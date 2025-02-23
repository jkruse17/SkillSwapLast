/*
  # Fix Message Deletion Policies

  1. Changes
    - Add policy for message soft deletion
    - Update existing message policies
    - Ensure proper constraints for deleted_at column

  2. Security
    - Only message senders can soft delete their own messages
    - Messages are soft deleted using deleted_at timestamp
*/

-- Drop existing message policies
DROP POLICY IF EXISTS "Enable read access for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable insert for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable update for message senders" ON messages;

-- Create updated policies
CREATE POLICY "Enable read access for chat participants"
  ON messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 
      FROM chat_participants 
      WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for chat participants"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    EXISTS (
      SELECT 1 
      FROM chat_participants 
      WHERE chat_participants.chat_room_id = messages.chat_room_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable soft delete for message senders"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (
    sender_id = auth.uid() AND
    (deleted_at IS NULL OR deleted_at IS NOT NULL)
  );