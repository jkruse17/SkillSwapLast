/*
  # Add resume fields to profiles table

  1. New Fields
    - `resume_summary` (text): Brief professional summary
    - `education` (jsonb[]): Array of education entries
    - `experience` (jsonb[]): Array of work experience entries
    - `certifications` (jsonb[]): Array of certifications
    - `languages` (text[]): Array of languages spoken

  2. Changes
    - Add new columns to profiles table
    - Add indexes for better performance
*/

-- Add resume fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS resume_summary text DEFAULT '',
ADD COLUMN IF NOT EXISTS education jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certifications jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_resume_fields ON profiles USING GIN (education, experience, certifications);