import { AppConstants } from '../constants/app-constants';
export class PaginatedDataProvider {
    constructor() {
        this.cache = new Map();
        this.loading = {
            isLoading: false,
            isLoadingMore: false,
            error: null,
        };
    }
    /**
     * Get data with pagination
     */
    async getData(options) {
        const { page = 0, pageSize = AppConstants.defaultPageSize, sortBy, sortOrder = 'desc', filters = {}, } = options;
        // Validate input
        if (page < 0) {
            throw new Error('Page number cannot be negative');
        }
        if (pageSize > AppConstants.maxPageSize) {
            throw new Error(`Page size cannot exceed ${AppConstants.maxPageSize}`);
        }
        const cacheKey = this.getCacheKey(options);
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            // Check if cache is still valid (5 minutes)
            if (Date.now() - cached.cachedAt < AppConstants.cacheTimeout) {
                return cached;
            }
        }
        try {
            this.loading.isLoading = true;
            this.loading.error = null;
            const result = await this.fetchPage({
                page,
                pageSize,
                sortBy,
                sortOrder,
                filters,
            });
            // Calculate derived fields
            const totalPages = Math.ceil(result.totalCount / pageSize);
            const hasNextPage = page < totalPages - 1;
            const hasPreviousPage = page > 0;
            const finalResult = {
                ...result,
                currentPage: page,
                pageSize,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            };
            // Cache the result
            finalResult.cachedAt = Date.now();
            this.cache.set(cacheKey, finalResult);
            this.loading.isLoading = false;
            return finalResult;
        }
        catch (error) {
            this.loading.isLoading = false;
            this.loading.error = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        }
    }
    /**
     * Load more data (for infinite scrolling)
     */
    async loadMore(currentResult, filters) {
        if (!currentResult.hasNextPage) {
            return currentResult;
        }
        try {
            this.loading.isLoadingMore = true;
            this.loading.error = null;
            const nextPageResult = await this.getData({
                page: currentResult.currentPage + 1,
                pageSize: currentResult.pageSize,
                filters,
            });
            // Merge the data
            const mergedResult = {
                ...nextPageResult,
                data: [...currentResult.data, ...nextPageResult.data],
                currentPage: nextPageResult.currentPage,
            };
            this.loading.isLoadingMore = false;
            return mergedResult;
        }
        catch (error) {
            this.loading.isLoadingMore = false;
            this.loading.error = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        }
    }
    /**
     * Refresh data (clear cache and reload)
     */
    async refresh(options) {
        this.clearCache();
        return this.getData(options);
    }
    /**
     * Search data with pagination
     */
    async search(query, options = {}) {
        const searchOptions = {
            page: 0,
            pageSize: AppConstants.defaultPageSize,
            ...options,
            filters: {
                ...options.filters,
                search: query.trim(),
            },
        };
        return this.getData(searchOptions);
    }
    /**
     * Get loading state
     */
    getLoadingState() {
        return { ...this.loading };
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Clear specific cache entry
     */
    clearCacheEntry(options) {
        const cacheKey = this.getCacheKey(options);
        this.cache.delete(cacheKey);
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
    /**
     * Generate cache key for the given options
     */
    getCacheKey(options) {
        const { page, pageSize, sortBy, sortOrder, filters, } = options;
        const filterStr = JSON.stringify(filters || {});
        return `p:${page}_ps:${pageSize}_sb:${sortBy || 'default'}_so:${sortOrder}_f:${filterStr}`;
    }
    /**
     * Validate pagination options
     */
    validateOptions(options) {
        if (options.page < 0) {
            throw new Error('Page number cannot be negative');
        }
        if (options.pageSize && options.pageSize > AppConstants.maxPageSize) {
            throw new Error(`Page size cannot exceed ${AppConstants.maxPageSize}`);
        }
        if (options.pageSize && options.pageSize < 1) {
            throw new Error('Page size must be at least 1');
        }
    }
    /**
     * Create empty result
     */
    createEmptyResult(options) {
        return {
            data: [],
            totalCount: 0,
            currentPage: options.page,
            pageSize: options.pageSize || AppConstants.defaultPageSize,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        };
    }
    /**
     * Utility method to calculate offset from page and pageSize
     */
    getOffset(page, pageSize) {
        return page * pageSize;
    }
    /**
     * Utility method to calculate range for Supabase
     */
    getRange(page, pageSize) {
        const offset = this.getOffset(page, pageSize);
        return [offset, offset + pageSize - 1];
    }
}
