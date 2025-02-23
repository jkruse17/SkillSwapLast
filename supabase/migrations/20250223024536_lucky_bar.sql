-- Add review_status to completions
ALTER TABLE completions ADD COLUMN IF NOT EXISTS review_status text CHECK (review_status IN ('pending', 'completed')) DEFAULT 'pending';

-- Function to create notification for completion
CREATE OR REPLACE FUNCTION notify_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify volunteer
  INSERT INTO notifications (
    user_id,
    message,
    type,
    reference_id
  )
  SELECT
    NEW.volunteer_id,
    'Your volunteer work for "' || opportunities.title || '" has been marked as complete. Please leave a review!',
    'completion',
    NEW.id
  FROM opportunities
  WHERE opportunities.id = NEW.opportunity_id;

  -- Notify organizer
  INSERT INTO notifications (
    user_id,
    message,
    type,
    reference_id
  )
  SELECT
    NEW.organizer_id,
    'You marked "' || opportunities.title || '" as complete. Please leave a review for the volunteer!',
    'completion',
    NEW.id
  FROM opportunities
  WHERE opportunities.id = NEW.opportunity_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for completion notifications
CREATE TRIGGER notify_on_completion_trigger
  AFTER INSERT ON completions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_completion();

-- Function to update completion review status
CREATE OR REPLACE FUNCTION update_completion_review_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if both organizer and volunteer have left reviews
  IF EXISTS (
    SELECT 1 FROM reviews r1
    WHERE r1.completion_id = NEW.completion_id
    AND r1.reviewer_id = (
      SELECT organizer_id FROM completions WHERE id = NEW.completion_id
    )
  ) AND EXISTS (
    SELECT 1 FROM reviews r2
    WHERE r2.completion_id = NEW.completion_id
    AND r2.reviewer_id = (
      SELECT volunteer_id FROM completions WHERE id = NEW.completion_id
    )
  ) THEN
    -- Update completion review status to completed
    UPDATE completions
    SET review_status = 'completed'
    WHERE id = NEW.completion_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating completion review status
CREATE TRIGGER update_completion_review_status_trigger
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_completion_review_status();