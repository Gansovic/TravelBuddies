# TravelBuddies — MVP Engineering Spec (Codex‑Ready)

> Private-first group travel planning with polls, expenses, friend‑weighted reviews, badges, recaps, and trip cloning. This doc is written so an AI codegen agent (Codex) can scaffold the app end‑to‑end.

---

## 0) Quick Pitch & Constraints
- **Goal:** Ship a solo‑friendly MVP under **$50k**, within ~12 weeks, to 10–20 seed groups.
- **Beachhead:** Private invite‑only groups that repeat trips (offsites, alumni, clubs).
- **Platforms:** Web (PWA) first; mobile via React Native (Expo) in Phase 1.5.
- **Data protection:** Private by default; public read‑only pages come later (feature flag).

---

## 1) Tech Stack (Opinionated Defaults)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + TanStack Query + Maplibre/Mapbox GL
- **Mobile (later):** Expo + React Native Web (shared UI kit)  
- **Backend/BaaS:** Supabase (Postgres + Auth + Row Level Security) + Edge Functions (Deno)  
- **Payments:** Stripe (Subscriptions @ group level)
- **Affiliates (stubbed initially):** Booking.com/Skyscanner/GetYourGuide deep links (later switch to APIs)
- **Storage:** Supabase Buckets (images, recap exports)
- **Jobs/Queues:** Supabase scheduled cron + Edge Functions (recap generation, reminders)
- **Infra/DevOps:** Vercel (web), Supabase (DB/Auth), Sentry, PostHog (analytics), LaunchDarkly‑lite via DB flags

**Why Supabase?** Auth + RLS lets us enforce private groups with minimal backend code. We’ll only add bespoke services if needed.

---

## 2) Monorepo Layout
```
/ (repo root)
├─ apps/
│  ├─ web/               # Next.js app
│  └─ mobile/            # Expo app (phase 1.5)
├─ packages/
│  ├─ ui/                # shared design system (Tailwind + Radix)
│  ├─ api/               # OpenAPI types + client SDKs (ts-rest or tRPC optional)
│  └─ utils/             # shared utils (currency, timezones, permissions)
├─ supabase/             # SQL migrations, policies, functions
└─ tooling/              # linters, codegen, git hooks
```

---

## 3) User Roles & Permissions (RLS‑first)
- **User:** anyone with an account.
- **TripMember:** user that has joined a `trip`. Has a `role` ∈ {owner, editor, viewer, treasurer}.
- **Access model:** all core tables include `trip_id` and RLS checks membership. Invite via signed magic link.

**RLS outline (pseudocode):**
```
create policy "trip members can read/write" on <table>
  for select using (is_trip_member(auth.uid(), trip_id))
  for insert with check (is_trip_member(auth.uid(), trip_id))
  for update using (is_trip_member(auth.uid(), trip_id))
```

---

## 4) Data Model (Postgres)

### 4.1 ERD (ASCII)
```
users( id )
 trips( id, owner_id )
  └─ trip_members( id, trip_id, user_id, role )
  └─ itinerary_items( id, trip_id, day, type, place_id, lat, lng, start_ts, end_ts, notes )
  └─ polls( id, trip_id, kind, title, closes_at, state )
      └─ poll_options( id, poll_id, payload_json )
      └─ poll_votes( id, poll_id, option_id, user_id, weight )
  └─ expenses( id, trip_id, amount_minor, currency, paid_by_user_id, ts, note )
      └─ expense_splits( id, expense_id, user_id, share_ratio )
      └─ fx_rates( id, base_ccy, quote_ccy, rate, as_of )
  └─ reviews( id, trip_id, place_id, author_id, rating, text )
  └─ badges( id, trip_id, user_id, kind, awarded_at, meta )
  └─ recaps( id, trip_id, status, asset_url )
  └─ templates( id, owner_user_id, public, payload_json )
 feature_flags( key, enabled, scope )
```

