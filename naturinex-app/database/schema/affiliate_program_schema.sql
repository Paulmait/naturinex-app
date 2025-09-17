-- Comprehensive Affiliate Program Database Schema for NaturineX
-- Handles affiliate registration, tracking, commissions, payouts, and fraud prevention
-- Created: 2025-09-16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- AFFILIATES TABLE
-- ================================================
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic Information
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),

    -- Contact Information
    phone VARCHAR(20),
    website VARCHAR(255),
    social_media JSONB DEFAULT '{}', -- {twitter, instagram, youtube, tiktok, etc}

    -- Business Information
    business_type VARCHAR(50) NOT NULL DEFAULT 'individual', -- individual, business, influencer, healthcare_provider
    tax_id VARCHAR(50),
    business_name VARCHAR(200),
    business_address JSONB,

    -- Affiliate Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, suspended, banned, inactive
    tier VARCHAR(20) NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum, healthcare

    -- Commission Structure
    commission_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% default
    custom_rates JSONB DEFAULT '{}', -- Product/category specific rates

    -- Tracking Information
    signup_source VARCHAR(100),
    referral_source VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Payment Information
    payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- bank_transfer, paypal, stripe
    payment_details JSONB DEFAULT '{}', -- Encrypted payment info
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,

    -- Performance Metrics
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_commission_earned DECIMAL(12,2) DEFAULT 0,
    total_commission_paid DECIMAL(12,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,

    -- Verification and Compliance
    email_verified BOOLEAN DEFAULT false,
    identity_verified BOOLEAN DEFAULT false,
    tax_form_submitted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    terms_version VARCHAR(20),

    -- Fraud Prevention
    device_fingerprint JSONB,
    risk_score INTEGER DEFAULT 0,
    last_login_ip INET,
    suspicious_activity_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,

    -- Soft Delete
    deleted_at TIMESTAMPTZ
);

-- ================================================
-- AFFILIATE TIERS TABLE
-- ================================================
CREATE TABLE affiliate_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,

    -- Commission Structure
    base_commission_rate DECIMAL(5,4) NOT NULL,
    bonus_commission_rate DECIMAL(5,4) DEFAULT 0,
    minimum_monthly_sales DECIMAL(10,2) DEFAULT 0,

    -- Benefits
    benefits JSONB DEFAULT '{}',
    perks JSONB DEFAULT '{}',

    -- Requirements
    requirements JSONB DEFAULT '{}',
    qualification_criteria JSONB DEFAULT '{}',

    -- Marketing Assets Access
    marketing_assets_access TEXT[] DEFAULT '{}',
    custom_landing_pages BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- REFERRAL TRACKING TABLE
-- ================================================
CREATE TABLE referral_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Tracking Information
    tracking_code VARCHAR(100) NOT NULL,
    click_id UUID DEFAULT uuid_generate_v4(),

    -- Visitor Information
    visitor_ip INET,
    visitor_user_agent TEXT,
    visitor_fingerprint JSONB,
    referrer_url TEXT,
    landing_page TEXT,

    -- UTM Parameters
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),

    -- Product Information
    product_id VARCHAR(100),
    product_category VARCHAR(100),

    -- Geography
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Device Information
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(50),
    operating_system VARCHAR(50),

    -- Status and Conversion
    status VARCHAR(20) DEFAULT 'click', -- click, conversion, fraud, invalid
    converted BOOLEAN DEFAULT false,
    conversion_id UUID,
    conversion_value DECIMAL(10,2),
    commission_earned DECIMAL(10,2),

    -- Timestamps
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',

    -- Quality Score
    quality_score INTEGER DEFAULT 100,
    fraud_indicators JSONB DEFAULT '{}',

    UNIQUE(click_id, affiliate_id)
);

