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
export class MetadataExtractionService {
    constructor() {
        this.cache = new Map();
    }
    static getInstance() {
        if (!MetadataExtractionService.instance) {
            MetadataExtractionService.instance = new MetadataExtractionService();
        }
        return MetadataExtractionService.instance;
    }
    /**
     * Extract comprehensive location metadata from coordinates
     */
    async extractLocationMetadata(latitude, longitude) {
        const cacheKey = `location_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            const [placeData, weatherData] = await Promise.all([
                this.reverseGeocode(latitude, longitude),
                this.getWeatherData(latitude, longitude)
            ]);
            const metadata = {
                place_id: placeData?.place_id,
                place_name: placeData?.name,
                address: placeData?.formatted_address,
                city: this.extractCity(placeData),
                region: this.extractRegion(placeData),
                country: this.extractCountry(placeData),
                place_types: placeData?.types || [],
                weather_temp_celsius: weatherData?.temperature,
                weather_condition: weatherData?.condition,
                weather_description: weatherData?.description,
                timezone: placeData?.timezone || await this.getTimezone(latitude, longitude)
            };
            // Cache for 5 minutes
            this.cache.set(cacheKey, metadata);
            setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
            return metadata;
        }
        catch (error) {
            console.error('Error extracting location metadata:', error);
            return this.getEmptyLocationMetadata();
        }
    }
    /**
     * Get weather data for coordinates
     */
    async getWeatherData(latitude, longitude) {
        try {
            // Using OpenWeatherMap API (would need API key)
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
            if (!response.ok)
                return null;
            const data = await response.json();
            return {
                temperature: Math.round(data.main?.temp),
                condition: data.weather?.[0]?.main,
                description: data.weather?.[0]?.description,
                humidity: data.main?.humidity,
                wind_speed: data.wind?.speed,
                visibility: data.visibility
            };
        }
        catch (error) {
            console.warn('Weather data unavailable:', error);
            return null;
        }
    }
    /**
     * Reverse geocode coordinates to place information
     */
    async reverseGeocode(latitude, longitude) {
        try {
            // Using Google Places API
            const response = await fetch('/api/places/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.result;
        }
        catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return null;
        }
    }
    /**
     * Get timezone for coordinates
     */
    async getTimezone(latitude, longitude) {
        try {
            // Using browser's Intl API or Google Timezone API
            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                return Intl.DateTimeFormat().resolvedOptions().timeZone;
            }
            const response = await fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${Math.floor(Date.now() / 1000)}&key=${process.env.GOOGLE_PLACES_API_KEY}`);
            if (response.ok) {
                const data = await response.json();
                return data.timeZoneId || 'UTC';
            }
            return 'UTC';
        }
        catch (error) {
            console.warn('Timezone detection failed:', error);
            return 'UTC';
        }
    }
    /**
     * Analyze moment content for AI tags and categorization
     */
    async analyzeContent(type, mediaUrl, text) {
        try {
            // This would integrate with AI services like OpenAI Vision API
            const analysis = {
                auto_tags: [],
                suggested_emoji: [],
                ai_category: 'general',
                ai_caption: '',
                confidence_score: 0
            };
            // Basic categorization based on type
            switch (type) {
                case 'photo':
                    analysis.ai_category = 'photo';
                    analysis.suggested_emoji = ['📷', '📸'];
                    break;
                case 'video':
                    analysis.ai_category = 'video';
                    analysis.suggested_emoji = ['🎥', '🎬'];
                    break;
                case 'voice':
                    analysis.ai_category = 'audio';
                    analysis.suggested_emoji = ['🎤', '🗣️'];
                    break;
                case 'text':
                    analysis.ai_category = 'note';
                    analysis.suggested_emoji = ['📝', '💭'];
                    if (text) {
                        analysis.auto_tags = this.extractTextTags(text);
                    }
                    break;
                case 'checkin':
                    analysis.ai_category = 'location';
                    analysis.suggested_emoji = ['📍', '🗺️'];
                    break;
            }
            // TODO: Integrate with actual AI services for advanced analysis
            // - Image recognition for photo content
            // - Audio transcription for voice notes
            // - Sentiment analysis for text
            // - Scene detection and object recognition
            return analysis;
        }
        catch (error) {
            console.error('Content analysis failed:', error);
            return this.getEmptyContentAnalysis();
        }
    }
    /**
     * Extract relevant tags from text content
     */
    extractTextTags(text) {
        const tags = [];
        const lowerText = text.toLowerCase();
        // Common travel keywords
        const keywords = {
            food: ['food', 'restaurant', 'meal', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee', 'drink'],
            transport: ['flight', 'train', 'bus', 'taxi', 'uber', 'metro', 'subway', 'car', 'drive'],
            accommodation: ['hotel', 'hostel', 'airbnb', 'stay', 'room', 'bed', 'sleep'],
            activity: ['museum', 'park', 'beach', 'hike', 'walk', 'tour', 'show', 'concert', 'festival'],
            weather: ['sunny', 'rain', 'cold', 'hot', 'cloudy', 'snow', 'windy'],
            emotion: ['amazing', 'beautiful', 'wonderful', 'terrible', 'boring', 'exciting', 'fun', 'scary']
        };
        Object.entries(keywords).forEach(([category, words]) => {
            words.forEach(word => {
                if (lowerText.includes(word)) {
                    tags.push(category);
                }
            });
        });
        return [...new Set(tags)]; // Remove duplicates
    }
    /**
     * Enhance a moment with additional metadata
     */
    async enhanceMoment(momentData) {
        const enhanced = { ...momentData };
        // Add location metadata if coordinates are available
        if (momentData.latitude && momentData.longitude) {
            const locationMetadata = await this.extractLocationMetadata(momentData.latitude, momentData.longitude);
            Object.assign(enhanced, locationMetadata);
        }
        // Add content analysis
        const contentAnalysis = await this.analyzeContent(momentData.type, momentData.media_url, momentData.description);
        Object.assign(enhanced, contentAnalysis);
        // Add device metadata
        enhanced.device_info = this.getDeviceInfo();
        return enhanced;
    }
    /**
     * Get device information for context
     */
    getDeviceInfo() {
        if (typeof navigator === 'undefined') {
            return { platform: 'unknown', user_agent: 'unknown' };
        }
        return {
            platform: navigator.platform,
            user_agent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine
        };
    }
    /**
     * Extract city from place data
     */
    extractCity(placeData) {
        if (!placeData?.address_components)
            return undefined;
        const cityComponent = placeData.address_components.find((component) => component.types.includes('locality') ||
            component.types.includes('administrative_area_level_2'));
        return cityComponent?.long_name;
    }
    /**
     * Extract region/state from place data
     */
    extractRegion(placeData) {
        if (!placeData?.address_components)
            return undefined;
        const regionComponent = placeData.address_components.find((component) => component.types.includes('administrative_area_level_1'));
        return regionComponent?.long_name;
    }
    /**
     * Extract country from place data
     */
    extractCountry(placeData) {
        if (!placeData?.address_components)
            return undefined;
        const countryComponent = placeData.address_components.find((component) => component.types.includes('country'));
        return countryComponent?.long_name;
    }
    getEmptyLocationMetadata() {
        return {
            place_types: []
        };
    }
    getEmptyContentAnalysis() {
        return {
            auto_tags: [],
            suggested_emoji: [],
            ai_category: 'general',
            ai_caption: '',
            confidence_score: 0
        };
    }
}
