-- TravelBuddies Memory Recording Schema
-- Complete redesign for memory capture MVP

-- Moment types enum
CREATE TYPE moment_type AS ENUM ('photo', 'video', 'voice', 'text', 'checkin');

-- Moment status enum
CREATE TYPE moment_status AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- Core moments table - replaces itinerary-focused structure
CREATE TABLE IF NOT EXISTS moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Moment content
  type moment_type NOT NULL,
  title text,
  description text,
  
  -- Media storage
  media_url text, -- main media file (photo/video/audio)
  thumbnail_url text, -- optimized thumbnail
  media_size_bytes bigint,
  media_duration_seconds integer, -- for video/audio
  
  -- Capture metadata
  captured_at timestamptz NOT NULL DEFAULT now(),
  device_timestamp timestamptz, -- original device time if different
  upload_status moment_status DEFAULT 'uploading',
  
  -- Location data
  latitude double precision,
  longitude double precision,
  altitude double precision,
  location_accuracy_meters real,
  place_id text, -- Google Places ID
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
  auto_tags text[], -- detected objects, scenes, etc.
  suggested_emoji text[],
  transcription text, -- for voice notes
  ai_caption text,
  ai_category text, -- meal, vista, selfie, landmark, etc.
  
  -- Social features
  is_starred boolean DEFAULT false,
  is_highlight boolean DEFAULT false,
  is_private boolean DEFAULT false, -- hidden from group timeline
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Moment reactions (emoji responses)
CREATE TABLE IF NOT EXISTS moment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(moment_id, user_id, emoji)
);

-- Trip timeline metadata - enhanced trip info for memory recording
CREATE TABLE IF NOT EXISTS trip_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  
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
  daily_stats jsonb, -- { "2025-01-15": { "moments": 25, "distance": 12.5, "highlights": [...] } }
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Moment collections for organizing memories
CREATE TABLE IF NOT EXISTS moment_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  description text,
  color text, -- hex color for UI
  is_auto_generated boolean DEFAULT false, -- AI-created collections
  
  created_at timestamptz DEFAULT now()
);

-- Junction table for moments in collections
CREATE TABLE IF NOT EXISTS collection_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES moment_collections(id) ON DELETE CASCADE,
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  
  UNIQUE(collection_id, moment_id)
);

-- Activity feed for real-time collaboration
CREATE TABLE IF NOT EXISTS trip_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  activity_type text NOT NULL, -- 'moment_created', 'moment_starred', 'user_joined', etc.
  target_id uuid, -- ID of the target object (moment, user, etc.)
  metadata jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moments_trip_captured_at ON moments(trip_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_location ON moments(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moments_type_status ON moments(type, upload_status);
CREATE INDEX IF NOT EXISTS idx_moments_creator ON moments(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trip_activity_trip_time ON trip_activity(trip_id, created_at DESC);

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

-- Enable realtime for collaboration
ALTER publication supabase_realtime ADD TABLE moments;
ALTER publication supabase_realtime ADD TABLE moment_reactions;
ALTER publication supabase_realtime ADD TABLE trip_activity;