### 4.2 Key Tables (DDL)
```sql
-- trips & membership
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','editor','viewer','treasurer')) not null,
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- itinerary
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day int, -- day index relative to start_date
  type text check (type in ('lodging','flight','food','activity','note','transport')) not null,
  place_id text,
  lat double precision, lng double precision,
  start_ts timestamptz, end_ts timestamptz,
  notes text,
  created_by uuid references auth.users(id)
);

-- polls
create table polls (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text check (kind in ('dates','lodging','activity','generic')) not null,
  title text not null,
  closes_at timestamptz,
  state text check (state in ('open','closed')) default 'open'
);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  payload_json jsonb not null -- e.g., {"dates":["2025-09-12","2025-09-15"]}
);

create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references poll_options(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  weight real default 1.0,
  unique (poll_id, user_id, option_id)
);

-- expenses & splits
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  amount_minor bigint not null, -- in minor units
  currency char(3) not null,
  paid_by_user_id uuid references auth.users(id) not null,
  ts timestamptz default now(),
  note text
);

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  share_ratio numeric(6,4) not null -- sum to 1.0 per expense
);

-- FX cache (optional for multi-currency balancing)
create table fx_rates (
  id bigserial primary key,
  base_ccy char(3) not null,
  quote_ccy char(3) not null,
  rate numeric(18,8) not null,
  as_of date not null,
  unique(base_ccy, quote_ccy, as_of)
);

-- reviews (friend-weighted)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  place_id text not null,
  author_id uuid references auth.users(id) not null,
  rating int check (rating between 1 and 5) not null,
  text text,
  created_at timestamptz default now()
);

-- badges & recaps
create table badges (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  kind text check (kind in ('Planner','Treasurer','Procrastinator','Ghost','PhotoMaster')) not null,
  awarded_at timestamptz default now(),
  meta jsonb
);

create table recaps (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  status text check (status in ('queued','processing','ready','failed')) default 'queued',
  asset_url text
);

-- templates (trip cloning)
create table templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  public boolean default false,
  payload_json jsonb not null,
  created_at timestamptz default now()
);

-- feature flags
create table feature_flags (
  key text primary key,
  enabled boolean not null,
  scope jsonb -- e.g., {"trip_ids":["..."]}
);
```

---

## 5) APIs (Edge Functions) — Minimal Surface
Use Supabase client for CRUD where possible. Add the following signed endpoints for integrity:

### 5.1 OpenAPI (excerpt)
```yaml
openapi: 3.0.3
info:
  title: TravelBuddies Edge API
  version: 0.1.0
paths:
  /trip/create:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, start_date, end_date]
              properties:
                name: { type: string }
                start_date: { type: string, format: date }
                end_date: { type: string, format: date }
      responses:
        '200': { description: OK }
  /poll/close:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [poll_id]
              properties:
                poll_id: { type: string, format: uuid }
      responses:
        '200': { description: OK }
  /expenses/settlements:
    post:
      summary: Compute net balances + minimal settlement transfers
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [trip_id, currency]
              properties:
                trip_id: { type: string, format: uuid }
                currency: { type: string, example: "EUR" }
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  balances: { type: array, items: { $ref: '#/components/schemas/Balance' } }
                  transfers: { type: array, items: { $ref: '#/components/schemas/Transfer' } }
components:
  schemas:
    Balance:
      type: object
      properties: { user_id: {type: string}, amount_minor: {type: integer} }
    Transfer:
      type: object
      properties: { from: {type: string}, to: {type: string}, amount_minor: {type: integer} }
```

---

## 6) Core Algorithms

### 6.1 Expense Balancing (multi‑currency aware)
1. Convert every expense to **trip settlement currency** using `fx_rates(as_of=expense.ts::date)`.
2. For each expense: payer gets **+amount**, each participant gets **−amount×share_ratio**.
3. After summing per user: run **greedy min‑transfer** matching (largest debtor → largest creditor) until balances are zeroed within 1 unit.

### 6.2 Friend‑Weighted Reviews Ranking
Let `score(place) = Σ_{r in reviews(place)} w(author(r)) × f(rating)` where:
- `w(u) = 1 + 0.5×I(u in this trip) + 0.2×overlap_days(u, me)/365` (cap at 2.0)
- `f(rating) = rating/5` with Wilson‑style confidence shrinkage for low n.
Return places sorted by `score` with a fallback to global rating.

### 6.3 Badges Engine (first pass)
- **Planner:** created ≥ X itinerary items
- **Treasurer:** logged ≥ Y expenses
- **Procrastinator:** voted after deadline − grace
- **Ghost:** joined trip but 0 votes + 0 expenses + 0 items
- **PhotoMaster:** uploaded ≥ Z images
Run a nightly job granting badges and persisting to `badges`.

### 6.4 Trip Cloning
Serialize trip’s itinerary (and optional polls) into `templates.payload_json`. New trip copies and remaps IDs; exclude expenses and votes.

---

## 7) UX Flows (Happy Paths)
1. **Create Trip → Invite**: user creates trip → gets share link (magic) → members join and pick roles.
2. **Itinerary**: day list + map; drag‑drop reorder; quick add via place search.
3. **Polls**: create, set close date, members vote; owner/treasurer can **close**; chosen option can auto‑create itinerary item(s).
4. **Expenses**: add expense, choose split (equal/percentage/custom), supports multi‑currency; settlement view suggests transfers.
5. **Reviews**: add rating/text to any itinerary place; list ranked by friend‑weighted score.
6. **Recap**: after trip end, generate shareable image (stats + badges); optional public page (feature flag).
7. **Clone Trip**: copy from templates; update dates; invite previous members optionally.

---

