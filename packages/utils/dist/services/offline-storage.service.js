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
export class OfflineStorageService {
    constructor() {
        this.db = null;
        this.dbName = 'TravelBuddiesDB';
        this.dbVersion = 1;
        this.initializeDB();
    }
    static getInstance() {
        if (!OfflineStorageService.instance) {
            OfflineStorageService.instance = new OfflineStorageService();
        }
        return OfflineStorageService.instance;
    }
    /**
     * Initialize IndexedDB database
     */
    async initializeDB() {
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
            console.warn('IndexedDB not available');
            return;
        }
        try {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Moment upload queue store
                if (!db.objectStoreNames.contains('uploadQueue')) {
                    const queueStore = db.createObjectStore('uploadQueue', { keyPath: 'id' });
                    queueStore.createIndex('tripId', 'trip_id', { unique: false });
                    queueStore.createIndex('createdAt', 'created_at', { unique: false });
                }
                // Cached moments store
                if (!db.objectStoreNames.contains('moments')) {
                    const momentsStore = db.createObjectStore('moments', { keyPath: 'id' });
                    momentsStore.createIndex('tripId', 'trip_id', { unique: false });
                    momentsStore.createIndex('capturedAt', 'captured_at', { unique: false });
                    momentsStore.createIndex('type', 'type', { unique: false });
                }
                // Media files store (for offline access)
                if (!db.objectStoreNames.contains('mediaFiles')) {
                    const mediaStore = db.createObjectStore('mediaFiles', { keyPath: 'id' });
                    mediaStore.createIndex('momentId', 'moment_id', { unique: false });
                }
                // Trip metadata cache
                if (!db.objectStoreNames.contains('trips')) {
                    const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
                    tripsStore.createIndex('lastAccessed', 'last_accessed', { unique: false });
                }
                console.log('IndexedDB schema upgraded');
            };
        }
        catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
        }
    }
    /**
     * Queue a moment for upload when online
     */
    async queueMoment(momentData) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
            const store = transaction.objectStore('uploadQueue');
            const queueItem = {
                ...momentData,
                created_at: new Date().toISOString(),
                retry_count: 0,
                status: 'pending'
            };
            await new Promise((resolve, reject) => {
                const request = store.add(queueItem);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            console.log('Moment queued for upload:', momentData.id);
            return true;
        }
        catch (error) {
            console.error('Failed to queue moment:', error);
            return false;
        }
    }
    /**
     * Get all items in upload queue
     */
    async getUploadQueue() {
        if (!this.db)
            return [];
        try {
            const transaction = this.db.transaction(['uploadQueue'], 'readonly');
            const store = transaction.objectStore('uploadQueue');
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to get upload queue:', error);
            return [];
        }
    }
    /**
     * Remove item from upload queue after successful upload
     */
    async removeFromQueue(itemId) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
            const store = transaction.objectStore('uploadQueue');
            await new Promise((resolve, reject) => {
                const request = store.delete(itemId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            return true;
        }
        catch (error) {
            console.error('Failed to remove from queue:', error);
            return false;
        }
    }
    /**
     * Cache moments locally for fast access
     */
    async cacheMoments(moments) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction(['moments'], 'readwrite');
            const store = transaction.objectStore('moments');
            await Promise.all(moments.map(moment => new Promise((resolve, reject) => {
                const request = store.put(moment);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })));
            console.log(`Cached ${moments.length} moments`);
            return true;
        }
        catch (error) {
            console.error('Failed to cache moments:', error);
            return false;
        }
    }
    /**
     * Get cached moments for a trip
     */
    async getCachedMoments(tripId) {
        if (!this.db)
            return [];
        try {
            const transaction = this.db.transaction(['moments'], 'readonly');
            const store = transaction.objectStore('moments');
            const index = store.index('tripId');
            return new Promise((resolve, reject) => {
                const request = index.getAll(tripId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to get cached moments:', error);
            return [];
        }
    }
    /**
     * Store media file temporarily for offline access
     */
    async storeMediaFile(momentId, file) {
        if (!this.db)
            return false;
        try {
            const transaction = this.db.transaction(['mediaFiles'], 'readwrite');
            const store = transaction.objectStore('mediaFiles');
            const mediaItem = {
                id: `${momentId}_${file.name}`,
                moment_id: momentId,
                file: file,
                stored_at: new Date().toISOString()
            };
            await new Promise((resolve, reject) => {
                const request = store.add(mediaItem);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
            return true;
        }
        catch (error) {
            console.error('Failed to store media file:', error);
            return false;
        }
    }
    /**
     * Get stored media file
     */
    async getMediaFile(momentId) {
        if (!this.db)
            return null;
        try {
            const transaction = this.db.transaction(['mediaFiles'], 'readonly');
            const store = transaction.objectStore('mediaFiles');
            const index = store.index('momentId');
            return new Promise((resolve, reject) => {
                const request = index.get(momentId);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.file : null);
                };
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to get media file:', error);
            return null;
        }
    }
    /**
     * Clear old cached data to free up space
     */
    async clearOldCache(daysToKeep = 7) {
        if (!this.db)
            return false;
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffISO = cutoffDate.toISOString();
            const transaction = this.db.transaction(['moments', 'mediaFiles'], 'readwrite');
            // Clear old moments
            const momentsStore = transaction.objectStore('moments');
            const momentsIndex = momentsStore.index('capturedAt');
            const momentsRange = IDBKeyRange.upperBound(cutoffISO);
            await new Promise((resolve, reject) => {
                const request = momentsIndex.openCursor(momentsRange);
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                    else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
            // Clear old media files
            const mediaStore = transaction.objectStore('mediaFiles');
            const allMediaRequest = mediaStore.getAll();
            await new Promise((resolve, reject) => {
                allMediaRequest.onsuccess = () => {
                    const mediaFiles = allMediaRequest.result;
                    const deletePromises = mediaFiles
                        .filter(item => item.stored_at < cutoffISO)
                        .map(item => new Promise((resolve, reject) => {
                        const deleteRequest = mediaStore.delete(item.id);
                        deleteRequest.onsuccess = () => resolve();
                        deleteRequest.onerror = () => reject(deleteRequest.error);
                    }));
                    Promise.all(deletePromises)
                        .then(() => resolve())
                        .catch(reject);
                };
                allMediaRequest.onerror = () => reject(allMediaRequest.error);
            });
            console.log(`Cleared cache older than ${daysToKeep} days`);
            return true;
        }
        catch (error) {
            console.error('Failed to clear old cache:', error);
            return false;
        }
    }
    /**
     * Get storage usage statistics
     */
    async getStorageStats() {
        if (typeof navigator === 'undefined' || !('storage' in navigator)) {
            return { used: 0, quota: 0, available: 0 };
        }
        try {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const available = quota - used;
            return { used, quota, available };
        }
        catch (error) {
            console.error('Failed to get storage stats:', error);
            return { used: 0, quota: 0, available: 0 };
        }
    }
    /**
     * Check if app is online
     */
    isOnline() {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
    /**
     * Set up online/offline event listeners
     */
    setupNetworkListeners(onOnline, onOffline) {
        if (typeof window === 'undefined')
            return () => { };
        const handleOnline = () => {
            console.log('App is now online');
            onOnline();
        };
        const handleOffline = () => {
            console.log('App is now offline');
            onOffline();
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }
}
