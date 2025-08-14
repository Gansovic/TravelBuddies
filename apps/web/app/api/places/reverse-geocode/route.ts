import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic since it processes request data
export const dynamic = 'force-dynamic';

/**
 * Reverse Geocoding API Route
 * Converts coordinates to place information using Google Places API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('lat') || '');
    const longitude = parseFloat(searchParams.get('lng') || '');

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }

    return await performReverseGeocode(latitude, longitude);
  } catch (error) {
    console.error('Error in reverse geocoding (GET):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    return await performReverseGeocode(latitude, longitude);
  } catch (error) {
    console.error('Error in reverse geocoding (POST):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Shared function to perform reverse geocoding using free OpenStreetMap Nominatim
 */
async function performReverseGeocode(latitude: number, longitude: number): Promise<NextResponse> {
  try {
    // Use OpenStreetMap Nominatim for free reverse geocoding
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    nominatimUrl.searchParams.set('lat', latitude.toString());
    nominatimUrl.searchParams.set('lon', longitude.toString());
    nominatimUrl.searchParams.set('format', 'jsonv2');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('namedetails', '1');
    nominatimUrl.searchParams.set('accept-language', 'en');

    const response = await fetch(nominatimUrl.toString(), {
      cache: 'no-store',
      headers: {
        'User-Agent': 'TravelBuddies/0.1 (memory location)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      console.error('Nominatim reverse geocoding error:', response.status);
      return NextResponse.json(
        { error: 'Failed to reverse geocode location' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data || !data.display_name) {
      return NextResponse.json(
        { error: 'No location found for coordinates' },
        { status: 404 }
      );
    }

    // Extract place name using same logic as the search API
    const namedetails = data.namedetails || {};
    const englishName = namedetails['name:en'] || 
                       namedetails['name:en-US'] || 
                       namedetails['int_name'] ||
                       namedetails['name'] ||
                       data.name ||
                       data.display_name.split(',')[0] || 
                       'Unknown Location';

    const placeInfo = {
      placeId: `osm:${data.osm_type}:${data.osm_id}`,
      name: englishName,
      address: data.display_name,
      lat: latitude,
      lng: longitude
    };

    console.log(`Reverse geocoded (${latitude}, ${longitude}):`, placeInfo.name);

    return NextResponse.json({
      place: placeInfo
    });
  } catch (error) {
    console.error('Error performing reverse geocode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

