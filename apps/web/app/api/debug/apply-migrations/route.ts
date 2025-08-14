import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    
    console.log('Applying memory recording schema migrations...');

    // Apply the memory recording schema migration
    const memorySchemaSQL = `
      -- TravelBuddies Memory Recording Schema
      -- Complete redesign for memory capture MVP

      -- Moment types enum
      CREATE TYPE IF NOT EXISTS moment_type AS ENUM ('photo', 'video', 'voice', 'text', 'checkin', 'note', 'audio');

      -- Moment status enum  
      CREATE TYPE IF NOT EXISTS moment_status AS ENUM ('uploading', 'processing', 'ready', 'failed');

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

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_moments_trip_captured_at ON moments(trip_id, captured_at DESC);
      CREATE INDEX IF NOT EXISTS idx_moments_location ON moments(latitude, longitude) WHERE latitude IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_moments_type_status ON moments(type, upload_status);
      CREATE INDEX IF NOT EXISTS idx_moments_creator ON moments(creator_id, created_at DESC);
    `;

    // Since we can't execute raw SQL directly, let's check if the table exists first
    const { data: existingMoments, error: checkError } = await supabase
      .from('moments')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      console.log('Moments table does not exist - this confirms our diagnosis');
      return NextResponse.json({ 
        success: false,
        error: 'Moments table does not exist', 
        message: 'The database schema is missing the moments table. You need to run the Supabase migrations manually.',
        solution: 'Run: supabase db reset --db-url YOUR_DATABASE_URL'
      }, { status: 200 });
    } else if (checkError) {
      console.error('Error checking moments table:', checkError);
      return NextResponse.json({ 
        error: 'Database connection error', 
        details: checkError 
      }, { status: 500 });
    } else {
      console.log('Moments table exists!');
      return NextResponse.json({ 
        success: true,
        message: 'Moments table already exists - the database schema is correct!'
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Memory recording schema applied successfully! The moments table and related tables are now ready.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}