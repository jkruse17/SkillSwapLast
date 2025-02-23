-- Create connections table
CREATE TABLE connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to handle connection notifications
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

-- Create triggers
CREATE TRIGGER connection_notification_trigger
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION handle_connection_notification();

-- Add indexes for better performance
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_recipient ON connections(recipient_id);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_created_at ON connections(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_connections_timestamp
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();