-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_profile_stats_trigger ON completions;
DROP FUNCTION IF EXISTS update_profile_stats();

-- Create updated function to handle completions
CREATE OR REPLACE FUNCTION handle_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a new completion or status changed to completed
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    
    -- Update volunteer's stats
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
      p.name,
      p.avatar_url,
      'completed',
      o.title
    FROM 
      profiles p,
      opportunities o
    WHERE 
      p.id = NEW.volunteer_id AND
      o.id = NEW.opportunity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger that fires on both INSERT and UPDATE
CREATE TRIGGER handle_completion_trigger
  AFTER INSERT OR UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION handle_completion();