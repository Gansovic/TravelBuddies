/**
 * PaginatedDataProvider - Abstract base class for paginated data operations
 * Following TravelBuddies principles for extension before creation
 *
 * Provides standardized pagination logic for any data type:
 * - Consistent pagination interface
 * - Built-in loading states
 * - Error handling
 * - Caching support
 * - Type-safe implementation
 *
 * @example
 * ```typescript
 * class TripProvider extends PaginatedDataProvider<Trip> {
 *   async fetchPage(page: number, pageSize: number): Promise<PaginatedResult<Trip>> {
 *     const { data, error } = await supabase
 *       .from('trips')
 *       .select('*')
 *       .range(page * pageSize, (page + 1) * pageSize - 1);
 *
 *     return {
 *       data: data?.map(DataConverters.toTrip) || [],
 *       totalCount: await this.getTotalCount(),
 *       currentPage: page,
 *       pageSize,
 *       hasNextPage: data?.length === pageSize,
 *       hasPreviousPage: page > 0,
 *     };
 *   }
 *
 *   protected async getTotalCount(): Promise<number> {
 *     const { count } = await supabase
 *       .from('trips')
 *       .select('*', { count: 'exact', head: true });
 *     return count || 0;
 *   }
 * }
 * ```
 */
export interface PaginatedResult<T> {
    data: T[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface PaginationOptions {
    page: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}
export interface LoadingState {
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
}
export declare abstract class PaginatedDataProvider<T> {
    protected cache: Map<string, PaginatedResult<T>>;
    protected loading: LoadingState;
    /**
     * Abstract method to fetch a page of data
     * Must be implemented by subclasses
     */
    protected abstract fetchPage(options: PaginationOptions): Promise<PaginatedResult<T>>;
    /**
     * Abstract method to get total count
     * Must be implemented by subclasses
     */
    protected abstract getTotalCount(filters?: Record<string, any>): Promise<number>;
    /**
     * Get data with pagination
     */
    getData(options: PaginationOptions): Promise<PaginatedResult<T>>;
    /**
     * Load more data (for infinite scrolling)
     */
    loadMore(currentResult: PaginatedResult<T>, filters?: Record<string, any>): Promise<PaginatedResult<T>>;
    /**
     * Refresh data (clear cache and reload)
     */
    refresh(options: PaginationOptions): Promise<PaginatedResult<T>>;
    /**
     * Search data with pagination
     */
    search(query: string, options?: Partial<PaginationOptions>): Promise<PaginatedResult<T>>;
    /**
     * Get loading state
     */
    getLoadingState(): LoadingState;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Clear specific cache entry
     */
    clearCacheEntry(options: PaginationOptions): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Generate cache key for the given options
     */
    private getCacheKey;
    /**
     * Validate pagination options
     */
    protected validateOptions(options: PaginationOptions): void;
    /**
     * Create empty result
     */
    protected createEmptyResult(options: PaginationOptions): PaginatedResult<T>;
    /**
     * Utility method to calculate offset from page and pageSize
     */
    protected getOffset(page: number, pageSize: number): number;
    /**
     * Utility method to calculate range for Supabase
     */
    protected getRange(page: number, pageSize: number): [number, number];
}
/**
 * Utility type for creating concrete paginated providers
 */
export type PaginatedProviderConstructor<T> = new (...args: any[]) => PaginatedDataProvider<T>;
