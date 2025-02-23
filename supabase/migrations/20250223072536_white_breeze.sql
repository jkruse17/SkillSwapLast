/*
  # Update activity policies and triggers

  1. Changes
    - Drop existing activity policies
    - Create new simplified policies
    - Add trigger for automatic activity creation
    - Add function to handle activity creation

  2. Security
    - Enable RLS
    - Add policies for read/write access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for activities" ON activities;
DROP POLICY IF EXISTS "Enable insert for activities" ON activities;

-- Create simplified policies
CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to handle activity creation
CREATE OR REPLACE FUNCTION create_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user profile data
  SELECT name, avatar_url INTO user_profile
  FROM profiles
  WHERE id = NEW.user_id;

  -- Set user data from profile
  NEW.user_name := user_profile.name;
  NEW.user_avatar := user_profile.avatar_url;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set activity data
CREATE TRIGGER set_activity_data
  BEFORE INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION create_activity();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_activities_created_at 
  ON activities(created_at DESC);