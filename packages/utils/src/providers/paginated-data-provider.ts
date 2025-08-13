import { AppConstants } from '../constants/app-constants';

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

export abstract class PaginatedDataProvider<T> {
  protected cache = new Map<string, PaginatedResult<T>>();
  protected loading: LoadingState = {
    isLoading: false,
    isLoadingMore: false,
    error: null,
  };

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
  async getData(options: PaginationOptions): Promise<PaginatedResult<T>> {
    const {
      page = 0,
      pageSize = AppConstants.defaultPageSize,
      sortBy,
      sortOrder = 'desc',
      filters = {},
    } = options;

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
      const cached = this.cache.get(cacheKey)!;
      // Check if cache is still valid (5 minutes)
      if (Date.now() - (cached as any).cachedAt < AppConstants.cacheTimeout) {
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

      const finalResult: PaginatedResult<T> = {
        ...result,
        currentPage: page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };

      // Cache the result
      (finalResult as any).cachedAt = Date.now();
      this.cache.set(cacheKey, finalResult);

      this.loading.isLoading = false;
      return finalResult;
    } catch (error) {
      this.loading.isLoading = false;
      this.loading.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Load more data (for infinite scrolling)
   */
  async loadMore(currentResult: PaginatedResult<T>, filters?: Record<string, any>): Promise<PaginatedResult<T>> {
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
      const mergedResult: PaginatedResult<T> = {
        ...nextPageResult,
        data: [...currentResult.data, ...nextPageResult.data],
        currentPage: nextPageResult.currentPage,
      };

      this.loading.isLoadingMore = false;
      return mergedResult;
    } catch (error) {
      this.loading.isLoadingMore = false;
      this.loading.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Refresh data (clear cache and reload)
   */
  async refresh(options: PaginationOptions): Promise<PaginatedResult<T>> {
    this.clearCache();
    return this.getData(options);
  }

  /**
   * Search data with pagination
   */
  async search(query: string, options: Partial<PaginationOptions> = {}): Promise<PaginatedResult<T>> {
    const searchOptions: PaginationOptions = {
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
  getLoadingState(): LoadingState {
    return { ...this.loading };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(options: PaginationOptions): void {
    const cacheKey = this.getCacheKey(options);
    this.cache.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Generate cache key for the given options
   */
  private getCacheKey(options: PaginationOptions): string {
    const {
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters,
    } = options;

    const filterStr = JSON.stringify(filters || {});
    return `p:${page}_ps:${pageSize}_sb:${sortBy || 'default'}_so:${sortOrder}_f:${filterStr}`;
  }

  /**
   * Validate pagination options
   */
  protected validateOptions(options: PaginationOptions): void {
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
  protected createEmptyResult(options: PaginationOptions): PaginatedResult<T> {
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
  protected getOffset(page: number, pageSize: number): number {
    return page * pageSize;
  }

  /**
   * Utility method to calculate range for Supabase
   */
  protected getRange(page: number, pageSize: number): [number, number] {
    const offset = this.getOffset(page, pageSize);
    return [offset, offset + pageSize - 1];
  }
}

/**
 * Utility type for creating concrete paginated providers
 */
export type PaginatedProviderConstructor<T> = new (...args: any[]) => PaginatedDataProvider<T>;