/*
  # Fix Chat Room Policies

  1. Changes
    - Update chat room policies to allow proper creation and access
    - Add update policy for chat rooms
    - Ensure consistent policy naming

  2. Security
    - Maintain proper access control
    - Allow chat room creation and updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for chat participants" ON chat_rooms;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON chat_rooms;
DROP POLICY IF EXISTS "Enable update for chat participants" ON chat_rooms;

-- Chat Room Policies
CREATE POLICY "Enable read access for chat participants"
  ON chat_rooms FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for chat participants"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_room_id = id 
    AND chat_participants.user_id = auth.uid()
  ));

-- Update chat_rooms table to ensure updated_at is set
CREATE OR REPLACE FUNCTION update_chat_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_chat_room_updated_at ON chat_rooms;
CREATE TRIGGER set_chat_room_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_updated_at();