-- Monetization Schema for Naturinex
-- Adds tables for subscriptions, payments, and monetization features

-- =====================================================
-- SUBSCRIPTION & PAYMENT TABLES
-- =====================================================

-- Payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_method TEXT,

    -- Stripe references
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    stripe_charge_id TEXT,

    -- Metadata
    description TEXT,
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- One-time purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Purchase details
    type TEXT NOT NULL CHECK (type IN (
        'DETAILED_REPORT',
        'EXPERT_CONSULTATION',
        'CUSTOM_PROTOCOL',
        'PRIORITY_ANALYSIS',
        'INTERACTION_CHECK'
    )),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'completed',

    -- Stripe reference
    payment_intent_id TEXT,

    -- Delivery status
    delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    delivery_data JSONB,

    -- Access control
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON purchases(profile_id);
CREATE INDEX idx_purchases_type ON purchases(type);
CREATE INDEX idx_purchases_status ON purchases(status);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id),

    -- Consultation details
    status TEXT DEFAULT 'pending_scheduling',
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,

    -- Practitioner assignment
    practitioner_id UUID,
    practitioner_name TEXT,

    -- Meeting details
    meeting_url TEXT,
    meeting_id TEXT,

    -- Notes and follow-up
    notes TEXT,
    recording_url TEXT,
    protocol_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_user ON consultations(profile_id);
CREATE INDEX idx_consultations_scheduled ON consultations(scheduled_at);
CREATE INDEX idx_consultations_status ON consultations(status);

-- =====================================================
-- SCAN TRACKING & LIMITS
-- =====================================================

-- User scan statistics (for enforcing limits)
CREATE TABLE IF NOT EXISTS scan_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Daily stats
    scans_today INTEGER DEFAULT 0,
    last_scan_date DATE DEFAULT CURRENT_DATE,

    -- Monthly stats
    scans_this_month INTEGER DEFAULT 0,
    current_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
    current_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),

    -- All-time stats
    total_scans INTEGER DEFAULT 0,

    -- Limits
    daily_limit INTEGER DEFAULT 2, -- Free tier default
    monthly_limit INTEGER DEFAULT 5, -- Free tier default

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_stats_user ON scan_stats(user_id);

-- Function to increment scan count with limit checking
CREATE OR REPLACE FUNCTION check_and_increment_scan(
    p_user_id UUID,
    p_tier TEXT DEFAULT 'free'
) RETURNS BOOLEAN AS $$
DECLARE
    v_stats scan_stats%ROWTYPE;
    v_monthly_limit INTEGER;
    v_daily_limit INTEGER;
BEGIN
    -- Set limits based on tier
    CASE p_tier
        WHEN 'free' THEN
            v_monthly_limit := 5;
            v_daily_limit := 2;
        WHEN 'plus' THEN
            v_monthly_limit := -1; -- Unlimited
            v_daily_limit := 50;
        WHEN 'pro' THEN
            v_monthly_limit := -1; -- Unlimited
            v_daily_limit := -1; -- Unlimited
        ELSE
            v_monthly_limit := 5;
            v_daily_limit := 2;
    END CASE;

    -- Get or create stats
    INSERT INTO scan_stats (user_id, profile_id)
    VALUES (p_user_id, (SELECT id FROM profiles WHERE user_id = p_user_id))
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock and get current stats
    SELECT * INTO v_stats FROM scan_stats WHERE user_id = p_user_id FOR UPDATE;

    -- Reset daily count if new day
    IF v_stats.last_scan_date < CURRENT_DATE THEN
        v_stats.scans_today := 0;
        v_stats.last_scan_date := CURRENT_DATE;
    END IF;

    -- Reset monthly count if new month
    IF v_stats.current_month != EXTRACT(MONTH FROM NOW()) OR
       v_stats.current_year != EXTRACT(YEAR FROM NOW()) THEN
        v_stats.scans_this_month := 0;
        v_stats.current_month := EXTRACT(MONTH FROM NOW());
        v_stats.current_year := EXTRACT(YEAR FROM NOW());
    END IF;

    -- Check limits
    IF v_monthly_limit != -1 AND v_stats.scans_this_month >= v_monthly_limit THEN
        RETURN FALSE; -- Monthly limit reached
    END IF;

    IF v_daily_limit != -1 AND v_stats.scans_today >= v_daily_limit THEN
        RETURN FALSE; -- Daily limit reached
    END IF;

    -- Increment counts
    UPDATE scan_stats
    SET
        scans_today = v_stats.scans_today + 1,
        scans_this_month = v_stats.scans_this_month + 1,
        total_scans = v_stats.total_scans + 1,
        last_scan_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE; -- Scan allowed
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AFFILIATE TRACKING
-- =====================================================

