-- Additional RLS policies for trip creation and polls closing

-- Allow creating trips where the owner is the authenticated user
create policy if not exists "users can create trips they own"
  on trips for insert
  with check (owner_id = auth.uid());

-- Restrict selecting trips to members by default (override earlier broad policy if needed)
-- You may drop the previous broad select policy if you want strict membership-only reads.
create policy if not exists "trip members can read trips"
  on trips for select
  using (exists(select 1 from trip_members m where m.trip_id = trips.id and m.user_id = auth.uid()));

-- Trip members table: members can see and insert their own membership rows
create policy if not exists "trip members can read trip_members"
  on trip_members for select
  using (public.is_trip_member(auth.uid(), trip_id));

create policy if not exists "users can add themselves to trip_members"
  on trip_members for insert
  with check (user_id = auth.uid());

-- Polls: members can update (e.g., close polls)
create policy if not exists "trip members can update polls"
  on polls for update
  using (public.is_trip_member(auth.uid(), trip_id))
  with check (public.is_trip_member(auth.uid(), trip_id));
