"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@travelbuddies/ui';

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  types?: string[];
};

export function PlaceSearch({ type, onSelect }: { type: string; onSelect: (p: PlaceResult) => void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!q) { setResults([]); return; }
      setLoading(true);
      try {
        const url = new URL('/api/places/search', window.location.origin);
        url.searchParams.set('q', q);
        url.searchParams.set('type', type);
        const res = await fetch(url.toString(), { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [q, type]);

  return (
    <div className="w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search places or addresses"
        className="border px-2 py-1 rounded w-full"
      />
      {loading && <div className="text-sm text-gray-500 mt-1">Searching…</div>}
      {results.length > 0 && (
        <ul className="mt-2 border rounded divide-y max-h-60 overflow-auto bg-white">
          {results.map((r) => (
            <li key={r.placeId} className="p-2 hover:bg-gray-50 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">{r.address}</div>
              </div>
              <Button onClick={() => onSelect(r)}>Select</Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
