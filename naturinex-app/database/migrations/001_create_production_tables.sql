-- Production Database Migrations for Naturinex
-- Run these migrations in Supabase SQL Editor
-- Version: 1.0
-- Date: 2025-01-17

-- =====================================================
-- 1. AUDIT LOGS TABLE (HIPAA Compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_role TEXT,
  session_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  severity TEXT DEFAULT 'info',
  metadata JSONB DEFAULT '{}'::jsonb,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit trail for all PHI access';

-- =====================================================
-- 2. DISCLAIMER ACCEPTANCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS disclaimer_acceptances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disclaimer_type TEXT NOT NULL,
  disclaimer_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disclaimer_user ON disclaimer_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_disclaimer_type ON disclaimer_acceptances(disclaimer_type);
CREATE INDEX IF NOT EXISTS idx_disclaimer_active ON disclaimer_acceptances(is_active);

-- Enable RLS
ALTER TABLE disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own acceptances"
  ON disclaimer_acceptances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances"
  ON disclaimer_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE disclaimer_acceptances IS 'Tracks user acceptance of medical disclaimers';

-- =====================================================
-- 3. SCANS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  medication_name TEXT NOT NULL,
  natural_alternatives JSONB NOT NULL,
  scan_source TEXT DEFAULT 'manual',
  ip_address TEXT,
  user_agent TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_device_fp ON scans(device_fingerprint);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all scans"
  ON scans FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE scans IS 'Medication scan history with alternatives';

-- =====================================================
-- 4. WEBHOOK EVENTS TABLE (Stripe Idempotency)
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON webhook_events(processed_at DESC);

COMMENT ON TABLE webhook_events IS 'Tracks processed webhooks for idempotency';

-- =====================================================
-- 5. PROFILES TABLE (Enhanced)
-- =====================================================

-- Check if profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  subscription_expires_at TIMESTAMPTZ,
  scans_this_month INTEGER DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE profiles IS 'User profiles with subscription information';

-- =====================================================
-- 6. RATE LIMIT TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

COMMENT ON TABLE rate_limits IS 'Tracks API rate limits per identifier';

-- =====================================================
-- 7. SUBSCRIPTION EVENTS TABLE (Audit Trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_tier TEXT,
  to_tier TEXT,
  from_status TEXT,
  to_status TEXT,
  stripe_event_id TEXT,
  stripe_subscription_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sub_events_created ON subscription_events(created_at DESC);

COMMENT ON TABLE subscription_events IS 'Audit trail for subscription changes';

-- =====================================================
-- 8. ABUSE LOGS TABLE (Security)
-- =====================================================

CREATE TABLE IF NOT EXISTS abuse_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  action TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abuse_logs_ip ON abuse_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_severity ON abuse_logs(severity);
CREATE INDEX IF NOT EXISTS idx_abuse_logs_created ON abuse_logs(created_at DESC);

COMMENT ON TABLE abuse_logs IS 'Tracks suspicious and abusive activity';

-- =====================================================
-- 9. DEVICE FINGERPRINTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fingerprint_hash TEXT UNIQUE NOT NULL,
  ip_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_agents TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_scans INTEGER DEFAULT 1,
  is_suspicious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_device_fp_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fp_suspicious ON device_fingerprints(is_suspicious);

COMMENT ON TABLE device_fingerprints IS 'Tracks device fingerprints for fraud detection';

-- =====================================================
-- 10. MONITORING ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON monitoring_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON monitoring_alerts(resolved);

COMMENT ON TABLE monitoring_alerts IS 'System monitoring and alerting';

-- =====================================================
-- FUNCTIONS AND STORED PROCEDURES
-- =====================================================

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET scans_this_month = scans_this_month + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly scan counts (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_scan_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET scans_this_month = 0,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_limit INTEGER,
  p_window_hours INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_hours || ' hours')::INTERVAL;
  v_window_end := NOW() + (p_window_hours || ' hours')::INTERVAL;

  -- Count requests in current window
  SELECT COUNT(*) INTO v_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND window_start >= v_window_start;

  -- Clean old entries
  DELETE FROM rate_limits
  WHERE identifier = p_identifier
    AND window_end < NOW();

  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, 0, v_window_end;
  ELSE
    -- Increment counter
    INSERT INTO rate_limits (identifier, request_count, window_start, window_end)
    VALUES (p_identifier, 1, NOW(), v_window_end);

    RETURN QUERY SELECT true, p_limit - v_count - 1, v_window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check abuse patterns
CREATE OR REPLACE FUNCTION check_abuse_patterns(
  p_ip TEXT,
  p_device_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_abuse_count INTEGER;
BEGIN
  -- Check for recent abuse from this IP/device
  SELECT COUNT(*) INTO v_recent_abuse_count
  FROM abuse_logs
  WHERE (ip_address = p_ip OR device_fingerprint = p_device_id)
    AND severity IN ('high', 'critical')
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Return true if suspicious activity detected
  RETURN v_recent_abuse_count >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update analytics (placeholder)
CREATE OR REPLACE FUNCTION update_analytics_daily()
RETURNS VOID AS $$
BEGIN
  -- Placeholder for daily analytics updates
  -- Implement based on your needs
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to scans table
DROP TRIGGER IF EXISTS update_scans_updated_at ON scans;
CREATE TRIGGER update_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default monitoring alert types
INSERT INTO monitoring_alerts (alert_type, severity, message, resolved)
VALUES
  ('system_initialized', 'info', 'Database migrations completed successfully', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANTS (If using service role)
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- COMPLETION
-- =====================================================

-- Log successful migration
INSERT INTO audit_logs (
  user_id,
  action,
  resource_type,
  status,
  metadata
) VALUES (
  'system',
  'database_migration',
  'database',
  'success',
  '{"version": "1.0", "date": "2025-01-17"}'::jsonb
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database migration completed successfully!';
  RAISE NOTICE 'Tables created: 10';
  RAISE NOTICE 'Functions created: 5';
  RAISE NOTICE 'Triggers created: 2';
  RAISE NOTICE 'Please verify all tables and run test queries.';
END $$;
