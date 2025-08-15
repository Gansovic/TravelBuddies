import { NextRequest, NextResponse } from 'next/server';
import { PollService } from '@travelbuddies/utils';

const pollService = PollService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string; pollId: string } }
) {
  try {
    const { tripId, pollId } = params;

    if (!tripId || !pollId) {
      return NextResponse.json({ 
        error: 'Trip ID and Poll ID are required' 
      }, { status: 400 });
    }

    console.log('Fetching poll:', pollId, 'for trip:', tripId);

    const poll = await pollService.getPoll(pollId);

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.trip_id !== tripId) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json({ poll });
  } catch (error) {
    console.error('API error fetching poll:', error);
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string; pollId: string } }
) {
  try {
    const { tripId, pollId } = params;
    const body = await request.json();

    if (!tripId || !pollId) {
      return NextResponse.json({ 
        error: 'Trip ID and Poll ID are required' 
      }, { status: 400 });
    }

    console.log('Updating poll:', pollId, 'for trip:', tripId, body);

    // First verify the poll exists and belongs to the trip
    const existingPoll = await pollService.getPoll(pollId);
    if (!existingPoll || existingPoll.trip_id !== tripId) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // For now, we'll implement a simple close poll operation
    if (body.action === 'close') {
      const results = await pollService.closePoll(pollId);
      if (!results) {
        return NextResponse.json({ error: 'Failed to close poll' }, { status: 500 });
      }
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error updating poll:', error);
    return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
  }
}