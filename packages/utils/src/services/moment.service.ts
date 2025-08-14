import { createClient } from '@supabase/supabase-js';
import type { 
  Moment, 
  CreateMomentInput, 
  UpdateMomentInput,
  MomentFilters,
  MomentReaction,
  Timeline,
  TimelineDay
} from '../types/moment';

/**
 * MomentService - Core moment capture and retrieval service
 * Following singleton pattern as per engineering principles
 * 
 * Handles all moment-related operations:
 * - Moment creation, upload, and metadata extraction
 * - Real-time moment synchronization
 * - Timeline organization and filtering
 * - Reaction management
 * - Offline queue management
 * 
 * @example
 * ```typescript
 * const service = MomentService.getInstance();
 * const moment = await service.createMoment(tripId, momentData);
 * const timeline = await service.getTimeline(tripId);
 * await service.addReaction(momentId, '❤️');
 * ```
 */
export class MomentService {
  private static instance: MomentService;
  private supabase: any = null;
  private uploadQueue: Map<string, CreateMomentInput> = new Map();

  private constructor() {
    // Initialize Supabase client if available
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('MomentService constructor - Supabase config:', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? `${url.substring(0, 20)}...` : 'missing'
    });
    
    if (url && key) {
      this.supabase = createClient(url, key);
      console.log('MomentService: Supabase client created successfully');
    } else {
      console.error('MomentService: Missing Supabase environment variables');
    }
  }

  static getInstance(): MomentService {
    if (!MomentService.instance) {
      MomentService.instance = new MomentService();
    }
    return MomentService.instance;
  }

  /**
   * Create a new moment with automatic metadata extraction
   */
  async createMoment(input: CreateMomentInput): Promise<Moment | null> {
    if (!this.supabase) {
      console.error('MomentService: Supabase client not initialized');
      return null;
    }

    try {
      console.log('MomentService.createMoment: Creating moment with input:', {
        trip_id: input.trip_id,
        type: input.type,
        title: input.title,
        has_media_file: !!input.media_file,
        latitude: input.latitude,
        longitude: input.longitude
      });
      // First, save the moment record
      const momentData = {
        trip_id: input.trip_id,
        type: input.type,
        title: input.title,
        description: input.description,
        captured_at: input.captured_at?.toISOString() || new Date().toISOString(),
        latitude: input.latitude,
        longitude: input.longitude,
        altitude: input.altitude,
        location_accuracy_meters: input.location_accuracy_meters,
        is_private: input.is_private || false,
        upload_status: 'uploading',
        creator_id: input.creator_id || (await this.supabase.auth.getUser())?.data?.user?.id
      };

      const { data, error } = await this.supabase
        .from('moments')
        .insert([momentData])
        .select()
        .single();

      if (error) {
        console.error('MomentService: Error creating moment in database:', error);
        return null;
      }

      console.log('MomentService: Moment created successfully:', data.id);

      const moment = this.convertDatabaseMoment(data);

      // If there's a media file, upload it separately
      if (input.media_file) {
        this.uploadMediaAsync(moment.id, input.media_file);
      } else {
        // If no media file, mark as ready immediately
        await this.supabase
          .from('moments')
          .update({ upload_status: 'ready' })
          .eq('id', moment.id);
        
        moment.upload_status = 'ready';
      }

      // Enhance with location data if coordinates provided
      if (input.latitude && input.longitude) {
        this.enhanceLocationDataAsync(moment.id, input.latitude, input.longitude);
      }

      return moment;
    } catch (error) {
      console.error('Failed to create moment:', error);
      return null;
    }
  }

  /**
   * Get moments for a trip with filtering
   */
  async getMoments(tripId: string, filters?: MomentFilters): Promise<Moment[]> {
    if (!this.supabase || !tripId) return [];

    try {
      let query = this.supabase
        .from('moments')
        .select(`
          *,
          moment_reactions (
            id,
            user_id,
            emoji,
            created_at
          )
        `)
        .eq('trip_id', tripId)
        .eq('upload_status', 'ready');

      // Apply filters
      if (filters?.type?.length) {
        query = query.in('type', filters.type);
      }

      if (filters?.date_range) {
        query = query
          .gte('captured_at', filters.date_range.start.toISOString())
          .lte('captured_at', filters.date_range.end.toISOString());
      }

      if (filters?.creator_ids?.length) {
        query = query.in('creator_id', filters.creator_ids);
      }

      if (filters?.is_starred !== undefined) {
        query = query.eq('is_starred', filters.is_starred);
      }

      if (filters?.is_highlight !== undefined) {
        query = query.eq('is_highlight', filters.is_highlight);
      }

      if (filters?.location_bounds) {
        const { north, south, east, west } = filters.location_bounds;
        query = query
          .gte('latitude', south)
          .lte('latitude', north)
          .gte('longitude', west)
          .lte('longitude', east);
      }

      if (filters?.search_text) {
        query = query.or(`title.ilike.%${filters.search_text}%,description.ilike.%${filters.search_text}%,transcription.ilike.%${filters.search_text}%`);
      }

      const { data, error } = await query.order('captured_at', { ascending: true });

      if (error) {
        console.error('Error fetching moments:', error);
        return [];
      }

      return data?.map((moment: any) => this.convertDatabaseMoment(moment)) || [];
    } catch (error) {
      console.error('Failed to fetch moments:', error);
      return [];
    }
  }

  /**
   * Get a single moment by ID
   */
  async getMoment(momentId: string): Promise<Moment | null> {
    if (!this.supabase || !momentId) return null;

    try {
      const { data, error } = await this.supabase
        .from('moments')
        .select(`
          *,
          moment_reactions (
            id,
            user_id,
            emoji,
            created_at
          )
        `)
        .eq('id', momentId)
        .single();

      if (error) {
        console.error('Error fetching moment:', error);
        return null;
      }

      return this.convertDatabaseMoment(data);
    } catch (error) {
      console.error('Failed to fetch moment:', error);
      return null;
    }
  }

  /**
   * Update a moment
   */
  async updateMoment(momentId: string, input: UpdateMomentInput): Promise<boolean> {
    if (!this.supabase || !momentId) return false;

    try {
      const { error } = await this.supabase
        .from('moments')
        .update(input)
        .eq('id', momentId);

      if (error) {
        console.error('Error updating moment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update moment:', error);
      return false;
    }
  }

  /**
   * Delete a moment
   */
  async deleteMoment(momentId: string): Promise<boolean> {
    if (!this.supabase || !momentId) return false;

    try {
      const { error } = await this.supabase
        .from('moments')
        .delete()
        .eq('id', momentId);

      if (error) {
        console.error('Error deleting moment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete moment:', error);
      return false;
    }
  }

  /**
   * Add a reaction to a moment
   */
  async addReaction(momentId: string, emoji: string): Promise<boolean> {
    if (!this.supabase || !momentId || !emoji) return false;

    try {
      const userId = (await this.supabase.auth.getUser())?.data?.user?.id;
      if (!userId) return false;

      const { error } = await this.supabase
        .from('moment_reactions')
        .insert([{
          moment_id: momentId,
          user_id: userId,
          emoji: emoji
        }]);

      if (error) {
        console.error('Error adding reaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      return false;
    }
  }

  /**
   * Remove a reaction from a moment
   */
  async removeReaction(momentId: string, emoji: string): Promise<boolean> {
    if (!this.supabase || !momentId || !emoji) return false;

    try {
      const userId = (await this.supabase.auth.getUser())?.data?.user?.id;
      if (!userId) return false;

      const { error } = await this.supabase
        .from('moment_reactions')
        .delete()
        .eq('moment_id', momentId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      return false;
    }
  }

  /**
   * Get organized timeline for a trip
   */
  async getTimeline(tripId: string): Promise<Timeline | null> {
    if (!this.supabase || !tripId) return null;

    try {
      const moments = await this.getMoments(tripId);
      
      // Group moments by day
      const dayMap = new Map<string, Moment[]>();
      
      moments.forEach(moment => {
        const dayKey = moment.captured_at.toISOString().split('T')[0];
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, []);
        }
        dayMap.get(dayKey)!.push(moment);
      });

      // Create timeline days with stats
      const days: TimelineDay[] = Array.from(dayMap.entries()).map(([date, dayMoments]) => {
        const cities = [...new Set(dayMoments.map(m => m.city).filter(Boolean))] as string[];
        const highlights = dayMoments.filter(m => m.is_highlight);
        
        // Calculate distance traveled during the day
        let distance_km = 0;
        for (let i = 1; i < dayMoments.length; i++) {
          const prev = dayMoments[i - 1];
          const curr = dayMoments[i];
          if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
            distance_km += this.calculateDistance(
              prev.latitude, prev.longitude,
              curr.latitude, curr.longitude
            );
          }
        }

        return {
          date,
          moments: dayMoments,
          stats: {
            moment_count: dayMoments.length,
            distance_km,
            cities_visited: cities,
            highlights
          }
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate total stats
      const allCountries = [...new Set(moments.map(m => m.country).filter(Boolean))] as string[];
      const allCities = [...new Set(moments.map(m => m.city).filter(Boolean))] as string[];
      const totalDistance = days.reduce((sum, day) => sum + (day.stats.distance_km || 0), 0);

      return {
        trip_id: tripId,
        days,
        total_stats: {
          total_moments: moments.length,
          total_distance_km: totalDistance,
          duration_days: days.length,
          countries_visited: allCountries,
          cities_visited: allCities
        }
      };
    } catch (error) {
      console.error('Failed to get timeline:', error);
      return null;
    }
  }

  /**
   * Subscribe to real-time moment updates for a trip
   */
  subscribeToMoments(tripId: string, callback: (moment: Moment) => void): () => void {
    if (!this.supabase || !tripId) return () => {};

    const subscription = this.supabase
      .channel(`moments:trip_id=eq.${tripId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'moments',
        filter: `trip_id=eq.${tripId}`
      }, (payload: any) => {
        const moment = this.convertDatabaseMoment(payload.new);
        callback(moment);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Upload media file for a moment (async background process)
   */
  private async uploadMediaAsync(momentId: string, file: File): Promise<void> {
    if (!this.supabase) return;

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${momentId}.${fileExt}`;
      const filePath = `moments/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading media:', error);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update moment with media URL
      await this.supabase
        .from('moments')
        .update({
          media_url: publicUrl,
          media_size_bytes: file.size,
          upload_status: 'ready'
        })
        .eq('id', momentId);

    } catch (error) {
      console.error('Failed to upload media:', error);
      
      // Mark as failed
      await this.supabase
        .from('moments')
        .update({ upload_status: 'failed' })
        .eq('id', momentId);
    }
  }

  /**
   * Enhance moment with location data (async background process)
   */
  private async enhanceLocationDataAsync(momentId: string, latitude: number, longitude: number): Promise<void> {
    try {
      // This would typically call Google Places API or similar
      // For now, we'll just mark as processed
      await this.supabase
        .from('moments')
        .update({
          // place_name, address, city, region, country would be set here
          upload_status: 'ready'
        })
        .eq('id', momentId);
    } catch (error) {
      console.error('Failed to enhance location data:', error);
    }
  }

  /**
   * Convert database moment to client Moment type
   */
  private convertDatabaseMoment(dbMoment: any): Moment {
    return {
      id: dbMoment.id,
      trip_id: dbMoment.trip_id,
      creator_id: dbMoment.creator_id,
      type: dbMoment.type,
      title: dbMoment.title,
      description: dbMoment.description,
      media_url: dbMoment.media_url,
      thumbnail_url: dbMoment.thumbnail_url,
      media_size_bytes: dbMoment.media_size_bytes,
      media_duration_seconds: dbMoment.media_duration_seconds,
      captured_at: new Date(dbMoment.captured_at),
      device_timestamp: dbMoment.device_timestamp ? new Date(dbMoment.device_timestamp) : undefined,
      upload_status: dbMoment.upload_status,
      latitude: dbMoment.latitude,
      longitude: dbMoment.longitude,
      altitude: dbMoment.altitude,
      location_accuracy_meters: dbMoment.location_accuracy_meters,
      place_id: dbMoment.place_id,
      place_name: dbMoment.place_name,
      address: dbMoment.address,
      city: dbMoment.city,
      region: dbMoment.region,
      country: dbMoment.country,
      weather_temp_celsius: dbMoment.weather_temp_celsius,
      weather_condition: dbMoment.weather_condition,
      weather_description: dbMoment.weather_description,
      timezone: dbMoment.timezone,
      auto_tags: dbMoment.auto_tags,
      suggested_emoji: dbMoment.suggested_emoji,
      transcription: dbMoment.transcription,
      ai_caption: dbMoment.ai_caption,
      ai_category: dbMoment.ai_category,
      is_starred: dbMoment.is_starred,
      is_highlight: dbMoment.is_highlight,
      is_private: dbMoment.is_private,
      created_at: new Date(dbMoment.created_at),
      updated_at: new Date(dbMoment.updated_at),
      reactions: dbMoment.moment_reactions?.map((reaction: any) => ({
        id: reaction.id,
        moment_id: reaction.moment_id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
        created_at: new Date(reaction.created_at)
      })) || [],
      reaction_count: dbMoment.moment_reactions?.length || 0
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}