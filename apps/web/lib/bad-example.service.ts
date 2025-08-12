// This file intentionally violates EVERY TravelBuddies principle to test hooks

import { createClient } from '@supabase/supabase-js';

// VIOLATION: No singleton pattern (missing private constructor, getInstance)
export class BadExampleService {
  
  // VIOLATION: Public constructor instead of singleton
  constructor() {
    console.log('User john.doe@example.com just logged in'); // VIOLATION: Logging PII
  }

  // VIOLATION: Direct Supabase access instead of proper service layer
  async getTripsDirectly(userId: string) {
    const supabase = createClient('url', 'key');
    const { data } = await supabase.from('trips').select('*').eq('user_id', userId);
    
    // VIOLATION: No error handling in async function
    return data;
  }

  // VIOLATION: Direct Edge Function calls instead of EdgeFunctionsService
  async processDirectly(tripData: any) {
    const supabase = createClient('url', 'key');
    return await supabase.functions.invoke('process-trip', { body: tripData });
  }

  // VIOLATION: Multiple responsibilities (API call + state management + logging + validation)
  async handleEverythingAtOnce(data: any) {
    // VIOLATION: No input validation
    const distance = Number(data.userInput);
    
    // VIOLATION: Hardcoded timeout instead of AppConstants
    const timeout = 30000;
    
    // VIOLATION: Hardcoded configuration path instead of ConfigPaths
    const config = await fetch('/api/config/points_rules_active');
    
    // VIOLATION: Manual polling instead of TanStack Query
    setInterval(() => {
      this.fetchLatestData();
    }, 5000);
    
    // VIOLATION: Value operation without audit logging
    const points = 500;
    await this.updateUserBalance(points);
    
    return { success: true };
  }

  // VIOLATION: Deep nesting (more than 6 levels)
  complexMethod(data: any) {
    if (data.level1) {
      if (data.level2) {
        if (data.level3) {
          if (data.level4) {
            if (data.level5) {
              if (data.level6) {
                if (data.level7) { // VIOLATION: Too deep
                  console.log('Too deep!');
                }
              }
            }
          }
        }
      }
    }
  }

  // VIOLATION: No JSDoc documentation for public method
  async updateUserBalance(points: number) {
    // VIOLATION: Direct database update with value operation (no audit log)
    const supabase = createClient('url', 'key');
    return await supabase
      .from('users')
      .update({ balance: points })
      .eq('id', 'user-id');
  }

  // VIOLATION: Duplicate string literal (appears multiple times)
  getString() {
    return 'This is a very long duplicate string that appears multiple times';
  }

  getAnotherString() {
    return 'This is a very long duplicate string that appears multiple times';
  }
}

// VIOLATION: Parallel implementation instead of extending existing
class CustomLoadingProvider {
  showLoading() {
    // VIOLATION: Custom loading pattern instead of LoadingDialog
    return '<div class="spinner">Loading...</div>';
  }
}

// VIOLATION: Duplicate functionality instead of using NumberFormatters
class MyNumberFormatter {
  formatPoints(points: number): string {
    return points.toString();
  }
}

// VIOLATION: Not using existing patterns
const customDataProvider = {
  fetchData: () => {
    // VIOLATION: Not extending PaginatedDataProvider
    return fetch('/api/data');
  }
};