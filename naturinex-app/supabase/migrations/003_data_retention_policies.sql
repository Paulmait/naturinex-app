-- Data Retention and AI Training Infrastructure
-- Implements tiered data storage and retention policies

-- 1. Update scan_logs table with retention fields
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'anonymous';
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS data_saved BOOLEAN DEFAULT false;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS available_for_training BOOLEAN DEFAULT true;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Create AI training dataset table
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES scan_logs(id),
  medication TEXT NOT NULL,
  alternatives_provided JSONB,
  user_feedback JSONB,
  effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 1 AND 5),
  training_approved BOOLEAN DEFAULT true,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB
);

-- 3. Create user scan quotas table
CREATE TABLE IF NOT EXISTS user_scan_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',

  -- Monthly limits
  monthly_limit INTEGER NOT NULL,
  scans_this_month INTEGER DEFAULT 0,
  month_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),

  -- Lifetime stats
  total_scans_lifetime INTEGER DEFAULT 0,

  -- Data retention settings
  data_retention_days INTEGER, -- NULL = forever, 0 = no save, 365 = 1 year

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Anonymous rate limiting table (per IP)
CREATE TABLE IF NOT EXISTS anonymous_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  device_fingerprint TEXT,

  -- Daily limit (3 per day)
  daily_scans INTEGER DEFAULT 0,
  daily_reset_at DATE DEFAULT CURRENT_DATE,

  -- Hourly limit tracking
  hourly_scans INTEGER DEFAULT 0,
  hourly_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('hour', NOW()),

  -- Blocking
  blocked_until TIMESTAMPTZ,
  total_violations INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_scan_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscription tiers configuration
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,

  -- Limits
  monthly_scan_limit INTEGER, -- NULL = unlimited
  daily_scan_limit INTEGER,   -- NULL = no daily limit

  -- Features
  save_scan_history BOOLEAN DEFAULT false,
  data_retention_days INTEGER, -- NULL = forever, 0 = no save
  ai_insights BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,

  -- Pricing
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),

  -- Metadata
  description TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert subscription tiers
INSERT INTO subscription_tiers (
  tier_name, display_name, monthly_scan_limit, daily_scan_limit,
  save_scan_history, data_retention_days, ai_insights,
  priority_support, api_access, price_monthly, price_yearly,
  description
) VALUES
  -- Anonymous users
  ('anonymous', 'Anonymous', 3, 3, false, 0, false, false, false, 0, 0,
   'Limited trial access - 3 scans per day'),

  -- Free account
  ('free', 'Free Account', 5, NULL, false, 0, false, false, false, 0, 0,
   '5 scans per month, no data saving'),

  -- Plus tier
  ('plus', 'Plus', 100, NULL, true, 365, true, false, false, 6.99, 69.99,
   '100 scans/month, 1 year data retention'),

  -- Pro tier
  ('pro', 'Professional', NULL, NULL, true, NULL, true, true, true, 12.99, 129.99,
   'Unlimited scans, permanent data storage, API access')
ON CONFLICT (tier_name) DO UPDATE SET
  monthly_scan_limit = EXCLUDED.monthly_scan_limit,
  daily_scan_limit = EXCLUDED.daily_scan_limit,
  save_scan_history = EXCLUDED.save_scan_history,
  data_retention_days = EXCLUDED.data_retention_days,
  price_monthly = EXCLUDED.price_monthly;

-- Create indexes
CREATE INDEX idx_scan_logs_retention ON scan_logs(retention_expires_at) WHERE retention_expires_at IS NOT NULL;
CREATE INDEX idx_scan_logs_training ON scan_logs(available_for_training) WHERE available_for_training = true;
CREATE INDEX idx_anonymous_limits_ip ON anonymous_rate_limits(ip_address, daily_reset_at);
CREATE INDEX idx_user_quotas_user ON user_scan_quotas(user_id);
CREATE INDEX idx_user_quotas_reset ON user_scan_quotas(month_reset_date);

-- Functions for rate limiting and data retention

