-- Fix subscription tier limits to match app pricing configuration
-- Free: 3 scans/month, Premium: 25 scans/month

-- Update subscription_tiers to match pricing.js
UPDATE subscription_tiers SET
  monthly_scan_limit = 3,
  daily_scan_limit = 3,
  description = '3 scans per month, no data saving'
WHERE tier_name = 'free';

-- Rename 'plus' to 'premium' and update limits
UPDATE subscription_tiers SET
  tier_name = 'premium',
  display_name = 'Premium',
  monthly_scan_limit = 25,
  daily_scan_limit = 10,
  save_scan_history = true,
  data_retention_days = 365,
  ai_insights = true,
  priority_support = true,
  price_monthly = 9.99,
  price_yearly = 99.99,
  description = '25 scans per month, 1 year data retention'
WHERE tier_name = 'plus';

-- Insert premium tier if it doesn't exist
INSERT INTO subscription_tiers (
  tier_name, display_name, monthly_scan_limit, daily_scan_limit,
  save_scan_history, data_retention_days, ai_insights,
  priority_support, api_access, price_monthly, price_yearly, description
) VALUES (
  'premium', 'Premium', 25, 10, true, 365, true, true, false, 9.99, 99.99,
  '25 scans per month, 1 year data retention'
) ON CONFLICT (tier_name) DO UPDATE SET
  monthly_scan_limit = 25,
  daily_scan_limit = 10,
  save_scan_history = true,
  data_retention_days = 365,
  ai_insights = true,
  priority_support = true,
  price_monthly = 9.99,
  price_yearly = 99.99;

-- Update user_scan_quotas function to use 'premium' instead of 'plus'
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
  v_tier_limits RECORD;
BEGIN
  -- Get user's subscription tier from profiles
  SELECT subscription_tier INTO v_quota
  FROM profiles
  WHERE user_id = p_user_id;

  -- Default to free if no profile
  IF v_quota.subscription_tier IS NULL THEN
    v_quota.subscription_tier := 'free';
  END IF;

  -- Get tier limits
  SELECT * INTO v_tier_limits
  FROM subscription_tiers
  WHERE tier_name = v_quota.subscription_tier;

  -- If tier not found, use free limits
  IF v_tier_limits IS NULL THEN
    SELECT * INTO v_tier_limits
    FROM subscription_tiers
    WHERE tier_name = 'free';
  END IF;

  -- Get or create user quota
  INSERT INTO user_scan_quotas (user_id, tier, monthly_limit, data_retention_days)
  VALUES (
    p_user_id,
    COALESCE(v_quota.subscription_tier, 'free'),
    COALESCE(v_tier_limits.monthly_scan_limit, 3),
    COALESCE(v_tier_limits.data_retention_days, 0)
  )
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

  -- Check if unlimited (monthly_limit is NULL)
  IF v_quota.monthly_limit IS NULL THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_user_rate_limit(UUID) TO authenticated, service_role;

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Subscription tiers updated to match app pricing:';
  RAISE NOTICE '  Free: 3 scans/month';
  RAISE NOTICE '  Premium: 25 scans/month, 10/day max';
END $$;
