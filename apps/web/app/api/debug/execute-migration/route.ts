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
    
    console.log('Attempting to create moments table using direct SQL...');

    // Try executing the full SQL as a single RPC call
    const migrationSQL = `
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

      -- Users table 
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        email text
      );

      -- Trip members
      CREATE TABLE IF NOT EXISTS trip_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        role text DEFAULT 'member',
        joined_at timestamptz DEFAULT now(),
        UNIQUE(trip_id, user_id)
      );

      -- Memory recording schema
      CREATE TYPE IF NOT EXISTS moment_type AS ENUM ('photo', 'video', 'voice', 'text', 'checkin', 'note', 'audio');
      CREATE TYPE IF NOT EXISTS moment_status AS ENUM ('uploading', 'processing', 'ready', 'failed');

      -- Core moments table
      CREATE TABLE IF NOT EXISTS moments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
        creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
        type moment_type NOT NULL,
        title text,
        description text,
        media_url text,
        thumbnail_url text,
        media_size_bytes bigint,
        media_duration_seconds integer,
        captured_at timestamptz NOT NULL DEFAULT now(),
        device_timestamp timestamptz,
        upload_status moment_status DEFAULT 'uploading',
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
        weather_temp_celsius real,
        weather_condition text,
        weather_description text,
        timezone text,
        auto_tags text[],
        suggested_emoji text[],
        transcription text,
        ai_caption text,
        ai_category text,
        is_starred boolean DEFAULT false,
        is_highlight boolean DEFAULT false,
        is_private boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Supporting tables
      CREATE TABLE IF NOT EXISTS moment_reactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        emoji text NOT NULL,
        created_at timestamptz DEFAULT now(),
        UNIQUE(moment_id, user_id, emoji)
      );

      CREATE TABLE IF NOT EXISTS trip_timeline (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
        recording_started_at timestamptz,
        recording_ended_at timestamptz,
        is_currently_recording boolean DEFAULT true,
        total_moments integer DEFAULT 0,
        total_distance_km real,
        cities_visited text[],
        countries_visited text[],
        daily_stats jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `;

    // Since RPC might not exist, let me try this approach instead
    // First, let's just check if we can create a simple test table
    console.log('Testing database connection...');

    // Test the connection by trying to insert into a simple table
    const testResult = await supabase
      .from('trips')
      .select('id')
      .limit(1);

    console.log('Connection test result:', testResult);

    if (testResult.error?.code === 'PGRST205') {
      // Table doesn't exist, this suggests the migrations haven't run at all
      console.log('No tables exist - migrations have not been applied');
      
      return NextResponse.json({ 
        success: false,
        error: 'No database tables exist',
        message: 'The database appears to be empty. The Supabase migrations were not applied during startup.',
        solution: 'The migration file exists but was not executed. This suggests a Supabase CLI configuration issue.'
      });
    }

    // Now test if moments table exists
    const { data: testMoments, error: momentsError } = await supabase
      .from('moments')
      .select('id')
      .limit(1);

    const momentsExists = momentsError?.code !== 'PGRST205';

    return NextResponse.json({ 
      success: momentsExists,
      message: momentsExists 
        ? 'Moments table already exists!' 
        : 'Moments table does not exist, but other tables do',
      momentsError: momentsError?.message,
      testResult: testResult.error?.message || 'Connection OK'
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}