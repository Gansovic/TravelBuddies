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
export class RecapService {
    constructor() { }
    static getInstance() {
        if (!RecapService.instance) {
            RecapService.instance = new RecapService();
        }
        return RecapService.instance;
    }
    /**
     * Generate comprehensive trip recap
     */
    async generateRecap(tripId, options = {}) {
        try {
            const moments = await this.getAllMoments(tripId);
            if (moments.length === 0) {
                throw new Error('No moments found for recap generation');
            }
            const timeframe = options.timeframe || this.detectTimeframe(moments);
            const insights = await this.generateInsights(moments, timeframe);
            const highlights = await this.selectHighlights(moments, options);
            const narrative = await this.generateNarrativeText(moments, insights);
            const statistics = await this.calculateStatistics(moments);
            const recommendations = await this.generateRecommendations(moments, insights);
            const recap = {
                id: crypto.randomUUID(),
                trip_id: tripId,
                generated_at: new Date(),
                timeframe,
                summary: {
                    title: await this.generateTitle(moments, insights),
                    subtitle: await this.generateSubtitle(moments, statistics),
                    duration: this.calculateDuration(moments),
                    location_summary: this.generateLocationSummary(moments)
                },
                highlights,
                insights,
                narrative,
                statistics,
                recommendations,
                visual_elements: await this.generateVisualElements(moments, highlights),
                metadata: {
                    total_moments: moments.length,
                    processing_time_ms: Date.now() - Date.now(),
                    ai_confidence: this.calculateConfidence(insights)
                }
            };
            return recap;
        }
        catch (error) {
            console.error('Recap generation failed:', error);
            throw new Error('Failed to generate trip recap');
        }
    }
    /**
     * Get trip highlights for a specific timeframe
     */
    async getHighlights(tripId, timeframe = 'trip') {
        try {
            const moments = await this.getAllMoments(tripId);
            return await this.selectHighlights(moments, { timeframe });
        }
        catch (error) {
            console.error('Highlights generation failed:', error);
            throw new Error('Failed to generate highlights');
        }
    }
    /**
     * Generate daily recap
     */
    async generateDailyRecap(tripId, date) {
        try {
            const moments = await this.getMomentsForDate(tripId, date);
            if (moments.length === 0) {
                throw new Error('No moments found for the specified date');
            }
            const dailyStats = this.calculateDailyStatistics(moments);
            const highlights = moments
                .filter((m) => m.is_highlight || m.is_starred)
                .slice(0, 3);
            const summary = await this.generateDailySummary(moments, dailyStats);
            return {
                date,
                trip_id: tripId,
                summary,
                moments_count: moments.length,
                highlights: highlights.map((moment) => ({
                    moment_id: moment.id,
                    type: moment.type,
                    title: moment.title || this.generateMomentTitle(moment),
                    description: moment.description,
                    media_url: moment.media_url,
                    timestamp: new Date(moment.captured_at),
                    location: moment.place_name,
                    significance_score: this.calculateSignificanceScore(moment)
                })),
                statistics: dailyStats,
                journey: this.generateDailyJourney(moments),
                mood: await this.analyzeDailyMood(moments),
                generated_at: new Date()
            };
        }
        catch (error) {
            console.error('Daily recap generation failed:', error);
            throw new Error('Failed to generate daily recap');
        }
    }
    // Private helper methods
    async getAllMoments(tripId) {
        // TODO: Implement actual moment retrieval
        return [];
    }
    async getMomentsForDate(tripId, date) {
        const allMoments = await this.getAllMoments(tripId);
        return allMoments.filter((moment) => new Date(moment.captured_at).toISOString().split('T')[0] === date);
    }
    detectTimeframe(moments) {
        const duration = this.calculateDuration(moments);
        if (duration <= 1)
            return 'day';
        if (duration <= 7)
            return 'week';
        if (duration <= 30)
            return 'month';
        return 'trip';
    }
    calculateDuration(moments) {
        if (moments.length === 0)
            return 0;
        const dates = moments.map((m) => new Date(m.captured_at).toISOString().split('T')[0]);
        const uniqueDates = Array.from(new Set(dates));
        return uniqueDates.length;
    }
    async generateInsights(moments, timeframe) {
        const insights = [];
        // Activity patterns
        const activityInsight = this.analyzeActivityPatterns(moments);
        if (activityInsight)
            insights.push(activityInsight);
        // Location insights
        const locationInsight = this.analyzeLocationPatterns(moments);
        if (locationInsight)
            insights.push(locationInsight);
        // Content insights
        const contentInsight = this.analyzeContentPatterns(moments);
        if (contentInsight)
            insights.push(contentInsight);
        return insights;
    }
    analyzeActivityPatterns(moments) {
        const hourCounts = moments.reduce((counts, moment) => {
            const hour = new Date(moment.captured_at).getHours();
            counts[hour] = (counts[hour] || 0) + 1;
            return counts;
        }, {});
        const peakHour = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)[0];
        if (!peakHour)
            return null;
        const hour = parseInt(peakHour[0]);
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        return {
            type: 'activity_pattern',
            title: `Most Active in the ${timeOfDay}`,
            description: `You captured ${peakHour[1]} moments during ${timeOfDay} hours, making it your most active time of day.`,
            value: peakHour[1],
            confidence: 0.8,
            category: 'behavior'
        };
    }
    analyzeLocationPatterns(moments) {
        const locations = moments
            .filter((m) => m.city)
            .map((m) => m.city);
        if (locations.length === 0)
            return null;
        const locationCounts = locations.reduce((counts, location) => {
            counts[location] = (counts[location] || 0) + 1;
            return counts;
        }, {});
        const favoriteLocation = Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)[0];
        return {
            type: 'location_pattern',
            title: `Favorite Destination: ${favoriteLocation[0]}`,
            description: `You captured ${favoriteLocation[1]} moments in ${favoriteLocation[0]}, making it your most documented location.`,
            value: favoriteLocation[1],
            confidence: 0.9,
            category: 'location'
        };
    }
    analyzeContentPatterns(moments) {
        const typeCounts = moments.reduce((counts, moment) => {
            counts[moment.type] = (counts[moment.type] || 0) + 1;
            return counts;
        }, {});
        const favoriteType = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)[0];
        if (!favoriteType)
            return null;
        const typeEmoji = this.getMomentTypeEmoji(favoriteType[0]);
        return {
            type: 'content_pattern',
            title: `${typeEmoji} ${favoriteType[0]} enthusiast`,
            description: `${favoriteType[1]} ${favoriteType[0]} moments captured - your preferred way to document memories.`,
            value: favoriteType[1],
            confidence: 0.85,
            category: 'content'
        };
    }
    async selectHighlights(moments, options = {}) {
        const scoredMoments = moments.map((moment) => ({
            moment,
            score: this.calculateSignificanceScore(moment)
        }));
        const topMoments = scoredMoments
            .sort((a, b) => b.score - a.score)
            .slice(0, options.maxHighlights || 10);
        return topMoments.map(({ moment, score }) => ({
            moment_id: moment.id,
            type: moment.type,
            title: moment.title || this.generateMomentTitle(moment),
            description: moment.description,
            media_url: moment.media_url,
            thumbnail_url: moment.thumbnail_url,
            timestamp: new Date(moment.captured_at),
            location: moment.place_name,
            significance_score: score,
            tags: moment.ai_analysis?.suggested_tags || [],
            emoji: moment.ai_analysis?.suggested_emoji?.[0] || this.getMomentTypeEmoji(moment.type)
        }));
    }
    calculateSignificanceScore(moment) {
        let score = 1;
        if (moment.is_highlight)
            score += 3;
        if (moment.is_starred)
            score += 2;
        if (moment.reactions?.length > 0)
            score += moment.reactions.length * 0.5;
        if (moment.ai_analysis?.quality_score)
            score += moment.ai_analysis.quality_score;
        if (moment.place_name)
            score += 0.5;
        if (moment.title && moment.description)
            score += 0.5;
        return Math.round(score * 100) / 100;
    }
    generateMomentTitle(moment) {
        if (moment.title)
            return moment.title;
        const time = new Date(moment.captured_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        const typeEmoji = this.getMomentTypeEmoji(moment.type);
        if (moment.place_name) {
            return `${typeEmoji} ${time} at ${moment.place_name}`;
        }
        return `${typeEmoji} ${moment.type} at ${time}`;
    }
    getMomentTypeEmoji(type) {
        const emojis = {
            photo: '📷',
            video: '🎥',
            voice: '🎤',
            text: '📝',
            checkin: '📍'
        };
        return emojis[type] || '•';
    }
    async generateNarrativeText(moments, insights) {
        const timeframe = this.calculateDuration(moments);
        const locations = Array.from(new Set(moments.map((m) => m.city).filter(Boolean)));
        let narrative = '';
        if (timeframe === 1) {
            narrative += 'What a memorable day! ';
        }
        else if (timeframe <= 7) {
            narrative += `Over ${timeframe} amazing days, `;
        }
        else {
            narrative += `During this incredible ${timeframe}-day journey, `;
        }
        if (locations.length > 0) {
            if (locations.length === 1) {
                narrative += `you explored ${locations[0]} `;
            }
            else {
                narrative += `you discovered ${locations.length} different places including ${locations.slice(0, 2).join(' and ')} `;
            }
        }
        narrative += `and captured ${moments.length} precious moments. `;
        narrative += 'This beautiful collection of memories tells the story of your adventure.';
        return narrative;
    }
    async generateTitle(moments, insights) {
        const duration = this.calculateDuration(moments);
        const locations = Array.from(new Set(moments.map((m) => m.city).filter(Boolean)));
        if (duration === 1) {
            return locations.length > 0 ? `A Day in ${locations[0]}` : 'A Day of Memories';
        }
        else if (duration <= 7) {
            return locations.length > 0 ? `${duration} Days Exploring ${locations[0]}` : `${duration} Days of Adventure`;
        }
        else {
            return locations.length > 1 ? `Journey Through ${locations.length} Cities` : `${duration}-Day Adventure`;
        }
    }
    async generateSubtitle(moments, statistics) {
        return `${moments.length} moments • ${statistics.countries_visited?.length || 0} countries • ${statistics.cities_visited?.length || 0} cities`;
    }
    generateLocationSummary(moments) {
        const countries = Array.from(new Set(moments.map((m) => m.country).filter(Boolean)));
        const cities = Array.from(new Set(moments.map((m) => m.city).filter(Boolean)));
        if (countries.length === 0)
            return 'Local exploration';
        if (countries.length === 1) {
            return cities.length <= 2 ? cities.join(' and ') : `${countries[0]} (${cities.length} cities)`;
        }
        return `${countries.length} countries, ${cities.length} cities`;
    }
    async calculateStatistics(moments) {
        return {
            total_moments: moments.length,
            moments_by_type: moments.reduce((counts, moment) => {
                counts[moment.type] = (counts[moment.type] || 0) + 1;
                return counts;
            }, {}),
            duration_days: this.calculateDuration(moments),
            countries_visited: Array.from(new Set(moments.map((m) => m.country).filter(Boolean))),
            cities_visited: Array.from(new Set(moments.map((m) => m.city).filter(Boolean)))
        };
    }
    async generateRecommendations(moments, insights) {
        const recommendations = [];
        const typeCounts = moments.reduce((counts, moment) => {
            counts[moment.type] = (counts[moment.type] || 0) + 1;
            return counts;
        }, {});
        const leastUsedType = Object.entries(typeCounts)
            .sort(([, a], [, b]) => a - b)[0];
        if (leastUsedType && leastUsedType[1] < 3) {
            recommendations.push({
                type: 'content_variety',
                title: `Try more ${leastUsedType[0]} moments`,
                description: `You've only captured ${leastUsedType[1]} ${leastUsedType[0]} moments. Adding more variety could enrich your memories!`,
                priority: 'medium',
                action: `capture_${leastUsedType[0]}`
            });
        }
        return recommendations;
    }
    async generateVisualElements(moments, highlights) {
        const elements = [];
        const photoMoments = highlights.filter(h => h.type === 'photo' && h.media_url);
        if (photoMoments.length >= 4) {
            elements.push({
                type: 'photo_collage',
                title: 'Trip Highlights',
                data: photoMoments.slice(0, 9),
                style: 'grid'
            });
        }
        const stats = await this.calculateStatistics(moments);
        elements.push({
            type: 'statistics_chart',
            title: 'Trip Statistics',
            data: stats,
            style: 'cards'
        });
        return elements;
    }
    calculateConfidence(insights) {
        if (insights.length === 0)
            return 0;
        return insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length;
    }
    calculateDailyStatistics(moments) {
        return {
            moments_count: moments.length,
            moments_by_type: moments.reduce((counts, moment) => {
                counts[moment.type] = (counts[moment.type] || 0) + 1;
                return counts;
            }, {}),
            distance_km: 0,
            locations_visited: Array.from(new Set(moments.map((m) => m.place_name).filter(Boolean))),
            active_hours: Array.from(new Set(moments.map((m) => new Date(m.captured_at).getHours()))).length,
            first_moment: moments[0]?.captured_at ? new Date(moments[0].captured_at) : undefined,
            last_moment: moments[moments.length - 1]?.captured_at ? new Date(moments[moments.length - 1].captured_at) : undefined
        };
    }
    async generateDailySummary(moments, stats) {
        let summary = `A day with ${moments.length} moments captured`;
        if (stats.locations_visited.length > 0) {
            summary += ` across ${stats.locations_visited.length} locations`;
        }
        return summary + '.';
    }
    generateDailyJourney(moments) {
        const geoMoments = moments
            .filter((m) => m.latitude && m.longitude)
            .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
        return {
            start_location: geoMoments[0]?.place_name,
            end_location: geoMoments[geoMoments.length - 1]?.place_name,
            route_points: geoMoments.map((m) => ({
                latitude: m.latitude,
                longitude: m.longitude,
                timestamp: new Date(m.captured_at),
                place_name: m.place_name
            })),
            total_distance_km: 0
        };
    }
    async analyzeDailyMood(moments) {
        return {
            overall: 'neutral',
            confidence: 0
        };
    }
}
