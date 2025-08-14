import type { Moment, UserPresence, MomentCaptureEvent } from '../types/moment';
import type { TripActivity } from '../types/trip';
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
export declare class CollaborationService {
    private static instance;
    private supabase;
    private subscriptions;
    private presenceChannels;
    private currentUserId;
    private constructor();
    static getInstance(): CollaborationService;
    /**
     * Set current user for presence tracking
     */
    setCurrentUser(userId: string): void;
    /**
     * Join a trip for real-time collaboration
     */
    joinTrip(tripId: string): Promise<void>;
    /**
     * Leave a trip and clean up subscriptions
     */
    leaveTrip(tripId: string): Promise<void>;
    /**
     * Subscribe to real-time moment updates for a trip
     */
    subscribeToMoments(tripId: string, onMomentCreated: (moment: Moment) => void, onMomentUpdated: (moment: Moment) => void, onMomentDeleted: (momentId: string) => void): () => void;
    /**
     * Subscribe to moment reactions
     */
    subscribeToReactions(tripId: string, onReactionAdded: (reaction: any) => void, onReactionRemoved: (reactionId: string) => void): () => void;
    /**
     * Subscribe to trip activity feed
     */
    subscribeToActivity(tripId: string, onActivity: (activity: TripActivity) => void): () => void;
    /**
     * Broadcast capture event to other users
     */
    broadcastCaptureEvent(tripId: string, event: MomentCaptureEvent): Promise<void>;
    /**
     * Update user's capture status
     */
    updateCaptureStatus(tripId: string, isCapturing: boolean, captureType?: string): Promise<void>;
    /**
     * Get current active users in trip
     */
    getActiveUsers(tripId: string): UserPresence[];
    /**
     * Send typing indicator for text notes
     */
    sendTypingIndicator(tripId: string, isTyping: boolean): Promise<void>;
    /**
     * Log activity to trip activity feed
     */
    private logActivity;
    /**
     * Handle presence updates
     */
    private handlePresenceUpdate;
    /**
     * Handle user joined
     */
    private handleUserJoined;
    /**
     * Handle user left
     */
    private handleUserLeft;
    /**
     * Convert database moment to client type
     */
    private convertDatabaseMoment;
    /**
     * Clean up all subscriptions
     */
    cleanup(): void;
}
