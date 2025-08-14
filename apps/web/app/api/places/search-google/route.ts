import { NextRequest } from 'next/server';

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic';

// Google Places API alternative with forced English results
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const type = searchParams.get('type') ?? '';

  if (!query) {
    return new Response(JSON.stringify({ results: [] }), { 
      headers: { 'content-type': 'application/json' } 
    });
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!googleApiKey) {
    return new Response(JSON.stringify({ 
      error: 'Google Places API key not configured' 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' } 
    });
  }

  try {
    // Use Google Places API Text Search with English language forced
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', googleApiKey);
    url.searchParams.set('language', 'en'); // Force English results
    url.searchParams.set('region', 'us'); // Use US region for English bias
    
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || data.status !== 'OK') {
      console.error('Google Places API error:', data);
      return new Response(JSON.stringify({ 
        error: data.error_message || 'Places API error' 
      }), { 
        status: 500,
        headers: { 'content-type': 'application/json' } 
      });
    }

    const results = (data.results || []).slice(0, 8).map((place: any) => ({
      placeId: place.place_id,
      name: place.name, // Should be in English due to language=en parameter
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      types: place.types || [],
    }));

    console.log(`Google Places results for "${query}":`, results.map((r: any) => r.name));

    return new Response(JSON.stringify({ results }), { 
      headers: { 'content-type': 'application/json' } 
    });

  } catch (error) {
    console.error('Google Places API fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch places' 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' } 
    });
  }
}