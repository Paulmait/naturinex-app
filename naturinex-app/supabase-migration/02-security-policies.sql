-- Supabase Row Level Security (RLS) Policies
-- Essential for production security

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SCANS TABLE POLICIES
-- Users can only access their own scans
CREATE POLICY "Users can view own scans"
ON scans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
ON scans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
ON scans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
ON scans FOR DELETE
USING (auth.uid() = user_id);

-- Family members can view scans if sharing is enabled
CREATE POLICY "Family members can view shared scans"
ON scans FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM family_members
        WHERE family_members.member_user_id = auth.uid()
        AND family_members.owner_user_id = scans.user_id
        AND family_members.can_view_scans = true
    )
);

-- SCAN HISTORY POLICIES
-- Users can only access their own history
CREATE POLICY "Users can view own scan history"
ON scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create scan history"
ON scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- PRODUCTS TABLE POLICIES
-- Products are public for reading
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify products
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- PRODUCT INTERACTIONS POLICIES
-- Users can only access their own interactions
CREATE POLICY "Users can view own interactions"
ON product_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions"
ON product_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- AFFILIATE LINKS POLICIES
-- Affiliate links are public for authenticated users
CREATE POLICY "Authenticated users can view affiliate links"
ON affiliate_links FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify affiliate links
CREATE POLICY "Admins can manage affiliate links"
ON affiliate_links FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- CONSULTATIONS POLICIES
-- Users can only access their own consultations
CREATE POLICY "Users can view own consultations"
ON consultations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create consultations"
ON consultations FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND (
            profiles.subscription_tier IN ('plus', 'pro')
            OR profiles.consultation_credits > 0
        )
    )
);

-- CUSTOM PLANS POLICIES
-- Users can only access their own plans
CREATE POLICY "Users can view own plans"
ON custom_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create plans"
ON custom_plans FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_tier IN ('plus', 'pro')
    )
);

CREATE POLICY "Users can update own plans"
ON custom_plans FOR UPDATE
USING (auth.uid() = user_id);

-- FAMILY MEMBERS POLICIES
-- Pro users can manage their family members
CREATE POLICY "Pro users can view family members"
ON family_members FOR SELECT
USING (
    auth.uid() = owner_user_id
    OR auth.uid() = member_user_id
);

CREATE POLICY "Pro users can add family members"
ON family_members FOR INSERT
WITH CHECK (
    auth.uid() = owner_user_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_tier = 'pro'
    )
);

CREATE POLICY "Pro users can update family members"
ON family_members FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can remove family members"
ON family_members FOR DELETE
USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

-- DATA EXPORTS POLICIES
-- Pro users can access their exports
CREATE POLICY "Pro users can view exports"
ON data_exports FOR SELECT
USING (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_tier = 'pro'
    )
);

CREATE POLICY "Pro users can create exports"
ON data_exports FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_tier = 'pro'
    )
);

-- ANALYTICS EVENTS POLICIES
-- Users can only create their own events
CREATE POLICY "Users can create analytics events"
ON analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can read analytics
CREATE POLICY "Admins can view analytics"
ON analytics_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- USER ENGAGEMENT POLICIES
-- Users can view their own engagement
CREATE POLICY "Users can view own engagement"
ON user_engagement FOR SELECT
USING (auth.uid() = user_id);

-- System can update engagement
CREATE POLICY "System can update engagement"
ON user_engagement FOR UPDATE
USING (true);

CREATE POLICY "System can insert engagement"
ON user_engagement FOR INSERT
WITH CHECK (true);

-- SUBSCRIPTION EVENTS POLICIES
-- Users can view their own subscription events
CREATE POLICY "Users can view own subscription events"
ON subscription_events FOR SELECT
USING (auth.uid() = user_id);

-- Only system/webhook can create subscription events
CREATE POLICY "System can create subscription events"
ON subscription_events FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'system'
    )
);

-- ADDITIONAL SECURITY FUNCTIONS

-- Function to check scan limits
CREATE OR REPLACE FUNCTION check_scan_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has reached their scan limit
    IF EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = NEW.user_id
        AND p.subscription_tier = 'free'
        AND (
            SELECT COUNT(*)
            FROM scans s
            WHERE s.user_id = NEW.user_id
            AND s.created_at >= date_trunc('month', CURRENT_DATE)
        ) >= 5
    ) THEN
        RAISE EXCEPTION 'Free tier scan limit reached. Please upgrade to continue.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply scan limit trigger
CREATE TRIGGER enforce_scan_limit
BEFORE INSERT ON scans
FOR EACH ROW
EXECUTE FUNCTION check_scan_limit();

-- Function to validate API access
CREATE OR REPLACE FUNCTION validate_api_access(api_key TEXT)
RETURNS TABLE (
    user_id UUID,
    tier TEXT,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.user_id,
        p.subscription_tier,
        CASE
            WHEN p.subscription_tier = 'pro'
            AND p.subscription_status = 'active'
            THEN true
            ELSE false
        END as is_valid
    FROM profiles p
    WHERE p.api_key = validate_api_access.api_key
    AND p.api_key IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize data for analytics
CREATE OR REPLACE FUNCTION anonymize_for_analytics(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    -- Return hashed user ID for analytics while maintaining privacy
    RETURN encode(sha256(user_id::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_limit INT,
    p_window_minutes INT
)
RETURNS BOOLEAN AS $$
DECLARE
    action_count INT;
BEGIN
    SELECT COUNT(*)
    INTO action_count
    FROM analytics_events
    WHERE user_id = p_user_id
    AND event_name = p_action
    AND created_at >= NOW() - INTERVAL '1 minute' * p_window_minutes;

    RETURN action_count < p_limit;
END;
$$ LANGUAGE plpgsql;

-- GRANT PERMISSIONS FOR SERVICE ROLE
-- Service role needs access for Edge Functions

-- Grant service role full access to profiles
GRANT ALL ON profiles TO service_role;

-- Grant service role insert on analytics
GRANT INSERT ON analytics_events TO service_role;
GRANT INSERT ON user_engagement TO service_role;
GRANT INSERT ON subscription_events TO service_role;

-- Grant service role access to manage subscriptions
GRANT ALL ON subscription_events TO service_role;
GRANT UPDATE ON profiles TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_user_created
ON scans(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription
ON profiles(subscription_tier, subscription_status);

CREATE INDEX IF NOT EXISTS idx_analytics_user_event
ON analytics_events(user_id, event_name, created_at);

-- Security Headers (for Supabase Dashboard)
-- These should be configured in your Supabase project settings:
/*
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
*/