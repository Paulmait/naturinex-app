-- Device Tracking Tables for Account Security
-- Prevents account sharing and abuse

-- User Devices Table
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT, -- ios, android, web
  device_model TEXT,
  os_version TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, device_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own devices
DROP POLICY IF EXISTS "Users can view own devices" ON user_devices;
CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own devices" ON user_devices;
CREATE POLICY "Users can insert own devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own devices" ON user_devices;
CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Security Events Table (audit trail)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events, but only admins can read
DROP POLICY IF EXISTS "Users can insert own security events" ON security_events;
CREATE POLICY "Users can insert own security events"
  ON security_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all security events" ON security_events;
CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add ip_address column to scans table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE scans ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- Function to count active devices for a user
CREATE OR REPLACE FUNCTION get_active_device_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_devices
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is registered
CREATE OR REPLACE FUNCTION is_device_registered(p_user_id UUID, p_device_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_devices
    WHERE user_id = p_user_id
      AND device_id = p_device_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_devices IS 'Tracks registered devices per user to prevent account sharing';
COMMENT ON TABLE security_events IS 'Audit trail for security-related events';
