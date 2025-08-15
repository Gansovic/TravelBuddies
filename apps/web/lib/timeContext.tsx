"use client";
import { createContext, useContext, useEffect, useState } from 'react';

interface TimeContextType {
  currentTime: Date;
  setSimulatedTime: (date: Date | null) => void;
  isSimulating: boolean;
  resetTime: () => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Load saved time simulation from localStorage
    const savedTime = localStorage.getItem('dev-simulated-time');
    if (savedTime) {
      try {
        const timeData = JSON.parse(savedTime);
        if (timeData.enabled && timeData.date) {
          setSimulatedTime(new Date(timeData.date));
        }
      } catch (error) {
        console.error('Error parsing saved time:', error);
      }
    }

    // Update current time every second if not simulating
    const interval = setInterval(() => {
      if (!simulatedTime) {
        setCurrentTime(new Date());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [simulatedTime]);

  const setSimulatedTimeWithPersistence = (date: Date | null) => {
    setSimulatedTime(date);
    if (date) {
      setCurrentTime(date);
      localStorage.setItem('dev-simulated-time', JSON.stringify({
        enabled: true,
        date: date.toISOString()
      }));
      console.log('Time simulation set to:', date);
    } else {
      setCurrentTime(new Date());
      localStorage.removeItem('dev-simulated-time');
      console.log('Time simulation cleared');
    }
  };

  const resetTime = () => {
    setSimulatedTimeWithPersistence(null);
  };

  return (
    <TimeContext.Provider value={{
      currentTime: simulatedTime || currentTime,
      setSimulatedTime: setSimulatedTimeWithPersistence,
      isSimulating: !!simulatedTime,
      resetTime
    }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}

// Utility functions for time simulation
export const timeUtils = {
  // Format time for display
  formatTime: (date: Date): string => {
    return date.toLocaleString();
  },

  // Check if a date is "recent" based on current/simulated time
  isRecent: (date: Date, currentTime: Date, hoursThreshold: number = 24): boolean => {
    const diffHours = (currentTime.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= hoursThreshold;
  },

  // Get relative time string (e.g., "2 hours ago", "yesterday")
  getRelativeTime: (date: Date, currentTime: Date): string => {
    const diffMs = currentTime.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  },

  // Generate preset time options
  getTimePresets: (baseTime: Date = new Date()) => [
    { label: 'Current Time', date: null },
    { label: '1 Hour Ago', date: new Date(baseTime.getTime() - 1000 * 60 * 60) },
    { label: 'Yesterday', date: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24) },
    { label: 'Last Week', date: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 7) },
    { label: 'Last Month', date: new Date(baseTime.getTime() - 1000 * 60 * 60 * 24 * 30) },
    { label: 'Trip Time (July 2024)', date: new Date('2024-07-17T12:00:00Z') },
    { label: 'Tokyo Trip (Aug 2024)', date: new Date('2024-08-22T10:00:00Z') },
  ]
};