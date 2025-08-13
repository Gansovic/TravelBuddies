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
export class NumberFormatters {
    /**
     * Format points with appropriate suffix
     */
    static formatPoints(points) {
        if (!points || isNaN(points))
            return '0 pts';
        if (points >= 1000000) {
            return `${(points / 1000000).toFixed(1)}M pts`;
        }
        else if (points >= 1000) {
            return `${(points / 1000).toFixed(1)}K pts`;
        }
        else {
            return `${points.toLocaleString()} pts`;
        }
    }
    /**
     * Format distance in meters to appropriate unit
     */
    static formatDistance(meters) {
        if (!meters || isNaN(meters) || meters < 0)
            return '0 m';
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        else {
            return `${Math.round(meters)} m`;
        }
    }
    /**
     * Format currency with proper symbol and decimals
     */
    static formatCurrency(amount, currency = 'USD') {
        if (!amount || isNaN(amount))
            return this.getCurrencySymbol(currency) + '0.00';
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency.toUpperCase(),
            }).format(amount);
        }
        catch {
            // Fallback for unsupported currencies
            const symbol = this.getCurrencySymbol(currency);
            return `${symbol}${Math.abs(amount).toFixed(2)}`;
        }
    }
    /**
     * Format percentage with appropriate decimals
     */
    static formatPercentage(value, decimals = 1) {
        if (!value || isNaN(value))
            return '0%';
        return `${value.toFixed(decimals)}%`;
    }
    /**
     * Format large numbers with K/M/B suffixes
     */
    static formatLargeNumber(value) {
        if (!value || isNaN(value))
            return '0';
        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';
        if (abs >= 1000000000) {
            return `${sign}${(abs / 1000000000).toFixed(1)}B`;
        }
        else if (abs >= 1000000) {
            return `${sign}${(abs / 1000000).toFixed(1)}M`;
        }
        else if (abs >= 1000) {
            return `${sign}${(abs / 1000).toFixed(1)}K`;
        }
        else {
            return value.toLocaleString();
        }
    }
    /**
     * Format duration in milliseconds to human-readable format
     */
    static formatDuration(milliseconds) {
        if (!milliseconds || isNaN(milliseconds) || milliseconds < 0)
            return '0s';
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Format CO2 emissions with appropriate unit
     */
    static formatCO2(grams) {
        if (!grams || isNaN(grams) || grams < 0)
            return '0g CO₂';
        if (grams >= 1000) {
            return `${(grams / 1000).toFixed(1)} kg CO₂`;
        }
        else {
            return `${Math.round(grams)}g CO₂`;
        }
    }
    /**
     * Format speed with appropriate unit
     */
    static formatSpeed(metersPerSecond) {
        if (!metersPerSecond || isNaN(metersPerSecond) || metersPerSecond < 0) {
            return '0 km/h';
        }
        const kmh = metersPerSecond * 3.6;
        return `${kmh.toFixed(1)} km/h`;
    }
    /**
     * Format file size in bytes to human-readable format
     */
    static formatFileSize(bytes) {
        if (!bytes || isNaN(bytes) || bytes < 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }
    /**
     * Format temperature with unit
     */
    static formatTemperature(celsius, unit = 'C') {
        if (isNaN(celsius))
            return '--°';
        if (unit === 'F') {
            const fahrenheit = (celsius * 9 / 5) + 32;
            return `${Math.round(fahrenheit)}°F`;
        }
        else {
            return `${Math.round(celsius)}°C`;
        }
    }
    /**
     * Format rating out of 5 stars
     */
    static formatRating(rating, maxRating = 5) {
        if (!rating || isNaN(rating))
            return '0/5 ⭐';
        const clampedRating = Math.min(Math.max(rating, 0), maxRating);
        return `${clampedRating.toFixed(1)}/${maxRating} ⭐`;
    }
    /**
     * Format decimal as fraction (for ratios)
     */
    static formatFraction(decimal) {
        if (!decimal || isNaN(decimal))
            return '0/1';
        // Convert to simple fractions for common decimals
        const commonFractions = {
            '0.25': '1/4',
            '0.33': '1/3',
            '0.5': '1/2',
            '0.67': '2/3',
            '0.75': '3/4',
        };
        const key = decimal.toFixed(2);
        if (commonFractions[key]) {
            return commonFractions[key];
        }
        return `${decimal.toFixed(2)}/1`;
    }
    /**
     * Get currency symbol for currency code
     */
    static getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'Fr',
            'CNY': '¥',
            'SEK': 'kr',
            'NZD': 'NZ$',
        };
        return symbols[currency.toUpperCase()] || currency.toUpperCase() + ' ';
    }
}
