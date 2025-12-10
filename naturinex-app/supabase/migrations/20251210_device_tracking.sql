-- Device Usage Tracking Migration
-- This prevents guest mode bypass by tracking scans server-side

-- Create device_usage table
CREATE TABLE IF NOT EXISTS device_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT NOT NULL UNIQUE,
  scan_count INTEGER DEFAULT 0,
  first_scan_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_scan_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_usage_device_id ON device_usage(device_id);
CREATE INDEX IF NOT EXISTS idx_device_usage_user_id ON device_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_device_usage_scan_count ON device_usage(scan_count);
CREATE INDEX IF NOT EXISTS idx_device_usage_is_blocked ON device_usage(is_blocked);
CREATE INDEX IF NOT EXISTS idx_device_usage_last_scan_at ON device_usage(last_scan_at);

-- Create api_usage_logs table for monitoring
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  input_length INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for api logs
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_function_name ON api_usage_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- Function to increment device scan count
CREATE OR REPLACE FUNCTION increment_device_scan(p_device_id TEXT)
RETURNS TABLE(scan_count INTEGER, remaining_scans INTEGER, is_blocked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scan_count INTEGER;
  v_is_blocked BOOLEAN;
  v_remaining INTEGER;
BEGIN
  -- Insert or update device usage
  INSERT INTO device_usage (device_id, scan_count, last_scan_at)
  VALUES (p_device_id, 1, NOW())
  ON CONFLICT (device_id)
  DO UPDATE SET
    scan_count = device_usage.scan_count + 1,
    last_scan_at = NOW(),
    updated_at = NOW()
  RETURNING device_usage.scan_count, device_usage.is_blocked
  INTO v_scan_count, v_is_blocked;

  -- Calculate remaining scans (3 free scans for guests)
  v_remaining := GREATEST(0, 3 - v_scan_count);

  RETURN QUERY SELECT v_scan_count, v_remaining, v_is_blocked;
END;
$$;

-- Function to check device scan limit
CREATE OR REPLACE FUNCTION check_device_scan_limit(p_device_id TEXT)
RETURNS TABLE(can_scan BOOLEAN, scan_count INTEGER, remaining_scans INTEGER, is_blocked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scan_count INTEGER;
  v_is_blocked BOOLEAN;
  v_remaining INTEGER;
  v_can_scan BOOLEAN;
BEGIN
  -- Get device usage
  SELECT du.scan_count, du.is_blocked
  INTO v_scan_count, v_is_blocked
  FROM device_usage du
  WHERE du.device_id = p_device_id;

  -- If no record found, device can scan (first time)
  IF NOT FOUND THEN
    v_scan_count := 0;
    v_is_blocked := FALSE;
    v_remaining := 3;
    v_can_scan := TRUE;
  ELSE
    -- Calculate remaining scans
    v_remaining := GREATEST(0, 3 - v_scan_count);
    v_can_scan := v_remaining > 0 AND NOT v_is_blocked;
  END IF;

  RETURN QUERY SELECT v_can_scan, COALESCE(v_scan_count, 0), v_remaining, COALESCE(v_is_blocked, FALSE);
END;
$$;

-- Function to block a device
CREATE OR REPLACE FUNCTION block_device(p_device_id TEXT, p_reason TEXT DEFAULT 'Suspicious activity')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE device_usage
  SET
    is_blocked = TRUE,
    blocked_reason = p_reason,
    blocked_at = NOW(),
    updated_at = NOW()
  WHERE device_id = p_device_id;

  RETURN FOUND;
END;
$$;

-- Function to unblock a device
CREATE OR REPLACE FUNCTION unblock_device(p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE device_usage
  SET
    is_blocked = FALSE,
    blocked_reason = NULL,
    blocked_at = NULL,
    updated_at = NOW()
  WHERE device_id = p_device_id;

  RETURN FOUND;
END;
$$;

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE device_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Device usage policies
-- Allow users to read their own device data
CREATE POLICY "Users can read own device data"
ON device_usage FOR SELECT
USING (
  device_id IN (
    SELECT device_id FROM device_usage WHERE user_id = auth.uid()
  )
  OR auth.uid() IS NOT NULL -- Allow authenticated users to check any device (for their own scans)
);

-- Allow service role to manage all data
CREATE POLICY "Service role can manage all device data"
ON device_usage FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- API usage logs policies
-- Users can read their own logs
CREATE POLICY "Users can read own api logs"
ON api_usage_logs FOR SELECT
USING (user_id = auth.uid());

-- Service role can manage all logs
CREATE POLICY "Service role can manage all api logs"
ON api_usage_logs FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow Edge Functions to insert logs
CREATE POLICY "Edge functions can insert api logs"
ON api_usage_logs FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_device_usage_updated_at
BEFORE UPDATE ON device_usage
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON device_usage TO authenticated;
GRANT ALL ON api_usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION increment_device_scan TO authenticated;
GRANT EXECUTE ON FUNCTION check_device_scan_limit TO authenticated;
GRANT EXECUTE ON FUNCTION block_device TO service_role;
GRANT EXECUTE ON FUNCTION unblock_device TO service_role;

-- Add comment
COMMENT ON TABLE device_usage IS 'Tracks device usage to prevent guest mode bypass and enforce free scan limits';
COMMENT ON TABLE api_usage_logs IS 'Logs API usage for monitoring and analytics';
COMMENT ON FUNCTION increment_device_scan IS 'Increments scan count for a device and returns updated counts';
COMMENT ON FUNCTION check_device_scan_limit IS 'Checks if a device has remaining free scans';
COMMENT ON FUNCTION block_device IS 'Blocks a device from scanning';
COMMENT ON FUNCTION unblock_device IS 'Unblocks a previously blocked device';
