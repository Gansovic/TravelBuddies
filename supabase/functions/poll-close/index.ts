import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const poll_id = body?.poll_id as string | undefined;
  if (!poll_id) return new Response("poll_id required", { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Supabase env not configured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  // Authorization: require logged in user; RLS should ensure they are a trip member
  const { data: userResp, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userResp?.user) return new Response("Unauthorized", { status: 401 });

  const { error } = await supabase.from("polls").update({ state: "closed" }).eq("id", poll_id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
console.log("test validation");
