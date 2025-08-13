"use client";
import { useState } from 'react';
import { Button } from '@travelbuddies/ui';
import { PlaceSearch, type PlaceResult } from '../../(sections)/itinerary/PlaceSearch';
import { supabase } from '../../../lib/supabaseClient';
import { EdgeFunctionsService } from '../../../lib/edge-functions.service';
import { useRouter } from 'next/navigation';

export default function NewTripPage() {
  const [name, setName] = useState('');
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Trip</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!name.trim()) { setError('Name required'); return; }
          setCreating(true);
          const body = {
            name,
            destination: place ? { placeId: place.placeId, name: place.name, address: place.address, lat: place.lat, lng: place.lng } : undefined,
          };
          // Fire-and-forget call to the edge function with keepalive so it completes after navigation
          try {
            if (FUNCTIONS_URL) {
              fetch(`${FUNCTIONS_URL}/trip-create`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  ...(ANON_KEY ? { apikey: ANON_KEY } : {}),
                },
                body: JSON.stringify(body),
                // ensure the request can outlive the page navigation
                keepalive: true,
              }).catch(() => {});
            } else {
              // fallback if functions URL isn't configured
              EdgeFunctionsService.getInstance().createTrip(body).catch(() => {});
            }
          } catch {}
          // Navigate immediately back to homepage
          router.replace('/');
          setCreating(false);
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="block text-sm mb-1">Trip name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="e.g., Lisbon Offsite" required />
        </label>
        <div>
          <span className="block text-sm mb-1">Destination (optional)</span>
          <PlaceSearch type="activity" onSelect={setPlace} />
          {place && <div className="text-xs text-gray-600 mt-1">Selected: {place.name} — {place.address}</div>}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create Trip'}</Button>
          <Button type="button" onClick={() => router.push('/')}>Cancel</Button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    </div>
  );
}
