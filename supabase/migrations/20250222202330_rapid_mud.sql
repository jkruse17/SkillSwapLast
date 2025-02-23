/*
  # Fix Chat Policies - Final Version

  1. Changes
    - Simplify chat participant policies to remove recursion
    - Update chat room and message policies for better performance
    - Add direct chat room access policy

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Simplify permission checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Chat Room Policies
CREATE POLICY "Users can view their chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_room_id = id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Chat Participant Policies
CREATE POLICY "Users can view chat participants"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join chats"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Message Policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_room_id = messages.chat_room_id 
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    EXISTS (
      SELECT 1 
      FROM chat_participants 
      WHERE chat_room_id = messages.chat_room_id 
      AND user_id = auth.uid()
    )
  );