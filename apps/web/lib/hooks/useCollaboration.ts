'use client';

import { useEffect, useState, useCallback } from 'react';
import { CollaborationService } from '@travelbuddies/utils';
import type { Moment, UserPresence } from '@travelbuddies/utils';

/**
 * useCollaboration - React hook for real-time collaboration features
 * 
 * Provides real-time updates for:
 * - Active users and their presence
 * - Live moment updates
 * - Capture events and status
 * - Activity feed
 * 
 * @example
 * ```tsx
 * const { activeUsers, isConnected } = useCollaboration(tripId, currentUserId);
 * ```
 */
export function useCollaboration(tripId: string | null, userId: string | null) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborationService] = useState(() => CollaborationService.getInstance());

  // Join trip when component mounts
  useEffect(() => {
    if (!tripId || !userId) return;

    let mounted = true;

    const joinTrip = async () => {
      try {
        collaborationService.setCurrentUser(userId);
        await collaborationService.joinTrip(tripId);
        
        if (mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to join trip collaboration:', error);
      }
    };

    joinTrip();

    return () => {
      mounted = false;
      if (tripId) {
        collaborationService.leaveTrip(tripId);
      }
      setIsConnected(false);
    };
  }, [tripId, userId, collaborationService]);

  // Listen for presence updates
  useEffect(() => {
    if (!tripId) return;

    const handlePresenceUpdate = (event: CustomEvent) => {
      if (event.detail.tripId === tripId) {
        setActiveUsers(event.detail.activeUsers);
      }
    };

    const handleUserJoined = (event: CustomEvent) => {
      if (event.detail.tripId === tripId) {
        // Refresh active users
        const users = collaborationService.getActiveUsers(tripId);
        setActiveUsers(users);
      }
    };

    const handleUserLeft = (event: CustomEvent) => {
      if (event.detail.tripId === tripId) {
        // Refresh active users
        const users = collaborationService.getActiveUsers(tripId);
        setActiveUsers(users);
      }
    };

    window.addEventListener('tripPresenceUpdate', handlePresenceUpdate as EventListener);
    window.addEventListener('userJoinedTrip', handleUserJoined as EventListener);
    window.addEventListener('userLeftTrip', handleUserLeft as EventListener);

    return () => {
      window.removeEventListener('tripPresenceUpdate', handlePresenceUpdate as EventListener);
      window.removeEventListener('userJoinedTrip', handleUserJoined as EventListener);
      window.removeEventListener('userLeftTrip', handleUserLeft as EventListener);
    };
  }, [tripId, collaborationService]);

  // Broadcast capture events
  const broadcastCaptureStart = useCallback(async (momentType: string) => {
    if (!tripId || !userId) return;

    await collaborationService.broadcastCaptureEvent(tripId, {
      type: 'capture_started',
      trip_id: tripId,
      user_id: userId,
      timestamp: new Date()
    });
  }, [tripId, userId, collaborationService]);

  const broadcastCaptureComplete = useCallback(async (momentId: string) => {
    if (!tripId || !userId) return;

    await collaborationService.broadcastCaptureEvent(tripId, {
      type: 'capture_completed',
      trip_id: tripId,
      user_id: userId,
      moment_id: momentId,
      timestamp: new Date()
    });
  }, [tripId, userId, collaborationService]);

  // Update capture status
  const updateCaptureStatus = useCallback(async (isCapturing: boolean, captureType?: string) => {
    if (!tripId) return;

    await collaborationService.updateCaptureStatus(tripId, isCapturing, captureType);
  }, [tripId, collaborationService]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!tripId) return;

    await collaborationService.sendTypingIndicator(tripId, isTyping);
  }, [tripId, collaborationService]);

  return {
    activeUsers,
    isConnected,
    broadcastCaptureStart,
    broadcastCaptureComplete,
    updateCaptureStatus,
    sendTypingIndicator,
    collaborationService
  };
}

/**
 * useMomentUpdates - Hook for subscribing to real-time moment updates
 */
export function useMomentUpdates(
  tripId: string | null,
  onMomentCreated?: (moment: Moment) => void,
  onMomentUpdated?: (moment: Moment) => void,
  onMomentDeleted?: (momentId: string) => void
) {
  const [collaborationService] = useState(() => CollaborationService.getInstance());

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = collaborationService.subscribeToMoments(
      tripId,
      onMomentCreated || (() => {}),
      onMomentUpdated || (() => {}),
      onMomentDeleted || (() => {})
    );

    return unsubscribe;
  }, [tripId, onMomentCreated, onMomentUpdated, onMomentDeleted, collaborationService]);
}

/**
 * useRealtimeReactions - Hook for real-time reaction updates
 */
export function useRealtimeReactions(
  tripId: string | null,
  onReactionAdded?: (reaction: any) => void,
  onReactionRemoved?: (reactionId: string) => void
) {
  const [collaborationService] = useState(() => CollaborationService.getInstance());

  useEffect(() => {
    if (!tripId) return;

    const unsubscribe = collaborationService.subscribeToReactions(
      tripId,
      onReactionAdded || (() => {}),
      onReactionRemoved || (() => {})
    );

    return unsubscribe;
  }, [tripId, onReactionAdded, onReactionRemoved, collaborationService]);
}