import { NextRequest } from 'next/server';

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic';

// OpenStreetMap Nominatim search with FORCED ENGLISH RESULTS
// We force English language using accept-language parameter to avoid Arabic/Chinese characters
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
  url.searchParams.set('namedetails', '1'); // Get all name variants including English
  url.searchParams.set('accept-language', 'en'); // Force English results

  const resp = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      // Respect Nominatim usage policy: identify the application
      'User-Agent': 'TravelBuddies/0.1 (itinerary search)',
      // Force English language in headers as well
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'Upstream error' }), { status: 502 });
  }
  const data: any[] = await resp.json();
  console.log(`Raw Nominatim response for "${q}":`, JSON.stringify(data, null, 2));

  const results = (Array.isArray(data) ? data : []).map((r: any) => {
    const displayName: string = r.display_name || '';
    
    // Try to get English name in order of preference:
    // 1. namedetails['name:en'] (explicit English name)
    // 2. namedetails['name:en-US'] (US English name)
    // 3. namedetails['int_name'] (international name)
    // 4. namedetails['name'] (default name, should be English due to accept-language)
    // 5. r.name (fallback to main name field)
    // 6. First part of display_name
    const namedetails = r.namedetails || {};
    const englishName = namedetails['name:en'] || 
                       namedetails['name:en-US'] || 
                       namedetails['int_name'] ||
                       namedetails['name'] ||
                       r.name ||
                       displayName.split(',')[0] || 
                       'Unknown';
    
    const latNum = typeof r.lat === 'string' ? Number(r.lat) : r.lat;
    const lonNum = typeof r.lon === 'string' ? Number(r.lon) : r.lon;
    
    console.log(`Place result for "${r.name}":`, {
      originalName: r.name,
      englishName,
      namedetails: namedetails,
      displayName
    });
    
    return {
      placeId: `osm:${r.osm_type}:${r.osm_id}`,
      name: englishName,
      address: displayName,
      lat: Number.isFinite(latNum) ? latNum : undefined,
      lng: Number.isFinite(lonNum) ? lonNum : undefined,
      types: [r.class, r.type].filter(Boolean),
    };
  });

  return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json' } });
}
