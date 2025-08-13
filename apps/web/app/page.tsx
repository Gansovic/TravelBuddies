"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../lib/userContext';
import Link from 'next/link';

interface Trip {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
}

export default function Page() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { user } = useUser();

  const fetchTrips = async () => {
    if (!user) {
      console.log('No user yet, skipping trip fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching trips for user:', user.id);
      const response = await fetch(`/api/trips?user_id=${user.id}`);
      const data = await response.json();

      console.log('API response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trips');
      }

      console.log('Setting trips:', data.trips);
      setTrips(data.trips || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch trips when user is available
    fetchTrips();
  }, [user]);

  useEffect(() => {
    // Refetch trips when returning from trip creation
    const refresh = searchParams.get('refresh');
    if (refresh === 'true') {
      console.log('Refreshing trips after creation...');
      fetchTrips();
    }
  }, [searchParams]);

  return (
    <div>
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <span className="text-sm text-gray-600">
          Logged in as: {user?.name || 'Loading...'} (ID: {user?.id || 'Loading...'})
        </span>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Your Trips</h1>
      <div className="mb-4">
        <Link href="/trip/new" className="underline">Create a new trip</Link>
      </div>
      
      {loading && <p className="text-gray-500">Loading trips...</p>}
      
      {error && (
        <div className="text-red-600 mb-4 p-2 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <ul className="space-y-2">
          {trips.map((trip) => (
            <li key={trip.id} className="border rounded p-3 hover:bg-gray-50">
              <Link href={`/trip/${trip.id}/itinerary`} className="block">
                <div className="font-medium hover:underline">{trip.name}</div>
                {(trip.start_date || trip.end_date) && (
                  <div className="text-sm text-gray-600 mt-1">
                    {trip.start_date && new Date(trip.start_date).toLocaleDateString()}
                    {trip.start_date && trip.end_date && ' - '}
                    {trip.end_date && new Date(trip.end_date).toLocaleDateString()}
                  </div>
                )}
              </Link>
            </li>
          ))}
          {trips.length === 0 && (
            <li className="text-gray-500 text-center py-8">
              No trips yet. <Link href="/trip/new" className="underline">Create your first trip!</Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
