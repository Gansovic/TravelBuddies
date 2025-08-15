import dynamic from 'next/dynamic';
import React from 'react';
import { LoadingOverlay } from '@travelbuddies/ui';

const PollsClient = dynamic(() => import('app/(sections)/polls/PollsClient'), {
  ssr: false,
  loading: () => <LoadingOverlay message="Loading polls..." />,
});

interface TripPollsPageProps {
  params: {
    tripId: string;
  };
}

export default function TripPollsPage({ params }: TripPollsPageProps) {
  return <PollsClient tripId={params.tripId} />;
}
