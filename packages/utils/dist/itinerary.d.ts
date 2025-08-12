export type ItineraryType = 'lodging' | 'flight' | 'food' | 'activity' | 'note' | 'transport';
export type ItineraryItem = {
    id: string;
    tripId?: string;
    day: number;
    type: ItineraryType;
    title?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
    startTs?: string;
    endTs?: string;
    notes?: string;
};
export declare function reorder<T>(list: T[], startIndex: number, endIndex: number): T[];
