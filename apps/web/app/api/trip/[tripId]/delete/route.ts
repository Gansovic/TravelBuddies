import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    console.log('Deleting trip:', tripId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    
    // First, verify the trip exists and get some info about it
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('id, name, owner_id')
      .eq('id', tripId)
      .single();

    if (fetchError || !trip) {
      console.error('Trip not found:', fetchError);
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log('Found trip to delete:', trip.name);

    // Delete the trip - this will cascade to related tables due to foreign key constraints
    // The database will automatically delete: trip_members, moments, moment_reactions, trip_timeline, etc.
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (deleteError) {
      console.error('Error deleting trip:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete trip', 
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('Trip deleted successfully:', trip.name);

    return NextResponse.json({ 
      success: true, 
      message: `Trip "${trip.name}" deleted successfully` 
    });

  } catch (error) {
    console.error('Delete trip API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}