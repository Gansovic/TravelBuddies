import { NextRequest } from 'next/server';

// Replace Google Places with OpenStreetMap Nominatim search
// We lightly bias queries by appending type keywords to the user query.
const TYPE_KEYWORDS: Record<string, string | undefined> = {
  lodging: 'hotel',
  flight: 'airport',
  food: 'restaurant',
  activity: 'tourist attraction',
  note: undefined,
  transport: 'station',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('q')?.trim() ?? '';
  const kind = searchParams.get('type') ?? '';
  const keyword = TYPE_KEYWORDS[kind] ?? undefined;

  if (!raw) {
    return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  }

  const q = keyword ? `${raw} ${keyword}` : raw;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '8');
  url.searchParams.set('extratags', '1');

  const resp = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      // Respect Nominatim usage policy: identify the application
      'User-Agent': 'TravelBuddies/0.1 (itinerary search)'
    }
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error' }), { status: 502 });
  }
  const data: any[] = await resp.json();
  const results = (Array.isArray(data) ? data : []).map((r: any) => {
    const displayName: string = r.display_name || '';
    const primaryName = r.namedetails?.name || displayName.split(',')[0] || 'Unknown';
    const latNum = typeof r.lat === 'string' ? Number(r.lat) : r.lat;
    const lonNum = typeof r.lon === 'string' ? Number(r.lon) : r.lon;
    return {
      placeId: `osm:${r.osm_type}:${r.osm_id}`,
      name: primaryName,
      address: displayName,
      lat: Number.isFinite(latNum) ? latNum : undefined,
      lng: Number.isFinite(lonNum) ? lonNum : undefined,
      types: [r.class, r.type].filter(Boolean),
    };
  });

  return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
}