-- ================================================
-- COMMISSION CALCULATIONS TABLE
-- ================================================
CREATE TABLE commission_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES referral_tracking(id),

    -- Transaction Information
    transaction_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100),
    customer_id UUID,

    -- Product Information
    product_id VARCHAR(100),
    product_name TEXT,
    product_category VARCHAR(100),

    -- Financial Information
    gross_sale_amount DECIMAL(12,2) NOT NULL,
    net_sale_amount DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,

    -- Tier and Bonus Information
    tier_at_time VARCHAR(50),
    tier_bonus_rate DECIMAL(5,4) DEFAULT 0,
    tier_bonus_amount DECIMAL(10,2) DEFAULT 0,

    -- Special Promotions
    promotion_code VARCHAR(50),
    promotion_bonus_rate DECIMAL(5,4) DEFAULT 0,
    promotion_bonus_amount DECIMAL(10,2) DEFAULT 0,

    -- Status and Validation
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, reversed, paid
    validation_status VARCHAR(20) DEFAULT 'valid', -- valid, fraud, chargeback, refund

    -- Quality and Fraud
    quality_score INTEGER DEFAULT 100,
    fraud_indicators JSONB DEFAULT '{}',
    risk_factors JSONB DEFAULT '{}',

    -- Payment Information
    payout_id UUID,
    paid_at TIMESTAMPTZ,

    -- Timestamps
    transaction_date TIMESTAMPTZ NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    admin_notes TEXT
);

-- ================================================
-- PAYOUT HISTORY TABLE
-- ================================================
CREATE TABLE payout_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Payout Information
    payout_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Period Information
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    commission_count INTEGER NOT NULL,

    -- Payment Details
    payment_reference VARCHAR(200),
    payment_provider VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

    -- Tax Information
    tax_withheld DECIMAL(10,2) DEFAULT 0,
    tax_form_type VARCHAR(20), -- 1099, W2, international

    -- Banking Information (encrypted)
    bank_details JSONB,

    -- Status and Tracking
    status VARCHAR(20) DEFAULT 'pending',
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Audit Trail
    processed_by UUID,
    notes TEXT
);

-- ================================================
-- MARKETING ASSETS TABLE
-- ================================================
CREATE TABLE marketing_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Asset Information
    title VARCHAR(200) NOT NULL,
    description TEXT,
    asset_type VARCHAR(50) NOT NULL, -- banner, logo, email_template, social_post, video, landing_page
    category VARCHAR(100),

    -- File Information
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    dimensions VARCHAR(50), -- "300x250", "1200x630", etc.

    -- Access Control
    tier_access TEXT[] DEFAULT '{}', -- Which tiers can access this asset
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, archived

    -- Usage Tracking
    download_count INTEGER DEFAULT 0,
    usage_guidelines TEXT,

    -- SEO and Targeting
    tags TEXT[],
    target_audience VARCHAR(100),
    campaign_type VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Creator
    created_by UUID
);

-- ================================================
-- PERFORMANCE ANALYTICS TABLE
-- ================================================
CREATE TABLE performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Time Period
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly

    -- Traffic Metrics
    clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,

    -- Conversion Metrics
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    commission_earned DECIMAL(10,2) DEFAULT 0,

    -- Quality Metrics
    average_order_value DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
    return_customer_rate DECIMAL(5,4) DEFAULT 0,

    -- Product Performance
    top_products JSONB DEFAULT '{}',
    top_categories JSONB DEFAULT '{}',

    -- Geographic Performance
    top_countries JSONB DEFAULT '{}',
    top_regions JSONB DEFAULT '{}',

    -- Device Performance
    desktop_performance JSONB DEFAULT '{}',
    mobile_performance JSONB DEFAULT '{}',
    tablet_performance JSONB DEFAULT '{}',

    -- Traffic Sources
    traffic_sources JSONB DEFAULT '{}', -- {direct, social, email, paid, organic}

    -- Calculated Fields
    earnings_per_click DECIMAL(6,4) DEFAULT 0,
    cost_per_acquisition DECIMAL(8,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(affiliate_id, date, period_type)
);

-- ================================================
-- AFFILIATE CUSTOM LINKS TABLE
-- ================================================
CREATE TABLE affiliate_custom_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Link Information
    link_name VARCHAR(200) NOT NULL,
    original_url TEXT NOT NULL,
    custom_path VARCHAR(100) UNIQUE,
    tracking_code VARCHAR(100) NOT NULL,

    -- QR Code
    qr_code_url TEXT,
    qr_code_data TEXT,

    -- Targeting and Campaigns
    campaign_name VARCHAR(200),
    target_audience VARCHAR(100),
    geo_targeting JSONB DEFAULT '{}',

    -- Performance
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,

    -- Status and Settings
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, expired
    expires_at TIMESTAMPTZ,

    -- Custom Parameters
    custom_parameters JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- PARTNER INTEGRATIONS TABLE
