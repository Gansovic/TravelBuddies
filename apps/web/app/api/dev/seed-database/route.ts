import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    
    console.log('Loading seed data...');
    
    // Execute seed data directly without reading the file
    
    console.log('Seeding users...');
    // Clear existing data first
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Create test users
    const users = [
      {
        id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Alice Smith',
        email: 'alice@test.com'
      },
      {
        id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Bob Johnson',
        email: 'bob@test.com'
      },
      {
        id: 'c2f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Carol Davis',
        email: 'carol@test.com'
      },
      {
        id: 'd3f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'David Wilson',
        email: 'david@test.com'
      },
      {
        id: 'e4f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Emma Brown',
        email: 'emma@test.com'
      }
    ];

    const { error: usersError } = await supabase.from('users').insert(users);
    if (usersError) throw usersError;

    console.log('Seeding trips...');
    // Clear existing data
    await supabase.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const trips = [
      {
        id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'European Adventure',
        start_date: '2024-07-15',
        end_date: '2024-07-25'
      },
      {
        id: 'f1f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Tokyo Summer Trip',
        start_date: '2024-08-20',
        end_date: '2024-08-27'
      },
      {
        id: 'f2f45e63-a83b-43fa-ac95-60721c0ce39d',
        name: 'Weekend Getaway',
        start_date: '2024-09-15',
        end_date: '2024-09-17'
      }
    ];

    const { error: tripsError } = await supabase.from('trips').insert(trips);
    if (tripsError) throw tripsError;

    console.log('Seeding trip memberships...');
    // Clear existing data
    await supabase.from('trip_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const memberships = [
      // European Adventure
      { trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'owner' },
      { trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'member' },
      { trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'member' },
      // Tokyo Trip
      { trip_id: 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'owner' },
      { trip_id: 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'member' },
      // Weekend Getaway
      { trip_id: 'f2f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'owner' },
      { trip_id: 'f2f45e63-a83b-43fa-ac95-60721c0ce39d', user_id: 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', role: 'member' },
    ];

    const { error: membershipsError } = await supabase.from('trip_members').insert(memberships);
    if (membershipsError) throw membershipsError;

    console.log('Seeding moments...');
    // Clear existing data
    await supabase.from('moments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const moments = [
      {
        trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d',
        creator_id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d',
        type: 'photo',
        title: 'Eiffel Tower at Sunset',
        description: 'Beautiful golden hour shot of the Eiffel Tower',
        captured_at: '2024-07-16T19:30:00.000Z',
        latitude: 48.8584,
        longitude: 2.2945,
        place_name: 'Eiffel Tower',
        address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
        city: 'Paris',
        country: 'France',
        upload_status: 'ready'
      },
      {
        trip_id: 'f0f45e63-a83b-43fa-ac95-60721c0ce39d',
        creator_id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d',
        type: 'note',
        title: 'Best Croissant Ever!',
        description: 'Found this amazing bakery near our hotel. The croissants are life-changing!',
        captured_at: '2024-07-17T08:15:00.000Z',
        latitude: 48.8566,
        longitude: 2.3522,
        place_name: 'Local Bakery',
        address: '123 Rue de Rivoli, 75001 Paris',
        city: 'Paris',
        country: 'France',
        upload_status: 'ready'
      },
      {
        trip_id: 'f1f45e63-a83b-43fa-ac95-60721c0ce39d',
        creator_id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d',
        type: 'photo',
        title: 'Shibuya Chaos',
        description: 'The controlled chaos of Shibuya crossing is mesmerizing',
        captured_at: '2024-08-21T15:30:00.000Z',
        latitude: 35.6598,
        longitude: 139.7006,
        place_name: 'Shibuya Crossing',
        address: 'Shibuya City, Tokyo',
        city: 'Tokyo',
        country: 'Japan',
        upload_status: 'ready'
      }
    ];

    const { error: momentsError } = await supabase.from('moments').insert(moments);
    if (momentsError) throw momentsError;

    // Get final counts
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: tripsCount } = await supabase.from('trips').select('*', { count: 'exact', head: true });
    const { count: momentsCount } = await supabase.from('moments').select('*', { count: 'exact', head: true });
    const { count: membershipsCount } = await supabase.from('trip_members').select('*', { count: 'exact', head: true });

    console.log('Database seeded successfully!');
    console.log(`Created: ${usersCount} users, ${tripsCount} trips, ${momentsCount} moments, ${membershipsCount} memberships`);

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully!',
      summary: {
        users: usersCount,
        trips: tripsCount,
        moments: momentsCount,
        memberships: membershipsCount
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}