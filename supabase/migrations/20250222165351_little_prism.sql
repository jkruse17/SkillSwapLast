/*
  # Add social features tables

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `user_name` (text)
      - `user_avatar` (text)
      - `action` (text)
      - `target` (text)
      - `created_at` (timestamptz)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `read` (boolean)
      - `created_at` (timestamptz)

  2. Profile Updates
    - Add `completed_opportunities` column
    - Add `total_hours` column

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_opportunities integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_hours integer DEFAULT 0;

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  action text NOT NULL,
  target text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Activities policies
CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);