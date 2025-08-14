import dynamic from 'next/dynamic';
import React from 'react';
import { LoadingOverlay } from '@travelbuddies/ui';

const ItineraryClient = dynamic(() => import('app/(sections)/itinerary/ItineraryClient'), {
  ssr: false,
  loading: () => <LoadingOverlay message="Loading itinerary..." />,
});

interface TripItineraryPageProps {
  params: {
    tripId: string;
  };
}

export default function TripItineraryPage({ params }: TripItineraryPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Itinerary</h1>
      <ItineraryClient tripId={params.tripId} />
    </div>
  );
}
