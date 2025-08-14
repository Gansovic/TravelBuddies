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
    
    console.log('Creating test user and memory...');
    
    // Generate proper UUID for test user
    const testUserId = crypto.randomUUID();
    console.log('Generated test user ID:', testUserId);
    
    // Use existing test user ID
    const existingTestUserId = 'a0f45e63-a83b-43fa-ac95-60721c0ce39d';
    console.log('Using existing test user ID:', existingTestUserId);

    // Create test memory
    const testMemory = {
      trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d',
      creator_id: existingTestUserId,
      type: 'note',
      title: 'Test Memory from Database',
      description: 'This is a test memory created directly in the database to verify that the schema, timeline loading, and UI display all work correctly. If you can see this memory in the app, then the problem is in the frontend form submission.',
      captured_at: new Date().toISOString(),
      upload_status: 'ready',
      latitude: 44.8019,
      longitude: 20.4897,
      place_name: 'Belgrade City Center',
      address: 'Belgrade, Serbia',
      city: 'Belgrade',
      country: 'Serbia',
      is_private: false
    };

    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .insert(testMemory)
      .select()
      .single();

    if (momentError) {
      console.error('Error creating test moment:', momentError);
      return NextResponse.json({ 
        error: 'Failed to create test memory', 
        details: momentError 
      }, { status: 500 });
    }

    console.log('Test memory created successfully:', moment.id);

    // Verify by fetching all moments for the trip
    const { data: allMoments, error: fetchError } = await supabase
      .from('moments')
      .select('*')
      .eq('trip_id', 'f0f45e63-a83b-43fa-ac95-60721c0ce39d')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching moments:', fetchError);
    } else {
      console.log(`Found ${allMoments?.length || 0} total moments for trip`);
    }

    return NextResponse.json({ 
      success: true, 
      moment_id: moment.id,
      total_moments: allMoments?.length || 0,
      message: 'Test memory created successfully! Check the memories page to see if it appears.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}