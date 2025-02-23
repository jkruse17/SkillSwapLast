/*
  # Fix RLS policies for opportunity deletion

  1. Changes
    - Drop existing policies for opportunities table
    - Create new, more permissive policies for CRUD operations
    - Add explicit DELETE policy for opportunity owners

  2. Security
    - Maintain security by ensuring users can only delete their own opportunities
    - Keep read access public for authenticated users
    - Preserve insert/update restrictions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Organizations can update own opportunities" ON opportunities;

-- Create new policies with explicit DELETE permission
CREATE POLICY "Anyone can read opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create opportunities"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update own opportunities"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete own opportunities"
  ON opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = organization_id);