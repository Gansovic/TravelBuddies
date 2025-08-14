import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('Fetching trip details for:', tripId);
    
    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date, created_at')
      .eq('id', tripId)
      .single();

    if (error) {
      console.error('Error fetching trip:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log('Fetched trip:', trip);
    return NextResponse.json({ trip });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}