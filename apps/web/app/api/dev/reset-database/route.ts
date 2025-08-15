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
    
    console.log('Resetting database...');
    
    // Delete in correct order to respect foreign key constraints
    const tablesToClear = [
      'poll_votes',
      'poll_options', 
      'polls',
      'moment_reactions',
      'moments',
      'trip_activity',
      'trip_timeline',
      'itinerary_items',
      'trip_members',
      'trips',
      'users'
    ];

    let cleared = 0;
    for (const table of tablesToClear) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.error(`Error clearing ${table}:`, error);
        // Continue with other tables even if one fails
      } else {
        cleared++;
        console.log(`✓ Cleared ${table}`);
      }
    }

    console.log(`Database reset complete. Cleared ${cleared}/${tablesToClear.length} tables.`);

    return NextResponse.json({ 
      success: true, 
      message: `Database reset successfully. Cleared ${cleared} tables.`,
      tablesCleared: cleared
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}