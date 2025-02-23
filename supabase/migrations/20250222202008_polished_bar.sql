/*
  # Add Skill Verification and Messaging Features

  1. New Tables
    - `skill_verifications`: Tracks skill endorsements and verifications
    - `skill_endorsements`: Stores endorsements between users
    - `messages`: Handles direct messaging between users
    - `chat_rooms`: Manages group chats and direct message threads
    - `chat_participants`: Tracks participants in chat rooms
    - `user_availability`: Stores user availability schedules
    - `meetings`: Tracks scheduled skill exchange sessions

  2. Security
    - Enable RLS on all new tables
    - Add policies for proper access control
*/

-- Skill Verification Tables
CREATE TABLE IF NOT EXISTS skill_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  verified_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  proof_description text,
  proof_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsed_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  comment text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id, skill)
);

-- Create verified_users view for policy checks
CREATE OR REPLACE VIEW verified_users AS
SELECT id
FROM profiles
WHERE completed_opportunities >= 5
  OR EXISTS (
    SELECT 1 
    FROM skill_endorsements 
    WHERE endorsed_id = profiles.id 
    GROUP BY endorsed_id 
    HAVING COUNT(*) >= 3
  );

-- Messaging System Tables
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text CHECK (type IN ('direct', 'group')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Scheduling Tables
CREATE TABLE IF NOT EXISTS user_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  meeting_type text CHECK (meeting_type IN ('in_person', 'online')) NOT NULL,
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Skill Verification Policies
CREATE POLICY "Users can view verified skills"
  ON skill_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Verified users can create verifications"
  ON skill_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM verified_users));

-- Skill Endorsement Policies
CREATE POLICY "Anyone can view endorsements"
  ON skill_endorsements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create endorsements"
  ON skill_endorsements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = endorser_id);

-- Chat Room Policies
CREATE POLICY "Users can view their chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_room_id = id
      AND user_id = auth.uid()
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
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_room_id = chat_participants.chat_room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chats"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Message Policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_room_id = messages.chat_room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_room_id = messages.chat_room_id
      AND user_id = auth.uid()
    )
  );

-- Availability Policies
CREATE POLICY "Users can view availability"
  ON user_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their availability"
  ON user_availability FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meeting Policies
CREATE POLICY "Users can view meetings"
  ON meetings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM meeting_participants
      WHERE meeting_id = meetings.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Meeting Participant Policies
CREATE POLICY "Users can view meeting participants"
  ON meeting_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE id = meeting_id
      AND (
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM meeting_participants mp
          WHERE mp.meeting_id = meetings.id
          AND mp.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage meeting participation"
  ON meeting_participants FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skill_verifications_user_id ON skill_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorsed_id ON skill_endorsements(endorsed_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);

-- Create function to update chat room updated_at
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET updated_at = now()
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating chat room timestamp
CREATE TRIGGER update_chat_room_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_timestamp();