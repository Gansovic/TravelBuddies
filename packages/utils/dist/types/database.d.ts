export type MomentType = 'photo' | 'video' | 'voice' | 'text' | 'checkin';
export type MomentStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export interface DatabaseMoment {
    id: string;
    trip_id: string;
    creator_id: string;
    type: MomentType;
    title?: string;
    description?: string;
    media_url?: string;
    thumbnail_url?: string;
    media_size_bytes?: number;
    media_duration_seconds?: number;
    captured_at: string;
    device_timestamp?: string;
    upload_status: MomentStatus;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    location_accuracy_meters?: number;
    place_id?: string;
    place_name?: string;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    weather_temp_celsius?: number;
    weather_condition?: string;
    weather_description?: string;
    timezone?: string;
    auto_tags?: string[];
    suggested_emoji?: string[];
    transcription?: string;
    ai_caption?: string;
    ai_category?: string;
    is_starred: boolean;
    is_highlight: boolean;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}
export interface DatabaseMomentReaction {
    id: string;
    moment_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}
export interface DatabaseTripTimeline {
    id: string;
    trip_id: string;
    recording_started_at?: string;
    recording_ended_at?: string;
    is_currently_recording: boolean;
    total_moments: number;
    total_distance_km?: number;
    cities_visited?: string[];
    countries_visited?: string[];
    daily_stats?: Record<string, any>;
    created_at: string;
    updated_at: string;
}
export interface DatabaseMomentCollection {
    id: string;
    trip_id: string;
    creator_id: string;
    name: string;
    description?: string;
    color?: string;
    is_auto_generated: boolean;
    created_at: string;
}
export interface DatabaseCollectionMoment {
    id: string;
    collection_id: string;
    moment_id: string;
    added_at: string;
}
export interface DatabaseTripActivity {
    id: string;
    trip_id: string;
    user_id: string;
    activity_type: string;
    target_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
}
export interface DatabaseTrip {
    id: string;
    name: string;
    owner_id: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
}
export interface DatabaseTripMember {
    id: string;
    trip_id: string;
    user_id: string;
    role: 'owner' | 'editor' | 'viewer' | 'treasurer';
    joined_at: string;
}
export interface DatabaseUser {
    id: string;
    name: string;
    email?: string;
    created_at: string;
}
