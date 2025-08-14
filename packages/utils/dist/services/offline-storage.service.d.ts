import type { CreateMomentInput, Moment } from '../types/moment';
/**
 * OfflineStorageService - IndexedDB-based offline storage for memory recording
 * Following singleton pattern as per engineering principles
 *
 * Handles offline-first architecture:
 * - Queue moments for upload when offline
 * - Cache moments locally for fast access
 * - Sync with server when online
 * - Store media files temporarily
 *
 * @example
 * ```typescript
 * const storage = OfflineStorageService.getInstance();
 * await storage.queueMoment(momentData);
 * const queue = await storage.getUploadQueue();
 * await storage.syncWithServer();
 * ```
 */
export declare class OfflineStorageService {
    private static instance;
    private db;
    private dbName;
    private dbVersion;
    private constructor();
    static getInstance(): OfflineStorageService;
    /**
     * Initialize IndexedDB database
     */
    private initializeDB;
    /**
     * Queue a moment for upload when online
     */
    queueMoment(momentData: CreateMomentInput & {
        id: string;
    }): Promise<boolean>;
    /**
     * Get all items in upload queue
     */
    getUploadQueue(): Promise<any[]>;
    /**
     * Remove item from upload queue after successful upload
     */
    removeFromQueue(itemId: string): Promise<boolean>;
    /**
     * Cache moments locally for fast access
     */
    cacheMoments(moments: Moment[]): Promise<boolean>;
    /**
     * Get cached moments for a trip
     */
    getCachedMoments(tripId: string): Promise<Moment[]>;
    /**
     * Store media file temporarily for offline access
     */
    storeMediaFile(momentId: string, file: File): Promise<boolean>;
    /**
     * Get stored media file
     */
    getMediaFile(momentId: string): Promise<File | null>;
    /**
     * Clear old cached data to free up space
     */
    clearOldCache(daysToKeep?: number): Promise<boolean>;
    /**
     * Get storage usage statistics
     */
    getStorageStats(): Promise<{
        used: number;
        quota: number;
        available: number;
    }>;
    /**
     * Check if app is online
     */
    isOnline(): boolean;
    /**
     * Set up online/offline event listeners
     */
    setupNetworkListeners(onOnline: () => void, onOffline: () => void): () => void;
}
