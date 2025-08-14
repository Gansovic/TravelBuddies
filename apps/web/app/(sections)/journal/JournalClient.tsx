"use client";
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@travelbuddies/ui';
import { ItineraryItem, ItineraryType } from '@travelbuddies/utils';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';
import { PlaceSearch, type PlaceResult } from '../itinerary/PlaceSearch';

const MapView = dynamic(() => import('../itinerary/MapView'), { ssr: false });

const experienceTypes: ItineraryType[] = ['activity','food','lodging','transport','note'];

interface JournalClientProps {
  tripId: string;
}

export default function JournalClient({ tripId }: JournalClientProps) {
  const [experiences, setExperiences] = useState<ItineraryItem[]>([]);
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const filteredExperiences = useMemo(() => experiences.filter(e => e.day === day), [experiences, day]);

  // Fetch journal entries for this trip
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trip/${tripId}/itinerary`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journal entries');
      }

      // Convert database items to experience format
      const convertedExperiences = data.items.map((item: any) => ({
        id: item.id,
        day: item.day,
        type: item.type,
        title: item.notes || '',
        placeId: item.place_id,
        lat: item.lat,
        lng: item.lng,
      }));

      setExperiences(convertedExperiences);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load your travel journal');
    } finally {
      setLoading(false);
    }
  };

  // Add new experience/journal entry
  const addExperience = async (newExperience: Omit<ItineraryItem, 'id'>) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/itinerary`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          type: newExperience.type,
          title: newExperience.title,
          day: newExperience.day,
          placeId: newExperience.placeId,
          lat: newExperience.lat,
          lng: newExperience.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save experience');
      }

      // Add the new experience to local state
      const convertedExperience = {
        id: data.item.id,
        day: data.item.day,
        type: data.item.type,
        title: data.item.notes || '',
        placeId: data.item.place_id,
        lat: data.item.lat,
        lng: data.item.lng,
      };

      setExperiences(prev => [...prev, convertedExperience]);
    } catch (err) {
      console.error('Error saving experience:', err);
      setError('Failed to save your experience');
    }
  };

  // Delete experience
  const deleteExperience = async (experienceId: string) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/itinerary?itemId=${experienceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete experience');
      }

      // Remove the experience from local state
      setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError('Failed to delete experience');
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchExperiences();
    }
  }, [tripId]);

  if (loading) {
    return <div className="text-center py-8">Loading your travel journal...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchExperiences}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-2">✍️ Log Your Experience</h2>
        <p className="text-gray-600 mb-4">What did you actually do today? Add places you visited and experiences you had.</p>
        <LogExperience onAdd={addExperience} day={day} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📅 Day {day}</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDay(d => Math.max(0, d-1))}>← Previous Day</Button>
              <Button onClick={() => setDay(d => d+1)}>Next Day →</Button>
            </div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({active, over}) => {
              if (!over || active.id === over.id) return;
              const ids = filteredExperiences.map(e => e.id);
              const oldIndex = ids.indexOf(String(active.id));
              const newIndex = ids.indexOf(String(over.id));
              const moved = arrayMove(filteredExperiences, oldIndex, newIndex);
              // apply move back to full list
              const idToIndex = new Map(experiences.map((exp, idx) => [exp.id, idx] as const));
              const newExperiences = experiences.slice();
              moved.forEach((exp, idx) => {
                const globalIndex = idToIndex.get(exp.id)!;
                newExperiences[globalIndex] = { ...exp };
              });
              setExperiences(newExperiences);
            }}
          >
            <SortableContext items={filteredExperiences.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {filteredExperiences.map((experience) => (
                  <ExperienceItem key={experience.id} experience={experience} onDelete={deleteExperience} />
                ))}
                {filteredExperiences.length === 0 && (
                  <li className="text-gray-500 text-center py-8">
                    No experiences logged for this day yet.
                    <br />
                    <span className="text-sm">Use the form above to record what you did!</span>
                  </li>
                )}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">🗺️ Places You Visited</h2>
          <MapView items={filteredExperiences} />
        </div>
      </section>
    </div>
  );
}

function LogExperience({ onAdd, day }: { onAdd: (e: Omit<ItineraryItem, 'id'>) => void, day: number }) {
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
      className="flex flex-wrap items-end gap-2 p-4 border rounded-lg bg-gray-50"
    >
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-medium">What did you do?</span>
        <select value={type} onChange={(e) => setType(e.target.value as ItineraryType)} className="border rounded px-2 py-1">
          {experienceTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-medium">Describe your experience</span>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g., Had amazing pasta at Luigi's" 
          className="border rounded px-2 py-1 w-64" 
        />
      </label>
      <div className="w-full md:w-auto md:flex-1 min-w-[320px]">
        <span className="block text-sm mb-1 font-medium">Where was this?</span>
        <PlaceSearch
          type={type}
          onSelect={(p) => setSelectedPlace(p)}
        />
        {selectedPlace && (
          <div className="text-xs text-gray-600 mt-1">📍 {selectedPlace.name} — {selectedPlace.address}</div>
        )}
      </div>
      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">💾 Log Experience</Button>
    </form>
  );
}

function ExperienceItem({ experience, onDelete }: { experience: ItineraryItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: experience.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <li ref={setNodeRef} style={style} className="border rounded p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div {...attributes} {...listeners} className="flex-1 cursor-move">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded uppercase font-medium">
              {experience.type}
            </span>
          </div>
          <div className="font-medium text-gray-900">{experience.title || 'Untitled Experience'}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(experience.id);
          }}
          className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200"
          title="Delete experience"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}