-- Affiliate clicks tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id TEXT NOT NULL,

    -- Affiliate program details
    program TEXT NOT NULL, -- AMAZON, IHERB, etc.
    product_id TEXT,
    product_name TEXT,
    identifier TEXT, -- ASIN, SKU, etc.

    -- Tracking data
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,

    -- Attribution window
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX idx_affiliate_clicks_session ON affiliate_clicks(session_id);
CREATE INDEX idx_affiliate_clicks_created ON affiliate_clicks(created_at DESC);

-- Affiliate conversions (when click leads to sale)
CREATE TABLE IF NOT EXISTS affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    click_id UUID REFERENCES affiliate_clicks(id),
    user_id UUID,

    -- Conversion details
    program TEXT NOT NULL,
    order_id TEXT,
    product_id TEXT,
    sale_amount DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,4),

    -- Status
    status TEXT DEFAULT 'pending', -- pending, confirmed, paid
    confirmed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversions_user ON affiliate_conversions(user_id);
CREATE INDEX idx_conversions_status ON affiliate_conversions(status);

-- User referral tracking
CREATE TABLE IF NOT EXISTS user_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID,

    -- Referral details
    referral_code TEXT UNIQUE NOT NULL,
    referred_email TEXT,

    -- Status
    status TEXT DEFAULT 'pending', -- pending, signed_up, converted, paid
    signed_up_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Rewards
    referrer_reward_type TEXT, -- free_month, credit, commission
    referrer_reward_amount DECIMAL(10,2),
    referred_reward_type TEXT,
    referred_reward_amount DECIMAL(10,2),
    rewards_granted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON user_referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON user_referrals(referral_code);

-- =====================================================
-- DATA INSIGHTS & B2B
-- =====================================================

-- Anonymized analytics for B2B insights
CREATE TABLE IF NOT EXISTS analytics_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Aggregated data (no user identifiers)
    medication_name TEXT NOT NULL,
    scan_count INTEGER DEFAULT 1,

    -- Demographics (anonymized)
    age_group TEXT, -- 18-24, 25-34, etc.
    region TEXT, -- US-West, US-East, etc.

    -- Insights
    top_alternatives JSONB,
    average_rating DECIMAL(3,2),
    conversion_rate DECIMAL(5,4),

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_medication ON analytics_insights(medication_name);
CREATE INDEX idx_insights_period ON analytics_insights(period_start, period_end);

-- B2B data access logs
CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Client details
    client_id TEXT NOT NULL,
    client_name TEXT,
    api_key_hash TEXT,

    -- Access details
    endpoint TEXT,
    query_params JSONB,
    response_size INTEGER,
    response_time_ms INTEGER,

    -- Billing
    billable BOOLEAN DEFAULT TRUE,
    credits_used INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_access_client ON data_access_logs(client_id);
CREATE INDEX idx_data_access_created ON data_access_logs(created_at DESC);

-- =====================================================
-- PROMOTIONAL CODES & DISCOUNTS
-- =====================================================

-- Promotional codes usage
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Code details
    code TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Discount configuration
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2),

    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    uses_count INTEGER DEFAULT 0,

    -- Restrictions
    applicable_tiers TEXT[], -- ['plus', 'pro']
    applicable_billing TEXT[], -- ['monthly', 'yearly']
    first_time_only BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);

-- Promo code redemptions
CREATE TABLE IF NOT EXISTS promo_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promo_code_id UUID REFERENCES promo_codes(id),
    user_id UUID NOT NULL,

    -- Redemption details
    original_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),

    subscription_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user ON promo_redemptions(user_id);
CREATE INDEX idx_redemptions_code ON promo_redemptions(promo_code_id);

