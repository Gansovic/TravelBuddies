import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = (body?.name as string | undefined)?.trim();
  const start_date = body?.start_date as string | undefined;
  const end_date = body?.end_date as string | undefined;
  const destination = body?.destination as
    | { placeId?: string; name?: string; address?: string; lat?: number; lng?: number }
    | undefined;
  if (!name) return new Response("name required", { status: 400 });

  const supabaseUrl = Deno.env.get("TB_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("TB_SERVICE_ROLE_KEY")
    ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response("Supabase env not configured", { status: 500 });
  }

  // Use service role to allow inserts even without auth during early dev
  const supabase = createClient(supabaseUrl, serviceKey);

  // Try to get user; if absent (no auth yet), generate a placeholder owner id
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth?.user?.id ?? crypto.randomUUID();

  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .insert({ name, owner_id: ownerId, start_date, end_date } satisfies Record<string, Json>)
    .select("id, name, start_date, end_date")
    .single();

  if (tripErr || !trip) {
    return new Response(JSON.stringify({ error: tripErr?.message ?? "insert failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const { error: memberErr } = await supabase
    .from("trip_members")
    .insert({ trip_id: trip.id, user_id: ownerId, role: "owner" });
  if (memberErr) {
    // Best effort; not fatal for returning the trip, but report error
    return new Response(
      JSON.stringify({ trip, warning: `owner membership insert failed: ${memberErr.message}` }),
      { headers: { "content-type": "application/json" } }
    );
  }

  if (destination && (destination.placeId || (destination.lat && destination.lng))) {
    await supabase.from("itinerary_items").insert({
      trip_id: trip.id,
      day: 0,
      type: "note",
      place_id: destination.placeId,
      lat: destination.lat,
      lng: destination.lng,
      notes: destination.name || destination.address || "Trip destination",
    } as Record<string, Json>).then(() => void 0).catch(() => void 0);
  }

  return new Response(JSON.stringify({ trip }), { headers: { "content-type": "application/json" } });
});
