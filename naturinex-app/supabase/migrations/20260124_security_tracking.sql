-- Security Tracking Tables
-- Tracks password reset requests and failed logins for security monitoring

-- Password Reset Tracking
CREATE TABLE IF NOT EXISTS password_reset_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  user_agent TEXT,
  platform TEXT,
  timezone TEXT,
  screen_resolution TEXT,
  ip_address INET,
  request_source TEXT DEFAULT 'web',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by email and time
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tracking(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_time ON password_reset_tracking(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_email_time ON password_reset_tracking(email, requested_at DESC);

-- Failed Login Tracking
CREATE TABLE IF NOT EXISTS failed_login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  error_code TEXT,
  user_agent TEXT,
  platform TEXT,
  timezone TEXT,
  ip_address INET,
  attempt_source TEXT DEFAULT 'web',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_tracking(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_tracking(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_email_time ON failed_login_tracking(email, attempted_at DESC);

-- Enable Row Level Security
ALTER TABLE password_reset_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for tracking from client)
CREATE POLICY "Allow anonymous insert password reset tracking" ON password_reset_tracking
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous insert failed login tracking" ON failed_login_tracking
  FOR INSERT TO anon WITH CHECK (true);

-- Policy: Only service role can read (admin access)
CREATE POLICY "Service role can read password reset tracking" ON password_reset_tracking
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can read failed login tracking" ON failed_login_tracking
  FOR SELECT TO service_role USING (true);

-- View for security monitoring (aggregated stats)
CREATE OR REPLACE VIEW security_monitoring_summary AS
SELECT
  'password_reset' as event_type,
  DATE(requested_at) as event_date,
  COUNT(*) as total_events,
  COUNT(DISTINCT email) as unique_users,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
FROM password_reset_tracking
WHERE requested_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(requested_at)
UNION ALL
SELECT
  'failed_login' as event_type,
  DATE(attempted_at) as event_date,
  COUNT(*) as total_events,
  COUNT(DISTINCT email) as unique_users,
  0 as successful,
  COUNT(*) as failed
FROM failed_login_tracking
WHERE attempted_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(attempted_at)
ORDER BY event_date DESC;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(check_email TEXT)
RETURNS TABLE (
  activity_type TEXT,
  count BIGINT,
  severity TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- Check password reset frequency
  RETURN QUERY
  SELECT
    'password_reset_frequency'::TEXT,
    COUNT(*)::BIGINT,
    CASE
      WHEN COUNT(*) > 10 THEN 'high'
      WHEN COUNT(*) > 5 THEN 'medium'
      ELSE 'low'
    END::TEXT,
    CASE
      WHEN COUNT(*) > 10 THEN 'Account may be under attack - consider temporary lock'
      WHEN COUNT(*) > 5 THEN 'Unusual activity - monitor closely'
      ELSE 'Normal activity'
    END::TEXT
  FROM password_reset_tracking
  WHERE email = check_email
    AND requested_at > NOW() - INTERVAL '24 hours';

  -- Check failed login frequency
  RETURN QUERY
  SELECT
    'failed_login_frequency'::TEXT,
    COUNT(*)::BIGINT,
    CASE
      WHEN COUNT(*) > 10 THEN 'high'
      WHEN COUNT(*) > 5 THEN 'medium'
      ELSE 'low'
    END::TEXT,
    CASE
      WHEN COUNT(*) > 10 THEN 'Possible brute force attack - lock account'
      WHEN COUNT(*) > 5 THEN 'Multiple failed attempts - send alert'
      ELSE 'Normal activity'
    END::TEXT
  FROM failed_login_tracking
  WHERE email = check_email
    AND attempted_at > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION check_suspicious_activity(TEXT) TO service_role;

COMMENT ON TABLE password_reset_tracking IS 'Tracks all password reset requests for security monitoring';
COMMENT ON TABLE failed_login_tracking IS 'Tracks failed login attempts for detecting brute force attacks';
