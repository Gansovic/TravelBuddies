// Deno (Supabase Edge Function) - Expenses Settlements
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// minimal types mirroring packages/utils where possible

type ExpenseRow = {
  id: string;
  trip_id: string;
  amount_minor: number;
  currency: string;
  paid_by_user_id: string;
  ts: string;
};

// Dummy in-function algorithm. Replace with DB queries when wired.

type Expense = {
  payerUserId: string;
  amountMinor: number;
  currency: string;
  ts: string;
  splits: Array<{ userId: string; shareRatio: number }>;
};

type Balance = { userId: string; amountMinor: number };

type Transfer = { from: string; to: string; amountMinor: number };

function minimalTransfers(balances: Balance[]): Transfer[] {
  const debtors: Balance[] = [];
  const creditors: Balance[] = [];
  for (const b of balances) {
    if (b.amountMinor < -1) debtors.push({ ...b, amountMinor: -b.amountMinor });
    else if (b.amountMinor > 1) creditors.push({ ...b });
  }
  debtors.sort((a, b) => b.amountMinor - a.amountMinor);
  creditors.sort((a, b) => b.amountMinor - a.amountMinor);
  const transfers: Transfer[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amt = Math.min(d.amountMinor, c.amountMinor);
    if (amt > 0) transfers.push({ from: d.userId, to: c.userId, amountMinor: amt });
    d.amountMinor -= amt;
    c.amountMinor -= amt;
    if (d.amountMinor <= 1) i++;
    if (c.amountMinor <= 1) j++;
  }
  return transfers;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json().catch(() => ({}));
  const tripId = body.trip_id as string;
  const settlementCurrency = (body.currency as string) ?? "USD";
  if (!tripId) return new Response("trip_id required", { status: 400 });

  // TODO: Replace with actual Supabase client fetches
  const example: Expense[] = body.expenses ?? [
    {
      payerUserId: "u1",
      amountMinor: 10000,
      currency: settlementCurrency,
      ts: new Date().toISOString(),
      splits: [
        { userId: "u1", shareRatio: 0.5 },
        { userId: "u2", shareRatio: 0.5 },
      ],
    },
  ];

  const balances = new Map<string, number>();
  const get = (u: string) => balances.get(u) ?? 0;
  const set = (u: string, v: number) => balances.set(u, v);
  for (const exp of example) {
    set(exp.payerUserId, get(exp.payerUserId) + exp.amountMinor);
    for (const s of exp.splits) {
      set(s.userId, get(s.userId) - Math.round(exp.amountMinor * s.shareRatio));
    }
  }
  const resultBalances: Balance[] = Array.from(balances.entries()).map(
    ([userId, amountMinor]) => ({ userId, amountMinor })
  );
  const transfers = minimalTransfers(resultBalances);

  return new Response(
    JSON.stringify({ balances: resultBalances, transfers }, null, 2),
    { headers: { "content-type": "application/json" } }
  );
});
