import { createClient } from '@supabase/supabase-js';
import type { 
  Trip, 
  TripState, 
  TripStats, 
  CreateTripInput, 
  UpdateTripInput,
  TripMember,
  TripTimeline,
  TripActivity,
  InviteTripMemberInput
} from '../types/trip';
import type { Timeline } from '../types/moment';

/**
 * TripService - Memory recording focused trip operations
 * Following singleton pattern as per engineering principles
 * 
 * Handles all trip-related data operations for memory recording:
 * - Trip recording session management
 * - Real-time collaboration state
 * - Timeline and statistics
 * - Member management and invitations
 * - RLS-protected data access
 * 
 * @example
 * ```typescript
 * const service = TripService.getInstance();
 * await service.startRecording("My Trip");
 * const timeline = await service.getTripTimeline(tripId);
 * ```
 */
export class TripService {
  private static instance: TripService;
  private supabase: any = null;

  private constructor() {
    // Initialize Supabase client if available
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  static getInstance(): TripService {
    if (!TripService.instance) {
      TripService.instance = new TripService();
    }
    return TripService.instance;
  }

  /**
   * Start a new trip recording session
   */
  async startRecording(input: CreateTripInput): Promise<Trip | null> {
    if (!this.supabase) return null;

    try {
      // Use Edge Function to create trip with proper initialization
      const { data, error } = await this.supabase.functions.invoke('trip-create', {
        body: {
          name: input.name,
          start_date: input.start_date?.toISOString(),
          auto_start_recording: input.auto_start_recording ?? true,
        }
      });

      if (error) {
        console.error('Error starting trip recording:', error);
        return null;
      }

      return this.convertDatabaseTrip(data.trip);
    } catch (error) {
      console.error('Failed to start trip recording:', error);
      return null;
    }
  }

  /**
   * Get all trips for a user with memory recording data
   */
  async getUserTrips(userId: string): Promise<Trip[]> {
    if (!this.supabase || !userId) return [];

    try {
      // First get trips where user is a member (through trip_members table)
      // Using a simpler query that works with or without trip_timeline table
      const { data, error } = await this.supabase
        .from('trip_members')
        .select(`
          trip_id,
          role,
          joined_at,
          trips!inner (
            id,
            name,
            owner_id,
            start_date,
            end_date,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user trips:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('No trips found for user:', userId);
        return [];
      }

      console.log(`TripService.getUserTrips: Found ${data.length} trips for user ${userId}`);
      console.log('Latest trip:', data[0] ? {
        trip_id: data[0].trip_id,
        trip_name: data[0].trips?.name,
        joined_at: data[0].joined_at
      } : 'none');

      // Get all trip IDs to fetch member counts
      const tripIds = data.map((item: any) => item.trip_id);
      const { data: memberCounts, error: memberError } = await this.supabase
        .from('trip_members')
        .select('trip_id, user_id')
        .in('trip_id', tripIds);

      if (memberError) {
        console.warn('Error fetching member counts:', memberError);
      }

      // Create member count map
      const memberCountMap = new Map<string, number>();
      memberCounts?.forEach((member: any) => {
        const current = memberCountMap.get(member.trip_id) || 0;
        memberCountMap.set(member.trip_id, current + 1);
      });

      // Try to get timeline data (if table exists)
      let timelineMap = new Map<string, any>();
      try {
        const { data: timelines, error: timelineError } = await this.supabase
          .from('trip_timeline')
          .select('*')
          .in('trip_id', tripIds);

        if (!timelineError && timelines) {
          timelines.forEach((timeline: any) => {
            timelineMap.set(timeline.trip_id, timeline);
          });
          console.log(`Loaded ${timelines.length} timeline records`);
        } else if (timelineError) {
          console.warn('Timeline table not available:', timelineError.message);
        }
      } catch (timelineErr) {
        console.warn('Timeline query failed, continuing without timeline data:', timelineErr);
      }

      // Convert to Trip objects
      return data.map((item: any) => {
        const trip = item.trips;
        const timeline = timelineMap.get(trip.id);
        
        return {
          id: trip.id,
          name: trip.name,
          owner_id: trip.owner_id,
          start_date: trip.start_date ? new Date(trip.start_date) : undefined,
          end_date: trip.end_date ? new Date(trip.end_date) : undefined,
          created_at: new Date(trip.created_at),
          timeline: timeline ? {
            id: timeline.id,
            trip_id: trip.id,
            recording_started_at: timeline.recording_started_at ? 
              new Date(timeline.recording_started_at) : undefined,
            recording_ended_at: timeline.recording_ended_at ? 
              new Date(timeline.recording_ended_at) : undefined,
            is_currently_recording: timeline.is_currently_recording || false,
            total_moments: timeline.total_moments || 0,
            total_distance_km: timeline.total_distance_km || 0,
            cities_visited: timeline.cities_visited || [],
            countries_visited: timeline.countries_visited || [],
            daily_stats: timeline.daily_stats || {},
            created_at: new Date(timeline.created_at),
            updated_at: new Date(timeline.updated_at)
          } : undefined,
          member_count: memberCountMap.get(trip.id) || 1,
          is_currently_recording: timeline?.is_currently_recording || false,
          members: [{
            id: item.id, // Using trip_member record id
            trip_id: trip.id,
            user_id: userId,
            role: item.role,
            joined_at: new Date(item.joined_at)
          }]
        } as Trip;
      });
    } catch (error) {
      console.error('Failed to fetch user trips:', error);
      return [];
    }
  }

  /**
   * Get a specific trip with full recording state
   */
  async getTripState(tripId: string): Promise<TripState | null> {
    if (!this.supabase || !tripId) return null;

    try {
      const { data, error } = await this.supabase
        .from('trips')
        .select(`
          id,
          name,
          owner_id,
          start_date,
          end_date,
          created_at,
          trip_timeline (
            *
          ),
          trip_members (
            id,
            user_id,
            role,
            joined_at,
            users (
              id,
              name,
              email
            )
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) {
        console.error('Error fetching trip state:', error);
        return null;
      }

      const trip = this.convertDatabaseTrip(data);
      
      // Get recent activity and timeline
      const [timeline, recentActivity] = await Promise.all([
        this.getTripTimeline(tripId),
        this.getRecentActivity(tripId, 20)
      ]);

      return {
        trip,
        timeline: timeline!,
        active_members: trip.members || [],
        recent_activity: recentActivity,
        live_stats: {
          moments_today: 0, // TODO: Calculate from timeline
          active_contributors_today: 0
        }
      };
    } catch (error) {
      console.error('Failed to fetch trip state:', error);
      return null;
    }
  }

  /**
   * Get trip timeline with organized moments
   */
  async getTripTimeline(tripId: string): Promise<Timeline | null> {
    if (!this.supabase || !tripId) return null;

    try {
      // Get timeline metadata and moments
      const { data: timelineData, error: timelineError } = await this.supabase
        .from('trip_timeline')
        .select('*')
        .eq('trip_id', tripId)
        .single();

      if (timelineError) {
        console.error('Error fetching timeline:', timelineError);
        return null;
      }

      // Get moments organized by day
      const { data: moments, error: momentsError } = await this.supabase
        .from('moments')
        .select(`
          *,
          moment_reactions (
            id,
            user_id,
            emoji
          )
        `)
        .eq('trip_id', tripId)
        .eq('upload_status', 'ready')
        .order('captured_at', { ascending: true });

      if (momentsError) {
        console.error('Error fetching moments:', momentsError);
        return null;
      }

      // Organize moments by day and create timeline
      const dayMap = new Map<string, any[]>();
      
      moments?.forEach((moment: any) => {
        const dayKey = moment.captured_at.split('T')[0];
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, []);
        }
        dayMap.get(dayKey)!.push(this.convertDatabaseMoment(moment));
      });

      const days = Array.from(dayMap.entries()).map(([date, dayMoments]) => ({
        date,
        moments: dayMoments,
        stats: {
          moment_count: dayMoments.length,
          cities_visited: [...new Set(dayMoments.map(m => m.city).filter(Boolean))],
          highlights: dayMoments.filter(m => m.is_highlight)
        }
      }));

      return {
        trip_id: tripId,
        days,
        total_stats: {
          total_moments: moments?.length || 0,
          duration_days: days.length,
          countries_visited: [...new Set(moments?.map((m: any) => m.country).filter(Boolean) || [])] as string[],
          cities_visited: [...new Set(moments?.map((m: any) => m.city).filter(Boolean) || [])] as string[]
        }
      };
    } catch (error) {
      console.error('Failed to fetch trip timeline:', error);
      return null;
    }
  }

