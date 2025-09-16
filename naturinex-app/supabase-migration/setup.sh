#!/bin/bash

# Supabase Database Setup Script
# Run this after creating your Supabase project

echo "🚀 Setting up Supabase for Naturinex (Enterprise Scale)"
echo "================================================"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase project (if not already initialized)
if [ ! -d "supabase" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
fi

# Link to remote project
echo "🔗 Linking to your Supabase project..."
echo "Please enter your Supabase project reference (found in project settings):"
read PROJECT_REF

supabase link --project-ref $PROJECT_REF

# Run migrations
echo "📊 Creating database schema..."
supabase db push ./schema.sql

# Create storage buckets
echo "📦 Creating storage buckets..."
supabase storage create scans --public false
supabase storage create profiles --public false
supabase storage create feedback --public false
supabase storage create public --public true

# Set up storage policies
echo "🔒 Setting up storage policies..."
cat > storage-policies.sql << 'EOF'
-- Storage policies for buckets

-- Scans bucket policies
CREATE POLICY "Users can upload own scans" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'scans' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own scans" ON storage.objects
FOR SELECT USING (
    bucket_id = 'scans' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Profiles bucket policies
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profiles' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

-- Public bucket - anyone can read
CREATE POLICY "Public files are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'public');
EOF

supabase db push storage-policies.sql

# Create database functions
echo "⚡ Creating optimized database functions..."
cat > functions.sql << 'EOF'
-- Optimized functions for enterprise scale

-- Function to get popular products (cached)
CREATE OR REPLACE FUNCTION get_popular_products(limit_count INT DEFAULT 10)
RETURNS TABLE(barcode TEXT, name TEXT, scan_count BIGINT)
LANGUAGE sql
STABLE
AS $$
    SELECT
        p.barcode,
        p.name,
        COUNT(s.id) as scan_count
    FROM products p
    JOIN scans s ON s.barcode = p.barcode
    WHERE s.scan_date > NOW() - INTERVAL '30 days'
    GROUP BY p.barcode, p.name
    ORDER BY scan_count DESC
    LIMIT limit_count;
$$;

-- Function for real-time analytics
CREATE OR REPLACE FUNCTION get_real_time_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users_today BIGINT,
    scans_today BIGINT,
    revenue_today NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        (SELECT COUNT(*) FROM profiles),
        (SELECT COUNT(*) FROM profiles WHERE last_active_date > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM scans WHERE scan_date > NOW() - INTERVAL '24 hours'),
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at > NOW() - INTERVAL '24 hours')
$$;

-- Function for user recommendations
CREATE OR REPLACE FUNCTION get_user_recommendations(p_user_id UUID)
RETURNS TABLE(product_id UUID, name TEXT, score FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT DISTINCT category
        FROM scans
        WHERE user_id = p_user_id
        ORDER BY scan_date DESC
        LIMIT 5
    )
    SELECT
        p.id,
        p.name,
        CASE
            WHEN p.category IN (SELECT category FROM user_preferences) THEN 1.0
            ELSE 0.5
        END * p.popularity_score as score
    FROM products p
    WHERE p.id NOT IN (
        SELECT DISTINCT p2.id
        FROM products p2
        JOIN scans s2 ON s2.barcode = p2.barcode
        WHERE s2.user_id = p_user_id
    )
    ORDER BY score DESC
    LIMIT 10;
END;
$$;
EOF

supabase db push functions.sql

# Create cron jobs for maintenance
echo "⏰ Setting up cron jobs..."
cat > cron-jobs.sql << 'EOF'
-- Cron jobs for maintenance (requires pg_cron extension)

-- Refresh materialized view every hour
SELECT cron.schedule('refresh-user-stats', '0 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
$$);

-- Clean expired cache every day
SELECT cron.schedule('clean-cache', '0 0 * * *', $$
    DELETE FROM cache WHERE expires_at < NOW();
$$);

-- Archive old analytics data monthly
SELECT cron.schedule('archive-analytics', '0 0 1 * *', $$
    INSERT INTO analytics_archive
    SELECT * FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '3 months';

    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '3 months';
$$);

-- Update product popularity scores daily
SELECT cron.schedule('update-popularity', '0 2 * * *', $$
    UPDATE products p
    SET popularity_score = (
        SELECT COUNT(*)
        FROM scans s
        WHERE s.barcode = p.barcode
        AND s.scan_date > NOW() - INTERVAL '30 days'
    );
$$);
EOF

supabase db push cron-jobs.sql

# Create indexes for performance
echo "📈 Creating performance indexes..."
cat > indexes.sql << 'EOF'
-- Additional performance indexes

-- Covering index for common queries
CREATE INDEX idx_scans_user_date_category ON scans(user_id, scan_date DESC, category)
INCLUDE (product_name, barcode);

-- Index for text search
CREATE INDEX idx_products_search ON products
USING GIN (to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- Index for geospatial queries (if using location data)
CREATE INDEX idx_scans_location ON scans
USING GIST (point(longitude, latitude))
WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Partial indexes for common filters
CREATE INDEX idx_profiles_active_premium ON profiles(user_id)
WHERE subscription_status = 'active' AND subscription_tier = 'premium';

CREATE INDEX idx_notifications_unread ON notifications(profile_id, created_at DESC)
WHERE read = false;

-- BRIN index for time-series data (very efficient for large tables)
CREATE INDEX idx_analytics_events_created_brin ON analytics_events
USING BRIN (created_at) WITH (pages_per_range = 128);
EOF

supabase db push indexes.sql

echo "✅ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env files with Supabase credentials"
echo "2. Run the migration script to move data from Firebase"
echo "3. Deploy Edge Functions"
echo "4. Update your app to use Supabase client"