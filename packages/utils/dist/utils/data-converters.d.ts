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
export declare class DataConverters {
    /**
     * Convert database query result to JSON-safe object
     */
    static queryResultToJson(queryResult: any): any;
    /**
     * Convert server response to typed object with validation
     */
    static toTypedObject<T>(data: unknown): T;
    /**
     * Convert raw data to Trip object
     */
    static toTrip(data: any): any;
    /**
     * Convert raw data to Expense object
     */
    static toExpense(data: any): any;
    /**
     * Safe string conversion
     */
    static toString(value: unknown): string;
    /**
     * Safe number conversion
     */
    static toNumber(value: unknown): number;
    /**
     * Safe boolean conversion
     */
    static toBoolean(value: unknown): boolean;
    /**
     * Safe date string conversion (ISO format)
     */
    static toDateString(value: unknown): string | null;
    /**
     * Safe array conversion
     */
    static toArray<T>(value: unknown): T[];
    /**
     * Sanitize object for database insertion
     */
    static sanitizeForDatabase(data: any): any;
    /**
     * Validate required fields
     */
    static validateRequired(data: any, requiredFields: string[]): void;
}
