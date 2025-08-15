-- TravelBuddies Test Seed Data
-- This file provides comprehensive test data for development and testing
-- Run with: supabase db reset (includes seed) or call via API endpoints

-- Clear existing test data
DELETE FROM poll_votes;
DELETE FROM poll_options;
DELETE FROM polls;
DELETE FROM moment_reactions;
DELETE FROM moments;
DELETE FROM trip_activity;
DELETE FROM trip_timeline;
DELETE FROM itinerary_items;
DELETE FROM trip_members;
DELETE FROM trips;
DELETE FROM users;

-- Create test users with different personas
INSERT INTO users (id, name, email, created_at) VALUES
-- Primary test user (current default)
('a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Alice Smith', 'alice@test.com', '2024-01-15 10:00:00'),
-- Additional test users for multi-user scenarios
('b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'Bob Johnson', 'bob@test.com', '2024-01-16 11:00:00'),
('c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'Carol Davis', 'carol@test.com', '2024-01-17 12:00:00'),
('d3f45e63-a83b-43fa-ac95-60721c0ce39d', 'David Wilson', 'david@test.com', '2024-01-18 13:00:00'),
('e4f45e63-a83b-43fa-ac95-60721c0ce39d', 'Emma Brown', 'emma@test.com', '2024-01-19 14:00:00');

-- Create test trips with different scenarios
INSERT INTO trips (id, name, description, created_at, start_date, end_date) VALUES
-- Current test trip (matches existing ID)
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'European Adventure', 'Amazing trip through Europe with friends', '2024-06-01 09:00:00', '2024-07-15', '2024-07-25'),
-- Additional trips for testing
('f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'Tokyo Summer Trip', 'Exploring Tokyo in the summer', '2024-08-01 10:00:00', '2024-08-20', '2024-08-27'),
('f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'Weekend Getaway', 'Quick weekend trip to the mountains', '2024-09-01 15:00:00', '2024-09-15', '2024-09-17'),
('f3f45e63-a83b-43fa-ac95-60721c0ce39d', 'Beach Holiday', 'Relaxing beach vacation', '2024-05-01 08:00:00', '2024-06-01', '2024-06-08');

-- Create trip memberships with different roles
INSERT INTO trip_members (trip_id, user_id, role, created_at) VALUES
-- European Adventure (multi-user trip)
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'owner', '2024-06-01 09:00:00'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'member', '2024-06-01 10:00:00'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'member', '2024-06-01 11:00:00'),
-- Tokyo Trip (Alice as owner, Bob as member)
('f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'owner', '2024-08-01 10:00:00'),
('f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'member', '2024-08-01 11:00:00'),
-- Weekend Getaway (Bob as owner)
('f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'owner', '2024-09-01 15:00:00'),
('f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'member', '2024-09-01 16:00:00'),
('f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'd3f45e63-a83b-43fa-ac95-60721c0ce39d', 'member', '2024-09-01 17:00:00'),
-- Beach Holiday (Carol as owner, solo trip initially)
('f3f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'owner', '2024-05-01 08:00:00');

-- Create itinerary items for different trips
INSERT INTO itinerary_items (id, trip_id, title, description, location, date, time, created_at, order_index) VALUES
-- European Adventure itinerary
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Arrive in Paris', 'Flight arrival and hotel check-in', 'Charles de Gaulle Airport, Paris', '2024-07-15', '14:30:00', '2024-06-01 12:00:00', 1),
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Visit Eiffel Tower', 'Iconic landmark visit and photos', 'Eiffel Tower, Paris', '2024-07-16', '10:00:00', '2024-06-01 12:30:00', 2),
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Louvre Museum', 'Art and culture exploration', 'Louvre Museum, Paris', '2024-07-17', '09:00:00', '2024-06-01 13:00:00', 3),
-- Tokyo Trip itinerary
(gen_random_uuid(), 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'Shibuya Crossing', 'Experience the famous crossing', 'Shibuya, Tokyo', '2024-08-21', '15:00:00', '2024-08-01 14:00:00', 1),
(gen_random_uuid(), 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'Sushi Dinner', 'Traditional sushi experience', 'Tsukiji, Tokyo', '2024-08-21', '19:00:00', '2024-08-01 14:30:00', 2);

-- Create moments (memories) with variety across time periods
INSERT INTO moments (id, trip_id, creator_id, type, title, description, captured_at, created_at, latitude, longitude, place_name, address, city, country, is_private, upload_status) VALUES
-- Recent moments (European Adventure)
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'photo', 'Eiffel Tower at Sunset', 'Beautiful golden hour shot of the Eiffel Tower', '2024-07-16 19:30:00', '2024-07-16 19:35:00', 48.8584, 2.2945, 'Eiffel Tower', 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris', 'Paris', 'France', false, 'ready'),
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'note', 'Best Croissant Ever!', 'Found this amazing bakery near our hotel. The croissants are life-changing!', '2024-07-17 08:15:00', '2024-07-17 08:20:00', 48.8566, 2.3522, 'Local Bakery', '123 Rue de Rivoli, 75001 Paris', 'Paris', 'France', false, 'ready'),
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'video', 'Seine River Cruise', 'Magical evening cruise along the Seine', '2024-07-18 20:00:00', '2024-07-18 20:30:00', 48.8566, 2.3522, 'Seine River', 'Seine River, Paris', 'Paris', 'France', false, 'ready'),

-- Historical moments (Tokyo Trip)
(gen_random_uuid(), 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'photo', 'Shibuya Chaos', 'The controlled chaos of Shibuya crossing is mesmerizing', '2024-08-21 15:30:00', '2024-08-21 15:35:00', 35.6598, 139.7006, 'Shibuya Crossing', 'Shibuya City, Tokyo', 'Tokyo', 'Japan', false, 'ready'),
(gen_random_uuid(), 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'note', 'Sushi Master Class', 'Learned so much about sushi preparation. The chef was incredible!', '2024-08-21 21:00:00', '2024-08-21 21:15:00', 35.6654, 139.7706, 'Tsukiji Sushi Restaurant', 'Tsukiji, Tokyo', 'Tokyo', 'Japan', false, 'ready'),

-- Weekend trip moments
(gen_random_uuid(), 'f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'photo', 'Mountain Sunrise', 'Woke up early for this incredible sunrise view', '2024-09-16 06:30:00', '2024-09-16 06:45:00', 47.6062, -122.3321, 'Mountain Peak', 'Cascade Mountains', 'Seattle', 'USA', false, 'ready'),
(gen_random_uuid(), 'f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'note', 'Campfire Stories', 'Amazing night sharing stories around the campfire with everyone', '2024-09-16 21:00:00', '2024-09-16 21:30:00', 47.6062, -122.3321, 'Campsite', 'Cascade Mountains Campground', 'Seattle', 'USA', false, 'ready');

-- Create polls for group decision making
INSERT INTO polls (id, trip_id, creator_id, title, description, created_at, closes_at, status) VALUES
(gen_random_uuid(), 'f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Dinner Choice Tonight', 'Where should we eat dinner in Paris?', '2024-07-17 16:00:00', '2024-07-17 18:00:00', 'open'),
(gen_random_uuid(), 'f1f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'Weekend Activity', 'What should we do on Saturday?', '2024-08-22 10:00:00', '2024-08-22 18:00:00', 'closed'),
(gen_random_uuid(), 'f2f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'Hiking Trail', 'Which trail should we take tomorrow?', '2024-09-15 20:00:00', '2024-09-16 07:00:00', 'closed');

-- Create poll options
INSERT INTO poll_options (poll_id, option_text, created_at) 
SELECT p.id, option_text, p.created_at
FROM polls p
CROSS JOIN (
  VALUES 
    ('Traditional French Bistro'),
    ('Italian Restaurant'),
    ('Sushi Bar'),
    ('Street Food Market')
) AS options(option_text)
WHERE p.title = 'Dinner Choice Tonight'

UNION ALL

SELECT p.id, option_text, p.created_at
FROM polls p
CROSS JOIN (
  VALUES 
    ('Visit Sensoji Temple'),
    ('Explore Harajuku'),
    ('Day trip to Mount Fuji'),
    ('Shopping in Ginza')
) AS options(option_text)
WHERE p.title = 'Weekend Activity'

UNION ALL

SELECT p.id, option_text, p.created_at
FROM polls p
CROSS JOIN (
  VALUES 
    ('Easy Lake Trail'),
    ('Challenging Summit Hike'),
    ('Waterfall Loop'),
    ('Forest Path')
) AS options(option_text)
WHERE p.title = 'Hiking Trail';

-- Create some poll votes
INSERT INTO poll_votes (poll_id, option_id, user_id, created_at)
SELECT 
  p.id,
  po.id,
  tm.user_id,
  p.created_at + INTERVAL '30 minutes'
FROM polls p
JOIN poll_options po ON p.id = po.poll_id
JOIN trip_members tm ON p.trip_id = tm.trip_id
WHERE p.title = 'Weekend Activity' 
  AND po.option_text = 'Visit Sensoji Temple'
  AND tm.user_id IN ('a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d');

-- Create moment reactions
INSERT INTO moment_reactions (moment_id, user_id, reaction_type, created_at)
SELECT 
  m.id,
  tm.user_id,
  CASE 
    WHEN random() < 0.5 THEN 'like'
    WHEN random() < 0.8 THEN 'love'
    ELSE 'wow'
  END,
  m.created_at + INTERVAL '1 hour'
FROM moments m
JOIN trip_members tm ON m.trip_id = tm.trip_id
WHERE tm.user_id != m.creator_id  -- Don't react to your own moments
  AND random() < 0.7;  -- 70% chance of reaction

-- Create trip activity feed
INSERT INTO trip_activity (trip_id, user_id, activity_type, description, created_at) VALUES
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'b1f45e63-a83b-43fa-ac95-60721c0ce39d', 'joined_trip', 'Bob joined the trip', '2024-06-01 10:00:00'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'c2f45e63-a83b-43fa-ac95-60721c0ce39d', 'joined_trip', 'Carol joined the trip', '2024-06-01 11:00:00'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'created_memory', 'Alice shared a new photo', '2024-07-16 19:35:00'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', 'a0f45e63-a83b-43fa-ac95-60721c0ce39d', 'created_poll', 'Alice created a poll about dinner', '2024-07-17 16:00:00');

-- Create trip timeline entries
INSERT INTO trip_timeline (trip_id, date, events_count, photos_count, notes_count, created_at) VALUES
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', '2024-07-16', 2, 1, 1, '2024-07-16 23:59:59'),
('f0f45e63-a83b-43fa-ac95-60721c0ce39d', '2024-07-17', 3, 0, 2, '2024-07-17 23:59:59'),
('f1f45e63-a83b-43fa-ac95-60721c0ce39d', '2024-08-21', 2, 1, 1, '2024-08-21 23:59:59'),
('f2f45e63-a83b-43fa-ac95-60721c0ce39d', '2024-09-16', 2, 1, 1, '2024-09-16 23:59:59');

-- Success message
SELECT 'Test seed data created successfully!' as message,
       (SELECT COUNT(*) FROM users) as users_count,
       (SELECT COUNT(*) FROM trips) as trips_count,
       (SELECT COUNT(*) FROM trip_members) as memberships_count,
       (SELECT COUNT(*) FROM moments) as moments_count,
       (SELECT COUNT(*) FROM polls) as polls_count;