/*
  # Update RLS policies for opportunities

  1. Changes
    - Allow public access to read opportunities
    - Keep existing policies for authenticated users

  2. Security
    - Opportunities can be read by anyone (authenticated or not)
    - Other operations still require authentication
*/

-- Update opportunities policies
DROP POLICY IF EXISTS "Anyone can read opportunities" ON opportunities;

CREATE POLICY "Anyone can read opportunities"
  ON opportunities FOR SELECT
  USING (true);