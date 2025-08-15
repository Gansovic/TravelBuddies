"use client";
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@travelbuddies/ui';
import { ItineraryItem, ItineraryType, reorder, Poll, PollOption } from '@travelbuddies/utils';
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
  const [polls, setPolls] = useState<Poll[]>([]);
  const [day, setDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const filtered = useMemo(() => items.filter(i => i.day === day), [items, day]);
  const dayPolls = useMemo(() => 
    polls.filter(poll => poll.related_data && poll.related_data.day === day), 
    [polls, day]
  );

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
      const errorMessage = err instanceof Error && err.message.includes('Could not find the table') 
        ? 'Database table missing (itinerary_items) - polls integration is working but table needs to be created'
        : 'Failed to load itinerary items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch polls related to this trip
  const fetchPolls = async () => {
    try {
      const response = await fetch(`/api/trip/${tripId}/polls?status=active`);
      const data = await response.json();

      if (response.ok) {
        setPolls(data.polls || []);
      } else {
        console.warn('Failed to fetch polls:', data.error);
        setPolls([]);
      }
    } catch (err) {
      console.warn('Error fetching polls:', err);
      setPolls([]);
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

  // Handle voting on polls
  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the poll in state with new vote data
        setPolls(prev => prev.map(poll => 
          poll.id === pollId ? data.poll : poll
        ));
      } else {
        console.error('Failed to vote:', data.error);
        setError(`Failed to vote: ${data.error}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to cast vote');
    }
  };

  // Close poll and resolve to itinerary
  const handleClosePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh both polls and itinerary items
        await fetchPolls();
        await fetchItems();
      } else {
        console.error('Failed to close poll:', data.error);
        setError(`Failed to close poll: ${data.error}`);
      }
    } catch (error) {
      console.error('Error closing poll:', error);
      setError('Failed to close poll');
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchItems();
      fetchPolls();
    }
  }, [tripId]);

  if (loading) {
    return <div className="text-center py-8">Loading itinerary...</div>;
  }

  if (error && !error.includes('polls integration is working')) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchItems}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && error.includes('polls integration is working') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">⚠️</span>
            <div>
              <p className="text-sm text-yellow-800 font-medium">Database Schema Issue</p>
              <p className="text-xs text-yellow-700 mt-1">
                The itinerary_items table is missing. Polls integration is working perfectly - you can create polls and vote!
                Run the missing migration to enable full itinerary functionality.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <section>
        <h2 className="text-xl font-semibold mb-2">Quick Add</h2>
        <QuickAdd onAdd={addItem} day={day} tripId={tripId} />
      </section>

      {dayPolls.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Pending Votes for Day {day}</h2>
          <div className="space-y-4">
            {dayPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={handleVote}
                onClose={handleClosePoll}
                compact={true}
              />
            ))}
          </div>
        </section>
      )}

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

function QuickAdd({ onAdd, day, tripId }: { onAdd: (i: Omit<ItineraryItem, 'id'>) => void, day: number, tripId: string }) {
  const [type, setType] = useState<ItineraryType>('activity');
  const [title, setTitle] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [action, setAction] = useState<'add' | 'poll'>('add');
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [pollDescription, setPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24); // hours
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      day,
      type,
      title: title || selectedPlace?.name || '',
      placeId: selectedPlace?.placeId,
      lat: selectedPlace?.lat,
      lng: selectedPlace?.lng,
    };

    if (action === 'add') {
      // Direct add to itinerary
      onAdd(itemData);
      setTitle('');
      setSelectedPlace(null);
    } else {
      // Create poll
      await createPoll(itemData);
    }
  };

  const createPoll = async (itemData: Omit<ItineraryItem, 'id'>) => {
    try {
      setIsCreatingPoll(true);

      // Prepare poll options - either custom options or Yes/No for single item
      const options = showPollOptions && pollOptions.some(opt => opt.trim()) 
        ? pollOptions.filter(opt => opt.trim()).map(opt => ({ title: opt.trim() }))
        : [
            { title: `Yes, add "${itemData.title}"`, data: { action: 'add', item: itemData } },
            { title: 'No, skip it', data: { action: 'skip' } }
          ];

      const pollData = {
        title: showPollOptions 
          ? title || `Choose ${type} for Day ${day}`
          : `Add "${itemData.title}" to Day ${day}?`,
        description: pollDescription || `Vote on whether to add this ${type} to our itinerary for Day ${day}.`,
        type: 'itinerary_item' as const,
        related_data: itemData,
        closes_at: new Date(Date.now() + pollDuration * 60 * 60 * 1000).toISOString(),
        options
      };

      const response = await fetch(`/api/trip/${tripId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Poll created successfully:', result.poll);
        alert(`Poll created! Trip members can now vote on "${itemData.title}".`);
        
        // Reset form
        setTitle('');
        setSelectedPlace(null);
        setPollDescription('');
        setPollOptions(['', '']);
        setShowPollOptions(false);
        setAction('add');
      } else {
        console.error('Failed to create poll:', result.error);
        alert(`Failed to create poll: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll');
    } finally {
      setIsCreatingPoll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Selection */}
      <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-900">Action:</span>
        <label className="flex items-center gap-2">
          <input 
            type="radio" 
            value="add" 
            checked={action === 'add'} 
            onChange={(e) => setAction(e.target.value as 'add')}
            className="text-blue-600"
          />
          <span className="text-sm">Add Directly</span>
        </label>
        <label className="flex items-center gap-2">
          <input 
            type="radio" 
            value="poll" 
            checked={action === 'poll'} 
            onChange={(e) => setAction(e.target.value as 'poll')}
            className="text-blue-600"
          />
          <span className="text-sm">Send for Group Vote</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Item Fields */}
        <div className="flex flex-wrap items-end gap-2">
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
        </div>

        {/* Poll-specific Options */}
        {action === 'poll' && (
          <div className="p-4 bg-purple-50 rounded-lg space-y-3">
            <h4 className="font-medium text-purple-900">Poll Settings</h4>
            
            <label className="flex flex-col text-sm">
              <span className="mb-1">Poll Description (optional)</span>
              <textarea 
                value={pollDescription} 
                onChange={(e) => setPollDescription(e.target.value)}
                placeholder="Add context or ask a specific question..."
                className="border rounded px-2 py-1 h-16"
              />
            </label>

            <div className="flex items-center gap-4">
              <label className="flex flex-col text-sm">
                <span className="mb-1">Duration (hours)</span>
                <select value={pollDuration} onChange={(e) => setPollDuration(Number(e.target.value))} className="border rounded px-2 py-1">
                  <option value={1}>1 hour</option>
                  <option value={6}>6 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                </select>
              </label>

              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showPollOptions} 
                  onChange={(e) => setShowPollOptions(e.target.checked)}
                />
                <span className="text-sm">Custom options</span>
              </label>
            </div>

            {showPollOptions && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Poll Options:</span>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input 
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="border rounded px-2 py-1 flex-1"
                    />
                    {index >= 2 && (
                      <button 
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isCreatingPoll}>
            {isCreatingPoll ? 'Creating...' : action === 'add' ? 'Add to Itinerary' : 'Create Poll'}
          </Button>
        </div>
      </form>
    </div>
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

// Compact PollCard component for itinerary integration
function PollCard({ 
  poll, 
  onVote, 
  onClose, 
  compact = false 
}: { 
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  onClose: (pollId: string) => void;
  compact?: boolean;
}) {
  const isActive = poll.status === 'active' && !poll.is_expired;
  const totalVotes = poll.total_votes || 0;

  const getWinningOption = (): PollOption | null => {
    if (!poll.options || poll.options.length === 0) return null;
    return poll.options.reduce((winner, option) => 
      option.vote_count > (winner?.vote_count || 0) ? option : winner
    );
  };

  const getPollTypeIcon = (type: string) => {
    switch (type) {
      case 'itinerary_item': return '📅';
      case 'place_choice': return '📍';
      case 'general': return '🗳️';
      default: return '❓';
    }
  };

  const formatTimeRemaining = (closesAt?: Date | string) => {
    if (!closesAt) return null;
    const now = new Date();
    const closesAtDate = typeof closesAt === 'string' ? new Date(closesAt) : closesAt;
    const diff = closesAtDate.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else {
      return `${minutes}m left`;
    }
  };

  const winningOption = getWinningOption();

  return (
    <div className={`bg-white rounded-lg border ${
      compact ? 'p-4' : 'p-6'
    } ${isActive ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getPollTypeIcon(poll.type)}</span>
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
              {poll.title}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isActive ? 'Active' : 'Closed'}
            </span>
          </div>
          
          {poll.description && !compact && (
            <p className="text-gray-600 text-sm mb-2">{poll.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>📊 {totalVotes} votes</span>
            {poll.closes_at && (
              <span>⏰ {formatTimeRemaining(poll.closes_at)}</span>
            )}
          </div>
        </div>

        {/* Poll Actions */}
        {isActive && (
          <button
            onClick={() => onClose(poll.id)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Close Poll
          </button>
        )}
      </div>

      {/* Poll Options */}
      <div className={`space-y-2 ${compact ? 'max-h-40 overflow-y-auto' : ''}`}>
        {poll.options?.map((option) => {
          const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
          const isWinning = winningOption?.id === option.id && totalVotes > 0;

          return (
            <div
              key={option.id}
              className={`relative border rounded-lg p-3 transition-all ${
                isActive 
                  ? 'hover:border-blue-300 cursor-pointer' 
                  : 'cursor-default'
              } ${isWinning ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              onClick={() => {
                if (isActive) {
                  onVote(poll.id, option.id);
                }
              }}
            >
              {/* Progress bar background */}
              <div 
                className={`absolute inset-0 rounded-lg transition-all ${
                  isWinning ? 'bg-green-100' : 'bg-blue-50'
                }`}
                style={{ 
                  width: `${percentage}%`,
                  opacity: totalVotes > 0 ? 0.3 : 0
                }}
              />

              {/* Option content */}
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{option.title}</span>
                    {isWinning && <span className="text-green-600">👑</span>}
                  </div>
                  {option.description && !compact && (
                    <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">{option.vote_count}</span>
                  {totalVotes > 0 && (
                    <span className="text-gray-500">({percentage.toFixed(0)}%)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Poll Results Summary for closed polls */}
      {!isActive && winningOption && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">🏆</span>
            <span className="font-medium text-green-900">
              Winner: "{winningOption.title}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
