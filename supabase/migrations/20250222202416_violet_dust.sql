/*
  # Fix Chat Policies to Prevent Recursion

  1. Changes
    - Simplify chat participant policies to avoid recursion
    - Update chat room and message policies for consistency
    - Maintain proper access control without circular dependencies

  2. Security
    - Ensure proper data access control
    - Prevent unauthorized access to chats and messages
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Simple, non-recursive chat room policies
CREATE POLICY "Users can view their chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_room_id = id 
    AND chat_participants.user_id = auth.uid()
  ));

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Simple chat participant policies without recursion
CREATE POLICY "Users can view chat participants"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join chats"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Message policies linked directly to participants
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_room_id = messages.chat_room_id 
    AND chat_participants.user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages"
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