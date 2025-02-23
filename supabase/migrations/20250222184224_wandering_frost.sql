/*
  # Add application notifications

  1. Changes
    - Create function to handle application notifications
    - Add trigger for new applications
    - Add notification type column
    - Update notifications policies

  2. Security
    - Maintain RLS policies
    - Ensure notifications are only visible to intended recipients
*/

-- Add type column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'application';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id uuid;

-- Create function to handle application notifications
CREATE OR REPLACE FUNCTION handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  opportunity_owner_id uuid;
  applicant_name text;
  opportunity_title text;
BEGIN
  -- Get the opportunity owner's ID and title
  SELECT organization_id, title INTO opportunity_owner_id, opportunity_title
  FROM opportunities
  WHERE id = NEW.opportunity_id;

  -- Get the applicant's name
  SELECT name INTO applicant_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Create notification for opportunity owner
  INSERT INTO notifications (
    user_id,
    message,
    type,
    reference_id,
    read
  ) VALUES (
    opportunity_owner_id,
    applicant_name || ' has applied to your post: ' || opportunity_title,
    'application',
    NEW.id,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new applications
DROP TRIGGER IF EXISTS on_application_created ON applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_application_notification();

-- Update notifications policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);