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
    
    console.log('Fetching itinerary items for trip:', tripId);
    
    // First, let's see all items in the table for debugging
    const { data: allItems } = await supabase
      .from('itinerary_items')
      .select('id, trip_id, day, type, notes');
    
    console.log('All itinerary items in database:', allItems);
    
    const { data: items, error } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('day', { ascending: true });

    if (error) {
      console.error('Error fetching itinerary items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Filtered itinerary items for trip', tripId, ':', items);
    console.log('Number of items found:', items?.length || 0);
    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const body = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const { type, title, day, placeId, lat, lng, notes } = body;

    if (!type || !title || day === undefined) {
      return NextResponse.json({ error: 'type, title, and day are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('Creating itinerary item for trip:', tripId, body);
    console.log('Trip ID type:', typeof tripId, 'Trip ID value:', tripId);
    
    const newItem = {
      trip_id: tripId,
      type,
      notes: title, // Using title as notes for now
      day,
      place_id: placeId,
      lat,
      lng
    };
    
    console.log('New item to insert:', newItem);

    const { data: item, error } = await supabase
      .from('itinerary_items')
      .insert(newItem)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating itinerary item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Created itinerary item:', item);
    return NextResponse.json({ item });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to create itinerary item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!tripId || !itemId) {
      return NextResponse.json({ error: 'Trip ID and item ID are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('Deleting itinerary item:', itemId, 'for trip:', tripId);
    
    // Delete item only if it belongs to the specified trip (for security)
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId);

    if (error) {
      console.error('Error deleting itinerary item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Successfully deleted itinerary item:', itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to delete itinerary item' }, { status: 500 });
  }
}