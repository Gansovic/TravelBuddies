/**
 * TripService - Centralized trip data operations service
 * Following singleton pattern as per engineering principles
 *
 * Handles all trip-related data operations:
 * - Trip CRUD operations (read-only, writes via Edge Functions)
 * - Trip searching and filtering
 * - Trip statistics and analytics
 * - RLS-protected data access
 *
 * @example
 * ```typescript
 * const service = TripService.getInstance();
 * const trips = await service.getUserTrips(userId);
 * const stats = await service.getTripStats(userId);
 * ```
 */
export declare class TripService {
    private static instance;
    private supabase;
    private constructor();
    static getInstance(): TripService;
    /**
     * Get all trips for a user (RLS-protected)
     */
    getUserTrips(userId: string): Promise<any[]>;
    /**
     * Get a specific trip by ID (RLS-protected)
     */
    getTrip(tripId: string): Promise<any | null>;
    /**
     * Search trips by name or destination
     */
    searchTrips(userId: string, query: string, limit?: number): Promise<any[]>;
    /**
     * Get trip statistics for a user
     */
    getTripStats(userId: string): Promise<any>;
    /**
     * Get recent trips for a user
     */
    getRecentTrips(userId: string, limit?: number): Promise<any[]>;
    /**
     * Get trips by date range
     */
    getTripsByDateRange(userId: string, startDate: string, endDate: string): Promise<any[]>;
    /**
     * Check if user has access to trip (via trip members)
     */
    hasAccessToTrip(userId: string, tripId: string): Promise<boolean>;
    /**
     * Get trip members
     */
    getTripMembers(tripId: string): Promise<any[]>;
    private getEmptyStats;
}
