import { NextRequest, NextResponse } from 'next/server';
import { MomentService } from '@travelbuddies/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const momentService = MomentService.getInstance();
    const timeline = await momentService.getTimeline(tripId);

    if (!timeline) {
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const formData = await request.formData();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Extract form data
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined;
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined;
    const is_private = formData.get('is_private') === 'true';
    const media_file = formData.get('media_file') as File | null;
    const audio_file = formData.get('audio_file') as File | null;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : null;

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
    }

    // Use the test user ID for development (same as trip creation and user context)
    const creator_id = 'a0f45e63-a83b-43fa-ac95-60721c0ce39d';

    const momentService = MomentService.getInstance();
    
    // Create the moment input with review metadata
    const momentInput = {
      trip_id: tripId,
      creator_id,
      type: type as any,
      title,
      description: description || undefined,
      latitude,
      longitude,
      is_private,
      media_file: media_file || undefined,
      captured_at: new Date()
    };

    // If we have review metadata, store it in auto_tags field for now
    // (In a real app, you'd want a proper reviews table)
    if (metadata) {
      (momentInput as any).auto_tags = JSON.stringify(metadata);
    }

    const moment = await momentService.createMoment(momentInput);

    if (moment) {
      return NextResponse.json({ moment });
    } else {
      return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}