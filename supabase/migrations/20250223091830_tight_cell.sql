/*
  # Update Connections Table and Policies

  1. Changes
    - Safely check for table existence before creating
    - Add missing indexes and constraints
    - Update notification triggers
    - Improve RLS policies

  2. Security
    - Enable RLS
    - Add policies for viewing and managing connections
    - Add notification triggers for connection events
*/

-- Only create table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connections') THEN
    CREATE TABLE connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(requester_id, recipient_id)
    );
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can create connection requests" ON connections;
DROP POLICY IF EXISTS "Users can update their connection requests" ON connections;

-- Enable RLS (safe to run multiple times)
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create updated policies
CREATE POLICY "Users can view their connections"
  ON connections FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can create connection requests"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id AND
    requester_id != recipient_id
  );

CREATE POLICY "Users can update their connection requests"
  ON connections FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (requester_id, recipient_id)
  );

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS connection_notification_trigger ON connections;
DROP FUNCTION IF EXISTS handle_connection_notification();

-- Create updated notification handler
CREATE OR REPLACE FUNCTION handle_connection_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For new connection requests
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (
      user_id,
      message,
      type,
      reference_id
    ) VALUES (
      NEW.recipient_id,
      (SELECT name || ' wants to connect with you' FROM profiles WHERE id = NEW.requester_id),
      'connection_request',
      NEW.id
    );
  -- For updated connections
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    -- Notify requester of accepted/rejected connection
    INSERT INTO notifications (
      user_id,
      message,
      type,
      reference_id
    ) VALUES (
      NEW.requester_id,
      (
        SELECT name || 
        CASE 
          WHEN NEW.status = 'accepted' THEN ' accepted your connection request'
          WHEN NEW.status = 'rejected' THEN ' declined your connection request'
          ELSE ' updated your connection request'
        END
        FROM profiles 
        WHERE id = NEW.recipient_id
      ),
      'connection_' || NEW.status,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification trigger
CREATE TRIGGER connection_notification_trigger
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_connection_notification();

-- Drop existing timestamp function and trigger if they exist
DROP TRIGGER IF EXISTS update_connections_timestamp ON connections;
DROP FUNCTION IF EXISTS update_connections_updated_at();

-- Create updated timestamp handler
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create timestamp trigger
CREATE TRIGGER update_connections_timestamp
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- Add or update indexes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_requester') THEN
    CREATE INDEX idx_connections_requester ON connections(requester_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_recipient') THEN
    CREATE INDEX idx_connections_recipient ON connections(recipient_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_status') THEN
    CREATE INDEX idx_connections_status ON connections(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_connections_created_at') THEN
    CREATE INDEX idx_connections_created_at ON connections(created_at);
  END IF;
END $$;