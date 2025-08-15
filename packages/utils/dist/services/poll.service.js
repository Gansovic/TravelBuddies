import { createClient } from '@supabase/supabase-js';
/**
 * PollService - Collaborative voting and decision making service
 * Following singleton pattern as per engineering principles
 *
 * Handles all poll-related operations for group trip planning:
 * - Poll creation and management
 * - Voting and vote management
 * - Real-time poll updates
 * - Automatic poll resolution and itinerary integration
 * - Poll statistics and analytics
 *
 * @example
 * ```typescript
 * const service = PollService.getInstance();
 * const poll = await service.createPoll(tripId, pollData);
 * await service.vote(pollId, optionId);
 * const results = await service.closePoll(pollId);
 * ```
 */
export class PollService {
    constructor() {
        this.supabase = null;
        // Initialize Supabase client if available
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        console.log('PollService constructor - Supabase config:', {
            hasUrl: !!url,
            hasKey: !!key,
            url: url ? `${url.substring(0, 20)}...` : 'missing'
        });
        if (url && key) {
            this.supabase = createClient(url, key);
            console.log('PollService: Supabase client created successfully');
        }
        else {
            console.error('PollService: Missing Supabase environment variables');
        }
    }
    static getInstance() {
        if (!PollService.instance) {
            PollService.instance = new PollService();
        }
        return PollService.instance;
    }
    /**
     * Create a new poll with options
     */
    async createPoll(input) {
        if (!this.supabase) {
            console.error('PollService: Supabase client not initialized');
            return null;
        }
        try {
            console.log('PollService.createPoll: Creating poll with input:', {
                trip_id: input.trip_id,
                title: input.title,
                type: input.type,
                options_count: input.options.length
            });
            // Create the poll record
            const pollData = {
                trip_id: input.trip_id,
                creator_id: input.creator_id || (await this.supabase.auth.getUser())?.data?.user?.id,
                title: input.title,
                description: input.description,
                type: input.type || 'general',
                related_data: input.related_data || {},
                status: 'active',
                closes_at: input.closes_at?.toISOString()
            };
            const { data: poll, error: pollError } = await this.supabase
                .from('polls')
                .insert([pollData])
                .select()
                .single();
            if (pollError) {
                console.error('PollService: Error creating poll:', pollError);
                return null;
            }
            console.log('PollService: Poll created successfully:', poll.id);
            // Create poll options
            const optionsData = input.options.map(option => ({
                poll_id: poll.id,
                title: option.title,
                description: option.description,
                data: option.data || {}
            }));
            const { data: options, error: optionsError } = await this.supabase
                .from('poll_options')
                .insert(optionsData)
                .select();
            if (optionsError) {
                console.error('PollService: Error creating poll options:', optionsError);
                // Try to clean up the poll if options creation failed
                await this.supabase.from('polls').delete().eq('id', poll.id);
                return null;
            }
            console.log('PollService: Poll options created:', options?.length);
            const convertedPoll = this.convertDatabasePoll(poll);
            convertedPoll.options = options?.map(opt => this.convertDatabasePollOption(opt)) || [];
            return convertedPoll;
        }
        catch (error) {
            console.error('Failed to create poll:', error);
            return null;
        }
    }
    /**
     * Get polls for a trip with filtering
     */
    async getPolls(tripId, options) {
        if (!this.supabase || !tripId)
            return [];
        try {
            let query = this.supabase
                .from('polls')
                .select(`
          *,
          poll_options (
            id,
            title,
            description,
            data,
            vote_count,
            created_at,
            poll_votes (
              id,
              user_id,
              created_at
            )
          )
        `)
                .eq('trip_id', tripId);
            // Apply filters
            if (options?.filters?.status?.length) {
                query = query.in('status', options.filters.status);
            }
            if (options?.filters?.type?.length) {
                query = query.in('type', options.filters.type);
            }
            if (options?.filters?.creator_ids?.length) {
                query = query.in('creator_id', options.filters.creator_ids);
            }
            if (options?.filters?.date_range) {
                query = query
                    .gte('created_at', options.filters.date_range.start.toISOString())
                    .lte('created_at', options.filters.date_range.end.toISOString());
            }
            // Apply sorting
            const sortBy = options?.sort_by || 'created_at';
            const sortOrder = options?.sort_order || 'desc';
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
            // Apply pagination
            if (options?.limit) {
                query = query.limit(options.limit);
            }
            if (options?.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Error fetching polls:', error);
                return [];
            }
            return data?.map((poll) => {
                const convertedPoll = this.convertDatabasePoll(poll);
                convertedPoll.options = poll.poll_options?.map((opt) => {
                    const convertedOption = this.convertDatabasePollOption(opt);
                    convertedOption.votes = opt.poll_votes?.map((vote) => this.convertDatabasePollVote(vote)) || [];
                    return convertedOption;
                }) || [];
                convertedPoll.total_votes = (convertedPoll.options || []).reduce((sum, opt) => sum + opt.vote_count, 0);
                return convertedPoll;
            }) || [];
        }
        catch (error) {
            console.error('Failed to fetch polls:', error);
            return [];
        }
    }
    /**
     * Get a single poll by ID with full details
     */
    async getPoll(pollId) {
        if (!this.supabase || !pollId)
            return null;
        try {
            const { data, error } = await this.supabase
                .from('polls')
                .select(`
          *,
          poll_options (
            id,
            title,
            description,
            data,
            vote_count,
            created_at,
            poll_votes (
              id,
              user_id,
              created_at
            )
          )
        `)
                .eq('id', pollId)
                .single();
            if (error) {
                console.error('Error fetching poll:', error);
                return null;
            }
            const poll = this.convertDatabasePoll(data);
            poll.options = data.poll_options?.map((opt) => {
                const option = this.convertDatabasePollOption(opt);
                option.votes = opt.poll_votes?.map((vote) => this.convertDatabasePollVote(vote)) || [];
                return option;
            }) || [];
            poll.total_votes = (poll.options || []).reduce((sum, opt) => sum + opt.vote_count, 0);
            return poll;
        }
        catch (error) {
            console.error('Failed to fetch poll:', error);
            return null;
        }
    }
    /**
     * Vote on a poll option
     */
    async vote(input) {
        if (!this.supabase)
            return false;
        try {
            const userId = input.user_id || (await this.supabase.auth.getUser())?.data?.user?.id;
            if (!userId)
                return false;
            console.log('PollService.vote: Casting vote:', {
                poll_id: input.poll_id,
                option_id: input.option_id,
                user_id: userId
            });
            // Check if user has already voted on this poll
            const { data: existingVote } = await this.supabase
                .from('poll_votes')
                .select('id, option_id')
                .eq('poll_id', input.poll_id)
                .eq('user_id', userId)
                .single();
            if (existingVote) {
                // User is changing their vote
                if (existingVote.option_id === input.option_id) {
                    console.log('PollService.vote: User already voted for this option');
                    return true; // Already voted for this option
                }
                // Update existing vote
                const { error } = await this.supabase
                    .from('poll_votes')
                    .update({ option_id: input.option_id })
                    .eq('id', existingVote.id);
                if (error) {
                    console.error('Error updating vote:', error);
                    return false;
                }
            }
            else {
                // Create new vote
                const { error } = await this.supabase
                    .from('poll_votes')
                    .insert([{
                        poll_id: input.poll_id,
                        option_id: input.option_id,
                        user_id: userId
                    }]);
                if (error) {
                    console.error('Error creating vote:', error);
                    return false;
                }
            }
            console.log('PollService.vote: Vote cast successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to cast vote:', error);
            return false;
        }
    }
    /**
     * Remove a user's vote from a poll
     */
    async removeVote(pollId, userId) {
        if (!this.supabase || !pollId)
            return false;
        try {
            const actualUserId = userId || (await this.supabase.auth.getUser())?.data?.user?.id;
            if (!actualUserId)
                return false;
            const { error } = await this.supabase
                .from('poll_votes')
                .delete()
                .eq('poll_id', pollId)
                .eq('user_id', actualUserId);
            if (error) {
                console.error('Error removing vote:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Failed to remove vote:', error);
            return false;
        }
    }
    /**
     * Close a poll and return results
     */
    async closePoll(pollId) {
        if (!this.supabase || !pollId)
            return null;
        try {
            // First get the poll with all votes
            const poll = await this.getPoll(pollId);
            if (!poll || poll.status === 'closed')
                return null;
            // Find the winning option
            const sortedOptions = [...(poll.options || [])].sort((a, b) => b.vote_count - a.vote_count);
            const winningOption = sortedOptions[0];
            if (!winningOption)
                return null;
            // Update poll status to closed
            const { error } = await this.supabase
                .from('polls')
                .update({
                status: 'closed',
                updated_at: new Date().toISOString()
            })
                .eq('id', pollId);
            if (error) {
                console.error('Error closing poll:', error);
                return null;
            }
            const totalVotes = poll.total_votes || 0;
            const participationRate = totalVotes > 0 ? winningOption.vote_count / totalVotes : 0;
            return {
                poll_id: pollId,
                winning_option: winningOption,
                final_vote_count: totalVotes,
                participation_rate: participationRate,
                close_reason: 'manual',
                should_execute: poll.type === 'itinerary_item' && winningOption.vote_count > 0
            };
        }
        catch (error) {
            console.error('Failed to close poll:', error);
            return null;
        }
    }
    /**
     * Subscribe to real-time poll updates for a trip
     */
    subscribeToPolls(tripId, callback) {
        if (!this.supabase || !tripId)
            return () => { };
        const subscription = this.supabase
            .channel(`polls:trip_id=eq.${tripId}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'polls',
            filter: `trip_id=eq.${tripId}`
        }, async (payload) => {
            // Fetch the full poll details when changes occur
            const poll = await this.getPoll(payload.new.id);
            if (poll)
                callback(poll);
        })
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'poll_votes'
        }, async (payload) => {
            // Fetch poll when votes change
            const poll = await this.getPoll(payload.new.poll_id);
            if (poll && poll.trip_id === tripId)
                callback(poll);
        })
            .subscribe();
        return () => {
            this.supabase?.removeChannel(subscription);
        };
    }
    /**
     * Convert database poll to client Poll type
     */
    convertDatabasePoll(dbPoll) {
        return {
            id: dbPoll.id,
            trip_id: dbPoll.trip_id,
            creator_id: dbPoll.creator_id,
            title: dbPoll.title,
            description: dbPoll.description,
            type: dbPoll.type,
            related_data: dbPoll.related_data,
            status: dbPoll.status,
            closes_at: dbPoll.closes_at ? new Date(dbPoll.closes_at) : undefined,
            created_at: new Date(dbPoll.created_at),
            updated_at: new Date(dbPoll.updated_at),
            is_expired: dbPoll.closes_at ? new Date(dbPoll.closes_at) < new Date() : false
        };
    }
    /**
     * Convert database poll option to client PollOption type
     */
    convertDatabasePollOption(dbOption) {
        return {
            id: dbOption.id,
            poll_id: dbOption.poll_id,
            title: dbOption.title,
            description: dbOption.description,
            data: dbOption.data,
            vote_count: dbOption.vote_count,
            created_at: new Date(dbOption.created_at)
        };
    }
    /**
     * Convert database poll vote to client PollVote type
     */
    convertDatabasePollVote(dbVote) {
        return {
            id: dbVote.id,
            poll_id: dbVote.poll_id,
            option_id: dbVote.option_id,
            user_id: dbVote.user_id,
            created_at: new Date(dbVote.created_at)
        };
    }
}
