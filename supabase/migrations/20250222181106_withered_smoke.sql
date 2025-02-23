/*
  # Add categories to opportunities table

  1. Changes
    - Add category column to opportunities table
    - Add type column to opportunities table
    - Add estimated_duration column to opportunities table
    - Add urgency column to opportunities table
    - Update existing opportunities with default values
*/

-- Add new columns
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS type text DEFAULT 'need-help';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS estimated_duration text DEFAULT '1-2';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'normal';

-- Update existing opportunities with default values
UPDATE opportunities 
SET 
  category = CASE 
    WHEN array_to_string(required_skills, ',') ILIKE '%tech%' THEN 'technology'
    WHEN array_to_string(required_skills, ',') ILIKE '%garden%' THEN 'yard-work'
    WHEN array_to_string(required_skills, ',') ILIKE '%mov%' THEN 'moving'
    ELSE 'other'
  END,
  type = 'need-help',
  estimated_duration = '1-2',
  urgency = 'normal'
WHERE category = 'other';