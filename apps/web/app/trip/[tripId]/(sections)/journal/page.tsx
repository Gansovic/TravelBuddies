'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TripJournalPageProps {
  params: {
    tripId: string;
  };
}

/**
 * Journal Redirect Page - Redirects to Memories
 * Journal and Memories sections have been unified
 */
export default function TripJournalRedirect({ params }: TripJournalPageProps) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to memories page
    router.replace(`/trip/${params.tripId}/memories`);
  }, [params.tripId, router]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Memories...</p>
      </div>
    </div>
  );
}