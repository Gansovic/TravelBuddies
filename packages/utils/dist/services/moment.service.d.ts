import type { Moment, CreateMomentInput, UpdateMomentInput, MomentFilters, Timeline } from '../types/moment';
/**
 * MomentService - Core moment capture and retrieval service
 * Following singleton pattern as per engineering principles
 *
 * Handles all moment-related operations:
 * - Moment creation, upload, and metadata extraction
 * - Real-time moment synchronization
 * - Timeline organization and filtering
 * - Reaction management
 * - Offline queue management
 *
 * @example
 * ```typescript
 * const service = MomentService.getInstance();
 * const moment = await service.createMoment(tripId, momentData);
 * const timeline = await service.getTimeline(tripId);
 * await service.addReaction(momentId, '❤️');
 * ```
 */
export declare class MomentService {
    private static instance;
    private supabase;
    private uploadQueue;
    private constructor();
    static getInstance(): MomentService;
    /**
     * Create a new moment with automatic metadata extraction
     */
    createMoment(input: CreateMomentInput): Promise<Moment | null>;
    /**
     * Get moments for a trip with filtering
     */
    getMoments(tripId: string, filters?: MomentFilters): Promise<Moment[]>;
    /**
     * Get a single moment by ID
     */
    getMoment(momentId: string): Promise<Moment | null>;
    /**
     * Update a moment
     */
    updateMoment(momentId: string, input: UpdateMomentInput): Promise<boolean>;
    /**
     * Delete a moment
     */
    deleteMoment(momentId: string): Promise<boolean>;
    /**
     * Add a reaction to a moment
     */
    addReaction(momentId: string, emoji: string): Promise<boolean>;
    /**
     * Remove a reaction from a moment
     */
    removeReaction(momentId: string, emoji: string): Promise<boolean>;
    /**
     * Get organized timeline for a trip
     */
    getTimeline(tripId: string): Promise<Timeline | null>;
    /**
     * Subscribe to real-time moment updates for a trip
     */
    subscribeToMoments(tripId: string, callback: (moment: Moment) => void): () => void;
    /**
     * Upload media file for a moment (async background process)
     */
    private uploadMediaAsync;
    /**
     * Enhance moment with location data (async background process)
     */
    private enhanceLocationDataAsync;
    /**
     * Convert database moment to client Moment type
     */
    private convertDatabaseMoment;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance;
    private toRadians;
}