-- Function to check anonymous rate limits (3 per day per IP)
CREATE OR REPLACE FUNCTION check_anonymous_rate_limit(
  p_ip_address TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
) RETURNS TABLE(
  allowed BOOLEAN,
  remaining_today INTEGER,
  message TEXT
) AS $$
DECLARE
  v_limit RECORD;
  v_daily_limit INTEGER := 3;
BEGIN
  -- Get or create rate limit record
  INSERT INTO anonymous_rate_limits (ip_address, device_fingerprint)
  VALUES (p_ip_address, p_device_fingerprint)
  ON CONFLICT (ip_address) DO UPDATE
  SET device_fingerprint = COALESCE(anonymous_rate_limits.device_fingerprint, EXCLUDED.device_fingerprint)
  RETURNING * INTO v_limit;

  -- Check if blocked
  IF v_limit.blocked_until IS NOT NULL AND v_limit.blocked_until > NOW() THEN
    RETURN QUERY SELECT false, 0, 'IP blocked until ' || v_limit.blocked_until::TEXT;
    RETURN;
  END IF;

  -- Reset daily counter if needed
  IF v_limit.daily_reset_at < CURRENT_DATE THEN
    UPDATE anonymous_rate_limits
    SET daily_scans = 0,
        daily_reset_at = CURRENT_DATE
    WHERE ip_address = p_ip_address;
    v_limit.daily_scans := 0;
  END IF;

  -- Check daily limit (3 per day)
  IF v_limit.daily_scans >= v_daily_limit THEN
    -- Record violation
    UPDATE anonymous_rate_limits
    SET total_violations = total_violations + 1,
        blocked_until = CASE
          WHEN total_violations >= 5 THEN NOW() + INTERVAL '24 hours'
          ELSE NULL
        END
    WHERE ip_address = p_ip_address;

    RETURN QUERY SELECT false, 0, 'Daily limit reached (3 scans per day for anonymous users)';
    RETURN;
  END IF;

  -- Increment counter
  UPDATE anonymous_rate_limits
  SET daily_scans = daily_scans + 1,
      last_scan_at = NOW()
  WHERE ip_address = p_ip_address;

  RETURN QUERY SELECT true, v_daily_limit - v_limit.daily_scans - 1, 'Scan allowed';
END;
$$ LANGUAGE plpgsql;

-- Function to check user rate limits based on tier
CREATE OR REPLACE FUNCTION check_user_rate_limit(
  p_user_id UUID
) RETURNS TABLE(
  allowed BOOLEAN,
  remaining_this_month INTEGER,
  tier TEXT,
  message TEXT
) AS $$
DECLARE
  v_quota RECORD;
  v_tier RECORD;
BEGIN
  -- Get or create user quota
  INSERT INTO user_scan_quotas (user_id, tier, monthly_limit, data_retention_days)
  SELECT p_user_id, COALESCE(p.subscription_tier, 'free'),
         CASE COALESCE(p.subscription_tier, 'free')
           WHEN 'free' THEN 5
           WHEN 'plus' THEN 100
           WHEN 'pro' THEN NULL  -- unlimited
           ELSE 5
         END,
         CASE COALESCE(p.subscription_tier, 'free')
           WHEN 'free' THEN 0     -- no save
           WHEN 'plus' THEN 365   -- 1 year
           WHEN 'pro' THEN NULL   -- forever
           ELSE 0
         END
  FROM profiles p
  WHERE p.user_id = p_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET tier = EXCLUDED.tier,
      monthly_limit = EXCLUDED.monthly_limit,
      data_retention_days = EXCLUDED.data_retention_days
  RETURNING * INTO v_quota;

  -- Reset monthly counter if needed
  IF v_quota.month_reset_date < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE user_scan_quotas
    SET scans_this_month = 0,
        month_reset_date = DATE_TRUNC('month', CURRENT_DATE)
    WHERE user_id = p_user_id;
    v_quota.scans_this_month := 0;
  END IF;

  -- Check if pro (unlimited)
  IF v_quota.tier = 'pro' THEN
    RETURN QUERY SELECT true, NULL::INTEGER, v_quota.tier, 'Unlimited scans';
    RETURN;
  END IF;

  -- Check monthly limit
  IF v_quota.scans_this_month >= v_quota.monthly_limit THEN
    RETURN QUERY SELECT false, 0, v_quota.tier,
      format('Monthly limit reached (%s/%s scans). Upgrade to continue.',
             v_quota.scans_this_month, v_quota.monthly_limit);
    RETURN;
  END IF;

  -- Increment counter
  UPDATE user_scan_quotas
  SET scans_this_month = scans_this_month + 1,
      total_scans_lifetime = total_scans_lifetime + 1
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, v_quota.monthly_limit - v_quota.scans_this_month - 1, v_quota.tier,
    format('Scan allowed (%s/%s this month)',
           v_quota.scans_this_month + 1, v_quota.monthly_limit);
