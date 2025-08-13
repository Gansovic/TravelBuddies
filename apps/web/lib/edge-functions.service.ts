import { supabase } from '@/lib/supabaseClient';

/**
 * EdgeFunctionsService - Centralized service for Edge Function calls
 * Following singleton pattern as per engineering principles
 */
export class EdgeFunctionsService {
  private static instance: EdgeFunctionsService;
  private supabaseClient = supabase;

  private constructor() {}

  static getInstance(): EdgeFunctionsService {
    if (!EdgeFunctionsService.instance) {
      EdgeFunctionsService.instance = new EdgeFunctionsService();
    }
    return EdgeFunctionsService.instance;
  }

  /**
   * Invoke trip-create Edge Function
   */
  async createTrip(tripData: {
    name: string;
    start_date?: string;
    end_date?: string;
    destination?: {
      placeId?: string;
      name?: string;
      address?: string;
      lat?: number;
      lng?: number;
    };
  }) {
    const { data, error } = await this.supabaseClient.functions.invoke('trip-create', {
      body: tripData
    });

    if (error) {
      throw new Error(`Trip creation failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Invoke poll-close Edge Function
   */
  async closePoll(pollId: string) {
    const { data, error } = await this.supabaseClient.functions.invoke('poll-close', {
      body: { poll_id: pollId }
    });

    if (error) {
      throw new Error(`Poll close failed: ${error.message}`);
    }

    return data;
  }
}