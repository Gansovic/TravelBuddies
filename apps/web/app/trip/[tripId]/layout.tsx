import { ReactNode } from 'react';
import { Sidebar } from '../../../components/Sidebar';

export default function TripLayout({ children, params }: { children: ReactNode; params: { tripId: string } }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar basePath={`/trip/${params.tripId}`} />
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  );
}