-- ================================================
CREATE TABLE partner_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Partner Information
    partner_name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(50) NOT NULL, -- supplement_store, health_blog, influencer, healthcare_provider, corporate
    contact_email VARCHAR(255),
    contact_name VARCHAR(200),

    -- Integration Details
    api_key VARCHAR(200),
    webhook_url TEXT,
    integration_type VARCHAR(50), -- api, webhook, iframe, redirect

    -- Commission Structure
    partner_commission_rate DECIMAL(5,4),
    revenue_share_model VARCHAR(50), -- fixed_rate, tiered, performance_based

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive, terminated
    contract_start_date DATE,
    contract_end_date DATE,

    -- Performance
    total_referrals INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,

    -- Settings
    custom_branding JSONB DEFAULT '{}',
    allowed_products TEXT[],
    geo_restrictions JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- FRAUD DETECTION TABLE
-- ================================================
CREATE TABLE fraud_detection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id),
    referral_id UUID REFERENCES referral_tracking(id),

    -- Fraud Information
    fraud_type VARCHAR(50) NOT NULL, -- click_fraud, conversion_fraud, fake_traffic, chargeback
    confidence_score DECIMAL(5,4) NOT NULL, -- 0.0 to 1.0
    risk_level VARCHAR(20) NOT NULL, -- low, medium, high, critical

    -- Detection Method
    detection_method VARCHAR(50), -- automated, manual, third_party
    detection_rules TEXT[],

    -- Evidence
    evidence JSONB DEFAULT '{}',
    ip_reputation JSONB DEFAULT '{}',
    device_analysis JSONB DEFAULT '{}',
    behavioral_patterns JSONB DEFAULT '{}',

    -- Actions Taken
    action_taken VARCHAR(50), -- none, flag, suspend, block, investigate
    investigation_status VARCHAR(20) DEFAULT 'pending',
    resolution VARCHAR(20), -- false_positive, confirmed_fraud, inconclusive

    -- Financial Impact
    estimated_loss DECIMAL(10,2) DEFAULT 0,
    recovered_amount DECIMAL(10,2) DEFAULT 0,

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    investigated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,

    -- Investigator
    investigated_by UUID,
    notes TEXT
);

-- ================================================
-- AFFILIATE NOTIFICATIONS TABLE
-- ================================================
CREATE TABLE affiliate_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Notification Details
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- payout, commission, tier_upgrade, alert, news
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Actions
    action_url TEXT,
    action_label VARCHAR(100),

    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Delivery
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    push_sent BOOLEAN DEFAULT false,
    push_sent_at TIMESTAMPTZ,

    -- Expiration
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Affiliates table indexes
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_tier ON affiliates(tier);
CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_created_at ON affiliates(created_at);

-- Referral tracking indexes
CREATE INDEX idx_referral_tracking_affiliate_id ON referral_tracking(affiliate_id);
CREATE INDEX idx_referral_tracking_tracking_code ON referral_tracking(tracking_code);
CREATE INDEX idx_referral_tracking_click_id ON referral_tracking(click_id);
CREATE INDEX idx_referral_tracking_clicked_at ON referral_tracking(clicked_at);
CREATE INDEX idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX idx_referral_tracking_converted ON referral_tracking(converted);
CREATE INDEX idx_referral_tracking_expires_at ON referral_tracking(expires_at);

-- Commission calculations indexes
CREATE INDEX idx_commission_affiliate_id ON commission_calculations(affiliate_id);
CREATE INDEX idx_commission_transaction_id ON commission_calculations(transaction_id);
CREATE INDEX idx_commission_status ON commission_calculations(status);
CREATE INDEX idx_commission_transaction_date ON commission_calculations(transaction_date);
CREATE INDEX idx_commission_payout_id ON commission_calculations(payout_id);

