-- Migration: LLM Training Data Storage
-- Purpose: Store anonymized scan data for future AI model training
-- Date: 2026-01-23

-- ============================================
-- Training Data Consent Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS training_data_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    consent_type VARCHAR(50) NOT NULL DEFAULT 'llm_training',
    ip_address_hash VARCHAR(64), -- Hashed for privacy
    user_agent_hash VARCHAR(64), -- Hashed for privacy
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX idx_training_consent_user ON training_data_consent(user_id);
CREATE INDEX idx_training_consent_status ON training_data_consent(consent_given, revoked_at);

-- ============================================
-- Anonymized Scan Data for Training
-- ============================================
CREATE TABLE IF NOT EXISTS training_scan_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Anonymized reference (not linked to user)
    anonymous_id VARCHAR(64) NOT NULL, -- SHA256 hash

    -- Scan metadata (anonymized)
    scan_type VARCHAR(50) NOT NULL, -- 'image', 'manual', 'barcode'
    product_category VARCHAR(100),

    -- OCR/Input data
    extracted_text TEXT,
    medication_name VARCHAR(255),
    detected_ingredients TEXT[], -- Array of ingredients

    -- AI Analysis results (for training validation)
    ai_response JSONB, -- Full AI response (anonymized)
    natural_alternatives JSONB, -- Suggested alternatives
    confidence_score DECIMAL(5,4),

    -- Image storage reference (if consent given)
    image_storage_path VARCHAR(500),
    image_hash VARCHAR(64), -- For deduplication

    -- Quality metrics for training
    ocr_confidence DECIMAL(5,4),
    is_valid_for_training BOOLEAN DEFAULT true,
    training_labels JSONB, -- Manual labels if any

    -- Timestamps
    scan_date DATE NOT NULL, -- Only date, not time (privacy)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicates
    CONSTRAINT unique_scan_hash UNIQUE (image_hash)
);

-- Indexes for training queries
CREATE INDEX idx_training_scan_category ON training_scan_data(product_category);
CREATE INDEX idx_training_scan_valid ON training_scan_data(is_valid_for_training);
CREATE INDEX idx_training_scan_date ON training_scan_data(scan_date);
CREATE INDEX idx_training_scan_type ON training_scan_data(scan_type);

-- ============================================
-- Training Data Statistics (Aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS training_data_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE NOT NULL UNIQUE,
    total_scans INTEGER DEFAULT 0,
    image_scans INTEGER DEFAULT 0,
    manual_scans INTEGER DEFAULT 0,
    barcode_scans INTEGER DEFAULT 0,
    unique_medications INTEGER DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    top_categories JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS
ALTER TABLE training_data_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_scan_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data_stats ENABLE ROW LEVEL SECURITY;

-- Consent table: Users can only see/modify their own consent
CREATE POLICY "Users can view own consent" ON training_data_consent
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent" ON training_data_consent
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent" ON training_data_consent
    FOR UPDATE USING (auth.uid() = user_id);

-- Training data: Only service role can access (no user access)
CREATE POLICY "Service role only for training data" ON training_scan_data
    FOR ALL USING (auth.role() = 'service_role');

-- Stats: Read-only for authenticated users
CREATE POLICY "Authenticated can view stats" ON training_data_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Functions for Data Anonymization
-- ============================================

-- Function to anonymize user ID
CREATE OR REPLACE FUNCTION anonymize_user_id(user_id UUID, salt TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(sha256((user_id::TEXT || salt)::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update training stats (called daily by cron)
CREATE OR REPLACE FUNCTION update_training_stats()
RETURNS void AS $$
BEGIN
    INSERT INTO training_data_stats (stat_date, total_scans, image_scans, manual_scans, barcode_scans, unique_medications, avg_confidence, top_categories)
    SELECT
        CURRENT_DATE - INTERVAL '1 day',
        COUNT(*),
        COUNT(*) FILTER (WHERE scan_type = 'image'),
        COUNT(*) FILTER (WHERE scan_type = 'manual'),
        COUNT(*) FILTER (WHERE scan_type = 'barcode'),
        COUNT(DISTINCT medication_name),
        AVG(confidence_score),
        (SELECT jsonb_agg(category_counts) FROM (
            SELECT jsonb_build_object('category', product_category, 'count', COUNT(*)) as category_counts
            FROM training_scan_data
            WHERE scan_date = CURRENT_DATE - INTERVAL '1 day'
            GROUP BY product_category
            ORDER BY COUNT(*) DESC
            LIMIT 10
        ) top_cats)
    FROM training_scan_data
    WHERE scan_date = CURRENT_DATE - INTERVAL '1 day'
    ON CONFLICT (stat_date) DO UPDATE SET
        total_scans = EXCLUDED.total_scans,
        image_scans = EXCLUDED.image_scans,
        manual_scans = EXCLUDED.manual_scans,
        barcode_scans = EXCLUDED.barcode_scans,
        unique_medications = EXCLUDED.unique_medications,
        avg_confidence = EXCLUDED.avg_confidence,
        top_categories = EXCLUDED.top_categories;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Storage Bucket Configuration (run via Supabase dashboard or CLI)
-- ============================================
-- Note: Create bucket 'training-images' with the following settings:
-- - Public: false
-- - File size limit: 10MB
-- - Allowed MIME types: image/jpeg, image/png, image/webp

COMMENT ON TABLE training_data_consent IS 'Tracks user consent for LLM training data collection';
COMMENT ON TABLE training_scan_data IS 'Anonymized scan data for AI model training';
COMMENT ON TABLE training_data_stats IS 'Aggregated daily statistics for training data';
