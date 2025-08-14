-- Temporary: Disable RLS for development to allow unauthenticated access
-- This should be removed in production

-- Disable RLS on trips table for development
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Also disable on trip_members for now
ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;