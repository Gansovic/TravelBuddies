"use client";
import { useMemo, useState } from 'react';
import { Button } from '@travelbuddies/ui';
import { computeBalances, minimalTransfers, type Expense as AlgoExpense } from '@travelbuddies/utils';

export type UIExpense = {
  id: string;
  payerUserId: string;
  amountMajor: number;
  currency: string;
  ts: string;
  splits: Array<{ userId: string; shareRatio: number }>;
};

const demoUsers = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'carol', name: 'Carol' },
];

export default function ExpensesClient() {
  const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [settleCcy, setSettleCcy] = useState('USD');

  const algoExpenses: AlgoExpense[] = useMemo(
    () =>
      expenses.map((e) => ({
        payerUserId: e.payerUserId,
        amountMinor: Math.round(e.amountMajor * 100),
        currency: e.currency,
        ts: e.ts,
        splits: e.splits,
      })),
    [expenses]
  );

  const balances = useMemo(() => computeBalances(algoExpenses, settleCcy, []), [algoExpenses, settleCcy]);
  const transfers = useMemo(() => minimalTransfers(balances), [balances]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Add Expense</h2>
        <ExpenseForm
          onAdd={(exp) => setExpenses((prev) => [...prev, exp])}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Expenses</h2>
        <ul className="space-y-2">
          {expenses.map((e) => (
            <li key={e.id} className="border rounded p-2 flex items-center justify-between">
              <span>
                <b>{demoUsers.find((u) => u.id === e.payerUserId)?.name}</b> paid {e.amountMajor.toFixed(2)} {e.currency}
              </span>
              <span className="text-gray-500 text-sm">{new Date(e.ts).toLocaleString()}</span>
            </li>
          ))}
          {expenses.length === 0 && <li className="text-gray-500">No expenses yet.</li>}
        </ul>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold">Settlement</h2>
          <select value={settleCcy} onChange={(e) => setSettleCcy(e.target.value)} className="border rounded px-2 py-1">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-1">Balances</h3>
            <ul className="space-y-1">
              {balances.map((b) => (
                <li key={b.userId} className="text-sm">
                  {demoUsers.find((u) => u.id === b.userId)?.name ?? b.userId}: {b.amountMinor}
                </li>
              ))}
              {balances.length === 0 && <li className="text-gray-500">No balances.</li>}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-1">Suggested Transfers</h3>
            <ul className="space-y-1">
              {transfers.map((t, idx) => (
                <li key={idx} className="text-sm">
                  {demoUsers.find((u) => u.id === t.from)?.name ?? t.from} → {demoUsers.find((u) => u.id === t.to)?.name ?? t.to}: {t.amountMinor}
                </li>
              ))}
              {transfers.length === 0 && <li className="text-gray-500">No transfers.</li>}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExpenseForm({ onAdd }: { onAdd: (e: UIExpense) => void }) {
  const [payerUserId, setPayerUserId] = useState('alice');
  const [amountMajor, setAmountMajor] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [equalSplit, setEqualSplit] = useState(true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const splits = equalSplit
          ? demoUsers.map((u) => ({ userId: u.id, shareRatio: 1 / demoUsers.length }))
          : demoUsers.map((u) => ({ userId: u.id, shareRatio: u.id === payerUserId ? 1 : 0 }));
        onAdd({
          id: Math.random().toString(36).slice(2),
          payerUserId,
          amountMajor,
          currency,
          ts: new Date(date).toISOString(),
          splits,
        });
        setAmountMajor(0);
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col text-sm">
        <span className="mb-1">Payer</span>
        <select value={payerUserId} onChange={(e) => setPayerUserId(e.target.value)} className="border rounded px-2 py-1">
          {demoUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1">Amount</span>
        <input type="number" step="0.01" value={amountMajor} onChange={(e) => setAmountMajor(Number(e.target.value))} className="border rounded px-2 py-1 w-32" />
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1">Currency</span>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border rounded px-2 py-1">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </label>
      <label className="flex flex-col text-sm">
        <span className="mb-1">Date/Time</span>
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={equalSplit} onChange={(e) => setEqualSplit(e.target.checked)} /> Equal split
      </label>
      <Button type="submit" className="ml-2">Add</Button>
    </form>
  );
}
