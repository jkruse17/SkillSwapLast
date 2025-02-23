/*
  # Fix Chat Participants and Profiles Relationship

  1. Changes
    - Add foreign key relationship between chat_participants and profiles
    - Update chat participant policies to handle profile access
    - Add indexes for better performance

  2. Security
    - Maintain proper access control
    - Ensure secure profile access
*/

-- Update chat_participants table to reference profiles instead of auth.users
ALTER TABLE chat_participants
  DROP CONSTRAINT chat_participants_user_id_fkey,
  ADD CONSTRAINT chat_participants_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_profile 
  ON chat_participants(user_id);

-- Update chat participant policies
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;

CREATE POLICY "Users can view chat participants"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants cp
    WHERE cp.chat_room_id = chat_participants.chat_room_id 
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Users can join chats"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());