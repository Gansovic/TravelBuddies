# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TravelBuddies is a private, group travel planning platform built as a full-stack monorepo application. The project uses Next.js 14+ (App Router) for the frontend and Supabase for the backend (PostgreSQL, Auth, Edge Functions).

## Development Commands

```bash
# Install dependencies (requires pnpm 9.6.0)
pnpm install

# Development
pnpm dev          # Start dev server on port 3000
pnpm build        # Build all packages
pnpm test         # Run tests (Vitest in packages/utils)
pnpm lint         # Lint all packages
pnpm format       # Format with Prettier

# Individual package commands (from root)
pnpm -F web dev
pnpm -F utils test
```

## Architecture & Key Concepts

### Monorepo Structure
- `apps/web/` - Next.js frontend application
- `packages/ui/` - Shared UI components (Tailwind-based)
- `packages/utils/` - Shared business logic and types
- `supabase/` - Database migrations, Edge Functions, RLS policies

### Core Architectural Decisions

1. **Security Model**: Row Level Security (RLS) policies enforce access control at the database level. All trip-related queries automatically filter by trip membership.

2. **Data Access Pattern**: Direct Supabase client usage with TanStack Query for caching/state management. No separate API layer needed due to RLS.

3. **Type Safety**: Shared TypeScript types generated from database schema. Types flow from `packages/utils` to both frontend and Edge Functions.

4. **Component Strategy**: Minimal external UI dependencies. Build custom components with Tailwind CSS first, only add libraries when absolutely necessary.

5. **Service Architecture**: All core services follow singleton pattern and are located in `packages/utils/src/services/`. Services are imported using `@utils/` alias and include:
   - ConfigService - Configuration management with caching
   - TripService - Trip data operations and statistics
   - EdgeFunctionsService - Centralized Edge Function calls

6. **Utility Architecture**: Centralized utilities in `packages/utils/src/` include:
   - DataConverters - Type-safe data transformations
   - NumberFormatters - Consistent number formatting
   - AppConstants/ConfigPaths - Centralized constants and config paths
   - PaginatedDataProvider - Base class for paginated data operations

### Key Files to Understand

- `MVP-spec.md` - Complete product specification, the single source of truth for requirements
- `apps/web/lib/supabaseClient.ts` - Supabase client configuration with auth helpers
- `packages/utils/src/types/` - Shared TypeScript types for the entire application
- `supabase/migrations/` - Database schema and RLS policies (numbered files show evolution)
- `apps/web/app/trip/[id]/` - Main trip functionality pages

### Current Implementation Status

**Completed Features:**
- User authentication (Supabase Auth)
- Trip creation and management
- Itinerary planning with drag-and-drop
- Polls/voting system
- Expense tracking with multi-currency support
- Settlement calculations
- Map integration (MapLibre/OpenStreetMap)

**Database Tables:**
- users, trips, trip_members
- itinerary_items, polls, poll_options, poll_votes
- expenses, expense_participants, settlements
- fx_rates (currency conversion)

### Development Guidelines

1. **Path Aliases**: Use `@/` for web app, `@ui/` for UI package, `@utils/` for utilities
2. **Error Handling**: Always check Supabase responses for errors before using data
3. **Client Components**: Mark with "use client" only when needed (interactivity, hooks)
4. **Database Changes**: Create numbered migration files in `supabase/migrations/`
5. **Testing**: All services and utilities have comprehensive test coverage with Vitest
6. **Principles Enforcement**: Git hooks automatically validate code against engineering principles

### Supabase Edge Functions

Located in `supabase/functions/`, these handle:
- `trip-create` - Creates trip with proper member initialization
- `poll-close` - Closes polls and determines winners
- `expense-settle` - Calculates optimal settlement transactions

Deploy with: `supabase functions deploy [function-name]`

### Environment Variables

Required in `apps/web/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_PLACES_API_KEY` (for places search)

### Common Patterns

**Protected Routes**: Use `withAuth` wrapper or check session in server components
**Data Fetching**: Use TanStack Query hooks with Supabase queries
**Form Handling**: React Hook Form with Zod validation
**State Management**: TanStack Query for server state, React Context for UI state