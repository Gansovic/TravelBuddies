export type ItineraryType = 'lodging' | 'flight' | 'food' | 'activity' | 'note' | 'transport';

export type ItineraryItem = {
  id: string;
  tripId?: string;
  day: number; // day index relative to start
  type: ItineraryType;
  title?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  startTs?: string; // ISO
  endTs?: string;   // ISO
  notes?: string;
};

export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = list.slice();
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed as T);
  return result;
}
