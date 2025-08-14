/**
 * RecapService - Generate automated trip recaps and insights
 * Following singleton pattern as per engineering principles
 *
 * Generates intelligent trip summaries including:
 * - Daily highlights and key moments
 * - Travel statistics and insights
 * - AI-powered narrative generation
 * - Interactive recap presentations
 *
 * @example
 * ```typescript
 * const service = RecapService.getInstance();
 * const recap = await service.generateRecap(tripId);
 * const highlights = await service.getHighlights(tripId, 'week');
 * const narrative = await service.generateNarrative(tripId);
 * ```
 */
export declare class RecapService {
    private static instance;
    private constructor();
    static getInstance(): RecapService;
    /**
     * Generate comprehensive trip recap
     */
    generateRecap(tripId: string, options?: RecapOptions): Promise<TripRecap>;
    /**
     * Get trip highlights for a specific timeframe
     */
    getHighlights(tripId: string, timeframe?: RecapTimeframe): Promise<RecapHighlight[]>;
    /**
     * Generate daily recap
     */
    generateDailyRecap(tripId: string, date: string): Promise<DailyRecap>;
    private getAllMoments;
    private getMomentsForDate;
    private detectTimeframe;
    private calculateDuration;
    private generateInsights;
    private analyzeActivityPatterns;
    private analyzeLocationPatterns;
    private analyzeContentPatterns;
    private selectHighlights;
    private calculateSignificanceScore;
    private generateMomentTitle;
    private getMomentTypeEmoji;
    private generateNarrativeText;
    private generateTitle;
    private generateSubtitle;
    private generateLocationSummary;
    private calculateStatistics;
    private generateRecommendations;
    private generateVisualElements;
    private calculateConfidence;
    private calculateDailyStatistics;
    private generateDailySummary;
    private generateDailyJourney;
    private analyzeDailyMood;
}
export interface RecapOptions {
    timeframe?: RecapTimeframe;
    maxHighlights?: number;
    includeInsights?: boolean;
    includeNarrative?: boolean;
    includeVisuals?: boolean;
}
export type RecapTimeframe = 'day' | 'week' | 'month' | 'trip';
export interface TripRecap {
    id: string;
    trip_id: string;
    generated_at: Date;
    timeframe: RecapTimeframe;
    summary: {
        title: string;
        subtitle: string;
        duration: number;
        location_summary: string;
    };
    highlights: RecapHighlight[];
    insights: RecapInsight[];
    narrative: string;
    statistics: any;
    recommendations: RecapRecommendation[];
    visual_elements: VisualElement[];
    metadata: {
        total_moments: number;
        processing_time_ms: number;
        ai_confidence: number;
    };
}
export interface RecapHighlight {
    moment_id: string;
    type: string;
    title: string;
    description?: string;
    media_url?: string;
    thumbnail_url?: string;
    timestamp: Date;
    location?: string;
    significance_score: number;
    tags?: string[];
    emoji?: string;
}
export interface RecapInsight {
    type: string;
    title: string;
    description: string;
    value: number;
    confidence: number;
    category: 'behavior' | 'location' | 'content' | 'mood' | 'social';
}
export interface RecapRecommendation {
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
}
export interface VisualElement {
    type: 'photo_collage' | 'journey_map' | 'statistics_chart' | 'timeline' | 'word_cloud';
    title: string;
    data: any;
    style: string;
}
export interface DailyRecap {
    date: string;
    trip_id: string;
    summary: string;
    moments_count: number;
    highlights: RecapHighlight[];
    statistics: DailyStats;
    journey: DailyJourney;
    mood: DailyMood;
    generated_at: Date;
}
export interface DailyStats {
    moments_count: number;
    moments_by_type: Record<string, number>;
    distance_km: number;
    locations_visited: string[];
    active_hours: number;
    first_moment?: Date;
    last_moment?: Date;
}
export interface DailyJourney {
    start_location?: string;
    end_location?: string;
    route_points: Array<{
        latitude: number;
        longitude: number;
        timestamp: Date;
        place_name?: string;
    }>;
    total_distance_km: number;
}
export interface DailyMood {
    overall: 'positive' | 'negative' | 'neutral';
    confidence: number;
    breakdown?: Record<string, number>;
}
