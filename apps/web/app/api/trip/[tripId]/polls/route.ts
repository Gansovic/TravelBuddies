import { NextRequest, NextResponse } from 'next/server';
import { PollService } from '@travelbuddies/utils';

const pollService = PollService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;
    const { searchParams } = new URL(request.url);

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    // Parse query parameters for filtering and sorting
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const options = {
      filters: {
        ...(status && { status: [status as any] }),
        ...(type && { type: [type as any] })
      },
      sort_by: sortBy as any,
      sort_order: sortOrder as 'asc' | 'desc',
      limit,
      offset
    };

    console.log('Fetching polls for trip:', tripId, 'with options:', options);

    const polls = await pollService.getPolls(tripId, options);

    console.log('Found polls:', polls.length);
    return NextResponse.json({ polls });
  } catch (error) {
    console.error('API error fetching polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
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

    const { title, description, type, related_data, closes_at, options } = body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ 
        error: 'Title and at least 2 options are required' 
      }, { status: 400 });
    }

    console.log('Creating poll for trip:', tripId, body);

    const pollInput = {
      trip_id: tripId,
      title,
      description,
      type: type || 'general',
      related_data: related_data || {},
      closes_at: closes_at ? new Date(closes_at) : undefined,
      options: options.map((opt: any) => ({
        title: opt.title,
        description: opt.description,
        data: opt.data || {}
      }))
    };

    const poll = await pollService.createPoll(pollInput);

    if (!poll) {
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    console.log('Poll created successfully:', poll.id);
    return NextResponse.json({ poll });
  } catch (error) {
    console.error('API error creating poll:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}