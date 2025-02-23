/*
  # Add location fields to profiles table

  1. Changes
    - Add location fields to profiles table:
      - location (text): Formatted address
      - latitude (numeric): GPS latitude
      - longitude (numeric): GPS longitude

  2. Notes
    - All fields are nullable since location is optional
    - Added index on location for better search performance
*/

-- Add location fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add index for location searches
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);