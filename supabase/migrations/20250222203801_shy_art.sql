/*
  # Implement Hard Delete for Messages

  1. Changes
    - Drop existing message policies
    - Create new policies that handle hard deletion
    - Add policy for deleting messages
    - Remove soft delete approach

  2. Security
    - Only message senders can delete their own messages
    - Messages are permanently deleted
*/

-- Drop existing message policies
DROP POLICY IF EXISTS "Enable read access for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable insert for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable soft delete for message senders" ON messages;

-- Create updated policies
CREATE POLICY "Enable read access for chat participants"
  ON messages FOR SELECT
  TO authenticated
  USING (
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

CREATE POLICY "Enable delete for message senders"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Remove soft delete column if it exists
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_at;

-- Drop soft delete index if it exists
DROP INDEX IF EXISTS idx_messages_deleted_at;