-- =====================================================
-- WEBHOOK EVENTS LOGGING
-- =====================================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    event_type TEXT NOT NULL,
    event_id TEXT,

    -- Payload
    data JSONB,

    -- Processing
    processed BOOLEAN DEFAULT TRUE,
    error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);

-- =====================================================
-- USER PERMISSIONS (for one-time purchases)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,

    permission TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    metadata JSONB
);

CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_permission ON user_permissions(permission);

-- =====================================================
-- PROTOCOL REQUESTS (for custom protocols)
-- =====================================================

CREATE TABLE IF NOT EXISTS protocol_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id),

    -- Request details
    medications TEXT[],
    health_conditions TEXT[],
    allergies TEXT[],
    preferences JSONB,

    -- Status
    status TEXT DEFAULT 'pending',

    -- Generated protocol
    protocol_data JSONB,
    protocol_pdf_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_protocol_requests_user ON protocol_requests(user_id);
CREATE INDEX idx_protocol_requests_status ON protocol_requests(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own consultations" ON consultations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own scan stats" ON scan_stats
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own affiliate clicks" ON affiliate_clicks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own conversions" ON affiliate_conversions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own referrals" ON user_referrals
    FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can view own promo redemptions" ON promo_redemptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own protocol requests" ON protocol_requests
    FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- INITIAL DATA POPULATION
-- =====================================================

-- Insert default promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, valid_until, max_uses, applicable_tiers, applicable_billing)
VALUES
    ('NATURAL2025', 'New Year, New You - 40% off', 'percentage', 40, '2025-02-01'::timestamptz, 1000, ARRAY['plus', 'pro'], ARRAY['yearly']),
    ('WELCOME50', 'Welcome offer - 50% off first month', 'percentage', 50, NULL, NULL, ARRAY['plus', 'pro'], ARRAY['monthly']),
    ('STUDENT', 'Student discount - 50% off', 'percentage', 50, NULL, NULL, ARRAY['plus'], ARRAY['monthly', 'yearly'])
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR MONETIZATION
-- =====================================================

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT subscription_tier INTO v_tier
    FROM profiles
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can scan
CREATE OR REPLACE FUNCTION can_user_scan(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier TEXT;
    v_can_scan BOOLEAN;
BEGIN
    v_tier := get_user_tier(p_user_id);
    v_can_scan := check_and_increment_scan(p_user_id, v_tier);
    RETURN v_can_scan;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate affiliate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    p_program TEXT,
    p_sale_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_rate DECIMAL;
BEGIN
    CASE p_program
        WHEN 'AMAZON' THEN v_rate := 0.04;
        WHEN 'IHERB' THEN v_rate := 0.08;
        WHEN 'VITACOST' THEN v_rate := 0.10;
        WHEN 'THORNE' THEN v_rate := 0.15;
        WHEN 'FULLSCRIPT' THEN v_rate := 0.20;
        ELSE v_rate := 0.05;
    END CASE;

    RETURN p_sale_amount * v_rate;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Tracks all payment transactions';
COMMENT ON TABLE purchases IS 'One-time in-app purchases';
COMMENT ON TABLE consultations IS 'Expert consultation bookings';
COMMENT ON TABLE scan_stats IS 'User scan statistics and limit enforcement';
COMMENT ON TABLE affiliate_clicks IS 'Affiliate link click tracking';
COMMENT ON TABLE affiliate_conversions IS 'Successful affiliate conversions';
COMMENT ON TABLE user_referrals IS 'User-to-user referral tracking';
COMMENT ON TABLE promo_codes IS 'Promotional code configurations';
COMMENT ON FUNCTION check_and_increment_scan IS 'Checks scan limits and increments counter if allowed';
COMMENT ON FUNCTION get_user_tier IS 'Returns the subscription tier for a user';

-- Grant necessary permissions for functions
GRANT EXECUTE ON FUNCTION check_and_increment_scan TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_scan TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Monetization schema created successfully!';
    RAISE NOTICE 'Tables created: payments, purchases, consultations, scan_stats, affiliate tracking, etc.';
    RAISE NOTICE 'Functions created: scan limit checking, commission calculation';
    RAISE NOTICE 'Default promo codes added: NATURAL2025, WELCOME50, STUDENT';
END $$;