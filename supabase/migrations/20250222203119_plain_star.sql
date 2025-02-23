/*
  # Add Message Deletion Support

  1. Changes
    - Add soft delete support for messages
    - Add policy for message deletion
    - Update existing message policies

  2. Security
    - Only message senders can delete their own messages
    - Messages are soft deleted (deleted_at timestamp)
*/

-- Update message policies
DROP POLICY IF EXISTS "Enable read access for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable insert for chat participants" ON messages;

-- Create policies with soft delete support
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

CREATE POLICY "Enable update for message senders"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());