END;
$$ LANGUAGE plpgsql;

-- Function to save scan with proper retention
CREATE OR REPLACE FUNCTION save_scan_with_retention(
  p_user_id UUID,
  p_medication TEXT,
  p_alternatives JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_device_fingerprint TEXT,
  p_tier TEXT
) RETURNS UUID AS $$
DECLARE
  v_scan_id UUID;
  v_save_data BOOLEAN;
  v_retention_days INTEGER;
  v_retention_expires TIMESTAMPTZ;
BEGIN
  -- Determine if we should save data based on tier
  SELECT save_scan_history, data_retention_days
  INTO v_save_data, v_retention_days
  FROM subscription_tiers
  WHERE tier_name = p_tier;

  -- Calculate retention expiry
  IF v_retention_days IS NULL THEN
    v_retention_expires := NULL;  -- Keep forever (Pro)
  ELSIF v_retention_days = 0 THEN
    v_save_data := false;  -- Don't save (Free)
  ELSE
    v_retention_expires := NOW() + (v_retention_days || ' days')::INTERVAL;  -- Plus: 1 year
  END IF;

  -- Always log the scan for analytics (but maybe not the results)
  INSERT INTO scan_logs (
    user_id, ip_address, user_agent, device_fingerprint,
    medication, is_anonymous, user_tier,
    data_saved, retention_expires_at,
    available_for_training
  ) VALUES (
    p_user_id, p_ip_address, p_user_agent, p_device_fingerprint,
    p_medication, p_user_id IS NULL, p_tier,
    v_save_data, v_retention_expires,
    true  -- All scans available for AI training
  ) RETURNING id INTO v_scan_id;

  -- Save to AI training data if we're keeping the data
  IF v_save_data THEN
    INSERT INTO ai_training_data (
      scan_id, medication, alternatives_provided,
      training_approved
    ) VALUES (
      v_scan_id, p_medication, p_alternatives,
      true
    );
  END IF;

  RETURN v_scan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Soft delete expired retention data
  UPDATE scan_logs
  SET deleted_at = NOW(),
      data_saved = false
  WHERE retention_expires_at IS NOT NULL
    AND retention_expires_at < NOW()
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Remove from AI training data
  DELETE FROM ai_training_data
  WHERE scan_id IN (
    SELECT id FROM scan_logs
    WHERE deleted_at IS NOT NULL
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to cleanup expired data (run daily)
-- Note: This would be set up as a cron job in Supabase dashboard
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');

-- RLS Policies
ALTER TABLE user_scan_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quotas
CREATE POLICY "Users view own quotas" ON user_scan_quotas
  FOR SELECT USING (user_id = auth.uid());

-- Everyone can view subscription tiers
CREATE POLICY "Public tier viewing" ON subscription_tiers
  FOR SELECT USING (true);

-- Only service role can modify rate limits
CREATE POLICY "Service role only" ON anonymous_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON ai_training_data
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON subscription_tiers TO anon, authenticated;
GRANT SELECT ON user_scan_quotas TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Data retention policies created successfully!';
  RAISE NOTICE 'Rate limits: Anonymous: 3/day, Free: 5/month, Plus: 100/month, Pro: Unlimited';
  RAISE NOTICE 'Data retention: Free: No save, Plus: 1 year, Pro: Forever';
  RAISE NOTICE 'All scans stored for AI training (anonymized)';
END $$;