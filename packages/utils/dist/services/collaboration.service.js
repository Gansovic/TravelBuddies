import { createClient } from '@supabase/supabase-js';
/**
 * CollaborationService - Real-time collaboration and presence management
 * Following singleton pattern as per engineering principles
 *
 * Handles real-time features for memory recording:
 * - User presence and activity tracking
 * - Live moment updates and notifications
 * - Collaborative capture events
 * - Activity feed management
 *
 * @example
 * ```typescript
 * const service = CollaborationService.getInstance();
 * await service.joinTrip(tripId);
 * service.subscribeToMoments(tripId, handleNewMoment);
 * await service.broadcastCaptureEvent(event);
 * ```
 */
export class CollaborationService {
    constructor() {
        this.supabase = null;
        this.subscriptions = new Map();
        this.presenceChannels = new Map();
        this.currentUserId = null;
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
            this.supabase = createClient(url, key);
        }
    }
    static getInstance() {
        if (!CollaborationService.instance) {
            CollaborationService.instance = new CollaborationService();
        }
        return CollaborationService.instance;
    }
    /**
     * Set current user for presence tracking
     */
    setCurrentUser(userId) {
        this.currentUserId = userId;
    }
    /**
     * Join a trip for real-time collaboration
     */
    async joinTrip(tripId) {
        if (!this.supabase || !this.currentUserId)
            return;
        try {
            // Create presence channel for this trip
            const presenceChannel = this.supabase.channel(`trip_presence_${tripId}`, {
                config: {
                    presence: {
                        key: this.currentUserId,
                    },
                },
            });
            // Track user presence
            presenceChannel
                .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState();
                this.handlePresenceUpdate(tripId, presenceState);
            })
                .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
                this.handleUserJoined(tripId, key, newPresences[0]);
            })
                .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
                this.handleUserLeft(tripId, key);
            });
            // Subscribe to presence channel
            await presenceChannel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Send initial presence
                    await presenceChannel.track({
                        user_id: this.currentUserId,
                        online_at: new Date().toISOString(),
                        is_capturing: false,
                    });
                }
            });
            this.presenceChannels.set(tripId, presenceChannel);
            // Log activity
            await this.logActivity(tripId, 'user_joined', this.currentUserId);
        }
        catch (error) {
            console.error('Error joining trip:', error);
        }
    }
    /**
     * Leave a trip and clean up subscriptions
     */
    async leaveTrip(tripId) {
        if (!this.supabase || !this.currentUserId)
            return;
        try {
            // Log activity
            await this.logActivity(tripId, 'user_left', this.currentUserId);
            // Unsubscribe from presence
            const presenceChannel = this.presenceChannels.get(tripId);
            if (presenceChannel) {
                await presenceChannel.unsubscribe();
                this.presenceChannels.delete(tripId);
            }
            // Unsubscribe from other channels
            const subscription = this.subscriptions.get(tripId);
            if (subscription) {
                await this.supabase.removeChannel(subscription);
                this.subscriptions.delete(tripId);
            }
        }
        catch (error) {
            console.error('Error leaving trip:', error);
        }
    }
    /**
     * Subscribe to real-time moment updates for a trip
     */
    subscribeToMoments(tripId, onMomentCreated, onMomentUpdated, onMomentDeleted) {
        if (!this.supabase || !tripId)
            return () => { };
        const channel = this.supabase
            .channel(`moments_${tripId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'moments',
            filter: `trip_id=eq.${tripId}`,
        }, (payload) => {
            console.log('New moment:', payload.new);
            onMomentCreated(this.convertDatabaseMoment(payload.new));
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'moments',
            filter: `trip_id=eq.${tripId}`,
        }, (payload) => {
            console.log('Updated moment:', payload.new);
            onMomentUpdated(this.convertDatabaseMoment(payload.new));
        })
            .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'moments',
            filter: `trip_id=eq.${tripId}`,
        }, (payload) => {
            console.log('Deleted moment:', payload.old.id);
            onMomentDeleted(payload.old.id);
        })
            .subscribe();
        this.subscriptions.set(tripId, channel);
        return () => {
            this.supabase.removeChannel(channel);
            this.subscriptions.delete(tripId);
        };
    }
    /**
     * Subscribe to moment reactions
     */
    subscribeToReactions(tripId, onReactionAdded, onReactionRemoved) {
        if (!this.supabase || !tripId)
            return () => { };
        const channel = this.supabase
            .channel(`reactions_${tripId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'moment_reactions',
        }, (payload) => {
            // Check if this reaction belongs to a moment in this trip
            this.supabase
                .from('moments')
                .select('trip_id')
                .eq('id', payload.new.moment_id)
                .single()
                .then(({ data }) => {
                if (data?.trip_id === tripId) {
                    onReactionAdded(payload.new);
                }
            });
        })
            .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'moment_reactions',
        }, (payload) => {
            onReactionRemoved(payload.old.id);
        })
            .subscribe();
        return () => {
            this.supabase.removeChannel(channel);
        };
    }
    /**
     * Subscribe to trip activity feed
     */
    subscribeToActivity(tripId, onActivity) {
        if (!this.supabase || !tripId)
            return () => { };
        const channel = this.supabase
            .channel(`activity_${tripId}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_activity',
            filter: `trip_id=eq.${tripId}`,
        }, (payload) => {
            onActivity({
                ...payload.new,
                created_at: new Date(payload.new.created_at),
            });
        })
            .subscribe();
        return () => {
            this.supabase.removeChannel(channel);
        };
    }
    /**
     * Broadcast capture event to other users
     */
    async broadcastCaptureEvent(tripId, event) {
        if (!this.supabase)
            return;
        const presenceChannel = this.presenceChannels.get(tripId);
        if (presenceChannel) {
            // Update presence with capture status
            await presenceChannel.track({
                user_id: this.currentUserId,
                online_at: new Date().toISOString(),
                is_capturing: event.type === 'capture_started',
                capture_type: event.type,
                moment_id: event.moment_id,
            });
        }
        // Log activity for capture events
        if (event.type === 'capture_completed' && event.moment_id) {
            await this.logActivity(tripId, 'moment_captured', event.moment_id);
        }
    }
    /**
     * Update user's capture status
     */
    async updateCaptureStatus(tripId, isCapturing, captureType) {
        if (!this.supabase || !this.currentUserId)
            return;
        const presenceChannel = this.presenceChannels.get(tripId);
        if (presenceChannel) {
            await presenceChannel.track({
                user_id: this.currentUserId,
                online_at: new Date().toISOString(),
                is_capturing: isCapturing,
                capture_type: captureType,
            });
        }
    }
    /**
     * Get current active users in trip
     */
    getActiveUsers(tripId) {
        const presenceChannel = this.presenceChannels.get(tripId);
        if (!presenceChannel)
            return [];
        const presenceState = presenceChannel.presenceState();
        const users = [];
        Object.entries(presenceState).forEach(([userId, presences]) => {
            const presence = presences[0]; // Get latest presence
            users.push({
                user_id: userId,
                user_name: presence.user_name || 'Unknown',
                is_capturing: presence.is_capturing || false,
                last_activity: new Date(presence.online_at),
                current_location: presence.location
            });
        });
        return users;
    }
    /**
     * Send typing indicator for text notes
     */
    async sendTypingIndicator(tripId, isTyping) {
        if (!this.supabase || !this.currentUserId)
            return;
        const presenceChannel = this.presenceChannels.get(tripId);
        if (presenceChannel) {
            await presenceChannel.track({
                user_id: this.currentUserId,
                online_at: new Date().toISOString(),
                is_typing: isTyping,
            });
        }
    }
    /**
     * Log activity to trip activity feed
     */
    async logActivity(tripId, activityType, targetId) {
        if (!this.supabase || !this.currentUserId)
            return;
        try {
            await this.supabase
                .from('trip_activity')
                .insert([{
                    trip_id: tripId,
                    user_id: this.currentUserId,
                    activity_type: activityType,
                    target_id: targetId,
                    metadata: {},
                }]);
        }
        catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    /**
     * Handle presence updates
     */
    handlePresenceUpdate(tripId, presenceState) {
        const activeUsers = this.getActiveUsers(tripId);
        console.log(`Active users in trip ${tripId}:`, activeUsers.length);
        // Dispatch custom event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tripPresenceUpdate', {
                detail: { tripId, activeUsers }
            }));
        }
    }
    /**
     * Handle user joined
     */
    handleUserJoined(tripId, userId, presence) {
        console.log(`User ${userId} joined trip ${tripId}`);
        // Dispatch custom event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userJoinedTrip', {
                detail: { tripId, userId, presence }
            }));
        }
    }
    /**
     * Handle user left
     */
    handleUserLeft(tripId, userId) {
        console.log(`User ${userId} left trip ${tripId}`);
        // Dispatch custom event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('userLeftTrip', {
                detail: { tripId, userId }
            }));
        }
    }
    /**
     * Convert database moment to client type
     */
    convertDatabaseMoment(dbMoment) {
        return {
            ...dbMoment,
            captured_at: new Date(dbMoment.captured_at),
            device_timestamp: dbMoment.device_timestamp ? new Date(dbMoment.device_timestamp) : undefined,
            created_at: new Date(dbMoment.created_at),
            updated_at: new Date(dbMoment.updated_at),
        };
    }
    /**
     * Clean up all subscriptions
     */
    cleanup() {
        // Unsubscribe from all channels
        this.subscriptions.forEach((channel) => {
            this.supabase?.removeChannel(channel);
        });
        this.subscriptions.clear();
        this.presenceChannels.forEach((channel) => {
            channel.unsubscribe();
        });
        this.presenceChannels.clear();
    }
}
