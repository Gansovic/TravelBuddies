import type { DatabasePoll, DatabasePollOption, DatabasePollVote, PollType, PollStatus } from './database';

// Poll types for the collaborative voting system
export interface Poll extends Omit<DatabasePoll, 'created_at' | 'updated_at' | 'closes_at'> {
  created_at: Date;
  updated_at: Date;
  closes_at?: Date;
  options?: PollOption[];
  total_votes?: number;
  user_vote?: PollVote;
  is_expired?: boolean;
  time_remaining?: number;
}

export interface PollOption extends Omit<DatabasePollOption, 'created_at'> {
  created_at: Date;
  votes?: PollVote[];
  percentage?: number;
  is_winning?: boolean;
}

export interface PollVote extends Omit<DatabasePollVote, 'created_at'> {
  created_at: Date;
  user_name?: string;
}

// Input types for creating polls and voting
export interface CreatePollInput {
  trip_id: string;
  creator_id?: string;
  title: string;
  description?: string;
  type?: PollType;
  related_data?: any; // JSON data for itinerary items, place details, etc.
  closes_at?: Date;
  options: CreatePollOptionInput[];
}

export interface CreatePollOptionInput {
  title: string;
  description?: string;
  data?: any; // JSON data specific to this option
}

export interface UpdatePollInput {
  title?: string;
  description?: string;
  status?: PollStatus;
  closes_at?: Date;
}

export interface VotePollInput {
  poll_id: string;
  option_id: string;
  user_id?: string;
}

// Specialized poll types for different use cases
export interface ItineraryPoll extends Poll {
  type: 'itinerary_item';
  related_data: {
    day: number;
    type: string; // ItineraryType
    title: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  };
}

export interface PlaceChoicePoll extends Poll {
  type: 'place_choice';
  related_data: {
    day?: number;
    type: string; // food, activity, lodging, etc.
    budget_range?: string;
    preferences?: string[];
  };
}

export interface GeneralPoll extends Poll {
  type: 'general';
  related_data?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

// Statistics and aggregation types
export interface PollStats {
  total_polls: number;
  active_polls: number;
  closed_polls: number;
  total_votes: number;
  participation_rate: number;
  most_active_voter: {
    user_id: string;
    user_name?: string;
    vote_count: number;
  };
  poll_types_breakdown: Record<PollType, number>;
}

export interface PollResults {
  poll_id: string;
  winning_option: PollOption;
  final_vote_count: number;
  participation_rate: number;
  close_reason: 'expired' | 'manual' | 'unanimous';
  should_execute: boolean; // Whether to auto-add to itinerary
}

// Real-time event types for subscriptions
export interface PollEvent {
  type: 'poll_created' | 'poll_closed' | 'vote_cast' | 'vote_changed';
  poll_id: string;
  trip_id: string;
  user_id?: string;
  data?: any;
  timestamp: Date;
}

export interface PollNotification {
  id: string;
  user_id: string;
  poll_id: string;
  type: 'new_poll' | 'poll_reminder' | 'poll_result' | 'poll_expiring';
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

// Filter and query types
export interface PollFilters {
  status?: PollStatus[];
  type?: PollType[];
  creator_ids?: string[];
  date_range?: {
    start: Date;
    end: Date;
  };
  has_voted?: boolean;
  is_expired?: boolean;
}

export interface PollSearchOptions {
  filters?: PollFilters;
  sort_by?: 'created_at' | 'closes_at' | 'vote_count' | 'title';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Export types from database for consistency
export { PollType, PollStatus };