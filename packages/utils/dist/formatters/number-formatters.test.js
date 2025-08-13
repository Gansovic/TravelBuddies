import { describe, it, expect } from 'vitest';
import { NumberFormatters } from './number-formatters';
describe('NumberFormatters', () => {
    describe('formatPoints', () => {
        it('should format small point values', () => {
            expect(NumberFormatters.formatPoints(0)).toBe('0 pts');
            expect(NumberFormatters.formatPoints(100)).toBe('100 pts');
            expect(NumberFormatters.formatPoints(999)).toBe('999 pts');
        });
        it('should format thousands with K suffix', () => {
            expect(NumberFormatters.formatPoints(1000)).toBe('1.0K pts');
            expect(NumberFormatters.formatPoints(1500)).toBe('1.5K pts');
            expect(NumberFormatters.formatPoints(999999)).toBe('1000.0K pts');
        });
        it('should format millions with M suffix', () => {
            expect(NumberFormatters.formatPoints(1000000)).toBe('1.0M pts');
            expect(NumberFormatters.formatPoints(2500000)).toBe('2.5M pts');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatPoints(NaN)).toBe('0 pts');
            expect(NumberFormatters.formatPoints(null)).toBe('0 pts');
            expect(NumberFormatters.formatPoints(undefined)).toBe('0 pts');
        });
    });
    describe('formatDistance', () => {
        it('should format meters', () => {
            expect(NumberFormatters.formatDistance(0)).toBe('0 m');
            expect(NumberFormatters.formatDistance(500)).toBe('500 m');
            expect(NumberFormatters.formatDistance(999)).toBe('999 m');
        });
        it('should format kilometers', () => {
            expect(NumberFormatters.formatDistance(1000)).toBe('1.0 km');
            expect(NumberFormatters.formatDistance(1500)).toBe('1.5 km');
            expect(NumberFormatters.formatDistance(10000)).toBe('10.0 km');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatDistance(-100)).toBe('0 m');
            expect(NumberFormatters.formatDistance(NaN)).toBe('0 m');
            expect(NumberFormatters.formatDistance(null)).toBe('0 m');
        });
    });
    describe('formatCurrency', () => {
        it('should format USD by default', () => {
            expect(NumberFormatters.formatCurrency(49.99)).toBe('$49.99');
            expect(NumberFormatters.formatCurrency(100)).toBe('$100.00');
        });
        it('should format different currencies', () => {
            expect(NumberFormatters.formatCurrency(49.99, 'EUR')).toBe('€49.99');
            expect(NumberFormatters.formatCurrency(100, 'GBP')).toBe('£100.00');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatCurrency(0)).toBe('$0.00');
            expect(NumberFormatters.formatCurrency(NaN)).toBe('$0.00');
        });
        it('should handle unknown currencies', () => {
            const result = NumberFormatters.formatCurrency(49.99, 'XYZ');
            expect(result).toBe('XYZ 49.99');
        });
    });
    describe('formatPercentage', () => {
        it('should format percentages with default decimals', () => {
            expect(NumberFormatters.formatPercentage(50)).toBe('50.0%');
            expect(NumberFormatters.formatPercentage(33.333)).toBe('33.3%');
        });
        it('should format percentages with custom decimals', () => {
            expect(NumberFormatters.formatPercentage(33.333, 2)).toBe('33.33%');
            expect(NumberFormatters.formatPercentage(50, 0)).toBe('50%');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatPercentage(0)).toBe('0%');
            expect(NumberFormatters.formatPercentage(NaN)).toBe('0%');
        });
    });
    describe('formatDuration', () => {
        it('should format seconds', () => {
            expect(NumberFormatters.formatDuration(5000)).toBe('5s');
            expect(NumberFormatters.formatDuration(30000)).toBe('30s');
        });
        it('should format minutes and seconds', () => {
            expect(NumberFormatters.formatDuration(65000)).toBe('1m 5s');
            expect(NumberFormatters.formatDuration(90000)).toBe('1m 30s');
        });
        it('should format hours and minutes', () => {
            expect(NumberFormatters.formatDuration(3665000)).toBe('1h 1m');
            expect(NumberFormatters.formatDuration(7200000)).toBe('2h 0m');
        });
        it('should format days and hours', () => {
            expect(NumberFormatters.formatDuration(90000000)).toBe('1d 1h');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatDuration(0)).toBe('0s');
            expect(NumberFormatters.formatDuration(-1000)).toBe('0s');
            expect(NumberFormatters.formatDuration(NaN)).toBe('0s');
        });
    });
    describe('formatCO2', () => {
        it('should format grams', () => {
            expect(NumberFormatters.formatCO2(500)).toBe('500g CO₂');
            expect(NumberFormatters.formatCO2(999)).toBe('999g CO₂');
        });
        it('should format kilograms', () => {
            expect(NumberFormatters.formatCO2(1000)).toBe('1.0 kg CO₂');
            expect(NumberFormatters.formatCO2(2500)).toBe('2.5 kg CO₂');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatCO2(0)).toBe('0g CO₂');
            expect(NumberFormatters.formatCO2(-100)).toBe('0g CO₂');
            expect(NumberFormatters.formatCO2(NaN)).toBe('0g CO₂');
        });
    });
    describe('formatRating', () => {
        it('should format ratings out of 5', () => {
            expect(NumberFormatters.formatRating(4.5)).toBe('4.5/5 ⭐');
            expect(NumberFormatters.formatRating(3.0)).toBe('3.0/5 ⭐');
        });
        it('should clamp ratings to max value', () => {
            expect(NumberFormatters.formatRating(6.0)).toBe('5.0/5 ⭐');
            expect(NumberFormatters.formatRating(-1.0)).toBe('0.0/5 ⭐');
        });
        it('should handle custom max rating', () => {
            expect(NumberFormatters.formatRating(8.5, 10)).toBe('8.5/10 ⭐');
        });
        it('should handle invalid inputs', () => {
            expect(NumberFormatters.formatRating(0)).toBe('0.0/5 ⭐');
            expect(NumberFormatters.formatRating(NaN)).toBe('0/5 ⭐');
        });
    });
});
