import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    // First, let's check if there are any trip_members for this user
    const { data: memberCheck, error: memberError } = await supabase
      .from('trip_members')
      .select('trip_id')
      .eq('user_id', userId);
    
    console.log('Trip members for user:', memberCheck);
    
    if (memberError) {
      console.error('Error checking trip members:', memberError);
    }

    // Get trips where the user is a member
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        id, 
        name, 
        start_date, 
        end_date,
        trip_members!inner(user_id)
      `)
      .eq('trip_members.user_id', userId)
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