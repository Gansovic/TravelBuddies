"use client";
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@travelbuddies/ui';
import { ItineraryItem, ItineraryType, reorder } from '@travelbuddies/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';
import { PlaceSearch, type PlaceResult } from './PlaceSearch';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const types: ItineraryType[] = ['lodging','flight','food','activity','note','transport'];

interface ItineraryClientProps {
  tripId?: string;
}

export default function ItineraryClient({ tripId = 'temp-trip-id' }: ItineraryClientProps) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const filtered = useMemo(() => items.filter(i => i.day === day), [items, day]);

  // Fetch itinerary items for this trip
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trip/${tripId}/itinerary`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch itinerary items');
      }

      // Convert database items to ItineraryItem format
      const convertedItems = data.items.map((item: any) => ({
        id: item.id,
        day: item.day,
        type: item.type,
        title: item.notes || '', // Using notes as title
        placeId: item.place_id,
        lat: item.lat,
        lng: item.lng,
      }));

      setItems(convertedItems);
    } catch (err) {
      console.error('Error fetching itinerary items:', err);
      setError('Failed to load itinerary items');
    } finally {
      setLoading(false);
    }
  };

  // Add new itinerary item
  const addItem = async (newItem: Omit<ItineraryItem, 'id'>) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: newItem.type,
          title: newItem.title,
          day: newItem.day,
          placeId: newItem.placeId,
          lat: newItem.lat,
          lng: newItem.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create itinerary item');
      }

      // Add the new item to local state
      const convertedItem = {
        id: data.item.id,
        day: data.item.day,
        type: data.item.type,
        title: data.item.notes || '',
        placeId: data.item.place_id,
        lat: data.item.lat,
        lng: data.item.lng,
      };

      setItems(prev => [...prev, convertedItem]);
    } catch (err) {
      console.error('Error creating itinerary item:', err);
      setError('Failed to add item');
    }
  };

  // Delete itinerary item
  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/itinerary?itemId=${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete itinerary item');
      }

      // Remove the item from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting itinerary item:', err);
      setError('Failed to delete item');
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchItems();
    }
  }, [tripId]);

  if (loading) {
    return <div className="text-center py-8">Loading itinerary...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchItems}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-2">Quick Add</h2>
        <QuickAdd onAdd={addItem} day={day} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Day {day}</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDay(d => Math.max(0, d-1))}>Prev Day</Button>
              <Button onClick={() => setDay(d => d+1)}>Next Day</Button>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({active, over}) => {
              if (!over || active.id === over.id) return;
              const ids = filtered.map(i => i.id);
              const oldIndex = ids.indexOf(String(active.id));
              const newIndex = ids.indexOf(String(over.id));
              const moved = arrayMove(filtered, oldIndex, newIndex);
              // apply move back to full list
              const idToIndex = new Map(items.map((it, idx) => [it.id, idx] as const));
              const newItems = items.slice();
              moved.forEach((it, idx) => {
                const globalIndex = idToIndex.get(it.id)!;
                newItems[globalIndex] = { ...it };
              });
              setItems(newItems);
            }}
          >
            <SortableContext items={filtered.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {filtered.map((i) => (
                  <SortableItem key={i.id} item={i} onDelete={deleteItem} />
                ))}
                {filtered.length === 0 && <li className="text-gray-500">No items for this day.</li>}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Map</h2>
          <MapView items={filtered} />
        </div>
      </section>
    </div>
  );
}

function QuickAdd({ onAdd, day }: { onAdd: (i: Omit<ItineraryItem, 'id'>) => void, day: number }) {
  const [type, setType] = useState<ItineraryType>('activity');
  const [title, setTitle] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({
          day,
          type,
          title: title || selectedPlace?.name || '',
          placeId: selectedPlace?.placeId,
          lat: selectedPlace?.lat,
          lng: selectedPlace?.lng,
        });
        setTitle('');
        setSelectedPlace(null);
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col text-sm">
        <span className="mb-1">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value as ItineraryType)} className="border rounded px-2 py-1">
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Brunch at LX" className="border rounded px-2 py-1 w-64" />
      </label>
      <div className="w-full md:w-auto md:flex-1 min-w-[320px]">
        <span className="block text-sm mb-1">Search place/address</span>
        <PlaceSearch
          type={type}
          onSelect={(p) => setSelectedPlace(p)}
        />
        {selectedPlace && (
          <div className="text-xs text-gray-600 mt-1">Selected: {selectedPlace.name} — {selectedPlace.address}</div>
        )}
      </div>
      <Button type="submit">Add</Button>
    </form>
  );
}

function SortableItem({ item, onDelete }: { item: ItineraryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style} className="border rounded p-2">
      <div className="flex items-center justify-between">
        <div {...attributes} {...listeners} className="flex-1 cursor-move">
          <div className="text-sm text-gray-500">{item.type}</div>
          <div className="font-medium">{item.title ?? item.placeId ?? 'Untitled'}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200"
          title="Delete item"
        >
          ✕
        </button>
      </div>
    </li>
  );
}
