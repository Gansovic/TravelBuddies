import type { DatabaseUser } from './database';
export interface User extends Omit<DatabaseUser, 'created_at'> {
    created_at: Date;
    avatar_url?: string;
    bio?: string;
    location?: string;
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
    trips_as_owner: number;
    trips_as_contributor: number;
    favorite_travel_companions: string[];
    last_trip_date?: Date;
    recent_destinations: string[];
}
export interface UserPreferences {
    default_moment_privacy: 'public' | 'private';
    auto_enhance_photos: boolean;
    auto_transcribe_voice: boolean;
    location_sharing_enabled: boolean;
    notify_on_new_moments: boolean;
    notify_on_reactions: boolean;
    notify_on_trip_invites: boolean;
    notification_frequency: 'instant' | 'daily' | 'weekly' | 'never';
    default_export_format: 'zip' | 'instagram_story' | 'pdf_book';
    default_export_quality: 'original' | 'compressed';
    preferred_map_style: 'street' | 'satellite' | 'terrain';
    timeline_sort_order: 'newest_first' | 'oldest_first';
    show_location_on_timeline: boolean;
    show_weather_on_timeline: boolean;
}
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
