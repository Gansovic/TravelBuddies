/**
 * ConfigService - Centralized configuration management
 * Following singleton pattern as per engineering principles
 *
 * Provides hierarchical configuration loading:
 * 1. Memory cache (fastest)
 * 2. Local storage (offline-capable)
 * 3. Supabase app_configurations (authoritative)
 * 4. Environment variables (fallback)
 * 5. Hardcoded defaults (last resort)
 *
 * @example
 * ```typescript
 * const config = await ConfigService.getInstance().getPointsConfiguration();
 * const timeout = await ConfigService.getInstance().getConfig('api_timeout');
 * ```
 */
export declare class ConfigService {
    private static instance;
    private memoryCache;
    private supabase;
    private constructor();
    static getInstance(): ConfigService;
    /**
     * Get configuration value with hierarchical fallback
     */
    getConfig<T>(key: string): Promise<T>;
    /**
     * Get points configuration
     */
    getPointsConfiguration(): Promise<unknown>;
    /**
     * Get trip detection configuration
     */
    getTripDetectionConfig(): Promise<unknown>;
    /**
     * Clear cache (useful for testing)
     */
    clearCache(): void;
    /**
     * Get default configuration values
     */
    private getDefault;
}
