'use client';
import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from '../../../components/Sidebar';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
}

export default function TripLayout({ children, params }: { children: ReactNode; params: { tripId: string } }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trip/${params.tripId}`);
        const data = await response.json();

        if (response.ok && data.trip) {
          setTrip(data.trip);
        } else {
          console.error('Failed to fetch trip:', data.error);
        }
      } catch (error) {
        console.error('Error fetching trip:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [params.tripId]);

  const handleDeleteTrip = async () => {
    if (!trip) return;
    
    try {
      setDeleting(true);
      console.log('Deleting trip:', trip.id);
      
      const response = await fetch(`/api/trip/${trip.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Trip deleted successfully:', data.message);
        // Redirect to main page
        router.push('/');
      } else {
        console.error('Failed to delete trip:', data.error);
        alert(`Failed to delete trip: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('An error occurred while deleting the trip');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar basePath={`/trip/${params.tripId}`} />
      <main style={{ flex: 1 }}>
        {/* Trip Header */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #eee', 
          backgroundColor: '#f8f9fa' 
        }}>
          {loading ? (
            <div className="text-gray-500">Loading trip...</div>
          ) : trip ? (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-gray-800">{trip.name}</h1>
                {(trip.start_date || trip.end_date) && (
                  <div className="text-sm text-gray-600 mt-1">
                    {trip.start_date && new Date(trip.start_date).toLocaleDateString()}
                    {trip.start_date && trip.end_date && ' - '}
                    {trip.end_date && new Date(trip.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                title="Delete Trip"
              >
                🗑️ Delete
              </button>
            </div>
          ) : (
            <div className="text-gray-500">Trip not found</div>
          )}
        </div>
        
        {/* Page Content */}
        <div style={{ padding: 16 }}>
          {children}
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Trip
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{trip?.name}"? This action cannot be undone and will permanently delete:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>All memories and moments</li>
              <li>All photos and media</li>
              <li>Trip timeline and statistics</li>
              <li>All member associations</li>
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
