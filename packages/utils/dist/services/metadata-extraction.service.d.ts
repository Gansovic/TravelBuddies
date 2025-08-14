/**
 * MetadataExtractionService - Location and contextual metadata extraction
 * Following singleton pattern as per engineering principles
 *
 * Handles automatic metadata enrichment for moments:
 * - Reverse geocoding with Google Places API
 * - Weather data extraction
 * - AI-powered content analysis
 * - Place categorization and tagging
 *
 * @example
 * ```typescript
 * const service = MetadataExtractionService.getInstance();
 * const metadata = await service.extractLocationMetadata(lat, lng);
 * const enhanced = await service.enhanceMoment(moment);
 * ```
 */
export declare class MetadataExtractionService {
    private static instance;
    private cache;
    private constructor();
    static getInstance(): MetadataExtractionService;
    /**
     * Extract comprehensive location metadata from coordinates
     */
    extractLocationMetadata(latitude: number, longitude: number): Promise<LocationMetadata>;
    /**
     * Get weather data for coordinates
     */
    getWeatherData(latitude: number, longitude: number): Promise<WeatherData | null>;
    /**
     * Reverse geocode coordinates to place information
     */
    reverseGeocode(latitude: number, longitude: number): Promise<PlaceData | null>;
    /**
     * Get timezone for coordinates
     */
    getTimezone(latitude: number, longitude: number): Promise<string>;
    /**
     * Analyze moment content for AI tags and categorization
     */
    analyzeContent(type: string, mediaUrl?: string, text?: string): Promise<ContentAnalysis>;
    /**
     * Extract relevant tags from text content
     */
    private extractTextTags;
    /**
     * Enhance a moment with additional metadata
     */
    enhanceMoment(momentData: any): Promise<any>;
    /**
     * Get device information for context
     */
    private getDeviceInfo;
    /**
     * Extract city from place data
     */
    private extractCity;
    /**
     * Extract region/state from place data
     */
    private extractRegion;
    /**
     * Extract country from place data
     */
    private extractCountry;
    private getEmptyLocationMetadata;
    private getEmptyContentAnalysis;
}
export interface LocationMetadata {
    place_id?: string;
    place_name?: string;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    place_types: string[];
    weather_temp_celsius?: number;
    weather_condition?: string;
    weather_description?: string;
    timezone?: string;
}
export interface WeatherData {
    temperature: number;
    condition: string;
    description: string;
    humidity?: number;
    wind_speed?: number;
    visibility?: number;
}
export interface PlaceData {
    place_id: string;
    name: string;
    formatted_address: string;
    address_components: any[];
    types: string[];
    timezone?: string;
}
export interface ContentAnalysis {
    auto_tags: string[];
    suggested_emoji: string[];
    ai_category: string;
    ai_caption: string;
    confidence_score: number;
}
export interface DeviceInfo {
    platform: string;
    user_agent: string;
    language?: string;
    timezone?: string;
    online?: boolean;
}