  /**
   * Get memory recording statistics for a user
   */
  async getTripStats(userId: string): Promise<TripStats> {
    if (!this.supabase || !userId) {
      return this.getEmptyStats();
    }

    try {
      // Get trips with timeline data
      const { data: trips, error } = await this.supabase
        .from('trips')
        .select(`
          id,
          name,
          start_date,
          end_date,
          created_at,
          trip_timeline (
            total_moments,
            total_distance_km,
            countries_visited,
            cities_visited
          ),
          moments!inner (
            id,
            type,
            captured_at,
            creator_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trip stats:', error);
        return this.getEmptyStats();
      }

      if (!trips || trips.length === 0) {
        return this.getEmptyStats();
      }

      // Calculate statistics
      const totalMoments = trips.reduce((sum: any, trip: any) => 
        sum + (trip.trip_timeline?.total_moments || 0), 0);
      
      const allCountries = new Set<string>();
      const allCities = new Set<string>();
      let totalDistance = 0;
      
      trips.forEach((trip: any) => {
        trip.trip_timeline?.countries_visited?.forEach((country: any) => allCountries.add(country));
        trip.trip_timeline?.cities_visited?.forEach((city: any) => allCities.add(city));
        totalDistance += trip.trip_timeline?.total_distance_km || 0;
      });

      // Calculate moment types
      const momentsByType: Record<string, number> = {};
      trips.forEach((trip: any) => {
        trip.moments?.forEach((moment: any) => {
          momentsByType[moment.type] = (momentsByType[moment.type] || 0) + 1;
        });
      });

      // Find most active contributor
      const contributorCounts: Record<string, number> = {};
      trips.forEach((trip: any) => {
        trip.moments?.forEach((moment: any) => {
          contributorCounts[moment.creator_id] = (contributorCounts[moment.creator_id] || 0) + 1;
        });
      });

      const mostActiveContributor = Object.entries(contributorCounts)
        .sort(([,a], [,b]) => b - a)[0];

      // Calculate durations
      const durations = trips
        .filter((t: any) => t.start_date && t.end_date)
        .map((t: any) => new Date(t.end_date).getTime() - new Date(t.start_date).getTime())
        .filter((d: any) => d > 0);

      const totalDuration = durations.reduce((sum: any, d: any) => sum + d, 0);
      const durationDays = totalDuration / (24 * 60 * 60 * 1000);

      return {
        duration_days: durationDays,
        total_moments: totalMoments,
        moments_by_type: momentsByType,
        total_distance_km: totalDistance,
        countries_visited: Array.from(allCountries),
        cities_visited: Array.from(allCities),
        most_active_contributor: {
          user_id: mostActiveContributor?.[0] || '',
          user_name: '', // Would need join with users table
          moment_count: mostActiveContributor?.[1] || 0
        },
        daily_averages: {
          moments_per_day: durationDays > 0 ? totalMoments / durationDays : 0,
          distance_per_day: durationDays > 0 ? totalDistance / durationDays : 0
        },
        peak_activity_day: {
          date: '', // Would need daily aggregation
          moment_count: 0
        }
      };
    } catch (error) {
      console.error('Failed to calculate trip stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Stop recording for a trip
   */
  async stopRecording(tripId: string): Promise<boolean> {
    if (!this.supabase || !tripId) return false;

    try {
      const { error } = await this.supabase
        .from('trip_timeline')
        .update({
          is_currently_recording: false,
          recording_ended_at: new Date().toISOString()
        })
        .eq('trip_id', tripId);

      if (error) {
        console.error('Error stopping recording:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return false;
    }
  }

  /**
   * Get recent activity for a trip
   */
  async getRecentActivity(tripId: string, limit: number = 20): Promise<TripActivity[]> {
    if (!this.supabase || !tripId) return [];

    try {
      const { data, error } = await this.supabase
        .from('trip_activity')
        .select(`
          *,
          users (
            name
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }

      return data?.map((activity: any) => ({
        ...activity,
        created_at: new Date(activity.created_at),
        user_name: activity.users?.name
      })) || [];
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }
  }

  /**
   * Invite a member to join the trip
   */
  async inviteMember(tripId: string, input: InviteTripMemberInput): Promise<boolean> {
    if (!this.supabase || !tripId) return false;

    try {
      const { error } = await this.supabase
        .from('trip_members')
        .insert({
          trip_id: tripId,
          user_id: input.user_id,
          role: input.role
        });

      if (error) {
        console.error('Error inviting member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to invite member:', error);
      return false;
    }
  }

  /**
   * Get trip members with contribution stats
   */
  async getTripMembers(tripId: string): Promise<TripMember[]> {
    if (!this.supabase || !tripId) return [];

    try {
      // Use basic query since users table doesn't exist in current schema
      const { data, error } = await this.supabase
        .from('trip_members')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('trip_id', tripId);

      if (error) {
        console.error('Error fetching trip members:', error);
        return [];
      }

      // Get contribution stats for each member
      const membersWithStats = await Promise.all(
        (data || []).map(async (member: any) => {
          // Try to get moments if table exists, otherwise use empty stats
          let moments: any[] = [];
          try {
            const { data: momentsData } = await this.supabase
              .from('moments')
              .select('type, captured_at')
              .eq('trip_id', tripId)
              .eq('creator_id', member.user_id);
            moments = momentsData || [];
          } catch (momentError) {
            // Moments table doesn't exist, use empty stats
            console.log('Moments table not available, using zero stats');
          }

          const momentTypes = moments.map((m: any) => m.type);
          const typeCounts: Record<string, number> = {};
          momentTypes.forEach((type: any) => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });

          const favoriteTypes = Object.entries(typeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type);

          return {
            id: member.id,
            trip_id: tripId,
            user_id: member.user_id,
            role: member.role,
            joined_at: new Date(member.joined_at),
            user_name: `User ${member.user_id.slice(0, 8)}`, // Generate name from user_id
            user_email: undefined,
            contribution_stats: {
              moment_count: moments.length,
              favorite_moment_types: favoriteTypes,
              most_active_day: undefined // Would need daily aggregation
            }
          } as TripMember;
        })
      );

      return membersWithStats;
    } catch (error) {
      console.error('Failed to fetch trip members:', error);
      return [];
    }
  }

  /**
   * Convert database trip to client Trip type
   */
  private convertDatabaseTrip(dbTrip: any): Trip {
    return {
      id: dbTrip.id,
      name: dbTrip.name,
      owner_id: dbTrip.owner_id,
      start_date: dbTrip.start_date ? new Date(dbTrip.start_date) : undefined,
      end_date: dbTrip.end_date ? new Date(dbTrip.end_date) : undefined,
      created_at: new Date(dbTrip.created_at),
      members: dbTrip.trip_members?.map((member: any) => ({
        id: member.id,
        trip_id: dbTrip.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: new Date(member.joined_at),
        user_name: member.users?.name
      })),
      timeline: dbTrip.trip_timeline ? {
        id: dbTrip.trip_timeline.id,
        trip_id: dbTrip.id,
        recording_started_at: dbTrip.trip_timeline.recording_started_at ? 
          new Date(dbTrip.trip_timeline.recording_started_at) : undefined,
        recording_ended_at: dbTrip.trip_timeline.recording_ended_at ? 
          new Date(dbTrip.trip_timeline.recording_ended_at) : undefined,
        is_currently_recording: dbTrip.trip_timeline.is_currently_recording,
        total_moments: dbTrip.trip_timeline.total_moments,
        total_distance_km: dbTrip.trip_timeline.total_distance_km,
        cities_visited: dbTrip.trip_timeline.cities_visited,
        countries_visited: dbTrip.trip_timeline.countries_visited,
        daily_stats: dbTrip.trip_timeline.daily_stats,
        created_at: new Date(dbTrip.trip_timeline.created_at),
        updated_at: new Date(dbTrip.trip_timeline.updated_at)
      } : undefined,
      member_count: dbTrip.trip_members?.length || 0,
      is_currently_recording: dbTrip.trip_timeline?.is_currently_recording || false
    };
  }

  /**
   * Convert database moment to client Moment type
   */
  private convertDatabaseMoment(dbMoment: any): any {
    return {
      ...dbMoment,
      captured_at: new Date(dbMoment.captured_at),
      device_timestamp: dbMoment.device_timestamp ? new Date(dbMoment.device_timestamp) : undefined,
      created_at: new Date(dbMoment.created_at),
      updated_at: new Date(dbMoment.updated_at),
      reactions: dbMoment.moment_reactions?.map((reaction: any) => ({
        ...reaction,
        created_at: new Date(reaction.created_at)
      })) || []
    };
  }

  private getEmptyStats(): TripStats {
    return {
      duration_days: 0,
      total_moments: 0,
      moments_by_type: {},
      total_distance_km: 0,
      countries_visited: [],
      cities_visited: [],
      most_active_contributor: {
        user_id: '',
        user_name: '',
        moment_count: 0
      },
      daily_averages: {
        moments_per_day: 0,
        distance_per_day: 0
      },
      peak_activity_day: {
        date: '',
        moment_count: 0
      }
    };
  }
}