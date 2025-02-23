/*
  # Fix RLS policies and data insertion

  1. Changes
    - Temporarily disable RLS for initial data insertion
    - Insert sample data
    - Re-enable RLS
*/

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

-- Create a dummy user in auth.users if not exists
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo.user@example.com',
  '{"name": "Demo User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create a profile for the dummy user
INSERT INTO profiles (
  id,
  name,
  email,
  skills,
  interests,
  bio,
  avatar_url
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo User',
  'demo.user@example.com',
  ARRAY['Teaching', 'Gardening', 'Tech Support'],
  ARRAY['Community Service', 'Education', 'Environment'],
  'Demo user for sample data',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample opportunities
INSERT INTO opportunities (
  title,
  organization,
  description,
  required_skills,
  location,
  date,
  image_url,
  spots,
  organization_id
) VALUES
  (
    'Need help setting up new computer',
    'sarah.tech@email.com',
    'Just got a new laptop and need help transferring files and setting up basic software. Perfect for someone with tech experience who enjoys helping seniors!',
    ARRAY['Computer Setup', 'Tech Support', 'Windows'],
    'Charlottesville - Downtown',
    '2025-03-15',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    1,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'Available for garden spring cleanup',
    'green.thumb@email.com',
    'Experienced gardener offering help with spring cleanup, planting, and basic landscaping. Have my own tools and 5+ years of experience.',
    ARRAY['Gardening', 'Landscaping', 'Plant Care'],
    'Charlottesville - Belmont',
    '2025-03-20',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    1,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'Moving help needed - small apartment',
    'moving.soon@email.com',
    'Need help moving from a 1-bedroom apartment to new place. Mostly boxes and small furniture. Building has elevator. Seeking someone strong and reliable.',
    ARRAY['Moving', 'Heavy Lifting', 'Organization'],
    'Charlottesville - UVA Area',
    '2025-03-10',
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    1,
    '11111111-1111-1111-1111-111111111111'
  );

-- Insert sample activities
INSERT INTO activities (
  user_id,
  user_name,
  user_avatar,
  action,
  target,
  created_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Emily Chen',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    'completed',
    'Senior Tech Support Session',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Marcus Johnson',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    'volunteered for',
    'Weekend Garden Cleanup',
    NOW() - INTERVAL '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Sophie Williams',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    'posted',
    'Math Tutoring for High School Students',
    NOW() - INTERVAL '3 hours'
  );

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;