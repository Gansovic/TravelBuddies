"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '../lib/userContext';
import { TripService } from '@travelbuddies/utils';
import Link from 'next/link';
import type { Trip } from '@travelbuddies/utils';

function HomePageContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useUser();

  const tripService = TripService.getInstance();

  const fetchTrips = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userTrips = await tripService.getUserTrips(user.id);
      setTrips(userTrips);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      
      const newTrip = await tripService.startRecording({
        auto_start_recording: true
      });

      if (newTrip) {
        // Redirect to timeline for this trip
        window.location.href = `/trip/${newTrip.id}/memories`;
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  useEffect(() => {
    const refresh = searchParams?.get('refresh');
    if (refresh === 'true') {
      fetchTrips();
    }
  }, [searchParams]);

  // Check if there's an active recording trip
  const activeTrip = trips.find(trip => trip.is_currently_recording);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TravelBuddies</h1>
              <p className="text-gray-600 mt-1">Capture memories as they happen</p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Active Trip Banner */}
        {activeTrip && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                <div>
                  <h3 className="font-semibold text-green-900">Currently Recording</h3>
                  <p className="text-green-700">{activeTrip.name}</p>
                  <p className="text-sm text-green-600">
                    {activeTrip.timeline?.total_moments || 0} moments captured
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link 
                  href={`/trip/${activeTrip.id}/memories`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  View Memories
                </Link>
                <Link 
                  href="/capture"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  📷 Capture
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!activeTrip && (
          <div className="text-center mb-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Start Recording Your Journey
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Capture photos, videos, voice notes, and check-ins as you explore. 
                Build a beautiful timeline that tells the story of your adventure.
              </p>
              
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 ${
                  isRecording 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    🎬 Start Recording
                  </>
                )}
              </button>
              
              <div className="mt-6 flex justify-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="text-lg mr-2">📷</span>
                  Photos & Videos
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-2">🎤</span>
                  Voice Notes
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-2">📍</span>
                  Location Tracking
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-2">👥</span>
                  Real-time Sharing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Past Trips */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Your Travel Memories</h3>
              <Link 
                href="/trip/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                + Create Trip
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🌍</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h4>
              <p className="text-gray-600 mb-6">Start your first trip to begin capturing memories!</p>
              <button
                onClick={startRecording}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                🎬 Start Your First Trip
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {trips.map((trip) => (
                <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <Link href={`/trip/${trip.id}/memories`} className="block">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 hover:text-blue-600">
                          {trip.name}
                        </h4>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          {trip.start_date && (
                            <span>📅 {new Date(trip.start_date).toLocaleDateString()}</span>
                          )}
                          <span>📸 {trip.timeline?.total_moments || 0} moments</span>
                          <span>👥 {trip.member_count} people</span>
                        </div>

                        {trip.timeline?.cities_visited && trip.timeline.cities_visited.length > 0 && (
                          <div className="text-sm text-gray-500">
                            📍 {trip.timeline.cities_visited.slice(0, 3).join(', ')}
                            {trip.timeline.cities_visited.length > 3 && ` +${trip.timeline.cities_visited.length - 3} more`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {trip.is_currently_recording && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Recording
                          </span>
                        )}
                        <span className="text-gray-400">→</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-semibold text-gray-900 mb-2">Instant Capture</h4>
            <p className="text-gray-600 text-sm">
              One-tap photo, video, and voice recording. No setup required.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">🤝</div>
            <h4 className="font-semibold text-gray-900 mb-2">Live Collaboration</h4>
            <p className="text-gray-600 text-sm">
              See moments as friends capture them. Everyone contributes to the same timeline.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-3xl mb-3">🧠</div>
            <h4 className="font-semibold text-gray-900 mb-2">Smart Organization</h4>
            <p className="text-gray-600 text-sm">
              Automatic location detection, weather data, and AI-enhanced memories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
