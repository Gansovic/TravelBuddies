import { describe, it, expect } from 'vitest';
import { DataConverters } from './data-converters';
describe('DataConverters', () => {
    describe('queryResultToJson', () => {
        it('should handle null/undefined', () => {
            expect(DataConverters.queryResultToJson(null)).toBeNull();
            expect(DataConverters.queryResultToJson(undefined)).toBeNull();
        });
        it('should handle arrays', () => {
            const input = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }];
            const result = DataConverters.queryResultToJson(input);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 1, name: 'test' });
        });
        it('should convert dates to ISO strings', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            const input = { created_at: date };
            const result = DataConverters.queryResultToJson(input);
            expect(result.created_at).toBe('2024-01-01T00:00:00.000Z');
        });
        it('should handle nested objects', () => {
            const input = {
                user: {
                    id: 1,
                    profile: { name: 'John' }
                }
            };
            const result = DataConverters.queryResultToJson(input);
            expect(result.user.profile.name).toBe('John');
        });
    });
    describe('toTypedObject', () => {
        it('should convert valid objects', () => {
            const input = { id: 1, name: 'test' };
            const result = DataConverters.toTypedObject(input);
            expect(result).toEqual(input);
            expect(result).not.toBe(input); // Should be a deep clone
        });
        it('should throw for null/undefined', () => {
            expect(() => DataConverters.toTypedObject(null)).toThrow();
            expect(() => DataConverters.toTypedObject(undefined)).toThrow();
        });
        it('should throw for non-objects', () => {
            expect(() => DataConverters.toTypedObject('string')).toThrow();
            expect(() => DataConverters.toTypedObject(123)).toThrow();
            expect(() => DataConverters.toTypedObject(true)).toThrow();
        });
    });
    describe('toTrip', () => {
        it('should convert valid trip data', () => {
            const input = {
                id: 'trip123',
                name: 'Paris Trip',
                start_date: '2024-01-01',
                end_date: '2024-01-05',
                destination: {
                    placeId: 'place123',
                    name: 'Paris',
                    address: '123 Main St',
                    lat: 48.8566,
                    lng: 2.3522
                },
                user_id: 'user123',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            };
            const result = DataConverters.toTrip(input);
            expect(result.id).toBe('trip123');
            expect(result.name).toBe('Paris Trip');
            expect(result.startDate).toBe('2024-01-01');
            expect(result.endDate).toBe('2024-01-05');
            expect(result.destination?.name).toBe('Paris');
            expect(result.destination?.lat).toBe(48.8566);
            expect(result.userId).toBe('user123');
        });
        it('should handle missing destination', () => {
            const input = {
                id: 'trip123',
                name: 'Trip',
                user_id: 'user123'
            };
            const result = DataConverters.toTrip(input);
            expect(result.destination).toBeNull();
        });
        it('should throw for invalid data', () => {
            expect(() => DataConverters.toTrip(null)).toThrow();
            expect(() => DataConverters.toTrip('string')).toThrow();
        });
    });
    describe('toString', () => {
        it('should convert values to strings', () => {
            expect(DataConverters.toString('hello')).toBe('hello');
            expect(DataConverters.toString(123)).toBe('123');
            expect(DataConverters.toString(true)).toBe('true');
        });
        it('should trim whitespace', () => {
            expect(DataConverters.toString('  hello  ')).toBe('hello');
        });
        it('should handle null/undefined', () => {
            expect(DataConverters.toString(null)).toBe('');
            expect(DataConverters.toString(undefined)).toBe('');
        });
    });
    describe('toNumber', () => {
        it('should convert values to numbers', () => {
            expect(DataConverters.toNumber('123')).toBe(123);
            expect(DataConverters.toNumber(456)).toBe(456);
            expect(DataConverters.toNumber('123.45')).toBe(123.45);
        });
        it('should handle invalid numbers', () => {
            expect(DataConverters.toNumber('abc')).toBe(0);
            expect(DataConverters.toNumber(null)).toBe(0);
            expect(DataConverters.toNumber(undefined)).toBe(0);
        });
    });
    describe('toBoolean', () => {
        it('should convert truthy values', () => {
            expect(DataConverters.toBoolean(true)).toBe(true);
            expect(DataConverters.toBoolean('true')).toBe(true);
            expect(DataConverters.toBoolean('1')).toBe(true);
            expect(DataConverters.toBoolean(1)).toBe(true);
        });
        it('should convert falsy values', () => {
            expect(DataConverters.toBoolean(false)).toBe(false);
            expect(DataConverters.toBoolean('false')).toBe(false);
            expect(DataConverters.toBoolean('0')).toBe(false);
            expect(DataConverters.toBoolean(0)).toBe(false);
            expect(DataConverters.toBoolean(null)).toBe(false);
            expect(DataConverters.toBoolean(undefined)).toBe(false);
        });
    });
    describe('validateRequired', () => {
        it('should pass validation for valid data', () => {
            const data = { name: 'John', email: 'john@example.com' };
            expect(() => DataConverters.validateRequired(data, ['name', 'email'])).not.toThrow();
        });
        it('should throw for missing fields', () => {
            const data = { name: 'John' };
            expect(() => DataConverters.validateRequired(data, ['name', 'email'])).toThrow('Missing required fields: email');
        });
        it('should throw for empty string fields', () => {
            const data = { name: '', email: 'john@example.com' };
            expect(() => DataConverters.validateRequired(data, ['name', 'email'])).toThrow('Missing required fields: name');
        });
        it('should throw for null/undefined data', () => {
            expect(() => DataConverters.validateRequired(null, ['name'])).toThrow('Data is required');
            expect(() => DataConverters.validateRequired(undefined, ['name'])).toThrow('Data is required');
        });
    });
    describe('sanitizeForDatabase', () => {
        it('should remove undefined values', () => {
            const input = { name: 'John', age: undefined, city: 'Paris' };
            const result = DataConverters.sanitizeForDatabase(input);
            expect(result).toEqual({ name: 'John', city: 'Paris' });
            expect(result.age).toBeUndefined();
        });
        it('should preserve null values', () => {
            const input = { name: 'John', age: null };
            const result = DataConverters.sanitizeForDatabase(input);
            expect(result.age).toBeNull();
        });
        it('should trim string values', () => {
            const input = { name: '  John  ', city: '  Paris  ' };
            const result = DataConverters.sanitizeForDatabase(input);
            expect(result.name).toBe('John');
            expect(result.city).toBe('Paris');
        });
        it('should handle nested objects', () => {
            const input = {
                user: {
                    name: '  John  ',
                    profile: { bio: '  Developer  ' }
                }
            };
            const result = DataConverters.sanitizeForDatabase(input);
            expect(result.user.name).toBe('John');
            expect(result.user.profile.bio).toBe('Developer');
        });
    });
});
