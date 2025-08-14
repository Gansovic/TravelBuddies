-- Schema for TravelBuddies per spec §4.2
create extension if not exists pgcrypto;

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table if not exists trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid not null,
  role text check (role in ('owner','editor','viewer','treasurer')) not null,
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day int,
  type text check (type in ('lodging','flight','food','activity','note','transport')) not null,
  place_id text,
  lat double precision, lng double precision,
  start_ts timestamptz, end_ts timestamptz,
  notes text,
  created_by uuid
);

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text check (kind in ('dates','lodging','activity','generic')) not null,
  title text not null,
  closes_at timestamptz,
  state text check (state in ('open','closed')) default 'open'
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  payload_json jsonb not null
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  user_id uuid not null,
  weight real default 1.0,
  unique (poll_id, user_id, option_id)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  amount_minor bigint not null,
  currency char(3) not null,
  paid_by_user_id uuid not null,
  ts timestamptz default now(),
  note text
);

create table if not exists expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade,
  user_id uuid not null,
  share_ratio numeric(6,4) not null
);

create table if not exists fx_rates (
  id bigserial primary key,
  base_ccy char(3) not null,
  quote_ccy char(3) not null,
  rate numeric(18,8) not null,
  as_of date not null,
  unique(base_ccy, quote_ccy, as_of)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  place_id text not null,
  author_id uuid not null,
  rating int check (rating between 1 and 5) not null,
  text text,
  created_at timestamptz default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid not null,
  kind text check (kind in ('Planner','Treasurer','Procrastinator','Ghost','PhotoMaster')) not null,
  awarded_at timestamptz default now(),
  meta jsonb
);

create table if not exists recaps (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  status text check (status in ('queued','processing','ready','failed')) default 'queued',
  asset_url text
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  public boolean default false,
  payload_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null,
  scope jsonb
);
