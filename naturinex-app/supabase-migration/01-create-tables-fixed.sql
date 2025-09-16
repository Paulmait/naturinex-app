-- STEP 1: Create Tables First (PostgreSQL Compatible)
-- Run this script BEFORE the security policies
-- This creates all the necessary tables for Naturinex

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For compound indexes

-- Drop types if they exist (for re-running)
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS consultation_status CASCADE;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('free', 'trialing', 'active', 'past_due', 'canceled', 'paused');
CREATE TYPE subscription_tier AS ENUM ('free', 'plus', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'system');
CREATE TYPE consultation_status AS ENUM ('pending', 'scheduled', 'completed', 'canceled');

-- PROFILES TABLE (User profiles with subscription info)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- Subscription fields
    subscription_status subscription_status DEFAULT 'free',
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,

    -- Usage tracking
    scans_this_month INT DEFAULT 0,
    scans_total INT DEFAULT 0,
    last_scan_at TIMESTAMP WITH TIME ZONE,

    -- Premium features
    consultation_credits INT DEFAULT 0,
    api_key TEXT UNIQUE,
    referral_code TEXT UNIQUE,
    referred_by TEXT,

    -- User preferences
    role user_role DEFAULT 'user',
    notifications_enabled BOOLEAN DEFAULT true,
    marketing_consent BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral ON profiles(referral_code);

-- SCANS TABLE (Medication scans)
CREATE TABLE IF NOT EXISTS scans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Scan data
    medication_name TEXT NOT NULL,
    active_ingredients TEXT[],
    dosage TEXT,
    manufacturer TEXT,
    ndc_code TEXT,
    image_url TEXT,

    -- OCR data
    ocr_text TEXT,
    ocr_confidence DECIMAL(3,2),

    -- AI-generated alternatives
    natural_alternatives JSONB,
    safety_warnings TEXT[],
    interaction_warnings TEXT[],

    -- Metadata
    scan_source TEXT, -- 'camera', 'text', 'upload'
    device_info JSONB,
    location JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scans
CREATE INDEX IF NOT EXISTS idx_scans_user_created ON scans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_medication ON scans(medication_name);
CREATE INDEX IF NOT EXISTS idx_scans_ndc ON scans(ndc_code);

-- SCAN_HISTORY TABLE (Detailed scan history)
CREATE TABLE IF NOT EXISTS scan_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Action tracking
    action TEXT NOT NULL, -- 'viewed', 'shared', 'exported', 'favorited'
    details JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scan_history
CREATE INDEX IF NOT EXISTS idx_history_user_created ON scan_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_scan ON scan_history(scan_id);

-- PRODUCTS TABLE (In-app purchase products)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Product info
    product_type TEXT NOT NULL, -- 'report', 'consultation', 'plan'
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Stripe info
    stripe_product_id TEXT UNIQUE,
    stripe_price_id TEXT UNIQUE,

    -- Availability
    is_active BOOLEAN DEFAULT true,
    requires_tier subscription_tier,

    -- Metadata
    features JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stripe ON products(stripe_product_id);

-- PRODUCT_INTERACTIONS TABLE (Track purchases and usage)
CREATE TABLE IF NOT EXISTS product_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id),

    -- Interaction details
    interaction_type TEXT NOT NULL, -- 'purchase', 'view', 'use'
    quantity INT DEFAULT 1,
    amount DECIMAL(10,2),

    -- Stripe info
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,

    -- Status
    status TEXT DEFAULT 'pending',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product_interactions
CREATE INDEX IF NOT EXISTS idx_interactions_user_created ON product_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON product_interactions(interaction_type);

-- AFFILIATE_LINKS TABLE (Affiliate program management)
CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Affiliate info
    partner_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    commission_rate DECIMAL(5,2),

    -- Tracking
    click_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for affiliate_links
