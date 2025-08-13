/**
 * DataConverters - Type-safe data transformation utilities
 * Following TravelBuddies principles for ALL data exchange between client and server
 *
 * Provides safe conversion utilities for:
 * - Database query results to JSON
 * - Edge Function responses to typed objects
 * - Client data to server-safe formats
 * - Type validation and sanitization
 *
 * @example
 * ```typescript
 * const result = await edgeFunction.invoke('processTrip', data);
 * const safeData = DataConverters.toTypedObject(result.data);
 * const trips = safeData.trips.map((item: any) => DataConverters.toTrip(item));
 * ```
 */
export class DataConverters {
    /**
     * Convert database query result to JSON-safe object
     */
    static queryResultToJson(queryResult) {
        if (!queryResult)
            return null;
        // Handle arrays
        if (Array.isArray(queryResult)) {
            return queryResult.map(item => this.queryResultToJson(item));
        }
        // Handle objects
        if (typeof queryResult === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(queryResult)) {
                if (value === null || value === undefined) {
                    result[key] = null;
                }
                else if (value instanceof Date) {
                    result[key] = value.toISOString();
                }
                else if (typeof value === 'object') {
                    result[key] = this.queryResultToJson(value);
                }
                else {
                    result[key] = value;
                }
            }
            return result;
        }
        return queryResult;
    }
    /**
     * Convert server response to typed object with validation
     */
    static toTypedObject(data) {
        if (data === null || data === undefined) {
            throw new Error('Cannot convert null/undefined to typed object');
        }
        if (typeof data !== 'object') {
            throw new Error(`Expected object, got ${typeof data}`);
        }
        // Deep clone to prevent reference issues
        return JSON.parse(JSON.stringify(data));
    }
    /**
     * Convert raw data to Trip object
     */
    static toTrip(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid trip data');
        }
        return {
            id: this.toString(data.id),
            name: this.toString(data.name),
            startDate: this.toDateString(data.start_date || data.startDate),
            endDate: this.toDateString(data.end_date || data.endDate),
            destination: data.destination ? {
                placeId: this.toString(data.destination.placeId),
                name: this.toString(data.destination.name),
                address: this.toString(data.destination.address),
                lat: this.toNumber(data.destination.lat),
                lng: this.toNumber(data.destination.lng),
            } : null,
            userId: this.toString(data.user_id || data.userId),
            createdAt: this.toDateString(data.created_at || data.createdAt),
            updatedAt: this.toDateString(data.updated_at || data.updatedAt),
        };
    }
    /**
     * Convert raw data to Expense object
     */
    static toExpense(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid expense data');
        }
        return {
            id: this.toString(data.id),
            tripId: this.toString(data.trip_id || data.tripId),
            description: this.toString(data.description),
            amount: this.toNumber(data.amount),
            currency: this.toString(data.currency),
            paidById: this.toString(data.paid_by_id || data.paidById),
            participants: data.participants || [],
            createdAt: this.toDateString(data.created_at || data.createdAt),
        };
    }
    /**
     * Safe string conversion
     */
    static toString(value) {
        if (value === null || value === undefined)
            return '';
        return String(value).trim();
    }
    /**
     * Safe number conversion
     */
    static toNumber(value) {
        if (value === null || value === undefined)
            return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }
    /**
     * Safe boolean conversion
     */
    static toBoolean(value) {
        if (value === null || value === undefined)
            return false;
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
    }
    /**
     * Safe date string conversion (ISO format)
     */
    static toDateString(value) {
        if (!value)
            return null;
        try {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.toISOString();
        }
        catch {
            return null;
        }
    }
    /**
     * Safe array conversion
     */
    static toArray(value) {
        if (Array.isArray(value))
            return value;
        if (value === null || value === undefined)
            return [];
        return [value];
    }
    /**
     * Sanitize object for database insertion
     */
    static sanitizeForDatabase(data) {
        if (!data || typeof data !== 'object')
            return data;
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined)
                continue; // Skip undefined values
            if (value === null) {
                sanitized[key] = null;
            }
            else if (typeof value === 'string') {
                sanitized[key] = value.trim();
            }
            else if (typeof value === 'object' && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeForDatabase(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * Validate required fields
     */
    static validateRequired(data, requiredFields) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data is required');
        }
        const missing = requiredFields.filter(field => {
            const value = data[field];
            return value === null || value === undefined || value === '';
        });
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }
}
