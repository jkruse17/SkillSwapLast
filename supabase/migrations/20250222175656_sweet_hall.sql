/*
  # Fix loading issues by updating RLS policies

  1. Changes
    - Allow public access to read activities
    - Keep existing policies for authenticated users

  2. Security
    - Activities can be read by anyone (authenticated or not)
    - Other operations still require authentication
*/

-- Update activities policies
DROP POLICY IF EXISTS "Anyone can read activities" ON activities;

CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  USING (true);