"use client";
import { useMemo, useState } from 'react';
import { Button } from '@travelbuddies/ui';
import { ItineraryItem, ItineraryType, reorder } from '@travelbuddies/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';
import { PlaceSearch, type PlaceResult } from './PlaceSearch';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const types: ItineraryType[] = ['lodging','flight','food','activity','note','transport'];

export default function ItineraryClient() {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [day, setDay] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor));

  const filtered = useMemo(() => items.filter(i => i.day === day), [items, day]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-2">Quick Add</h2>
        <QuickAdd onAdd={(item) => setItems(prev => [...prev, item])} day={day} />
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
                  <SortableItem key={i.id} item={i} />
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

function QuickAdd({ onAdd, day }: { onAdd: (i: ItineraryItem) => void, day: number }) {
  const [type, setType] = useState<ItineraryType>('activity');
  const [title, setTitle] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({
          id: Math.random().toString(36).slice(2),
          day,
          type,
          title: title || selectedPlace?.name,
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

function SortableItem({ item }: { item: ItineraryItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="border rounded p-2">
      <div className="text-sm text-gray-500">{item.type}</div>
      <div className="font-medium">{item.title ?? item.placeId ?? 'Untitled'}</div>
    </li>
  );
}
