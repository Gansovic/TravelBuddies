import type { DatabaseMoment, DatabaseMomentReaction, DatabaseMomentCollection, MomentType, MomentStatus } from './database';
export interface Moment extends Omit<DatabaseMoment, 'captured_at' | 'device_timestamp' | 'created_at' | 'updated_at'> {
    captured_at: Date;
    device_timestamp?: Date;
    created_at: Date;
    updated_at: Date;
    reactions?: MomentReaction[];
    reaction_count?: number;
    user_reaction?: string;
    distance_from_previous?: number;
    time_since_previous?: number;
    weather_display?: string;
}
export interface MomentReaction extends Omit<DatabaseMomentReaction, 'created_at'> {
    created_at: Date;
}
export interface MomentCollection extends Omit<DatabaseMomentCollection, 'created_at'> {
    created_at: Date;
    moment_count?: number;
    moments?: Moment[];
}
export interface CreateMomentInput {
    trip_id: string;
    creator_id?: string;
    type: MomentType;
    title?: string;
    description?: string;
    media_file?: File;
    media_url?: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    location_accuracy_meters?: number;
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
export interface TimelineDay {
    date: string;
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
export interface MomentCaptureEvent {
    type: 'capture_started' | 'capture_completed' | 'upload_progress' | 'upload_completed';
    trip_id: string;
    user_id: string;
    moment_id?: string;
    progress?: number;
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
export interface ExportOptions {
    format: 'zip' | 'instagram_story' | 'pdf_book' | 'gpx_route';
    include_private: boolean;
    date_range?: {
        start: Date;
        end: Date;
    };
    collections?: string[];
    quality: 'original' | 'compressed' | 'thumbnail';
}
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
