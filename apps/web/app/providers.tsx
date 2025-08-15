"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { UserProvider } from '../lib/userContext';
import { TimeProvider } from '../lib/timeContext';
import { DevTestingPanelProvider } from '../components/DevTestingPanel';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TimeProvider>
        <UserProvider>
          <DevTestingPanelProvider>
            {children}
          </DevTestingPanelProvider>
        </UserProvider>
      </TimeProvider>
    </QueryClientProvider>
  );
}
