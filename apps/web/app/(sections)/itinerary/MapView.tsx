"use client";
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl, ViewState } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import type { ItineraryItem } from '@travelbuddies/utils';
import { useMemo, useState } from 'react';

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapView({ items }: { items: ItineraryItem[] }) {
  const withCoords = items.filter(i => typeof i.lat === 'number' && typeof i.lng === 'number') as Array<ItineraryItem & {lat: number; lng: number}>;
  const center = useMemo(() => {
    if (withCoords.length === 0) return { latitude: 38.7223, longitude: -9.1393, zoom: 10 };
    const avgLat = withCoords.reduce((s, i) => s + i.lat, 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, i) => s + i.lng, 0) / withCoords.length;
    return { latitude: avgLat, longitude: avgLng, zoom: 12 };
  }, [withCoords]);

  const [view, setView] = useState<ViewState>({ ...center, bearing: 0, pitch: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } });

  return (
    <Map
      mapLib={maplibregl as any}
      initialViewState={view}
      onMove={(e) => setView({ ...e.viewState, padding: { top: 0, right: 0, bottom: 0, left: 0 } })}
      mapStyle={{ version: 8, sources: { osm: { type: 'raster', tiles: [OSM], tileSize: 256 } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] }}
      style={{ width: '100%', height: 400 }}
    >
      <NavigationControl position="top-right" />
      {withCoords.map((i) => (
        <Marker key={i.id} longitude={i.lng} latitude={i.lat} color="#ef4444" />
      ))}
    </Map>
  );
}
