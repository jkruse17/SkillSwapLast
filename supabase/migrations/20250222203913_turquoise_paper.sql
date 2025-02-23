/*
  # Fix Message Deletion System

  1. Changes
    - Add deleted_at column to messages table
    - Update message policies to handle soft deletion
    - Add index for better query performance

  2. Security
    - Only message senders can mark their messages as deleted
    - Messages are soft deleted for data retention
    - Deleted messages are filtered out from queries
*/

-- Add deleted_at column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Drop existing message policies
DROP POLICY IF EXISTS "Enable read access for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable insert for chat participants" ON messages;
DROP POLICY IF EXISTS "Enable delete for message senders" ON messages;

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

CREATE POLICY "Enable update for message senders"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;