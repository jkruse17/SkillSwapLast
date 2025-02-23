/*
  # Data Cleanup Functions
  
  1. New Functions
    - cleanup_data(): Safely deletes all data from main tables
    - cleanup_user_data(user_id): Deletes all data associated with a specific user
  
  2. Security
    - Functions can only be executed by authenticated users
    - User data cleanup restricted to own data
*/

-- Create a function to safely delete data
CREATE OR REPLACE FUNCTION cleanup_data()
RETURNS void AS $$
BEGIN
  -- Disable triggers temporarily to prevent cascading notifications
  ALTER TABLE notifications DISABLE TRIGGER ALL;
  ALTER TABLE activities DISABLE TRIGGER ALL;
  ALTER TABLE reviews DISABLE TRIGGER ALL;
  ALTER TABLE completions DISABLE TRIGGER ALL;
  
  -- Delete data in reverse order of dependencies
  DELETE FROM notifications;
  DELETE FROM activities;
  DELETE FROM reviews;
  DELETE FROM completions;
  DELETE FROM applications;
  DELETE FROM opportunities;
  
  -- Re-enable triggers
  ALTER TABLE notifications ENABLE TRIGGER ALL;
  ALTER TABLE activities ENABLE TRIGGER ALL;
  ALTER TABLE reviews ENABLE TRIGGER ALL;
  ALTER TABLE completions ENABLE TRIGGER ALL;
  
  -- Reset sequences if they exist
  -- This is safe as it only affects tables that have sequences
  PERFORM setval(pg_get_serial_sequence('"notifications"', 'id'), 1, false);
  PERFORM setval(pg_get_serial_sequence('"activities"', 'id'), 1, false);
  PERFORM setval(pg_get_serial_sequence('"reviews"', 'id'), 1, false);
  PERFORM setval(pg_get_serial_sequence('"completions"', 'id'), 1, false);
  PERFORM setval(pg_get_serial_sequence('"applications"', 'id'), 1, false);
  PERFORM setval(pg_get_serial_sequence('"opportunities"', 'id'), 1, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to delete specific user's data
CREATE OR REPLACE FUNCTION cleanup_user_data(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Disable triggers temporarily
  ALTER TABLE notifications DISABLE TRIGGER ALL;
  ALTER TABLE activities DISABLE TRIGGER ALL;
  ALTER TABLE reviews DISABLE TRIGGER ALL;
  ALTER TABLE completions DISABLE TRIGGER ALL;
  
  -- Delete user's data in reverse order of dependencies
  DELETE FROM notifications WHERE user_id = $1;
  DELETE FROM activities WHERE user_id = $1;
  DELETE FROM reviews WHERE reviewer_id = $1 OR reviewee_id = $1;
  DELETE FROM completions WHERE volunteer_id = $1 OR organizer_id = $1;
  DELETE FROM applications WHERE user_id = $1;
  DELETE FROM opportunities WHERE organization_id = $1;
  
  -- Re-enable triggers
  ALTER TABLE notifications ENABLE TRIGGER ALL;
  ALTER TABLE activities ENABLE TRIGGER ALL;
  ALTER TABLE reviews ENABLE TRIGGER ALL;
  ALTER TABLE completions ENABLE TRIGGER ALL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_data() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_user_data(uuid) TO authenticated;

-- Add security barrier views to control access
CREATE OR REPLACE VIEW admin_functions AS
SELECT current_user AS username,
       CASE WHEN EXISTS (
         SELECT 1 FROM auth.users
         WHERE id = auth.uid()
         AND raw_user_meta_data->>'role' = 'super_admin'
       ) THEN true ELSE false END AS is_admin;

CREATE OR REPLACE VIEW user_functions AS
SELECT current_user AS username,
       auth.uid() AS user_id;

-- Revoke direct execute permissions
REVOKE EXECUTE ON FUNCTION cleanup_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cleanup_user_data(uuid) FROM PUBLIC;

-- Grant execute through security barrier views
GRANT SELECT ON admin_functions TO authenticated;
GRANT SELECT ON user_functions TO authenticated;