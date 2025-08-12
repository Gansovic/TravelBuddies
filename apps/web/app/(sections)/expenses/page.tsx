import dynamic from 'next/dynamic';

const ExpensesClient = dynamic(() => import('./ExpensesClient'), { ssr: false });

export default function ExpensesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Expenses</h1>
      <ExpensesClient />
    </div>
  );
}
