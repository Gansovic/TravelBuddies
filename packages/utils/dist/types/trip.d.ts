import type { DatabaseTrip, DatabaseTripMember, DatabaseTripTimeline, DatabaseTripActivity } from './database';
import type { Moment, Timeline } from './moment';
export interface Trip extends Omit<DatabaseTrip, 'start_date' | 'end_date' | 'created_at'> {
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
    members?: TripMember[];
    timeline?: TripTimeline;
    member_count?: number;
    is_currently_recording?: boolean;
    recent_moments?: Moment[];
    cover_photo_url?: string;
}
export interface TripMember extends Omit<DatabaseTripMember, 'joined_at'> {
    joined_at: Date;
    user_name?: string;
    user_email?: string;
    last_activity?: Date;
    contribution_stats?: {
        moment_count: number;
        favorite_moment_types: string[];
        most_active_day?: string;
    };
}
export interface TripTimeline extends Omit<DatabaseTripTimeline, 'recording_started_at' | 'recording_ended_at' | 'created_at' | 'updated_at'> {
    recording_started_at?: Date;
    recording_ended_at?: Date;
    created_at: Date;
    updated_at: Date;
    daily_stats?: Record<string, DayStats>;
}
export interface DayStats {
    date: string;
    moments: number;
    distance_km?: number;
    cities_visited: string[];
    weather?: {
        condition: string;
        temp_high?: number;
        temp_low?: number;
    };
    highlights: string[];
    activity_summary?: string;
}
export interface TripActivity extends Omit<DatabaseTripActivity, 'created_at'> {
    created_at: Date;
    user_name?: string;
    target_name?: string;
}
export interface CreateTripInput {
    name?: string;
    start_date?: Date;
    auto_start_recording?: boolean;
}
export interface UpdateTripInput {
    name?: string;
    start_date?: Date;
    end_date?: Date;
}
export interface InviteTripMemberInput {
    email?: string;
    user_id?: string;
    role: 'editor' | 'viewer';
}
export interface TripStats {
    duration_days: number;
    total_moments: number;
    moments_by_type: Record<string, number>;
    total_distance_km?: number;
    countries_visited: string[];
    cities_visited: string[];
    most_active_contributor: {
        user_id: string;
        user_name: string;
        moment_count: number;
    };
    daily_averages: {
        moments_per_day: number;
        distance_per_day?: number;
    };
    peak_activity_day: {
        date: string;
        moment_count: number;
    };
}
export interface TripState {
    trip: Trip;
    timeline: Timeline;
    active_members: TripMember[];
    recent_activity: TripActivity[];
    live_stats: {
        moments_today: number;
        distance_today?: number;
        active_contributors_today: number;
    };
}
export interface TripSharingSettings {
    is_public: boolean;
    allow_guest_contributions: boolean;
    require_approval_for_new_members: boolean;
    share_link_expires_at?: Date;
    password_protected?: boolean;
}
export interface TripInvite {
    id: string;
    trip_id: string;
    created_by: string;
    invite_code: string;
    expires_at?: Date;
    max_uses?: number;
    current_uses: number;
    role: 'editor' | 'viewer';
    created_at: Date;
}
