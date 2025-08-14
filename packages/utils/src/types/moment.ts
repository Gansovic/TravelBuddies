import type { 
  DatabaseMoment, 
  DatabaseMomentReaction, 
  DatabaseMomentCollection,
  MomentType,
  MomentStatus 
} from './database';

// Client-side enhanced types with computed properties
export interface Moment extends Omit<DatabaseMoment, 'captured_at' | 'device_timestamp' | 'created_at' | 'updated_at'> {
  captured_at: Date;
  device_timestamp?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Computed/enhanced properties
  reactions?: MomentReaction[];
  reaction_count?: number;
  user_reaction?: string; // current user's reaction emoji
  distance_from_previous?: number; // km
  time_since_previous?: number; // minutes
  weather_display?: string; // formatted weather
}

export interface MomentReaction extends Omit<DatabaseMomentReaction, 'created_at'> {
  created_at: Date;
}

export interface MomentCollection extends Omit<DatabaseMomentCollection, 'created_at'> {
  created_at: Date;
  moment_count?: number;
  moments?: Moment[];
}

// Input types for creating moments
export interface CreateMomentInput {
  trip_id: string;
  creator_id?: string; // Optional - will be set by API if not provided
  type: MomentType;
  title?: string;
  description?: string;
  
  // Media (usually uploaded separately)
  media_file?: File;
  media_url?: string;
  
  // Location (auto-detected or manual)
  latitude?: number;
  longitude?: number;
  altitude?: number;
  location_accuracy_meters?: number;
  
  // Manual metadata
  captured_at?: Date;
  is_private?: boolean;
  manual_tags?: string[];
}

export interface UpdateMomentInput {
  title?: string;
  description?: string;
  is_starred?: boolean;
  is_highlight?: boolean;
  is_private?: boolean;
}

// Timeline organization types
export interface TimelineDay {
  date: string; // YYYY-MM-DD
  moments: Moment[];
  stats: {
    moment_count: number;
    distance_km?: number;
    cities_visited: string[];
    weather_summary?: string;
    highlights: Moment[];
  };
}

export interface Timeline {
  trip_id: string;
  days: TimelineDay[];
  total_stats: {
    total_moments: number;
    total_distance_km?: number;
    duration_days: number;
    countries_visited: string[];
    cities_visited: string[];
  };
}

// Real-time collaboration types
export interface MomentCaptureEvent {
  type: 'capture_started' | 'capture_completed' | 'upload_progress' | 'upload_completed';
  trip_id: string;
  user_id: string;
  moment_id?: string;
  progress?: number; // 0-100 for upload progress
  timestamp: Date;
}

export interface UserPresence {
  user_id: string;
  user_name: string;
  is_capturing: boolean;
  last_activity: Date;
  current_location?: {
    latitude: number;
    longitude: number;
  };
}

// Export formats
export interface ExportOptions {
  format: 'zip' | 'instagram_story' | 'pdf_book' | 'gpx_route';
  include_private: boolean;
  date_range?: {
    start: Date;
    end: Date;
  };
  collections?: string[]; // collection IDs
  quality: 'original' | 'compressed' | 'thumbnail';
}

// Search and filtering
export interface MomentFilters {
  type?: MomentType[];
  date_range?: {
    start: Date;
    end: Date;
  };
  location_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  creator_ids?: string[];
  has_reactions?: boolean;
  is_starred?: boolean;
  is_highlight?: boolean;
  tags?: string[];
  search_text?: string;
}

export { MomentType, MomentStatus };