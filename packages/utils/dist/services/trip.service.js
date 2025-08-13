import { createClient } from '@supabase/supabase-js';
import { DataConverters } from '../utils/data-converters';
import { AppConstants } from '../constants/app-constants';
/**
 * TripService - Centralized trip data operations service
 * Following singleton pattern as per engineering principles
 *
 * Handles all trip-related data operations:
 * - Trip CRUD operations (read-only, writes via Edge Functions)
 * - Trip searching and filtering
 * - Trip statistics and analytics
 * - RLS-protected data access
 *
 * @example
 * ```typescript
 * const service = TripService.getInstance();
 * const trips = await service.getUserTrips(userId);
 * const stats = await service.getTripStats(userId);
 * ```
 */
export class TripService {
    constructor() {
        this.supabase = null;
        // Initialize Supabase client if available
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
            this.supabase = createClient(url, key);
        }
    }
    static getInstance() {
        if (!TripService.instance) {
            TripService.instance = new TripService();
        }
        return TripService.instance;
    }
    /**
     * Get all trips for a user (RLS-protected)
     */
    async getUserTrips(userId) {
        if (!this.supabase || !userId)
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select(`
          id,
          name,
          start_date,
          end_date,
          destination,
          created_at,
          updated_at,
          trip_members (
            id,
            user_id,
            role
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching user trips:', error);
                return [];
            }
            return data?.map(trip => DataConverters.toTrip(trip)) || [];
        }
        catch (error) {
            console.error('Failed to fetch user trips:', error);
            return [];
        }
    }
    /**
     * Get a specific trip by ID (RLS-protected)
     */
    async getTrip(tripId) {
        if (!this.supabase || !tripId)
            return null;
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select(`
          id,
          name,
          start_date,
          end_date,
          destination,
          created_at,
          updated_at,
          trip_members (
            id,
            user_id,
            role,
            users (
              id,
              email,
              display_name
            )
          )
        `)
                .eq('id', tripId)
                .single();
            if (error) {
                console.error('Error fetching trip:', error);
                return null;
            }
            return data ? DataConverters.toTrip(data) : null;
        }
        catch (error) {
            console.error('Failed to fetch trip:', error);
            return null;
        }
    }
    /**
     * Search trips by name or destination
     */
    async searchTrips(userId, query, limit = AppConstants.defaultPageSize) {
        if (!this.supabase || !userId || !query.trim())
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select('id, name, start_date, end_date, destination, created_at')
                .eq('user_id', userId)
                .or(`name.ilike.%${query}%,destination->>name.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('Error searching trips:', error);
                return [];
            }
            return data?.map(trip => DataConverters.toTrip(trip)) || [];
        }
        catch (error) {
            console.error('Failed to search trips:', error);
            return [];
        }
    }
    /**
     * Get trip statistics for a user
     */
    async getTripStats(userId) {
        if (!this.supabase || !userId) {
            return {
                totalTrips: 0,
                totalDistance: 0,
                totalDuration: 0,
                averageDuration: 0,
                favoriteDestination: null,
            };
        }
        try {
            // Get basic trip counts and data
            const { data: trips, error } = await this.supabase
                .from('trips')
                .select('id, name, start_date, end_date, destination')
                .eq('user_id', userId);
            if (error) {
                console.error('Error fetching trip stats:', error);
                return this.getEmptyStats();
            }
            if (!trips || trips.length === 0) {
                return this.getEmptyStats();
            }
            // Calculate statistics
            const totalTrips = trips.length;
            const destinations = trips
                .map(t => t.destination?.name)
                .filter(Boolean);
            const destinationCounts = {};
            destinations.forEach(dest => {
                destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
            });
            const favoriteDestination = Object.entries(destinationCounts)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
            // Calculate durations
            const durations = trips
                .filter(t => t.start_date && t.end_date)
                .map(t => new Date(t.end_date).getTime() - new Date(t.start_date).getTime())
                .filter(d => d > 0);
            const totalDuration = durations.reduce((sum, d) => sum + d, 0);
            const averageDuration = durations.length > 0 ? totalDuration / durations.length : 0;
            return {
                totalTrips,
                totalDistance: 0, // Would need additional data from itinerary_items
                totalDuration,
                averageDuration,
                favoriteDestination,
                destinationsVisited: Object.keys(destinationCounts).length,
                averageTripLength: averageDuration / (24 * 60 * 60 * 1000), // Days
            };
        }
        catch (error) {
            console.error('Failed to calculate trip stats:', error);
            return this.getEmptyStats();
        }
    }
    /**
     * Get recent trips for a user
     */
    async getRecentTrips(userId, limit = 5) {
        if (!this.supabase || !userId)
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select('id, name, start_date, end_date, destination, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('Error fetching recent trips:', error);
                return [];
            }
            return data?.map(trip => DataConverters.toTrip(trip)) || [];
        }
        catch (error) {
            console.error('Failed to fetch recent trips:', error);
            return [];
        }
    }
    /**
     * Get trips by date range
     */
    async getTripsByDateRange(userId, startDate, endDate) {
        if (!this.supabase || !userId)
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trips')
                .select('id, name, start_date, end_date, destination, created_at')
                .eq('user_id', userId)
                .gte('start_date', startDate)
                .lte('end_date', endDate)
                .order('start_date', { ascending: true });
            if (error) {
                console.error('Error fetching trips by date range:', error);
                return [];
            }
            return data?.map(trip => DataConverters.toTrip(trip)) || [];
        }
        catch (error) {
            console.error('Failed to fetch trips by date range:', error);
            return [];
        }
    }
    /**
     * Check if user has access to trip (via trip members)
     */
    async hasAccessToTrip(userId, tripId) {
        if (!this.supabase || !userId || !tripId)
            return false;
        try {
            const { data, error } = await this.supabase
                .from('trip_members')
                .select('id')
                .eq('trip_id', tripId)
                .eq('user_id', userId)
                .single();
            return !error && !!data;
        }
        catch {
            return false;
        }
    }
    /**
     * Get trip members
     */
    async getTripMembers(tripId) {
        if (!this.supabase || !tripId)
            return [];
        try {
            const { data, error } = await this.supabase
                .from('trip_members')
                .select(`
          id,
          user_id,
          role,
          users (
            id,
            email,
            display_name,
            avatar_url
          )
        `)
                .eq('trip_id', tripId);
            if (error) {
                console.error('Error fetching trip members:', error);
                return [];
            }
            return data?.map(member => ({
                id: member.id,
                userId: member.user_id,
                role: member.role,
                user: {
                    id: member.users.id,
                    email: member.users.email,
                    displayName: member.users.display_name,
                    avatarUrl: member.users.avatar_url,
                },
            })) || [];
        }
        catch (error) {
            console.error('Failed to fetch trip members:', error);
            return [];
        }
    }
    getEmptyStats() {
        return {
            totalTrips: 0,
            totalDistance: 0,
            totalDuration: 0,
            averageDuration: 0,
            favoriteDestination: null,
            destinationsVisited: 0,
            averageTripLength: 0,
        };
    }
}