## 8) Screens (MVP)
- Trips List, Create Trip Modal
- Trip Room: **Itinerary (Day/Map)** | **Polls** | **Expenses** | **Recap**
- Poll Create/Vote, Expense Create/Edit, Settlement
- Settings: Members & Roles, Currency, Integrations (deep links)

Include responsive PWA with install prompt.

---

## 9) Analytics (PostHog events)
- `trip_created`, `member_invited`, `member_joined`
- `itinerary_item_added`, `poll_created`, `poll_voted`, `poll_closed`
- `expense_added`, `settlement_viewed`, `transfer_confirmed`
- `review_added`, `badge_awarded`, `recap_generated`, `trip_cloned`
All events with `trip_id`, `user_id`, `ts` and relevant payload sizes.

---

## 10) Feature Flags (DB‑driven)
- `public_pages_enabled`
- `recap_generation_enabled`
- `templates_library_enabled`

---

## 11) NFRs
- **Perf:** P95 < 200ms for reads, < 500ms for writes (edge functions), map tiles excluded.
- **Security:** RLS on all trip‑scoped tables; invite tokens expire in 7 days; audit basic inserts.
- **Reliability:** nightly backups; idempotent edge endpoints.
- **i18n/timezones:** store UTC, render local; money in minor units.

---

## 12) Dev Setup (Codex Tasks)
1. Scaffold monorepo with `pnpm` workspaces; add Next.js web app.
2. Initialize Supabase; apply SQL in `/supabase/migrations` from §4.2.
3. Implement RLS helper `is_trip_member(uid, trip_id)` in SQL.
4. Build Edge Functions for `/trip/create`, `/poll/close`, `/expenses/settlements`.
5. Implement UI shells: layout, left nav (Itinerary/Polls/Expenses/Recap), trip switcher.
6. Map: basic map with item pins; day filter.
7. Expenses: form + split presets; settlement algo.
8. Polls: dates/lodging/activity kinds; close action.
9. Badges job (cron): nightly function.
10. Recap generator: server‑side image (Satori/Resvg) into bucket; download link.

---

## 13) Testing & QA
- Unit: utils (currency, balances, ranking) ≥ 90% cov.
- E2E: Playwright flows (create trip → invite → add item → create poll → vote → add expense → settlement → recap).
- Manual: RLS checks (non‑members blocked), invite expiry, FX fallback.

---

## 14) Example Seed Data (JSON)
```json
{
  "trip": {"name": "Lisbon Offsite", "start_date": "2025-10-10", "end_date": "2025-10-14"},
  "members": [
    {"email": "a@example.com", "role": "owner"},
    {"email": "b@example.com", "role": "treasurer"},
    {"email": "c@example.com", "role": "editor"}
  ],
  "itinerary": [
    {"day": 0, "type": "lodging", "place_id": "hotel:123", "lat": 38.72, "lng": -9.14},
    {"day": 1, "type": "activity", "place_id": "poi:456", "start_ts": "2025-10-11T10:00:00Z"}
  ],
  "polls": [
    {"kind": "dates", "title": "When?", "options": [["2025-10-10","2025-10-14"],["2025-10-17","2025-10-21"]]}
  ]
}
```

---

## 15) Stretch (Phase 1.5)
- Offline (itinerary cache), in‑app chat deeplinks, advanced search/filters, mobile app bundle.

---

## 16) Out of Scope (MVP)
- Real‑time collaborative cursors, complex permission hierarchies, vendor API bookings inside app (deep links only).

---

## 17) Definition of Done (MVP)
- Any member can: add items, vote, add expenses, see settlements.
- Owner can: close polls, invite, clone trip.
- Treasurer can: export expenses CSV + suggested transfers.
- Recap image generated after trip end with badges + top stats.

---

## 18) Prompts for Codex (copy/paste)
**Scaffold monorepo:**
```
Create a pnpm workspace with apps/web (Next.js TypeScript) and packages/ui,packages/utils. Configure ESLint, Prettier, Husky. Install Tailwind and set up base theme.
```
**Generate Supabase SQL:**
```
Read §4.2 and produce SQL migration files under /supabase/migrations with proper foreign keys and indexes. Add a SQL function is_trip_member(uid uuid, trip_id uuid) returning boolean. Add RLS policies from §3 for all trip-scoped tables.
```
**Edge function: settlements:**
```
Implement a Supabase Edge Function POST /expenses/settlements that loads all expenses + splits for a trip, converts to the requested currency using fx_rates (fallback rate=1 if same currency), computes per-user balances, and returns a minimal set of transfers using a greedy algorithm. Write unit tests.
```
**UI shell:**
```
Build a Next.js layout with a left sidebar (Itinerary, Polls, Expenses, Recap). Implement the Itinerary Day view and Map view with add/edit modals. Use TanStack Query for data fetching and optimistic updates.
```

---

**End of spec.**
