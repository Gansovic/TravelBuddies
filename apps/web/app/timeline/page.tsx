'use client';

import { useState, useEffect } from 'react';
import { MomentService, TripService } from '@travelbuddies/utils';
import type { Timeline, TimelineDay, Moment } from '@travelbuddies/utils';
import { useCollaboration, useMomentUpdates } from '../../lib/hooks/useCollaboration';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

/**
 * Timeline Page - Main memory timeline view
 * Shows chronological moments organized by day
 * Supports real-time updates as moments are captured
 */
export default function TimelinePage() {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');

  const momentService = MomentService.getInstance();
  const tripService = TripService.getInstance();

  // Real-time collaboration
  const tripId = 'current-trip-id'; // TODO: Get from route/context
  const userId = 'current-user-id'; // TODO: Get from auth context
  const { activeUsers, isConnected } = useCollaboration(tripId, userId);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tripId = 'current-trip-id'; // TODO: Get from route/context
      const timelineData = await momentService.getTimeline(tripId);
      
      if (timelineData) {
        setTimeline(timelineData);
        // Auto-select today or latest day
        const today = new Date().toISOString().split('T')[0];
        const hasToday = timelineData.days.some(day => day.date === today);
        setSelectedDay(hasToday ? today : timelineData.days[timelineData.days.length - 1]?.date);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      setError('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMoment = (moment: Moment) => {
    if (!timeline) return;

    // Add new moment to timeline
    const dayKey = moment.captured_at.toISOString().split('T')[0];
    const updatedDays = [...timeline.days];
    
    const dayIndex = updatedDays.findIndex(day => day.date === dayKey);
    if (dayIndex >= 0) {
      // Add to existing day
      updatedDays[dayIndex].moments.push(moment);
      updatedDays[dayIndex].stats.moment_count += 1;
    } else {
      // Create new day
      const newDay: TimelineDay = {
        date: dayKey,
        moments: [moment],
        stats: {
          moment_count: 1,
          cities_visited: moment.city ? [moment.city] : [],
          highlights: moment.is_highlight ? [moment] : []
        }
      };
      updatedDays.push(newDay);
      updatedDays.sort((a, b) => a.date.localeCompare(b.date));
    }

    setTimeline({
      ...timeline,
      days: updatedDays,
      total_stats: {
        ...timeline.total_stats,
        total_moments: timeline.total_stats.total_moments + 1
      }
    });

    // Show notification for new moments from other users
    if (moment.creator_id !== userId) {
      showNewMomentNotification(moment);
    }
  };

  const handleMomentUpdated = (updatedMoment: Moment) => {
    if (!timeline) return;

    const updatedDays = timeline.days.map(day => ({
      ...day,
      moments: day.moments.map(moment => 
        moment.id === updatedMoment.id ? updatedMoment : moment
      )
    }));

    setTimeline({
      ...timeline,
      days: updatedDays
    });
  };

  const handleMomentDeleted = (momentId: string) => {
    if (!timeline) return;

    const updatedDays = timeline.days.map(day => ({
      ...day,
      moments: day.moments.filter(moment => moment.id !== momentId),
      stats: {
        ...day.stats,
        moment_count: day.moments.filter(moment => moment.id !== momentId).length
      }
    })).filter(day => day.moments.length > 0); // Remove empty days

    setTimeline({
      ...timeline,
      days: updatedDays,
      total_stats: {
        ...timeline.total_stats,
        total_moments: timeline.total_stats.total_moments - 1
      }
    });
  };

  const showNewMomentNotification = (moment: Moment) => {
    // Show brief notification for new moments
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">${getMomentIcon(moment.type)}</span>
        <span>New ${moment.type} added!</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-slide-out');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Subscribe to real-time moment updates after handlers are defined
  useMomentUpdates(tripId, handleNewMoment, handleMomentUpdated, handleMomentDeleted);

  useEffect(() => {
    loadTimeline();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMomentIcon = (type: string): string => {
    switch (type) {
      case 'photo': return '📷';
      case 'video': return '🎥';
      case 'voice': return '🎤';
      case 'text': return '📝';
      case 'checkin': return '📍';
      default: return '•';
    }
  };

  const selectedDayData = timeline?.days.find(day => day.date === selectedDay);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

  if (!timeline || timeline.days.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No memories yet</h2>
          <p className="text-gray-600 mb-6">Start capturing moments to build your travel timeline!</p>
          <a 
            href="/capture"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            📷 Start Capturing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">Trip Timeline</h1>
                {isConnected && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{timeline.total_stats.total_moments} moments • {timeline.total_stats.duration_days} days</span>
                {activeUsers.length > 0 && (
                  <span className="text-sm">
                    👥 {activeUsers.length} active {activeUsers.length === 1 ? 'user' : 'users'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'timeline' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Timeline
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🗺️ Map
                </button>
              </div>

              <a 
                href="/capture"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                + Add Moment
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="space-y-6">
            {/* Day Filter for Map */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedDay === null
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </button>
                {timeline.days.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day.date)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedDay === day.date
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDate(day.date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Component */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <MapView 
                timeline={timeline} 
                selectedDay={selectedDay || undefined}
                onMomentSelect={(moment) => {
                  // Could add moment detail modal here
                  console.log('Selected moment:', moment);
                }}
              />
            </div>
          </div>
        ) : (
          /* Timeline View */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Day Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Days</h3>
                <div className="space-y-2">
                  {timeline.days.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDay(day.date)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedDay === day.date
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {formatDate(day.date)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {day.stats.moment_count} moments
                      </div>
                      {day.stats.cities_visited.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {day.stats.cities_visited.join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="lg:col-span-3">
              {selectedDayData ? (
                <div className="bg-white rounded-lg shadow-sm">
                  {/* Day Header */}
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {formatDate(selectedDayData.date)}
                    </h2>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span>{selectedDayData.stats.moment_count} moments</span>
                      {selectedDayData.stats.distance_km && (
                        <span>📏 {selectedDayData.stats.distance_km.toFixed(1)} km</span>
                      )}
                      {selectedDayData.stats.cities_visited.length > 0 && (
                        <span>📍 {selectedDayData.stats.cities_visited.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {/* Moments List */}
                  <div className="p-6">
                    <div className="space-y-6">
                      {selectedDayData.moments.map((moment, index) => (
                        <div key={moment.id} className="flex items-start space-x-4">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              moment.is_highlight ? 'bg-yellow-400' : 'bg-blue-400'
                            }`} />
                            {index < selectedDayData.moments.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                            )}
                          </div>

                          {/* Moment Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{getMomentIcon(moment.type)}</span>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {moment.type}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatTime(moment.captured_at)}
                              </span>
                              {moment.is_starred && <span className="text-yellow-500">⭐</span>}
                            </div>

                            {/* Media Preview */}
                            {moment.media_url && (
                              <div className="mb-3">
                                {moment.type === 'photo' && (
                                  <img 
                                    src={moment.thumbnail_url || moment.media_url}
                                    alt={moment.title || 'Moment photo'}
                                    className="rounded-lg max-w-sm h-48 object-cover"
                                  />
                                )}
                                {moment.type === 'video' && (
                                  <video 
                                    src={moment.media_url}
                                    controls
                                    className="rounded-lg max-w-sm h-48 object-cover"
                                  />
                                )}
                                {moment.type === 'voice' && (
                                  <audio 
                                    src={moment.media_url}
                                    controls
                                    className="w-64"
                                  />
                                )}
                              </div>
                            )}

                            {/* Text Content */}
                            {(moment.title || moment.description) && (
                              <div className="mb-3">
                                {moment.title && (
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {moment.title}
                                  </h4>
                                )}
                                {moment.description && (
                                  <p className="text-gray-700">{moment.description}</p>
                                )}
                              </div>
                            )}

                            {/* Transcription */}
                            {moment.transcription && (
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-gray-700 italic">"{moment.transcription}"</p>
                              </div>
                            )}

                            {/* Location */}
                            {moment.place_name && (
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <span className="mr-1">📍</span>
                                <span>{moment.place_name}</span>
                                {moment.city && moment.city !== moment.place_name && (
                                  <span className="text-gray-500 ml-1">• {moment.city}</span>
                                )}
                              </div>
                            )}

                            {/* Reactions */}
                            {moment.reactions && moment.reactions.length > 0 && (
                              <div className="flex items-center space-x-2">
                                {Array.from(new Set(moment.reactions.map(r => r.emoji))).map(emoji => {
                                  const count = moment.reactions!.filter(r => r.emoji === emoji).length;
                                  return (
                                    <span key={emoji} className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                                      {emoji} {count}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-600">Select a day to view moments</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <a
        href="/capture"
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50"
      >
        📷
      </a>
    </div>
  );
}