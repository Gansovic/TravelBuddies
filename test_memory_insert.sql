-- Test memory creation script
-- Insert a test memory directly into the database for debugging

-- First, let's create a test user if needed
INSERT INTO users (id, name, email) 
VALUES (
  'test-user-12345',
  'Test User', 
  'test@example.com'
) ON CONFLICT (id) DO NOTHING;

-- Add the test user to the trip as a member if not already there
INSERT INTO trip_members (trip_id, user_id, role)
VALUES (
  'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 
  'test-user-12345', 
  'owner'
) ON CONFLICT (trip_id, user_id) DO NOTHING;

-- Insert a test moment/memory
INSERT INTO moments (
  id,
  trip_id,
  creator_id,
  type,
  title,
  description,
  captured_at,
  upload_status,
  latitude,
  longitude,
  place_name,
  address,
  city,
  country,
  is_private,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f0f45e63-a83b-43fa-ac95-60721c0ce39d',
  'test-user-12345',
  'note',
  'Test Memory from Database',
  'This is a test memory created directly in the database to verify that the schema, timeline loading, and UI display all work correctly. If you can see this memory in the app, then the problem is in the frontend form submission.',
  NOW(),
  'ready',
  44.8019,  -- Belgrade coordinates  
  20.4897,
  'Belgrade City Center',
  'Belgrade, Serbia', 
  'Belgrade',
  'Serbia',
  false,
  NOW(),
  NOW()
);

-- Verify the insert worked
SELECT 
  m.id,
  m.title,
  m.description,
  m.type,
  m.created_at,
  m.place_name
FROM moments m 
WHERE m.trip_id = 'f0f45e63-a83b-43fa-ac95-60721c0ce39d'
ORDER BY m.created_at DESC;