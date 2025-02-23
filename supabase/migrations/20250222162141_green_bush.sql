/*
  # Fix profiles table RLS policies

  1. Changes
    - Add policy for users to insert their own profile
    - Modify existing policies to be more specific
  
  2. Security
    - Enable RLS on profiles table
    - Add policy for profile creation during signup
    - Ensure users can only modify their own profile
*/

-- Drop existing policies for profiles table
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);