CREATE INDEX IF NOT EXISTS idx_affiliate_partner ON affiliate_links(partner_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_category ON affiliate_links(product_category);
CREATE INDEX IF NOT EXISTS idx_affiliate_active ON affiliate_links(is_active);

-- CONSULTATIONS TABLE (Healthcare consultations)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Consultation details
    consultant_name TEXT,
    consultation_type TEXT, -- 'naturopath', 'nutritionist', 'pharmacist'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,

    -- Status
    status consultation_status DEFAULT 'pending',

    -- Notes and results
    user_notes TEXT,
    consultant_notes TEXT,
    recommendations JSONB,

    -- Payment
    amount DECIMAL(10,2),
    stripe_payment_intent_id TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for consultations
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- CUSTOM_PLANS TABLE (Personalized wellness plans)
CREATE TABLE IF NOT EXISTS custom_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Plan details
    plan_name TEXT NOT NULL,
    plan_type TEXT, -- 'detox', 'immunity', 'sleep', 'energy'
    duration_days INT,

    -- Content
    daily_routine JSONB,
    supplements JSONB,
    dietary_guidelines JSONB,

    -- Progress tracking
    start_date DATE,
    end_date DATE,
    progress JSONB,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for custom_plans
CREATE INDEX IF NOT EXISTS idx_plans_user ON custom_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_active ON custom_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_type ON custom_plans(plan_type);

-- FAMILY_MEMBERS TABLE (Family sharing for Pro users)
CREATE TABLE IF NOT EXISTS family_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_email TEXT,

    -- Permissions
    can_view_scans BOOLEAN DEFAULT true,
    can_add_scans BOOLEAN DEFAULT false,

    -- Status
    invite_status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    invite_code TEXT UNIQUE,

    -- Timestamps
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    UNIQUE(owner_user_id, member_user_id),
    CHECK (owner_user_id != member_user_id)
);

-- Create indexes for family_members
CREATE INDEX IF NOT EXISTS idx_family_owner ON family_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_member ON family_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_family_invite ON family_members(invite_code);

-- DATA_EXPORTS TABLE (Track Pro user exports)
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Export details
    export_type TEXT NOT NULL, -- 'pdf', 'csv', 'json'
    export_scope TEXT NOT NULL, -- 'scan', 'history', 'all'
    file_url TEXT,
    file_size_bytes INT,

    -- Status
    status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for data_exports
CREATE INDEX IF NOT EXISTS idx_exports_user ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_exports_created ON data_exports(created_at DESC);

-- ANALYTICS_EVENTS TABLE (User behavior tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,

    -- Event data
    event_name TEXT NOT NULL,
    event_category TEXT,
    event_properties JSONB,

    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- USER_ENGAGEMENT TABLE (Engagement metrics)
CREATE TABLE IF NOT EXISTS user_engagement (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

    -- Engagement metrics
    total_sessions INT DEFAULT 0,
    total_scans INT DEFAULT 0,
    total_shares INT DEFAULT 0,
    total_exports INT DEFAULT 0,

    -- Time metrics
    total_time_minutes INT DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,

    -- Streak tracking
    current_streak_days INT DEFAULT 0,
    longest_streak_days INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_engagement
CREATE INDEX IF NOT EXISTS idx_engagement_user ON user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_active ON user_engagement(last_active_at DESC);

-- SUBSCRIPTION_EVENTS TABLE (Track subscription changes)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Event details
    event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'reactivated'
    from_tier subscription_tier,
    to_tier subscription_tier,
    from_status subscription_status,
    to_status subscription_status,

    -- Stripe data
    stripe_event_id TEXT UNIQUE,
    stripe_subscription_id TEXT,

    -- Metadata
    reason TEXT,
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscription_events
CREATE INDEX IF NOT EXISTS idx_sub_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sub_events_stripe ON subscription_events(stripe_event_id);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_plans_updated_at BEFORE UPDATE ON custom_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON affiliate_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_engagement_updated_at BEFORE UPDATE ON user_engagement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for service role (used by Edge Functions)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Tables created successfully!';
END
$$;