import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('Querying trips for user:', userId);
    
    // Use direct PostgREST request (more reliable than Supabase client)
    const postgreRestUrl = `${supabaseUrl}/rest/v1/trip_members?select=trip_id&user_id=eq.${userId}`;
    const directResponse = await fetch(postgreRestUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    if (!directResponse.ok) {
      console.error('Error fetching trip members:', await directResponse.text());
      return NextResponse.json({ error: 'Failed to fetch trip members' }, { status: 500 });
    }
    
    const memberCheck = await directResponse.json();
    console.log('Trip members for user:', memberCheck);
    
    if (!memberCheck || memberCheck.length === 0) {
      console.log('No trips found for user');
      return NextResponse.json({ trips: [] });
    }

    // Get the trip IDs
    const tripIds = memberCheck.map(member => member.trip_id);
    console.log('Found trip IDs:', tripIds);

    // Get trips by ID (simpler query that should work consistently)
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date')
      .in('id', tripIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trips with join:', error);
      
      // Fallback: Get all trips owned by the user (simpler query)
      console.log('Trying fallback query - trips owned by user...');
      const { data: ownedTrips, error: ownedError } = await supabase
        .from('trips')
        .select('id, name, start_date, end_date')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
        
      if (ownedError) {
        console.error('Error fetching owned trips:', ownedError);
        return NextResponse.json({ error: ownedError.message }, { status: 500 });
      }
      
      console.log('Fetched owned trips for user', userId, ':', ownedTrips);
      return NextResponse.json({ trips: ownedTrips || [] });
    }

    console.log('Fetched trips for user', userId, ':', trips);
    return NextResponse.json({ trips: trips || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}