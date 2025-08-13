/**
 * NumberFormatters - Consistent number formatting across TravelBuddies
 * Following TravelBuddies principles for ALL number display
 *
 * Provides standardized formatting for:
 * - Points and rewards
 * - Distances and measurements
 * - Currency and money amounts
 * - Percentages and ratios
 * - Large numbers with units
 *
 * @example
 * ```typescript
 * <Text>{NumberFormatters.formatPoints(1250)}</Text>        // "1,250 pts"
 * <Text>{NumberFormatters.formatDistance(2500)}</Text>      // "2.5 km"
 * <Text>{NumberFormatters.formatCurrency(49.99, 'USD')}</Text> // "$49.99"
 * ```
 */
export declare class NumberFormatters {
    /**
     * Format points with appropriate suffix
     */
    static formatPoints(points: number): string;
    /**
     * Format distance in meters to appropriate unit
     */
    static formatDistance(meters: number): string;
    /**
     * Format currency with proper symbol and decimals
     */
    static formatCurrency(amount: number, currency?: string): string;
    /**
     * Format percentage with appropriate decimals
     */
    static formatPercentage(value: number, decimals?: number): string;
    /**
     * Format large numbers with K/M/B suffixes
     */
    static formatLargeNumber(value: number): string;
    /**
     * Format duration in milliseconds to human-readable format
     */
    static formatDuration(milliseconds: number): string;
    /**
     * Format CO2 emissions with appropriate unit
     */
    static formatCO2(grams: number): string;
    /**
     * Format speed with appropriate unit
     */
    static formatSpeed(metersPerSecond: number): string;
    /**
     * Format file size in bytes to human-readable format
     */
    static formatFileSize(bytes: number): string;
    /**
     * Format temperature with unit
     */
    static formatTemperature(celsius: number, unit?: 'C' | 'F'): string;
    /**
     * Format rating out of 5 stars
     */
    static formatRating(rating: number, maxRating?: number): string;
    /**
     * Format decimal as fraction (for ratios)
     */
    static formatFraction(decimal: number): string;
    /**
     * Get currency symbol for currency code
     */
    private static getCurrencySymbol;
}
