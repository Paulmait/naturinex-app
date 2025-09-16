-- Security and Analytics Tables for Production
-- Run this in Supabase SQL Editor

-- 1. Scan logs table for tracking all scans
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  medication TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  response_time_ms INTEGER,
  api_cost_cents DECIMAL(10,2) DEFAULT 0.2, -- Track costs
  country_code TEXT,
  region TEXT,
  city TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Abuse logs for tracking violations
CREATE TABLE IF NOT EXISTS abuse_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  action TEXT NOT NULL, -- 'rate_limit', 'suspicious_pattern', 'blocked'
  details JSONB,
  severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rate limits tracking with expiry
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT UNIQUE NOT NULL, -- IP + UserAgent hash
  identifier_type TEXT DEFAULT 'ip_ua', -- 'ip_ua', 'device_id', 'user_id'
  request_count INTEGER DEFAULT 1,
  first_request TIMESTAMPTZ DEFAULT NOW(),
  last_request TIMESTAMPTZ DEFAULT NOW(),
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  total_requests_all_time INTEGER DEFAULT 1
);

-- 4. Device fingerprints for better tracking
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT UNIQUE NOT NULL,
  ip_addresses TEXT[], -- Array of seen IPs
  user_agents TEXT[], -- Array of seen UAs
  user_ids UUID[], -- Array of associated user IDs
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  total_scans INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  metadata JSONB
);

-- 5. Analytics aggregates for dashboard
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_scans INTEGER DEFAULT 0,
  anonymous_scans INTEGER DEFAULT 0,
  authenticated_scans INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  unique_ips INTEGER DEFAULT 0,
  unique_devices INTEGER DEFAULT 0,
  api_cost_total DECIMAL(10,2) DEFAULT 0,
  abuse_attempts INTEGER DEFAULT 0,
  blocked_requests INTEGER DEFAULT 0,
  top_medications JSONB,
  geographic_distribution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Real-time monitoring alerts
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'high_usage', 'abuse_detected', 'cost_threshold'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  details JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scan_logs_ip ON scan_logs(ip_address);
CREATE INDEX idx_scan_logs_timestamp ON scan_logs(timestamp);
CREATE INDEX idx_scan_logs_user ON scan_logs(user_id);
CREATE INDEX idx_scan_logs_device ON scan_logs(device_fingerprint);
CREATE INDEX idx_abuse_logs_ip ON abuse_logs(ip_address);
CREATE INDEX idx_abuse_logs_severity ON abuse_logs(severity);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(blocked_until);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_analytics_date ON analytics_daily(date);
CREATE INDEX idx_monitoring_alerts_type ON monitoring_alerts(alert_type);
CREATE INDEX idx_monitoring_alerts_resolved ON monitoring_alerts(is_resolved);

-- Enable Row Level Security
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only service role can write to security tables
CREATE POLICY "Service role write" ON scan_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON abuse_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON rate_limits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON device_fingerprints FOR ALL USING (auth.role() = 'service_role');

-- Admin can read monitoring data
CREATE POLICY "Admin read" ON analytics_daily FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);
CREATE POLICY "Admin read" ON monitoring_alerts FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'admin'
  )
);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION update_analytics_daily()
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_daily (
    date,
    total_scans,
    anonymous_scans,
    authenticated_scans,
    unique_users,
    unique_ips,
    api_cost_total
  )
  SELECT
    CURRENT_DATE,
    COUNT(*),
    COUNT(*) FILTER (WHERE is_anonymous = true),
    COUNT(*) FILTER (WHERE is_anonymous = false),
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT ip_address),
    SUM(api_cost_cents) / 100
  FROM scan_logs
  WHERE DATE(timestamp) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE SET
    total_scans = EXCLUDED.total_scans,
    anonymous_scans = EXCLUDED.anonymous_scans,
    authenticated_scans = EXCLUDED.authenticated_scans,
    unique_users = EXCLUDED.unique_users,
    unique_ips = EXCLUDED.unique_ips,
    api_cost_total = EXCLUDED.api_cost_total;
END;
$$ LANGUAGE plpgsql;

-- Function to check for abuse patterns
CREATE OR REPLACE FUNCTION check_abuse_patterns(
  p_ip TEXT,
  p_device_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
  is_suspicious BOOLEAN := false;
BEGIN
  -- Check for rapid-fire requests (more than 10 in last minute)
  SELECT COUNT(*) INTO recent_count
  FROM scan_logs
  WHERE ip_address = p_ip
    AND timestamp > NOW() - INTERVAL '1 minute';

  IF recent_count > 10 THEN
    INSERT INTO abuse_logs (ip_address, device_fingerprint, action, severity, details)
    VALUES (p_ip, p_device_id, 'rapid_fire', 'high',
            jsonb_build_object('count', recent_count, 'window', '1 minute'));
    is_suspicious := true;
  END IF;

  RETURN is_suspicious;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure for rate limiting check
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_limit INTEGER,
  p_window_hours INTEGER
) RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_count INTEGER;
  v_first_request TIMESTAMPTZ;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Check if currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM rate_limits
  WHERE identifier = p_identifier;

  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN QUERY SELECT false, 0, v_blocked_until;
    RETURN;
  END IF;

  -- Get current window data
  SELECT request_count, window_start INTO v_count, v_first_request
  FROM rate_limits
  WHERE identifier = p_identifier
    AND window_start > NOW() - (p_window_hours || ' hours')::INTERVAL;

  IF NOT FOUND THEN
    -- First request in window
    INSERT INTO rate_limits (identifier, request_count, window_start)
    VALUES (p_identifier, 1, NOW())
    ON CONFLICT (identifier) DO UPDATE
    SET request_count = 1, window_start = NOW();

    RETURN QUERY SELECT true, p_limit - 1, NOW() + (p_window_hours || ' hours')::INTERVAL;
  ELSIF v_count >= p_limit THEN
    -- Rate limit exceeded
    UPDATE rate_limits
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE identifier = p_identifier;

    RETURN QUERY SELECT false, 0, v_first_request + (p_window_hours || ' hours')::INTERVAL;
  ELSE
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1,
        last_request = NOW()
    WHERE identifier = p_identifier;

    RETURN QUERY SELECT true, p_limit - v_count - 1, v_first_request + (p_window_hours || ' hours')::INTERVAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Alert trigger for high usage
CREATE OR REPLACE FUNCTION check_usage_alerts() RETURNS TRIGGER AS $$
BEGIN
  -- Alert if more than 100 scans in last hour
  IF (SELECT COUNT(*) FROM scan_logs WHERE timestamp > NOW() - INTERVAL '1 hour') > 100 THEN
    INSERT INTO monitoring_alerts (alert_type, severity, message, details)
    VALUES ('high_usage', 'warning', 'High scan volume detected',
            jsonb_build_object('hourly_count', 100))
    ON CONFLICT DO NOTHING;
  END IF;

  -- Alert if API costs exceed $10 today
  IF (SELECT SUM(api_cost_cents)/100 FROM scan_logs WHERE DATE(timestamp) = CURRENT_DATE) > 10 THEN
    INSERT INTO monitoring_alerts (alert_type, severity, message, details)
    VALUES ('cost_threshold', 'critical', 'Daily API cost exceeded $10',
            jsonb_build_object('cost', 10))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER usage_alert_trigger
  AFTER INSERT ON scan_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_usage_alerts();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON scan_logs TO authenticated;
GRANT SELECT ON analytics_daily TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Security tables created successfully!';
END $$;