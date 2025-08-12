import dynamic from 'next/dynamic';

const ItineraryClient = dynamic(() => import('./ItineraryClient'), { ssr: false });

export default function ItineraryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Itinerary</h1>
      <ItineraryClient />
    </div>
  );
}
