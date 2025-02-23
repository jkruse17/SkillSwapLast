/*
  # Fix Messages Table Relationship

  1. Changes
    - Update messages table to properly reference profiles
    - Add necessary indexes for performance
    - Update message policies for proper access control

  2. Security
    - Maintain proper access control for messages
    - Ensure data integrity with foreign key constraints
*/

-- Update messages table to properly reference profiles
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile 
  ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created 
  ON messages(chat_room_id, created_at);

-- Update message policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Enable read access for chat participants"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
    AND chat_participants.user_id = auth.uid()
  ));

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