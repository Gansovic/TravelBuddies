"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTripPage() {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Trip</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!name.trim()) { 
            setError('Name required'); 
            return; 
          }
          
          setCreating(true);
          
          try {
            // Call the local API route to create the trip
            const response = await fetch('/api/trip/create', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({ name }),
            });

            if (!response.ok) {
              const errorData = await response.text();
              console.error('API Error:', response.status, errorData);
              throw new Error(`Failed to create trip: ${response.status}`);
            }

            const data = await response.json();
            console.log('Trip created:', data);

            // Navigate back to homepage with a refresh parameter
            router.push('/?refresh=true');
          } catch (err) {
            console.error('Error creating trip:', err);
            setError(`Failed to create trip: ${err instanceof Error ? err.message : 'Unknown error'}`);
          } finally {
            setCreating(false);
          }
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="block text-sm mb-1">Trip name</span>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="border rounded px-2 py-1 w-full" 
            placeholder="e.g., Lisbon Offsite" 
            required 
          />
        </label>
        
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={creating}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Trip'}
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/')}
            className="border px-4 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    </div>
  );
}
