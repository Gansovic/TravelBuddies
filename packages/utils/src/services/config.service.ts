import { createClient } from '@supabase/supabase-js';
import { ConfigPaths } from '../constants/app-constants';

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
export class ConfigService {
  private static instance: ConfigService;
  private memoryCache = new Map<string, any>();
  private supabase: any = null;

  private constructor() {
    // Initialize Supabase client if available
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key && typeof window !== 'undefined') {
      this.supabase = createClient(url, key);
    }
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get configuration value with hierarchical fallback
   */
  async getConfig<T>(key: string): Promise<T> {
    // 1. Check memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. Check local storage
    if (typeof window !== 'undefined') {
      const localValue = localStorage.getItem(`config_${key}`);
      if (localValue) {
        try {
          const parsed = JSON.parse(localValue);
          this.memoryCache.set(key, parsed);
          return parsed;
        } catch {
          // Invalid JSON, continue to next fallback
        }
      }
    }

    // 3. Try to fetch from Supabase
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('app_configurations')
          .select('value')
          .eq('key', key)
          .single();

        if (!error && data) {
          const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          
          // Cache the value
          this.memoryCache.set(key, value);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`config_${key}`, JSON.stringify(value));
          }
          
          return value;
        }
      } catch (error) {
        console.warn(`Failed to fetch config for key ${key}:`, error);
      }
    }

    // 4. Check environment variables
    const envValue = process.env[key.toUpperCase()];
    if (envValue !== undefined) {
      try {
        const parsed = JSON.parse(envValue);
        this.memoryCache.set(key, parsed);
        return parsed;
      } catch {
        // Not JSON, return as string
        this.memoryCache.set(key, envValue);
        return envValue as T;
      }
    }

    // 5. Fall back to defaults
    const defaultValue = this.getDefault(key);
    if (defaultValue !== undefined) {
      this.memoryCache.set(key, defaultValue);
      return defaultValue;
    }

    throw new Error(`Configuration key '${key}' not found`);
  }

  /**
   * Get points configuration
   */
  async getPointsConfiguration() {
    return this.getConfig(ConfigPaths.pointsRules);
  }

  /**
   * Get trip detection configuration  
   */
  async getTripDetectionConfig() {
    return this.getConfig(ConfigPaths.tripDetection);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('config_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Get default configuration values
   */
  private getDefault(key: string): any {
    const defaults: Record<string, any> = {
      'api_timeout': 30000,
      'max_retries': 3,
      'cache_duration': 300000, // 5 minutes
      'points_per_km_walking': 100,
      'points_per_km_cycling': 80,
      'points_per_km_transit': 60,
      'min_trip_distance': 100, // meters
      'max_trip_distance': 1000000, // 1000km
    };

    return defaults[key];
  }
}