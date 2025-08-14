import type { Trip, TripState, TripStats, CreateTripInput, TripMember, TripActivity, InviteTripMemberInput } from '../types/trip';
import type { Timeline } from '../types/moment';
/**
 * TripService - Memory recording focused trip operations
 * Following singleton pattern as per engineering principles
 *
 * Handles all trip-related data operations for memory recording:
 * - Trip recording session management
 * - Real-time collaboration state
 * - Timeline and statistics
 * - Member management and invitations
 * - RLS-protected data access
 *
 * @example
 * ```typescript
 * const service = TripService.getInstance();
 * await service.startRecording("My Trip");
 * const timeline = await service.getTripTimeline(tripId);
 * ```
 */
export declare class TripService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(): TripService;
    /**
     * Start a new trip recording session
     */
    startRecording(input: CreateTripInput): Promise<Trip | null>;
    /**
     * Get all trips for a user with memory recording data
     */
    getUserTrips(userId: string): Promise<Trip[]>;
    /**
     * Get a specific trip with full recording state
     */
    getTripState(tripId: string): Promise<TripState | null>;
    /**
     * Get trip timeline with organized moments
     */
    getTripTimeline(tripId: string): Promise<Timeline | null>;
    /**
     * Get memory recording statistics for a user
     */
    getTripStats(userId: string): Promise<TripStats>;
    /**
     * Stop recording for a trip
     */
    stopRecording(tripId: string): Promise<boolean>;
    /**
     * Get recent activity for a trip
     */
    getRecentActivity(tripId: string, limit?: number): Promise<TripActivity[]>;
    /**
     * Invite a member to join the trip
     */
    inviteMember(tripId: string, input: InviteTripMemberInput): Promise<boolean>;
    /**
     * Get trip members with contribution stats
     */
    getTripMembers(tripId: string): Promise<TripMember[]>;
    /**
     * Convert database trip to client Trip type
     */
    private convertDatabaseTrip;
    /**
     * Convert database moment to client Moment type
     */
    private convertDatabaseMoment;
    private getEmptyStats;
}
