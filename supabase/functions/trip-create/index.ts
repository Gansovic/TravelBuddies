import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await req.json().catch(() => ({}));
  const { name, start_date, end_date } = body ?? {};
  if (!name) return new Response('name required', { status: 400 });
  // TODO: insert into trips and trip_members(owner)
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
});