-- Performance analytics indexes
CREATE INDEX idx_performance_affiliate_date ON performance_analytics(affiliate_id, date);
CREATE INDEX idx_performance_period_type ON performance_analytics(period_type);
CREATE INDEX idx_performance_date ON performance_analytics(date);

-- Payout history indexes
CREATE INDEX idx_payout_affiliate_id ON payout_history(affiliate_id);
CREATE INDEX idx_payout_status ON payout_history(status);
CREATE INDEX idx_payout_period ON payout_history(period_start, period_end);

-- Custom links indexes
CREATE INDEX idx_custom_links_affiliate_id ON affiliate_custom_links(affiliate_id);
CREATE INDEX idx_custom_links_tracking_code ON affiliate_custom_links(tracking_code);
CREATE INDEX idx_custom_links_custom_path ON affiliate_custom_links(custom_path);

-- Fraud detection indexes
CREATE INDEX idx_fraud_detection_affiliate_id ON fraud_detection(affiliate_id);
CREATE INDEX idx_fraud_detection_risk_level ON fraud_detection(risk_level);
CREATE INDEX idx_fraud_detection_detected_at ON fraud_detection(detected_at);

-- ================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================

-- Update affiliate updated_at timestamp
CREATE OR REPLACE FUNCTION update_affiliate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_updated_at
    BEFORE UPDATE ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_updated_at();

-- Update affiliate performance metrics when commissions are added
CREATE OR REPLACE FUNCTION update_affiliate_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update affiliate totals when commission is confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE affiliates
        SET
            total_conversions = total_conversions + 1,
            total_revenue = total_revenue + NEW.net_sale_amount,
            total_commission_earned = total_commission_earned + NEW.commission_amount,
            updated_at = NOW()
        WHERE id = NEW.affiliate_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_metrics_trigger
    AFTER INSERT OR UPDATE ON commission_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_metrics();

-- Update click counts when referrals are tracked
CREATE OR REPLACE FUNCTION update_affiliate_clicks()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE affiliates
    SET
        total_clicks = total_clicks + 1,
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.affiliate_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_clicks_trigger
    AFTER INSERT ON referral_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_clicks();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_custom_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_notifications ENABLE ROW LEVEL SECURITY;

-- Affiliates can only access their own data
CREATE POLICY affiliate_own_data ON affiliates
    FOR ALL USING (auth.uid() = user_id);

-- Affiliates can only see their own referral tracking
CREATE POLICY affiliate_own_referrals ON referral_tracking
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

-- Affiliates can only see their own commissions
CREATE POLICY affiliate_own_commissions ON commission_calculations
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

-- Continue with other RLS policies...
CREATE POLICY affiliate_own_payouts ON payout_history
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY affiliate_own_analytics ON performance_analytics
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY affiliate_own_links ON affiliate_custom_links
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

CREATE POLICY affiliate_own_notifications ON affiliate_notifications
    FOR ALL USING (
        affiliate_id IN (
            SELECT id FROM affiliates WHERE user_id = auth.uid()
        )
    );

-- Marketing assets are visible to all approved affiliates
CREATE POLICY marketing_assets_visible ON marketing_assets
    FOR SELECT USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM affiliates
            WHERE user_id = auth.uid()
            AND status = 'approved'
            AND (tier = ANY(tier_access) OR tier_access = '{}')
        )
    );

-- ================================================
-- INITIAL DATA
-- ================================================

-- Insert default affiliate tiers
INSERT INTO affiliate_tiers (name, display_name, base_commission_rate, minimum_monthly_sales, benefits, requirements) VALUES
('bronze', 'Bronze Affiliate', 0.15, 0,
 '{"marketing_assets": true, "basic_support": true}',
 '{"email_verification": true}'),

('silver', 'Silver Affiliate', 0.20, 1000,
 '{"marketing_assets": true, "priority_support": true, "monthly_bonus": true}',
 '{"monthly_sales": 1000, "conversion_rate": 0.02}'),

('gold', 'Gold Affiliate', 0.25, 5000,
 '{"marketing_assets": true, "priority_support": true, "custom_landing_pages": true, "monthly_bonus": true, "quarterly_bonus": true}',
 '{"monthly_sales": 5000, "conversion_rate": 0.03}'),

