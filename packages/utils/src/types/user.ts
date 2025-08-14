import type { DatabaseUser } from './database';

// Enhanced user type with computed properties
export interface User extends Omit<DatabaseUser, 'created_at'> {
  created_at: Date;
  
  // Profile enhancements
  avatar_url?: string;
  bio?: string;
  location?: string;
  
  // Travel stats
  travel_stats?: UserTravelStats;
  preferences?: UserPreferences;
}

export interface UserTravelStats {
  trips_completed: number;
  total_moments_captured: number;
  favorite_moment_type: string;
  countries_visited: number;
  cities_visited: number;
  total_distance_traveled_km?: number;
  most_active_travel_month?: string;
  
  // Social stats
  trips_as_owner: number;
  trips_as_contributor: number;
  favorite_travel_companions: string[]; // user IDs
  
  // Recent activity
  last_trip_date?: Date;
  recent_destinations: string[];
}

export interface UserPreferences {
  // Capture preferences
  default_moment_privacy: 'public' | 'private';
  auto_enhance_photos: boolean;
  auto_transcribe_voice: boolean;
  location_sharing_enabled: boolean;
  
  // Notification preferences
  notify_on_new_moments: boolean;
  notify_on_reactions: boolean;
  notify_on_trip_invites: boolean;
  notification_frequency: 'instant' | 'daily' | 'weekly' | 'never';
  
  // Export preferences
  default_export_format: 'zip' | 'instagram_story' | 'pdf_book';
  default_export_quality: 'original' | 'compressed';
  
  // UI preferences
  preferred_map_style: 'street' | 'satellite' | 'terrain';
  timeline_sort_order: 'newest_first' | 'oldest_first';
  show_location_on_timeline: boolean;
  show_weather_on_timeline: boolean;
}

// Authentication and profile management
export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserSession {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  is_authenticated: boolean;
}

// User discovery and social features
export interface UserSearchResult {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  mutual_trips?: number;
  last_active?: Date;
  is_friend?: boolean;
}

export interface UserFriendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: Date;
  friend_name?: string;
  friend_avatar_url?: string;
}

// Device and location tracking
export interface UserDevice {
  id: string;
  user_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  device_name?: string;
  push_token?: string;
  last_active: Date;
  is_primary: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  altitude?: number;
  heading?: number;
  speed?: number;
}