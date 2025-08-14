import { NextRequest, NextResponse } from 'next/server';
import { MomentService } from '@travelbuddies/utils';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string; momentId: string } }
) {
  try {
    const { tripId, momentId } = params;
    
    if (!tripId || !momentId) {
      return NextResponse.json({ error: 'Trip ID and Moment ID are required' }, { status: 400 });
    }

    console.log('Deleting moment:', momentId, 'from trip:', tripId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    
    // First, get the moment to check if it has media that needs to be deleted
    const { data: moment, error: fetchError } = await supabase
      .from('moments')
      .select('id, title, media_url, trip_id')
      .eq('id', momentId)
      .eq('trip_id', tripId) // Ensure moment belongs to this trip
      .single();

    if (fetchError || !moment) {
      console.error('Moment not found:', fetchError);
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    console.log('Found moment to delete:', moment.title);

    // If moment has media, delete it from storage first
    if (moment.media_url) {
      try {
        // Extract file path from media URL
        // URL format: http://127.0.0.1:54321/storage/v1/object/public/media/moments/[id].jpg
        const urlParts = moment.media_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `moments/${fileName}`;
        
        console.log('Deleting media file:', filePath);
        
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Failed to delete media file:', storageError);
          // Continue with moment deletion even if media deletion fails
        } else {
          console.log('Media file deleted successfully');
        }
      } catch (mediaError) {
        console.warn('Error deleting media file:', mediaError);
        // Continue with moment deletion even if media deletion fails
      }
    }

    // Delete moment reactions first (due to foreign key constraints)
    const { error: reactionsError } = await supabase
      .from('moment_reactions')
      .delete()
      .eq('moment_id', momentId);

    if (reactionsError) {
      console.warn('Failed to delete moment reactions:', reactionsError);
      // Continue with moment deletion
    }

    // Delete the moment record
    const { error: deleteError } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId)
      .eq('trip_id', tripId); // Ensure we only delete from the correct trip

    if (deleteError) {
      console.error('Error deleting moment:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete memory', 
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('Moment deleted successfully:', moment.title);

    return NextResponse.json({ 
      success: true, 
      message: `Memory "${moment.title}" deleted successfully` 
    });

  } catch (error) {
    console.error('Delete moment API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}