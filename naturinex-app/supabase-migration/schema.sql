-- Supabase Schema for Naturinex (Enterprise Scale)
-- Designed for 1M+ users with optimizations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- User profiles table with partitioning ready structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Subscription data
    subscription_status TEXT DEFAULT 'free',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,

    -- Stats (denormalized for performance)
    total_scans INTEGER DEFAULT 0,
    last_scan_date TIMESTAMPTZ,
    most_scanned_category TEXT DEFAULT 'unknown',
    total_session_time INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    last_active_date TIMESTAMPTZ DEFAULT NOW(),

    -- Gamification
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]'::JSONB,

    -- Privacy & Compliance
    privacy_consent BOOLEAN DEFAULT FALSE,
    privacy_consent_date TIMESTAMPTZ,
    medical_disclaimer_accepted BOOLEAN DEFAULT FALSE,
    medical_disclaimer_date TIMESTAMPTZ,

    -- Metadata
    app_version TEXT,
    platform TEXT,
    device_info JSONB,
    preferences JSONB DEFAULT '{}'::JSONB,
    feature_flags JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_date DESC);

-- Scans table with partitioning by month for scale
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Scan data
    barcode TEXT,
    product_name TEXT,
    brand TEXT,
    category TEXT,
    image_url TEXT,

    -- Analysis results (stored as JSONB for flexibility)
    ingredients JSONB,
    allergens JSONB,
    nutritional_info JSONB,
    health_analysis JSONB,
    ai_insights JSONB,

    -- Metadata
    scan_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    scan_method TEXT, -- 'camera', 'manual', 'image'
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),

    -- Location data (optional)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location_name TEXT,

    -- Cache control
    cached_until TIMESTAMPTZ,
    version INTEGER DEFAULT 1
) PARTITION BY RANGE (scan_date);

-- Create monthly partitions for scans (automated via pg_partman in production)
CREATE TABLE scans_2025_01 PARTITION OF scans FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE scans_2025_02 PARTITION OF scans FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE scans_2025_03 PARTITION OF scans FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for scan performance
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_profile_id ON scans(profile_id);
CREATE INDEX idx_scans_barcode ON scans(barcode);
CREATE INDEX idx_scans_date ON scans(scan_date DESC);
CREATE INDEX idx_scans_category ON scans(category);
CREATE GIN INDEX idx_scans_ingredients ON scans USING gin(ingredients);

-- Products master table (cached/reference data)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,

    -- Detailed product info
    ingredients TEXT[],
    allergens TEXT[],
    nutritional_info JSONB,
    certifications TEXT[],

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE,
    source TEXT, -- 'user', 'api', 'manual'
    popularity_score INTEGER DEFAULT 0
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_brand ON products(brand);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',

    -- Attachments
    attachments JSONB DEFAULT '[]'::JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    admin_notes TEXT
);

CREATE INDEX idx_feedback_user ON feedback(profile_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    data JSONB,

    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(profile_id, read, created_at DESC);

-- Analytics events table (for tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id UUID,

    event_name TEXT NOT NULL,
    event_category TEXT,
    event_data JSONB,

    -- Device/platform info
    platform TEXT,
    app_version TEXT,
    device_info JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for analytics
CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_event ON analytics_events(event_name);
CREATE INDEX idx_analytics_date ON analytics_events(created_at DESC);

-- API rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY, -- user_id or ip_address
    endpoint TEXT NOT NULL,
    requests INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(id, endpoint)
);

CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Cache table for expensive operations
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_expires ON cache(expires_at);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scans" ON scans
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Functions for triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to clean old cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function for incrementing scan count (atomic operation)
CREATE OR REPLACE FUNCTION increment_scan_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        total_scans = total_scans + 1,
        last_scan_date = NOW(),
        last_active_date = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Materialized view for dashboard stats (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT
    p.user_id,
    p.total_scans,
    COUNT(DISTINCT DATE(s.scan_date)) as days_active,
    COUNT(DISTINCT s.category) as categories_scanned,
    AVG(s.processing_time_ms) as avg_processing_time
FROM profiles p
LEFT JOIN scans s ON s.user_id = p.user_id
GROUP BY p.user_id, p.total_scans;

CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles with denormalized stats for performance';
COMMENT ON TABLE scans IS 'Scan history partitioned by month for scale';
COMMENT ON TABLE products IS 'Product master data for caching and reference';
COMMENT ON TABLE cache IS 'General purpose cache for expensive operations';
COMMENT ON TABLE rate_limits IS 'API rate limiting per user/endpoint';