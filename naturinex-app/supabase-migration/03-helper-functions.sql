-- Helper Functions for Supabase
-- Run this after creating tables and security policies

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        scans_this_month = scans_this_month + 1,
        scans_total = scans_total + 1,
        last_scan_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly scan counts
CREATE OR REPLACE FUNCTION reset_monthly_scans()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        scans_this_month = 0,
        updated_at = NOW()
    WHERE scans_this_month > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get policies count (for testing)
CREATE OR REPLACE FUNCTION get_policies_count()
RETURNS INTEGER AS $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RETURN policy_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule monthly reset (requires pg_cron extension)
-- Uncomment if you have pg_cron enabled:
/*
SELECT cron.schedule(
    'reset-monthly-scans',
    '0 0 1 * *', -- First day of each month at midnight
    'SELECT reset_monthly_scans();'
);
*/

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_scan_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_policies_count TO authenticated;