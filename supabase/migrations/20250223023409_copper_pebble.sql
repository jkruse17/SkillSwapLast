/*
  # Add volunteer completion and review system

  1. New Tables
    - `completions`
      - Tracks completed volunteer opportunities
      - Links volunteers, opportunities, and reviews
      - Stores hours and completion status
    
    - `reviews`
      - Stores reviews for completed opportunities
      - Includes ratings and feedback
      - Links to completions

  2. Updates
    - Add triggers to update profile stats
    - Add triggers to create activity entries
    - Add triggers to update leaderboard stats

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for access control
*/

-- Create completions table
CREATE TABLE completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  hours_spent integer DEFAULT 0,
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id uuid REFERENCES completions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(completion_id, reviewer_id, reviewee_id)
);

-- Enable RLS
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Completions policies
CREATE POLICY "Users can view their completions"
  ON completions FOR SELECT
  TO authenticated
  USING (
    volunteer_id = auth.uid() OR 
    organizer_id = auth.uid()
  );

CREATE POLICY "Users can create completions"
  ON completions FOR INSERT
  TO authenticated
  WITH CHECK (
    volunteer_id = auth.uid() OR 
    organizer_id = auth.uid()
  );

CREATE POLICY "Users can update their completions"
  ON completions FOR UPDATE
  TO authenticated
  USING (
    volunteer_id = auth.uid() OR 
    organizer_id = auth.uid()
  );

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completed opportunities count and total hours
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET 
      completed_opportunities = completed_opportunities + 1,
      total_hours = total_hours + NEW.hours_spent
    WHERE id = NEW.volunteer_id;

    -- Create activity entry
    INSERT INTO activities (
      user_id,
      user_name,
      user_avatar,
      action,
      target
    )
    SELECT
      NEW.volunteer_id,
      profiles.name,
      profiles.avatar_url,
      'completed',
      opportunities.title
    FROM profiles, opportunities
    WHERE profiles.id = NEW.volunteer_id
    AND opportunities.id = NEW.opportunity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating profile stats
CREATE TRIGGER update_profile_stats_trigger
  AFTER UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();

-- Function to create notification on review
CREATE OR REPLACE FUNCTION notify_on_review()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    message,
    type,
    reference_id
  )
  VALUES (
    NEW.reviewee_id,
    'You have received a new review',
    'review',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review notifications
CREATE TRIGGER notify_on_review_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_review();

-- Add indexes for better performance
CREATE INDEX idx_completions_volunteer ON completions(volunteer_id);
CREATE INDEX idx_completions_organizer ON completions(organizer_id);
CREATE INDEX idx_completions_status ON completions(status);
CREATE INDEX idx_reviews_completion ON reviews(completion_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);