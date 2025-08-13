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
export declare const AppConstants: {
    readonly edgeFunctionTimeout: 30000;
    readonly maxRetries: 3;
    readonly cacheTimeout: 300000;
    readonly apiRequestTimeout: 15000;
    readonly minTripDistance: 100;
    readonly maxTripDistance: 1000000;
    readonly tripDetectionInterval: 30000;
    readonly locationAccuracyThreshold: 50;
    readonly pointsPerKmWalking: 100;
    readonly pointsPerKmCycling: 80;
    readonly pointsPerKmTransit: 60;
    readonly pointsPerKmCar: 0;
    readonly bonusMultiplierWeekend: 1.5;
    readonly loadingDialogMinDuration: 1000;
    readonly toastDuration: 3000;
    readonly debounceDelay: 300;
    readonly animationDuration: 200;
    readonly maxFileSize: 10485760;
    readonly maxImageSize: 5242880;
    readonly maxDescriptionLength: 500;
    readonly maxTripNameLength: 100;
    readonly defaultPageSize: 20;
    readonly maxPageSize: 100;
    readonly defaultCurrency: "USD";
    readonly maxExpenseAmount: 10000;
    readonly currencyDecimalPlaces: 2;
    readonly defaultZoomLevel: 13;
    readonly maxZoomLevel: 18;
    readonly minZoomLevel: 8;
    readonly mapTileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    readonly realtimeRetryInterval: 5000;
    readonly maxRealtimeRetries: 5;
    readonly pollingInterval: 30000;
    readonly maxLoginAttempts: 5;
    readonly sessionTimeout: 3600000;
    readonly passwordMinLength: 8;
    readonly lazyLoadThreshold: 200;
    readonly virtualScrollItemHeight: 80;
    readonly maxConcurrentRequests: 5;
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
    readonly enableDebugLogs: boolean;
};
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
export declare const ConfigPaths: {
    readonly pointsRules: "points_rules_active";
    readonly rewardTiers: "reward_tiers_config";
    readonly bonusMultipliers: "bonus_multipliers_config";
    readonly tripDetection: "trip_detection_config";
    readonly transportModes: "transport_modes_config";
    readonly locationSettings: "location_settings_config";
    readonly appTheme: "app_theme_config";
    readonly featureFlags: "feature_flags_active";
    readonly maintenanceMode: "maintenance_mode_config";
    readonly fraudDetection: "fraud_detection_rules";
    readonly validationRules: "validation_rules_config";
    readonly processingRules: "processing_rules_config";
    readonly mapsConfig: "maps_integration_config";
    readonly analyticsConfig: "analytics_config";
    readonly notificationConfig: "notification_settings";
    readonly rateLimits: "rate_limits_config";
    readonly cachingConfig: "caching_strategy_config";
    readonly performanceConfig: "performance_settings";
    readonly currencyRates: "currency_exchange_rates";
    readonly regionalSettings: "regional_config_active";
    readonly timezoneConfig: "timezone_settings";
    readonly securityPolicy: "security_policy_config";
    readonly authSettings: "authentication_settings";
    readonly privacySettings: "privacy_policy_config";
};
/**
 * ErrorCodes - Standardized error codes for the application
 */
export declare const ErrorCodes: {
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly API_TIMEOUT: "API_TIMEOUT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly SERVER_ERROR: "SERVER_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly DATA_TOO_LARGE: "DATA_TOO_LARGE";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly TRIP_TOO_SHORT: "TRIP_TOO_SHORT";
    readonly TRIP_TOO_LONG: "TRIP_TOO_LONG";
    readonly INSUFFICIENT_POINTS: "INSUFFICIENT_POINTS";
    readonly DUPLICATE_ENTRY: "DUPLICATE_ENTRY";
    readonly CONFIG_NOT_FOUND: "CONFIG_NOT_FOUND";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly MAINTENANCE_MODE: "MAINTENANCE_MODE";
};
/**
 * StorageKeys - Local storage and session storage keys
 */
export declare const StorageKeys: {
    readonly theme: "app_theme";
    readonly language: "user_language";
    readonly currency: "preferred_currency";
    readonly draftTrip: "draft_trip_data";
    readonly tripHistory: "trip_history_cache";
    readonly offlineTrips: "offline_trips_queue";
    readonly lastKnownLocation: "last_known_location";
    readonly appSettings: "app_settings";
    readonly onboardingComplete: "onboarding_completed";
    readonly configCache: "config_cache";
    readonly userCache: "user_data_cache";
    readonly tripCache: "trip_data_cache";
};
export type AppConstantsType = typeof AppConstants;
export type ConfigPathsType = typeof ConfigPaths;
export type ErrorCodesType = typeof ErrorCodes;
export type StorageKeysType = typeof StorageKeys;
