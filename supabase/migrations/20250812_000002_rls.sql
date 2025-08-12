-- RLS scaffolding (functions and policy stubs)
create or replace function public.is_trip_member(uid uuid, trip uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from trip_members m where m.trip_id = trip and m.user_id = uid
  );
$$;

alter table trips enable row level security;
alter table trip_members enable row level security;
alter table itinerary_items enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table reviews enable row level security;
alter table badges enable row level security;
alter table recaps enable row level security;

-- Example policy; replicate for each table
create policy "trip members can read trips"
  on trips for select
  using (true); -- trips listing may be via join; tighten in app via joins

create policy "trip members write itinerary_items"
  on itinerary_items for all
  using (public.is_trip_member(auth.uid(), trip_id))
  with check (public.is_trip_member(auth.uid(), trip_id));
