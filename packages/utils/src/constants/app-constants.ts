/**
 * AppConstants - Centralized application constants
 * Following TravelBuddies principles to eliminate hardcoded values
 * 
 * Contains all application-wide constants including:
 * - Timeouts and limits
 * - API configurations
 * - Business rules
 * - UI defaults
 * 
 * @example
 * ```typescript
 * const timeout = AppConstants.edgeFunctionTimeout;
 * const maxRetries = AppConstants.maxRetries;
 * ```
 */
export const AppConstants = {
  // API & Network
  edgeFunctionTimeout: 30000, // 30 seconds
  maxRetries: 3,
  cacheTimeout: 300000, // 5 minutes
  apiRequestTimeout: 15000, // 15 seconds
  
  // Trip Detection & Processing
  minTripDistance: 100, // meters
  maxTripDistance: 1000000, // 1000 km
  tripDetectionInterval: 30000, // 30 seconds
  locationAccuracyThreshold: 50, // meters
  
  // Points & Rewards
  pointsPerKmWalking: 100,
  pointsPerKmCycling: 80,
  pointsPerKmTransit: 60,
  pointsPerKmCar: 0, // No points for driving
  bonusMultiplierWeekend: 1.5,
  
  // UI & UX
  loadingDialogMinDuration: 1000, // Show for at least 1 second
  toastDuration: 3000, // 3 seconds
  debounceDelay: 300, // For search inputs
  animationDuration: 200, // Standard animation time
  
  // File & Data Limits
  maxFileSize: 10485760, // 10 MB
  maxImageSize: 5242880, // 5 MB
  maxDescriptionLength: 500,
  maxTripNameLength: 100,
  
  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,
  
  // Currency & Money
  defaultCurrency: 'USD',
  maxExpenseAmount: 10000, // $10,000
  currencyDecimalPlaces: 2,
  
  // Maps & Location
  defaultZoomLevel: 13,
  maxZoomLevel: 18,
  minZoomLevel: 8,
  mapTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // Polling & Realtime
  realtimeRetryInterval: 5000, // 5 seconds
  maxRealtimeRetries: 5,
  pollingInterval: 30000, // 30 seconds for fallback polling
  
  // Security
  maxLoginAttempts: 5,
  sessionTimeout: 3600000, // 1 hour
  passwordMinLength: 8,
  
  // Performance
  lazyLoadThreshold: 200, // pixels
  virtualScrollItemHeight: 80, // pixels
  maxConcurrentRequests: 5,
  
  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableDebugLogs: process.env.NODE_ENV === 'development',
} as const;

/**
 * ConfigPaths - Centralized configuration paths
 * Following TravelBuddies principles to eliminate hardcoded paths
 * 
 * Contains all configuration keys for the app_configurations table
 * 
 * @example
 * ```typescript
 * const config = await fetch(ConfigPaths.pointsRules);
 * const detection = await ConfigService.getInstance().getConfig(ConfigPaths.tripDetection);
 * ```
 */
export const ConfigPaths = {
  // Points & Rewards
  pointsRules: 'points_rules_active',
  rewardTiers: 'reward_tiers_config',
  bonusMultipliers: 'bonus_multipliers_config',
  
  // Trip Detection
  tripDetection: 'trip_detection_config',
  transportModes: 'transport_modes_config',
  locationSettings: 'location_settings_config',
  
  // UI & Display
  appTheme: 'app_theme_config',
  featureFlags: 'feature_flags_active',
  maintenanceMode: 'maintenance_mode_config',
  
  // Business Rules
  fraudDetection: 'fraud_detection_rules',
  validationRules: 'validation_rules_config',
  processingRules: 'processing_rules_config',
  
  // Integration Settings
  mapsConfig: 'maps_integration_config',
  analyticsConfig: 'analytics_config',
  notificationConfig: 'notification_settings',
  
  // Performance & Limits
  rateLimits: 'rate_limits_config',
  cachingConfig: 'caching_strategy_config',
  performanceConfig: 'performance_settings',
  
  // Regional Settings
  currencyRates: 'currency_exchange_rates',
  regionalSettings: 'regional_config_active',
  timezoneConfig: 'timezone_settings',
  
  // Security
  securityPolicy: 'security_policy_config',
  authSettings: 'authentication_settings',
  privacySettings: 'privacy_policy_config',
} as const;

/**
 * ErrorCodes - Standardized error codes for the application
 */
export const ErrorCodes = {
  // Network & API
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  DATA_TOO_LARGE: 'DATA_TOO_LARGE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Business Logic
  TRIP_TOO_SHORT: 'TRIP_TOO_SHORT',
  TRIP_TOO_LONG: 'TRIP_TOO_LONG',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // System
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

/**
 * StorageKeys - Local storage and session storage keys
 */
export const StorageKeys = {
  // User preferences
  theme: 'app_theme',
  language: 'user_language',
  currency: 'preferred_currency',
  
  // Trip data
  draftTrip: 'draft_trip_data',
  tripHistory: 'trip_history_cache',
  offlineTrips: 'offline_trips_queue',
  
  // App state
  lastKnownLocation: 'last_known_location',
  appSettings: 'app_settings',
  onboardingComplete: 'onboarding_completed',
  
  // Cache keys
  configCache: 'config_cache',
  userCache: 'user_data_cache',
  tripCache: 'trip_data_cache',
} as const;

// Type exports for better TypeScript support
export type AppConstantsType = typeof AppConstants;
export type ConfigPathsType = typeof ConfigPaths;
export type ErrorCodesType = typeof ErrorCodes;
export type StorageKeysType = typeof StorageKeys;