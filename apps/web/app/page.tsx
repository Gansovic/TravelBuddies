"use client";
import { useState } from 'react';
import { Button } from '@travelbuddies/ui';

export default function Page() {
  const [trips, setTrips] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState('');

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Trips</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setTrips((t) => [...t, { id: Math.random().toString(36).slice(2), name }]);
          setName('');
        }}
        className="flex gap-2 mb-6"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New trip name"
          className="border px-2 py-1 rounded"
        />
        <Button type="submit">Create Trip</Button>
      </form>
      <ul className="space-y-2">
        {trips.map((t) => (
          <li key={t.id} className="border rounded p-2">{t.name}</li>
        ))}
        {trips.length === 0 && <li className="text-gray-500">No trips yet.</li>}
      </ul>
    </div>
  );
}
