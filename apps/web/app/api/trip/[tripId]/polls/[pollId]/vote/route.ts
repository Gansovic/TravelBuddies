import { NextRequest, NextResponse } from 'next/server';
import { PollService } from '@travelbuddies/utils';

const pollService = PollService.getInstance();

export async function POST(
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

    const { option_id } = body;

    if (!option_id) {
      return NextResponse.json({ 
        error: 'Option ID is required' 
      }, { status: 400 });
    }

    console.log('Casting vote for poll:', pollId, 'option:', option_id);

    // First verify the poll exists and belongs to the trip
    const poll = await pollService.getPoll(pollId);
    if (!poll || poll.trip_id !== tripId) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
    }

    if (poll.is_expired) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Verify the option exists for this poll
    const validOption = poll.options?.find(opt => opt.id === option_id);
    if (!validOption) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }

    const success = await pollService.vote({
      poll_id: pollId,
      option_id,
      user_id: '550e8400-e29b-41d4-a716-446655440000' // Test user for now
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
    }

    // Return updated poll data
    const updatedPoll = await pollService.getPoll(pollId);

    console.log('Vote cast successfully');
    return NextResponse.json({ 
      success: true, 
      poll: updatedPoll 
    });
  } catch (error) {
    console.error('API error casting vote:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}

export async function DELETE(
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

    console.log('Removing vote for poll:', pollId);

    // First verify the poll exists and belongs to the trip
    const poll = await pollService.getPoll(pollId);
    if (!poll || poll.trip_id !== tripId) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 });
    }

    const success = await pollService.removeVote(pollId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    }

    // Return updated poll data
    const updatedPoll = await pollService.getPoll(pollId);

    console.log('Vote removed successfully');
    return NextResponse.json({ 
      success: true, 
      poll: updatedPoll 
    });
  } catch (error) {
    console.error('API error removing vote:', error);
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }
}