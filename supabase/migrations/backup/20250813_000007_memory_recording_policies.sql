-- RLS Policies for Memory Recording Schema

-- Enable RLS on all new tables
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is trip member
CREATE OR REPLACE FUNCTION is_trip_member(user_id uuid, trip_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members 
    WHERE trip_members.user_id = is_trip_member.user_id 
    AND trip_members.trip_id = is_trip_member.trip_id
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Moments policies
CREATE POLICY "Trip members can view moments" ON moments
  FOR SELECT USING (
    is_trip_member(auth.uid(), trip_id) AND 
    (NOT is_private OR creator_id = auth.uid())
  );

CREATE POLICY "Trip members can create moments" ON moments
  FOR INSERT WITH CHECK (
    is_trip_member(auth.uid(), trip_id) AND 
    creator_id = auth.uid()
  );

CREATE POLICY "Creators can update their moments" ON moments
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their moments" ON moments
  FOR DELETE USING (creator_id = auth.uid());

-- Moment reactions policies
CREATE POLICY "Trip members can view reactions" ON moment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM moments 
      WHERE moments.id = moment_reactions.moment_id 
      AND is_trip_member(auth.uid(), moments.trip_id)
    )
  );

CREATE POLICY "Trip members can add reactions" ON moment_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM moments 
      WHERE moments.id = moment_reactions.moment_id 
      AND is_trip_member(auth.uid(), moments.trip_id)
    )
  );

CREATE POLICY "Users can update their reactions" ON moment_reactions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their reactions" ON moment_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Trip timeline policies
CREATE POLICY "Trip members can view timeline" ON trip_timeline
  FOR SELECT USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can update timeline" ON trip_timeline
  FOR UPDATE USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can insert timeline" ON trip_timeline
  FOR INSERT WITH CHECK (is_trip_member(auth.uid(), trip_id));

-- Moment collections policies
CREATE POLICY "Trip members can view collections" ON moment_collections
  FOR SELECT USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can create collections" ON moment_collections
  FOR INSERT WITH CHECK (
    is_trip_member(auth.uid(), trip_id) AND 
    creator_id = auth.uid()
  );

CREATE POLICY "Creators can update their collections" ON moment_collections
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their collections" ON moment_collections
  FOR DELETE USING (creator_id = auth.uid());

-- Collection moments policies
CREATE POLICY "Trip members can view collection moments" ON collection_moments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM moment_collections mc
      WHERE mc.id = collection_moments.collection_id 
      AND is_trip_member(auth.uid(), mc.trip_id)
    )
  );

CREATE POLICY "Trip members can add moments to collections" ON collection_moments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM moment_collections mc
      WHERE mc.id = collection_moments.collection_id 
      AND is_trip_member(auth.uid(), mc.trip_id)
    ) AND
    EXISTS (
      SELECT 1 FROM moments m
      WHERE m.id = collection_moments.moment_id 
      AND is_trip_member(auth.uid(), m.trip_id)
    )
  );

CREATE POLICY "Collection creators can manage collection moments" ON collection_moments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM moment_collections mc
      WHERE mc.id = collection_moments.collection_id 
      AND mc.creator_id = auth.uid()
    )
  );

-- Trip activity policies
CREATE POLICY "Trip members can view activity" ON trip_activity
  FOR SELECT USING (is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Trip members can create activity" ON trip_activity
  FOR INSERT WITH CHECK (
    is_trip_member(auth.uid(), trip_id) AND 
    user_id = auth.uid()
  );

-- Grant permissions for realtime
GRANT ALL ON moments TO authenticated;
GRANT ALL ON moment_reactions TO authenticated;
GRANT ALL ON trip_activity TO authenticated;