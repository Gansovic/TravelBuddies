"use client";
import { useState, useEffect } from 'react';
import { useUser } from '../lib/userContext';
import { useTime, timeUtils } from '../lib/timeContext';

// Test users from our seed data
const TEST_USERS = [
  { id: 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', name: 'Alice Smith', role: 'Trip Creator' },
  { id: 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', name: 'Bob Johnson', role: 'Active Member' },
  { id: 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', name: 'Carol Davis', role: 'Trip Member' },
  { id: 'd3f45e63-a83b-43fa-ac95-60721c0ce39d', name: 'David Wilson', role: 'Weekend Trip Owner' },
  { id: 'e4f45e63-a83b-43fa-ac95-60721c0ce39d', name: 'Emma Brown', role: 'New User' },
];


interface DevTestingPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DevTestingPanel({ isVisible, onToggle }: DevTestingPanelProps) {
  const { user, setUser } = useUser();
  const { currentTime, setSimulatedTime, isSimulating, resetTime } = useTime();
  const [selectedTimePreset, setSelectedTimePreset] = useState(0);
  const [customDate, setCustomDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const timePresets = timeUtils.getTimePresets();

  // Load saved preferences
  useEffect(() => {
    const savedUser = localStorage.getItem('dev-test-user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
    }

    const savedTime = localStorage.getItem('dev-test-time');
    if (savedTime) {
      setSelectedTimePreset(parseInt(savedTime));
    }
  }, [setUser]);

  const handleUserSwitch = (testUser: typeof TEST_USERS[0]) => {
    setUser(testUser);
    localStorage.setItem('dev-test-user', JSON.stringify(testUser));
  };

  const handleTimeChange = (presetIndex: number) => {
    setSelectedTimePreset(presetIndex);
    localStorage.setItem('dev-test-time', presetIndex.toString());
    
    const preset = timePresets[presetIndex];
    if (preset.date) {
      setSimulatedTime(preset.date);
      setCustomDate(preset.date.toISOString().split('T')[0]);
    } else {
      resetTime();
      setCustomDate('');
    }
  };

  const resetDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dev/reset-database', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Database reset successfully!');
        window.location.reload();
      } else {
        alert('Failed to reset database: ' + result.error);
      }
    } catch (error) {
      alert('Error resetting database: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDatabase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dev/seed-database', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`Database seeded successfully! Created ${result.summary?.users || 0} users, ${result.summary?.trips || 0} trips, ${result.summary?.moments || 0} moments`);
      } else {
        alert('Failed to seed database: ' + result.error);
      }
    } catch (error) {
      alert('Error seeding database: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50"
        title="Open Developer Tools"
      >
        🛠️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">🛠️ Dev Testing Panel</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Current Status Display */}
      <div className="mb-4 p-2 bg-gray-50 rounded">
        <div className="text-sm font-medium">Current User:</div>
        <div className="text-lg">{user?.name || 'No user'}</div>
        <div className="text-xs text-gray-600">{user?.id}</div>
        
        <div className="text-sm font-medium mt-2">Current Time:</div>
        <div className="text-sm">{timeUtils.formatTime(currentTime)}</div>
        {isSimulating && (
          <div className="text-xs text-orange-600">⏰ Time Simulation Active</div>
        )}
      </div>

      {/* User Switcher */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Switch User:</label>
        <div className="space-y-1">
          {TEST_USERS.map((testUser) => (
            <button
              key={testUser.id}
              onClick={() => handleUserSwitch(testUser)}
              className={`w-full text-left p-2 rounded text-sm ${
                user?.id === testUser.id
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="font-medium">{testUser.name}</div>
              <div className="text-xs text-gray-600">{testUser.role}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Machine */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Time Machine:</label>
        <select
          value={selectedTimePreset}
          onChange={(e) => handleTimeChange(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        >
          {timePresets.map((preset, index) => (
            <option key={index} value={index}>
              {preset.label}
            </option>
          ))}
        </select>
        {customDate && (
          <div className="mt-2 text-xs text-gray-600">
            Simulating: {new Date(customDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Database Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Database:</label>
        <div className="space-y-2">
          <button
            onClick={seedDatabase}
            disabled={isLoading}
            className="w-full bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : '🌱 Seed Test Data'}
          </button>
          <button
            onClick={resetDatabase}
            disabled={isLoading}
            className="w-full bg-red-600 text-white p-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : '🔄 Reset Database'}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Quick Links:</label>
        <div className="space-y-1">
          <a
            href="/timeline"
            className="block w-full bg-gray-100 text-gray-700 p-2 rounded text-sm hover:bg-gray-200 text-center"
          >
            📅 Timeline View
          </a>
          <a
            href="/trip/f0f45e63-a83b-43fa-ac95-60721c0ce39d"
            className="block w-full bg-gray-100 text-gray-700 p-2 rounded text-sm hover:bg-gray-200 text-center"
          >
            🇪🇺 European Trip
          </a>
          <a
            href="/trip/f1f45e63-a83b-43fa-ac95-60721c0ce39d"
            className="block w-full bg-gray-100 text-gray-700 p-2 rounded text-sm hover:bg-gray-200 text-center"
          >
            🇯🇵 Tokyo Trip
          </a>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Development Mode Only
      </div>
    </div>
  );
}

export function DevTestingPanelProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <DevTestingPanel
        isVisible={isVisible}
        onToggle={() => setIsVisible(!isVisible)}
      />
    </>
  );
}