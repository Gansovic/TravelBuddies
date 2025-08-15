-- Polls and Voting System Migration
-- Adds collaborative voting functionality for itinerary planning

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  creator_id uuid,
  title text NOT NULL,
  description text,
  type text DEFAULT 'itinerary_item', -- 'itinerary_item', 'general', 'place_choice'
  related_data jsonb, -- stores itinerary item data for itinerary polls
  status text DEFAULT 'active', -- 'active', 'closed'
  closes_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS for development
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;

-- Create poll_options table  
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  data jsonb, -- stores option-specific data (place details, etc.)
  vote_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for development
ALTER TABLE poll_options DISABLE ROW LEVEL SECURITY;

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id) -- one vote per user per poll
);

-- Disable RLS for development
ALTER TABLE poll_votes DISABLE ROW LEVEL SECURITY;

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_poll_option_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update vote counts
CREATE TRIGGER trigger_update_vote_count_insert
  AFTER INSERT ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_option_vote_count();

CREATE TRIGGER trigger_update_vote_count_delete
  AFTER DELETE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_option_vote_count();

-- Create trigger for updated_at on polls
CREATE TRIGGER trigger_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_trip_id ON polls(trip_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);