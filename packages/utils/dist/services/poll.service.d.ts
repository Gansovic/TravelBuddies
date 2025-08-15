import type { Poll, CreatePollInput, VotePollInput, PollSearchOptions, PollResults } from '../types';
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
export declare class PollService {
    private static instance;
    private supabase;
    constructor();
    static getInstance(): PollService;
    /**
     * Create a new poll with options
     */
    createPoll(input: CreatePollInput): Promise<Poll | null>;
    /**
     * Get polls for a trip with filtering
     */
    getPolls(tripId: string, options?: PollSearchOptions): Promise<Poll[]>;
    /**
     * Get a single poll by ID with full details
     */
    getPoll(pollId: string): Promise<Poll | null>;
    /**
     * Vote on a poll option
     */
    vote(input: VotePollInput): Promise<boolean>;
    /**
     * Remove a user's vote from a poll
     */
    removeVote(pollId: string, userId?: string): Promise<boolean>;
    /**
     * Close a poll and return results
     */
    closePoll(pollId: string): Promise<PollResults | null>;
    /**
     * Subscribe to real-time poll updates for a trip
     */
    subscribeToPolls(tripId: string, callback: (poll: Poll) => void): () => void;
    /**
     * Convert database poll to client Poll type
     */
    private convertDatabasePoll;
    /**
     * Convert database poll option to client PollOption type
     */
    private convertDatabasePollOption;
    /**
     * Convert database poll vote to client PollVote type
     */
    private convertDatabasePollVote;
}
