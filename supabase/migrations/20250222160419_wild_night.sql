/*
  # Initial Schema Setup for Volunteer Platform

  1. New Tables
    - `profiles`
      - User profiles with skills and interests
    - `opportunities`
      - Volunteer opportunities posted by organizations
    - `applications`
      - Volunteer applications for opportunities

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  skills text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organization text NOT NULL,
  description text NOT NULL,
  required_skills text[] DEFAULT '{}',
  location text NOT NULL,
  date text NOT NULL,
  image_url text NOT NULL,
  spots integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  organization_id uuid REFERENCES auth.users(id)
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Opportunities policies
CREATE POLICY "Anyone can read opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizations can create opportunities"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Organizations can update own opportunities"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = organization_id);

-- Applications policies
CREATE POLICY "Users can read own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Organizations can read applications for their opportunities"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.organization_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizations can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.organization_id = auth.uid()
    )
  );