-- Add missing users table and create admin user

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Insert admin user with a proper UUID
INSERT INTO users (id, name, email) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Admin User', 'admin@travelbuddies.com')
ON CONFLICT (email) DO NOTHING;

-- Add foreign key constraints (optional, but good practice)
-- Note: We're not adding these now since there might be existing data
-- ALTER TABLE trips ADD CONSTRAINT trips_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);
-- ALTER TABLE trip_members ADD CONSTRAINT trip_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);