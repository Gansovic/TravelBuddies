-- Complete TravelBuddies Schema
-- Single migration with all required tables and minimal RLS for development

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Core tables
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for development
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;

-- Itinerary items table
CREATE TABLE IF NOT EXISTS itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  day integer NOT NULL,
  type text NOT NULL,
  notes text,
  place_id text,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE itinerary_items DISABLE ROW LEVEL SECURITY;

-- Memory recording schema
DO $$ BEGIN
    CREATE TYPE moment_type AS ENUM ('photo', 'video', 'voice', 'text', 'checkin', 'note', 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moment_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Core moments table for memory recording
CREATE TABLE IF NOT EXISTS moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Moment content
  type moment_type NOT NULL,
  title text,
  description text,
  
  -- Media storage
  media_url text,
  thumbnail_url text,
  media_size_bytes bigint,
  media_duration_seconds integer,
  
  -- Capture metadata
  captured_at timestamptz NOT NULL DEFAULT now(),
  device_timestamp timestamptz,
  upload_status moment_status DEFAULT 'uploading',
  
  -- Location data
  latitude double precision,
  longitude double precision,
  altitude double precision,
  location_accuracy_meters real,
  place_id text,
  place_name text,
  address text,
  city text,
  region text,
  country text,
  
  -- Context metadata
  weather_temp_celsius real,
  weather_condition text,
  weather_description text,
  timezone text,
  
  -- AI/Auto-generated tags
  auto_tags text[],
  suggested_emoji text[],
  transcription text,
  ai_caption text,
  ai_category text,
  
  -- Social features
  is_starred boolean DEFAULT false,
  is_highlight boolean DEFAULT false,
  is_private boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE moments DISABLE ROW LEVEL SECURITY;

-- Moment reactions
CREATE TABLE IF NOT EXISTS moment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(moment_id, user_id, emoji)
);

ALTER TABLE moment_reactions DISABLE ROW LEVEL SECURITY;

-- Trip timeline metadata
CREATE TABLE IF NOT EXISTS trip_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE UNIQUE,
  
  -- Recording session info
  recording_started_at timestamptz,
  recording_ended_at timestamptz,
  is_currently_recording boolean DEFAULT true,
  
  -- Auto-generated info
  total_moments integer DEFAULT 0,
  total_distance_km real,
  cities_visited text[],
  countries_visited text[],
  
  -- Daily summaries cache
  daily_stats jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trip_timeline DISABLE ROW LEVEL SECURITY;

-- Activity feed
CREATE TABLE IF NOT EXISTS trip_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trip_activity DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moments_trip_captured_at ON moments(trip_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_location ON moments(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moments_type_status ON moments(type, upload_status);
CREATE INDEX IF NOT EXISTS idx_moments_creator ON moments(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_activity_trip_time ON trip_activity(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_day ON itinerary_items(trip_id, day);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON itinerary_items(trip_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_trip_timeline_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update moment count when new moment is added
    UPDATE trip_timeline 
    SET total_moments = total_moments + 1,
        updated_at = now()
    WHERE trip_id = NEW.trip_id;
    
    -- Create timeline record if it doesn't exist
    INSERT INTO trip_timeline (trip_id, recording_started_at)
    VALUES (NEW.trip_id, NEW.captured_at)
    ON CONFLICT (trip_id) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update moment count when moment is deleted
    UPDATE trip_timeline 
    SET total_moments = greatest(total_moments - 1, 0),
        updated_at = now()
    WHERE trip_id = OLD.trip_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain timeline stats
CREATE TRIGGER trigger_update_timeline_stats
  AFTER INSERT OR DELETE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_timeline_stats();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_moments_updated_at
  BEFORE UPDATE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trip_timeline_updated_at
  BEFORE UPDATE ON trip_timeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();