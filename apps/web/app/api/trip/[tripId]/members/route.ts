import { NextRequest, NextResponse } from 'next/server';
import { TripService } from '@travelbuddies/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { tripId } = params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const tripService = TripService.getInstance();
    const members = await tripService.getTripMembers(tripId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
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

    if (!body.email && !body.user_id) {
      return NextResponse.json({ error: 'Email or user_id is required' }, { status: 400 });
    }

    if (!body.role || !['editor', 'viewer'].includes(body.role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    const tripService = TripService.getInstance();
    const success = await tripService.inviteMember(tripId, {
      email: body.email,
      user_id: body.user_id,
      role: body.role
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}