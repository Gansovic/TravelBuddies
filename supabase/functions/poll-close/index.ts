import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const body = await req.json().catch(() => ({}));
  const { poll_id } = body ?? {};
  if (!poll_id) return new Response('poll_id required', { status: 400 });
  // TODO: set polls.state = 'closed'
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
});
