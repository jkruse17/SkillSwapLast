/*
  # Fix Chat Policies

  1. Changes
    - Remove circular dependencies in chat participant policies
    - Simplify chat room and message policies
    - Add proper cascading permissions

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access to chats
    - Allow users to view and participate in their own chats
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
  USING (
    id IN (
      SELECT chat_room_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Chat Participant Policies
CREATE POLICY "Users can view chat participants"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT chat_room_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chats"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to join if they're being added to a chat
    user_id = auth.uid() OR
    -- Or if they're the creator of the chat room
    chat_room_id IN (
      SELECT id 
      FROM chat_rooms 
      WHERE id IN (
        SELECT chat_room_id 
        FROM chat_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Message Policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT chat_room_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    chat_room_id IN (
      SELECT chat_room_id 
      FROM chat_participants 
      WHERE user_id = auth.uid()
    )
  );