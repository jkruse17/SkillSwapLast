-- Drop existing activities policies
DROP POLICY IF EXISTS "Anyone can read activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;

-- Create updated policies
CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable activity creation"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create activities for themselves
    user_id = auth.uid() OR
    -- Or if they are marking a completion
    EXISTS (
      SELECT 1 
      FROM opportunities o
      WHERE o.organization_id = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_created 
  ON activities(user_id, created_at DESC);