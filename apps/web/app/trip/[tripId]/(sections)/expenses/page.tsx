import dynamic from 'next/dynamic';
import { LoadingOverlay } from '@travelbuddies/ui';

const ExpensesClient = dynamic(() => import('app/(sections)/expenses/ExpensesClient'), { ssr: false, loading: () => <LoadingOverlay message="Loading expenses..." /> });

export default function TripExpensesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Expenses</h1>
      <ExpensesClient />
    </div>
  );
}
