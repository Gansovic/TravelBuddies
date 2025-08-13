import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaginatedDataProvider } from './paginated-data-provider';
// Test implementation of PaginatedDataProvider
class TestPaginatedProvider extends PaginatedDataProvider {
    constructor(data = [], totalCount = 0) {
        super();
        this.mockData = [];
        this.mockTotalCount = 0;
        this.mockData = data;
        this.mockTotalCount = totalCount;
    }
    async fetchPage(options) {
        const { page, pageSize = 20, filters = {} } = options;
        const offset = this.getOffset(page, pageSize);
        let filteredData = this.mockData;
        // Apply search filter if provided
        if (filters.search) {
            filteredData = this.mockData.filter(item => item.name.toLowerCase().includes(filters.search.toLowerCase()));
        }
        const pageData = filteredData.slice(offset, offset + pageSize);
        return {
            data: pageData,
            totalCount: this.mockTotalCount,
            currentPage: page,
            pageSize,
            totalPages: Math.ceil(this.mockTotalCount / pageSize),
            hasNextPage: offset + pageSize < this.mockTotalCount,
            hasPreviousPage: page > 0,
        };
    }
    async getTotalCount(filters) {
        if (filters?.search) {
            return this.mockData.filter(item => item.name.toLowerCase().includes(filters.search.toLowerCase())).length;
        }
        return this.mockTotalCount;
    }
    // Helper method to simulate errors
    setError(shouldError) {
        if (shouldError) {
            this.fetchPage = vi.fn().mockRejectedValue(new Error('Mock error'));
        }
    }
}
describe('PaginatedDataProvider', () => {
    let provider;
    const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
        { id: 5, name: 'Item 5' },
    ];
    beforeEach(() => {
        provider = new TestPaginatedProvider(mockData, 5);
    });
    describe('getData', () => {
        it('should return paginated results', async () => {
            const result = await provider.getData({ page: 0, pageSize: 2 });
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toEqual({ id: 1, name: 'Item 1' });
            expect(result.data[1]).toEqual({ id: 2, name: 'Item 2' });
            expect(result.currentPage).toBe(0);
            expect(result.pageSize).toBe(2);
            expect(result.totalCount).toBe(5);
            expect(result.totalPages).toBe(3);
            expect(result.hasNextPage).toBe(true);
            expect(result.hasPreviousPage).toBe(false);
        });
        it('should handle last page correctly', async () => {
            const result = await provider.getData({ page: 2, pageSize: 2 });
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toEqual({ id: 5, name: 'Item 5' });
            expect(result.hasNextPage).toBe(false);
            expect(result.hasPreviousPage).toBe(true);
        });
        it('should validate negative page numbers', async () => {
            await expect(provider.getData({ page: -1 }))
                .rejects.toThrow('Page number cannot be negative');
        });
        it('should validate page size limits', async () => {
            await expect(provider.getData({ page: 0, pageSize: 101 }))
                .rejects.toThrow('Page size cannot exceed 100');
        });
        it('should use cache for repeated requests', async () => {
            const fetchPageSpy = vi.spyOn(provider, 'fetchPage');
            // First call
            await provider.getData({ page: 0, pageSize: 2 });
            expect(fetchPageSpy).toHaveBeenCalledTimes(1);
            // Second call - should use cache
            await provider.getData({ page: 0, pageSize: 2 });
            expect(fetchPageSpy).toHaveBeenCalledTimes(1); // Still 1, cache was used
        });
        it('should handle errors properly', async () => {
            const errorProvider = new TestPaginatedProvider();
            errorProvider.setError(true);
            await expect(errorProvider.getData({ page: 0 }))
                .rejects.toThrow('Mock error');
            const loadingState = errorProvider.getLoadingState();
            expect(loadingState.isLoading).toBe(false);
            expect(loadingState.error).toBe('Mock error');
        });
    });
    describe('loadMore', () => {
        it('should load next page and merge data', async () => {
            const firstPage = await provider.getData({ page: 0, pageSize: 2 });
            const merged = await provider.loadMore(firstPage);
            expect(merged.data).toHaveLength(4);
            expect(merged.data[0]).toEqual({ id: 1, name: 'Item 1' });
            expect(merged.data[2]).toEqual({ id: 3, name: 'Item 3' });
            expect(merged.currentPage).toBe(1);
        });
        it('should not load more when no next page', async () => {
            const lastPage = await provider.getData({ page: 2, pageSize: 2 });
            const result = await provider.loadMore(lastPage);
            expect(result).toBe(lastPage); // Same object returned
        });
        it('should handle loadMore errors', async () => {
            const firstPage = await provider.getData({ page: 0, pageSize: 2 });
            // Mock error for next page
            const originalFetch = provider['fetchPage'];
            provider['fetchPage'] = vi.fn().mockRejectedValue(new Error('Load more error'));
            await expect(provider.loadMore(firstPage))
                .rejects.toThrow('Load more error');
            const loadingState = provider.getLoadingState();
            expect(loadingState.isLoadingMore).toBe(false);
            expect(loadingState.error).toBe('Load more error');
        });
    });
    describe('search', () => {
        it('should search and return results', async () => {
            const result = await provider.search('Item 3');
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Item 3');
        });
        it('should handle empty search query', async () => {
            const result = await provider.search('   ');
            // Should return all results when search is empty after trim
            expect(result.data).toHaveLength(5);
        });
        it('should combine search with other options', async () => {
            const result = await provider.search('Item', { pageSize: 2 });
            expect(result.pageSize).toBe(2);
            expect(result.data).toHaveLength(2);
        });
    });
    describe('refresh', () => {
        it('should clear cache and reload data', async () => {
            // Load initial data
            await provider.getData({ page: 0, pageSize: 2 });
            const fetchPageSpy = vi.spyOn(provider, 'fetchPage');
            const clearCacheSpy = vi.spyOn(provider, 'clearCache');
            // Refresh should clear cache and fetch again
            await provider.refresh({ page: 0, pageSize: 2 });
            expect(clearCacheSpy).toHaveBeenCalled();
            expect(fetchPageSpy).toHaveBeenCalled();
        });
    });
    describe('cache management', () => {
        it('should provide cache statistics', async () => {
            await provider.getData({ page: 0, pageSize: 2 });
            await provider.getData({ page: 1, pageSize: 2 });
            const stats = provider.getCacheStats();
            expect(stats.size).toBe(2);
            expect(stats.keys).toHaveLength(2);
        });
        it('should clear cache', () => {
            provider.clearCache();
            const stats = provider.getCacheStats();
            expect(stats.size).toBe(0);
        });
        it('should clear specific cache entries', async () => {
            const options1 = { page: 0, pageSize: 2 };
            const options2 = { page: 1, pageSize: 2 };
            await provider.getData(options1);
            await provider.getData(options2);
            provider.clearCacheEntry(options1);
            const stats = provider.getCacheStats();
            expect(stats.size).toBe(1);
        });
    });
    describe('utility methods', () => {
        it('should calculate offset correctly', () => {
            expect(provider['getOffset'](0, 10)).toBe(0);
            expect(provider['getOffset'](1, 10)).toBe(10);
            expect(provider['getOffset'](2, 5)).toBe(10);
        });
        it('should calculate range correctly', () => {
            expect(provider['getRange'](0, 10)).toEqual([0, 9]);
            expect(provider['getRange'](1, 10)).toEqual([10, 19]);
            expect(provider['getRange'](2, 5)).toEqual([10, 14]);
        });
        it('should create empty result', () => {
            const options = { page: 0, pageSize: 10 };
            const result = provider['createEmptyResult'](options);
            expect(result.data).toEqual([]);
            expect(result.totalCount).toBe(0);
            expect(result.currentPage).toBe(0);
            expect(result.pageSize).toBe(10);
            expect(result.totalPages).toBe(0);
            expect(result.hasNextPage).toBe(false);
            expect(result.hasPreviousPage).toBe(false);
        });
    });
});
