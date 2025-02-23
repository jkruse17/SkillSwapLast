/*
  # Fix Message Deletion System

  1. Changes
    - Update message policies to properly handle message deletion
    - Add explicit UPDATE policy for soft deletion
    - Ensure proper RLS policy checks

  2. Security
    - Only message senders can delete their own messages
    - Messages are soft deleted for data retention
    - Deleted messages are filtered out from queries
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
  USING (sender_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (sender_id = auth.uid());

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;