'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MomentService } from '@travelbuddies/utils';
import type { Moment, Timeline, CreateMomentInput, MomentType } from '@travelbuddies/utils';
import { PlaceSearch, type PlaceResult } from '../../../../(sections)/itinerary/PlaceSearch';

interface TripMemoriesPageProps {
  params: {
    tripId: string;
  };
}

export default function TripMemoriesPage({ params }: TripMemoriesPageProps) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const momentService = MomentService.getInstance();

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timelineData = await momentService.getTimeline(params.tripId);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error loading timeline:', error);
      setError('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [params.tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadTimeline}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Memories</h1>
          <p className="text-gray-600 mt-1">Capture and relive your travel experiences</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/trip/${params.tripId}/review`}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium shadow-md"
          >
            ✍️ Write Review
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            📷 Quick Capture
          </button>
        </div>
      </div>

      {/* Timeline Stats */}
      {timeline && timeline.total_stats.total_moments > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{timeline.total_stats.total_moments}</div>
              <div className="text-sm text-gray-600">Memories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{timeline.total_stats.duration_days}</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{timeline.total_stats.cities_visited.length}</div>
              <div className="text-sm text-gray-600">Cities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{timeline.total_stats.countries_visited.length}</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {!timeline || timeline.days.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memories yet</h3>
          <p className="text-gray-600 mb-6">Start capturing your travel experiences with photos, notes, and locations!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            📷 Add Your First Memory
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {timeline.days.map((day) => (
            <div key={day.date} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>📸 {day.stats.moment_count} memories</span>
                      {day.stats.cities_visited.length > 0 && (
                        <span>📍 {day.stats.cities_visited.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {day.stats.highlights.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      ⭐ {day.stats.highlights.length} highlights
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {day.moments.map((moment) => (
                    <MemoryCard 
                      key={moment.id} 
                      moment={moment} 
                      tripId={params.tripId}
                      onDelete={loadTimeline}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Memory Modal */}
      {showCreateModal && (
        <CreateMemoryModal
          tripId={params.tripId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTimeline(); // Refresh timeline
          }}
        />
      )}
    </div>
  );
}

function MemoryCard({ 
  moment, 
  tripId, 
  onDelete 
}: { 
  moment: Moment; 
  tripId: string; 
  onDelete: () => void; 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Parse review metadata if available
  const reviewData = (() => {
    try {
      if (Array.isArray(moment.auto_tags) && moment.auto_tags.length > 0) {
        return typeof moment.auto_tags[0] === 'string' ? JSON.parse(moment.auto_tags[0]) : moment.auto_tags[0];
      }
      return null;
    } catch {
      return null;
    }
  })();

  const isReview = reviewData?.template;
  const overallRating = reviewData?.overallRating;

  const getReviewIcon = (template: string) => {
    const icons: Record<string, string> = {
      restaurant: '🍽️',
      accommodation: '🏨',
      activity: '🎯',
      transport: '🚗',
      place: '📍',
      moment: '✨'
    };
    return icons[template] || '📝';
  };

  const handleDeleteMemory = async () => {
    try {
      setDeleting(true);
      console.log('Deleting memory:', moment.id);
      
      const response = await fetch(`/api/trip/${tripId}/memories/${moment.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Memory deleted successfully:', data.message);
        setShowDeleteConfirm(false);
        onDelete(); // Refresh the timeline
      } else {
        console.error('Failed to delete memory:', data.error);
        alert(`Failed to delete memory: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert('An error occurred while deleting the memory');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
        {/* Delete button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
          title="Delete Memory"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {moment.media_url && (
          <div className="aspect-video bg-gray-100">
            <img 
              src={moment.media_url}
              alt={moment.title || 'Memory'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {moment.title && (
                <h4 className="font-medium text-gray-900 mb-1">{moment.title}</h4>
              )}
              {moment.description && (
                <p className="text-gray-600 text-sm mb-2">{moment.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {isReview ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                    {getReviewIcon(reviewData.template)} Review
                  </span>
                  {overallRating > 0 && (
                    <div className="flex items-center text-yellow-500">
                      {'⭐'.repeat(Math.floor(overallRating))}
                      <span className="text-xs text-gray-600 ml-1">({overallRating})</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {moment.type}
                </span>
              )}
            </div>
          </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>{formatTime(moment.captured_at)}</span>
            {moment.place_name && (
              <>
                <span>•</span>
                <span>📍 {moment.place_name}</span>
              </>
            )}
          </div>
          {moment.reactions && moment.reactions.length > 0 && (
            <div className="flex items-center space-x-1">
              {moment.reactions.slice(0, 3).map((reaction, idx) => (
                <span key={idx}>{reaction.emoji}</span>
              ))}
              {moment.reactions.length > 3 && (
                <span className="text-gray-400">+{moment.reactions.length - 3}</span>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Memory
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{moment.title || 'this memory'}"? This action cannot be undone and will permanently delete:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>The memory and all its content</li>
              {moment.media_url && <li>Associated photo/video file</li>}
              <li>All reactions and comments</li>
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
                onClick={handleDeleteMemory}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Memory'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateMemoryModal({ 
  tripId, 
  onClose, 
  onSuccess 
}: { 
  tripId: string; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState<Partial<CreateMomentInput>>({
    trip_id: tripId,
    type: 'photo',
    title: '',
    description: '',
    is_private: false
  });
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const momentService = MomentService.getInstance();

  // Auto-detect current location on modal open
  useEffect(() => {
    getCurrentLocation();
    console.log('CreateMemoryModal: MomentService instance:', momentService);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return;
    
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      
      // Try to reverse geocode the location
      try {
        const response = await fetch(`/api/places/reverse-geocode?lat=${latitude}&lng=${longitude}`);
        const data = await response.json();
        if (data.place) {
          setSelectedPlace(data.place);
        }
      } catch (error) {
        console.warn('Failed to reverse geocode location:', error);
      }
    } catch (error) {
      console.warn('Failed to get current location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!cameraStream) return;

    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!video || !context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, type: 'photo' }));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('CreateMemoryModal.handleSubmit: Starting memory creation');
    
    if (!formData.title?.trim()) {
      alert('Please add a title for your memory');
      return;
    }

    try {
      setLoading(true);
      console.log('CreateMemoryModal.handleSubmit: Calling API endpoint');
      console.log('CreateMemoryModal.handleSubmit: formData:', formData);
      console.log('CreateMemoryModal.handleSubmit: selectedPlace:', selectedPlace);
      console.log('CreateMemoryModal.handleSubmit: selectedFile:', selectedFile?.name);

      // Create FormData to send to API
      const apiFormData = new FormData();
      apiFormData.append('type', formData.type as string);
      apiFormData.append('title', formData.title.trim());
      if (formData.description?.trim()) {
        apiFormData.append('description', formData.description.trim());
      }
      if (selectedPlace?.lat) {
        apiFormData.append('latitude', selectedPlace.lat.toString());
      } else if (currentLocation?.lat) {
        apiFormData.append('latitude', currentLocation.lat.toString());
      }
      if (selectedPlace?.lng) {
        apiFormData.append('longitude', selectedPlace.lng.toString());
      } else if (currentLocation?.lng) {
        apiFormData.append('longitude', currentLocation.lng.toString());
      }
      apiFormData.append('is_private', formData.is_private?.toString() || 'false');
      if (selectedFile) {
        apiFormData.append('media_file', selectedFile);
      }

      console.log('CreateMemoryModal.handleSubmit: About to call API with FormData');
      const response = await fetch(`/api/trip/${tripId}/memories`, {
        method: 'POST',
        body: apiFormData
      });

      const result = await response.json();
      console.log('CreateMemoryModal.handleSubmit: API response:', result);
      
      if (response.ok && result.moment) {
        console.log('CreateMemoryModal.handleSubmit: Memory created successfully');
        onSuccess();
      } else {
        console.log('CreateMemoryModal.handleSubmit: Memory creation failed:', result.error);
        alert(`Failed to create memory: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating memory:', error);
      alert(`Failed to create memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-set type based on file
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, type: 'photo' }));
      } else if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, type: 'video' }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Add Memory</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={(e) => {
          console.log('Form onSubmit triggered');
          handleSubmit(e);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Memory Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MomentType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="photo">📷 Photo</option>
              <option value="video">🎥 Video</option>
              <option value="note">📝 Note</option>
              <option value="audio">🎤 Voice Note</option>
              <option value="location">📍 Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="What's this memory about?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Tell the story of this moment..."
            />
          </div>

          {(formData.type === 'photo' || formData.type === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.type === 'photo' ? 'Photo' : 'Video'}
              </label>
              
              <div className="space-y-2">
                {/* Camera Capture Button */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
                  >
                    📷 Take Photo
                  </button>
                  <label className="flex-1">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept={formData.type === 'photo' ? 'image/*' : 'video/*'}
                      className="hidden"
                    />
                    <div className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium text-sm text-center cursor-pointer">
                      📁 Choose File
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                    {selectedFile.type.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera View Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">Take Photo</h3>
                </div>
                
                <div className="relative mb-4">
                  <video
                    id="camera-video"
                    autoPlay
                    playsInline
                    muted
                    ref={(video) => {
                      if (video && cameraStream) {
                        video.srcObject = cameraStream;
                      }
                    }}
                    className="w-full h-64 object-cover rounded-lg bg-gray-900"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    📷 Capture
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {locationLoading ? '🔄 Detecting...' : '📍 Use Current Location'}
              </button>
            </div>
            
            {currentLocation && !selectedPlace && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <div className="text-green-800">📍 Current location detected</div>
                <div className="text-green-600 text-xs">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
              </div>
            )}
            
            <PlaceSearch
              type="activity"
              onSelect={(place) => setSelectedPlace(place)}
            />
            {selectedPlace && (
              <div className="text-xs text-gray-600 mt-1">
                📍 {selectedPlace.name} — {selectedPlace.address}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_private"
              checked={formData.is_private}
              onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_private" className="ml-2 text-sm text-gray-700">
              Keep this memory private (only visible to me)
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}