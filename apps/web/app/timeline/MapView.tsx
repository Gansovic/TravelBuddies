'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import type { Moment, Timeline } from '@travelbuddies/utils';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  timeline: Timeline;
  selectedDay?: string;
  onMomentSelect?: (moment: Moment) => void;
}

/**
 * MapView - Interactive map showing journey route and moment locations
 * Uses MapLibre GL with OpenStreetMap tiles for memory recording visualization
 */
export default function MapView({ timeline, selectedDay, onMomentSelect }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2
  });

  // Filter moments based on selected day
  const momentsToShow = selectedDay 
    ? timeline.days.find(day => day.date === selectedDay)?.moments || []
    : timeline.days.flatMap(day => day.moments);

  // Filter moments with location data
  const geoMoments = momentsToShow.filter(moment => 
    moment.latitude && moment.longitude
  );

  // Calculate map bounds to fit all moments
  useEffect(() => {
    if (geoMoments.length === 0) return;

    const bounds = geoMoments.reduce(
      (acc, moment) => ({
        minLat: Math.min(acc.minLat, moment.latitude!),
        maxLat: Math.max(acc.maxLat, moment.latitude!),
        minLng: Math.min(acc.minLng, moment.longitude!),
        maxLng: Math.max(acc.maxLng, moment.longitude!)
      }),
      {
        minLat: geoMoments[0].latitude!,
        maxLat: geoMoments[0].latitude!,
        minLng: geoMoments[0].longitude!,
        maxLng: geoMoments[0].longitude!
      }
    );

    // Calculate center and zoom
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    
    // Simple zoom calculation based on bounds
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 2;
    if (maxDiff < 0.001) zoom = 16;
    else if (maxDiff < 0.01) zoom = 13;
    else if (maxDiff < 0.1) zoom = 10;
    else if (maxDiff < 1) zoom = 7;
    else if (maxDiff < 10) zoom = 4;

    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom
    });
  }, [geoMoments]);

  // Create journey route from moments
  const createJourneyRoute = () => {
    if (geoMoments.length < 2) return null;

    // Sort moments by captured time
    const sortedMoments = [...geoMoments].sort(
      (a, b) => a.captured_at.getTime() - b.captured_at.getTime()
    );

    const coordinates = sortedMoments.map(moment => [
      moment.longitude!,
      moment.latitude!
    ]);

    return {
      type: 'geojson' as const,
      data: {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates
        }
      }
    };
  };

  const journeyRoute = createJourneyRoute();

  const handleMarkerClick = (moment: Moment) => {
    setSelectedMoment(moment);
    onMomentSelect?.(moment);
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

  const getMomentColor = (type: string): string => {
    switch (type) {
      case 'photo': return '#3b82f6'; // blue
      case 'video': return '#ef4444'; // red
      case 'voice': return '#10b981'; // green
      case 'text': return '#f59e0b'; // amber
      case 'checkin': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (geoMoments.length === 0) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p>No location data available</p>
          <p className="text-sm">Moments with GPS coordinates will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        attributionControl={false}
      >
        {/* Journey Route */}
        {journeyRoute && (
          <Source id="journey-route" {...journeyRoute}>
            <Layer
              id="journey-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Moment Markers */}
        {geoMoments.map((moment, index) => (
          <Marker
            key={moment.id}
            longitude={moment.longitude!}
            latitude={moment.latitude!}
            onClick={() => handleMarkerClick(moment)}
          >
            <div className="relative cursor-pointer group">
              {/* Marker Pin */}
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-medium transform transition-transform group-hover:scale-110"
                style={{ backgroundColor: getMomentColor(moment.type) }}
              >
                {getMomentIcon(moment.type)}
              </div>
              
              {/* Sequence Number */}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center">
                {index + 1}
              </div>
            </div>
          </Marker>
        ))}

        {/* Moment Details Popup */}
        {selectedMoment && (
          <Popup
            longitude={selectedMoment.longitude!}
            latitude={selectedMoment.latitude!}
            onClose={() => setSelectedMoment(null)}
            offset={25}
            className="max-w-sm"
          >
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getMomentIcon(selectedMoment.type)}</span>
                <span className="font-medium capitalize">{selectedMoment.type}</span>
                <span className="text-sm text-gray-500">
                  {formatTime(selectedMoment.captured_at)}
                </span>
              </div>

              {selectedMoment.title && (
                <h4 className="font-medium text-gray-900 mb-1">
                  {selectedMoment.title}
                </h4>
              )}

              {selectedMoment.description && (
                <p className="text-gray-700 text-sm mb-2">
                  {selectedMoment.description}
                </p>
              )}

              {selectedMoment.media_url && selectedMoment.type === 'photo' && (
                <img 
                  src={selectedMoment.thumbnail_url || selectedMoment.media_url}
                  alt="Moment"
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}

              {selectedMoment.place_name && (
                <div className="text-sm text-gray-600">
                  📍 {selectedMoment.place_name}
                </div>
              )}

              {selectedMoment.weather_condition && selectedMoment.weather_temp_celsius && (
                <div className="text-sm text-gray-600 mt-1">
                  🌡️ {selectedMoment.weather_temp_celsius}°C, {selectedMoment.weather_condition}
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* Map Controls */}
        <NavigationControl position="top-right" />
      </Map>

      {/* Map Statistics Overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{geoMoments.length} moments</div>
          {timeline.total_stats.total_distance_km && (
            <div className="text-gray-600">
              📏 {timeline.total_stats.total_distance_km.toFixed(1)} km journey
            </div>
          )}
          {timeline.total_stats.countries_visited.length > 0 && (
            <div className="text-gray-600">
              🌍 {timeline.total_stats.countries_visited.length} countries
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium text-gray-900 mb-2">Moment Types</div>
        <div className="space-y-1">
          {Array.from(new Set(geoMoments.map(m => m.type))).map(type => (
            <div key={type} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getMomentColor(type) }}
              />
              <span className="text-xs text-gray-700 capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}