('platinum', 'Platinum Affiliate', 0.30, 15000,
 '{"everything": true, "dedicated_manager": true, "custom_commission_rates": true}',
 '{"monthly_sales": 15000, "conversion_rate": 0.04}'),

('healthcare', 'Healthcare Professional', 0.25, 0,
 '{"practitioner_access": true, "fullscript_integration": true, "professional_materials": true}',
 '{"healthcare_license": true, "professional_verification": true}');

-- Insert sample marketing assets
INSERT INTO marketing_assets (title, description, asset_type, file_url, tier_access, tags) VALUES
('NaturineX Banner 728x90', 'Standard leaderboard banner for websites', 'banner',
 '/assets/banners/naturinex-728x90.png', ARRAY['bronze', 'silver', 'gold', 'platinum'],
 ARRAY['banner', 'website', 'standard']),

('Social Media Kit', 'Complete social media templates and graphics', 'social_post',
 '/assets/social/social-media-kit.zip', ARRAY['silver', 'gold', 'platinum'],
 ARRAY['social', 'instagram', 'facebook', 'twitter']),

('Email Template - Welcome', 'Welcome email template for new referrals', 'email_template',
 '/assets/email/welcome-template.html', ARRAY['gold', 'platinum'],
 ARRAY['email', 'welcome', 'template']);

-- Add comments to tables
COMMENT ON TABLE affiliates IS 'Main affiliates table storing affiliate partner information, status, and performance metrics';
COMMENT ON TABLE affiliate_tiers IS 'Defines different affiliate tiers with commission rates and benefits';
COMMENT ON TABLE referral_tracking IS 'Tracks all clicks and referrals with detailed analytics and fraud prevention';
COMMENT ON TABLE commission_calculations IS 'Calculates and stores commission amounts for each sale with validation';
COMMENT ON TABLE payout_history IS 'Records all payouts made to affiliates with payment details and status';
COMMENT ON TABLE marketing_assets IS 'Stores marketing materials and assets available to affiliates';
COMMENT ON TABLE performance_analytics IS 'Aggregated performance metrics for affiliates by time period';
COMMENT ON TABLE affiliate_custom_links IS 'Custom tracking links and QR codes created by affiliates';
COMMENT ON TABLE partner_integrations IS 'External partner integrations and API configurations';
COMMENT ON TABLE fraud_detection IS 'Fraud detection results and investigation records';
COMMENT ON TABLE affiliate_notifications IS 'Notifications sent to affiliates about payouts, performance, etc.';

-- Create materialized view for affiliate dashboard
CREATE MATERIALIZED VIEW affiliate_dashboard_summary AS
SELECT
    a.id,
    a.affiliate_code,
    a.first_name,
    a.last_name,
    a.email,
    a.status,
    a.tier,
    a.commission_rate,
    a.total_clicks,
    a.total_conversions,
    a.total_revenue,
    a.total_commission_earned,
    a.total_commission_paid,
    CASE
        WHEN a.total_clicks > 0 THEN (a.total_conversions::DECIMAL / a.total_clicks::DECIMAL)
        ELSE 0
    END as conversion_rate,
    CASE
        WHEN a.total_conversions > 0 THEN (a.total_revenue / a.total_conversions)
        ELSE 0
    END as average_order_value,
    a.total_commission_earned - a.total_commission_paid as pending_commission,
    COUNT(DISTINCT rt.id) as clicks_last_30_days,
    COUNT(DISTINCT cc.id) as conversions_last_30_days,
    SUM(cc.commission_amount) as commission_last_30_days
FROM affiliates a
LEFT JOIN referral_tracking rt ON a.id = rt.affiliate_id
    AND rt.clicked_at >= NOW() - INTERVAL '30 days'
LEFT JOIN commission_calculations cc ON a.id = cc.affiliate_id
    AND cc.transaction_date >= NOW() - INTERVAL '30 days'
    AND cc.status = 'confirmed'
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.affiliate_code, a.first_name, a.last_name, a.email,
         a.status, a.tier, a.commission_rate, a.total_clicks, a.total_conversions,
         a.total_revenue, a.total_commission_earned, a.total_commission_paid;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_affiliate_dashboard_summary_id ON affiliate_dashboard_summary(id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW affiliate_dashboard_summary;