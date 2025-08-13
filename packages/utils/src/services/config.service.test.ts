import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from './config.service';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
    configService.clearCache();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should fetch from cache first', async () => {
      // Arrange
      const cachedValue = { test: 'cached' };
      const service = ConfigService.getInstance();
      // Simulate cache by calling getConfig once
      vi.spyOn(service as any, 'getDefault').mockReturnValue(cachedValue);
      
      await service.getConfig('test_key');
      
      // Act - second call should use cache
      const result = await service.getConfig('test_key');
      
      // Assert
      expect(result).toEqual(cachedValue);
    });

    it('should fall back to defaults when all else fails', async () => {
      // Arrange
      const defaultValue = 30000;
      
      // Act
      const result = await configService.getConfig('api_timeout');
      
      // Assert
      expect(result).toBe(defaultValue);
    });

    it('should throw error for unknown config key', async () => {
      // Act & Assert
      await expect(configService.getConfig('unknown_key')).rejects.toThrow(
        "Configuration key 'unknown_key' not found"
      );
    });
  });

  describe('getPointsConfiguration', () => {
    it('should fetch points rules configuration', async () => {
      // Arrange
      const pointsConfig = { walking: 100, cycling: 80 };
      vi.spyOn(configService, 'getConfig').mockResolvedValue(pointsConfig);
      
      // Act
      const result = await configService.getPointsConfiguration();
      
      // Assert
      expect(configService.getConfig).toHaveBeenCalledWith('points_rules_active');
      expect(result).toEqual(pointsConfig);
    });
  });

  describe('getTripDetectionConfig', () => {
    it('should fetch trip detection configuration', async () => {
      // Arrange
      const detectionConfig = { minDistance: 100 };
      vi.spyOn(configService, 'getConfig').mockResolvedValue(detectionConfig);
      
      // Act
      const result = await configService.getTripDetectionConfig();
      
      // Assert
      expect(configService.getConfig).toHaveBeenCalledWith('trip_detection_config');
      expect(result).toEqual(detectionConfig);
    });
  });

  describe('clearCache', () => {
    it('should clear memory cache', () => {
      // Arrange
      const service = ConfigService.getInstance();
      (service as any).memoryCache.set('test', 'value');
      
      // Act
      service.clearCache();
      
      // Assert
      expect((service as any).memoryCache.size).toBe(0);
    });
  });
});