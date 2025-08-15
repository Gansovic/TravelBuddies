'use client';

import { useState, useEffect } from 'react';
import { Poll, PollOption, PollService } from '@travelbuddies/utils';

interface PollsClientProps {
  tripId: string;
}

export default function PollsClient({ tripId }: PollsClientProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [votingLoading, setVotingLoading] = useState<string | null>(null);

  const pollService = PollService.getInstance();

  const loadPolls = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trip/${tripId}/polls?${new URLSearchParams({
        ...(filter !== 'all' && { status: filter }),
        sort_by: 'created_at',
        sort_order: 'desc'
      })}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch polls');
      }

      setPolls(data.polls || []);
    } catch (err) {
      console.error('Error loading polls:', err);
      setError('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      setVotingLoading(pollId);

      const response = await fetch(`/api/trip/${tripId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the poll in state with new data
        setPolls(prev => prev.map(poll => 
          poll.id === pollId ? data.poll : poll
        ));
      } else {
        alert(`Failed to vote: ${data.error}`);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to cast vote');
    } finally {
      setVotingLoading(null);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/trip/${tripId}/polls/${pollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Poll closed! Winning option: "${data.results.winning_option.title}"`);
        loadPolls(); // Refresh polls
      } else {
        alert(`Failed to close poll: ${data.error}`);
      }
    } catch (error) {
      console.error('Error closing poll:', error);
      alert('Failed to close poll');
    }
  };

  useEffect(() => {
    if (tripId) {
      loadPolls();
    }
  }, [tripId, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
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
            onClick={loadPolls}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Group Polls</h1>
          <p className="text-gray-600 mt-1">Vote on trip decisions together</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter:</span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Polls</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🗳️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-600 mb-6">
            Create polls from the itinerary page to make group decisions!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              onClosePoll={handleClosePoll}
              votingLoading={votingLoading === poll.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({ 
  poll, 
  onVote, 
  onClosePoll, 
  votingLoading 
}: { 
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  onClosePoll: (pollId: string) => void;
  votingLoading: boolean;
}) {
  const isActive = poll.status === 'active' && !poll.is_expired;
  const totalVotes = poll.total_votes || 0;

  const formatTimeRemaining = (closesAt?: Date) => {
    if (!closesAt) return null;
    const now = new Date();
    const diff = closesAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getPollTypeIcon = (type: string) => {
    switch (type) {
      case 'itinerary_item': return '📅';
      case 'place_choice': return '📍';
      case 'general': return '🗳️';
      default: return '❓';
    }
  };

  const getWinningOption = (): PollOption | null => {
    if (!poll.options || poll.options.length === 0) return null;
    return poll.options.reduce((winner, option) => 
      option.vote_count > (winner?.vote_count || 0) ? option : winner
    );
  };

  const winningOption = getWinningOption();

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${
      isActive ? 'border-l-blue-500' : 'border-l-gray-300'
    }`}>
      <div className="p-6">
        {/* Poll Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{getPollTypeIcon(poll.type)}</span>
              <h3 className="text-lg font-semibold">{poll.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Closed'}
              </span>
            </div>
            
            {poll.description && (
              <p className="text-gray-600 mb-2">{poll.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>📊 {totalVotes} votes</span>
              {poll.closes_at && (
                <span>⏰ {formatTimeRemaining(poll.closes_at)}</span>
              )}
              <span>📅 {poll.created_at.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Poll Actions */}
          {isActive && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onClosePoll(poll.id)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close Poll
              </button>
            </div>
          )}
        </div>

        {/* Poll Options */}
        <div className="space-y-3">
          {poll.options?.map((option) => {
            const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
            const isWinning = winningOption?.id === option.id && totalVotes > 0;

            return (
              <div
                key={option.id}
                className={`relative border rounded-lg p-3 transition-all ${
                  isActive && !votingLoading 
                    ? 'hover:border-blue-300 cursor-pointer' 
                    : 'cursor-default'
                } ${isWinning ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => {
                  if (isActive && !votingLoading) {
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
                      <span className="font-medium">{option.title}</span>
                      {isWinning && <span className="text-green-600">👑</span>}
                    </div>
                    {option.description && (
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{option.vote_count} votes</span>
                    {totalVotes > 0 && (
                      <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                    )}
                  </div>
                </div>

                {/* Loading indicator */}
                {votingLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Poll Results Summary */}
        {!isActive && winningOption && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600">🏆</span>
              <span className="font-medium text-green-900">
                Winner: "{winningOption.title}" with {winningOption.vote_count} votes
              </span>
            </div>
          </div>
        )}

        {/* Itinerary Integration */}
        {poll.type === 'itinerary_item' && poll.related_data && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-900">
              <strong>Related to:</strong> {poll.related_data.title} (Day {poll.related_data.day})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}