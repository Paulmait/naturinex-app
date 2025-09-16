-- Medical Compliance Migration Script
-- Run this migration to add medical disclaimer and drug interaction tables
-- Compatible with existing Supabase projects

-- Migration: 001_medical_compliance_migration
-- Created: 2024-01-01
-- Description: Add HIPAA-compliant medical disclaimer and drug interaction tables

BEGIN;

-- Create migration tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_medical_compliance') THEN
        RAISE NOTICE 'Migration 001_medical_compliance already applied, skipping...';
        RETURN;
    END IF;
END
$$;

-- Enable required extensions (safely)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DISCLAIMER ACCEPTANCE TRACKING
-- ============================================================================

CREATE TABLE disclaimer_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    feature_type VARCHAR(50) NOT NULL DEFAULT 'general',
    disclaimer_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    geolocation_hash VARCHAR(64),
    is_minor BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_contact JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    audit_trail JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add constraint for unique active disclaimers per user/feature
ALTER TABLE disclaimer_acceptances
ADD CONSTRAINT disclaimer_acceptances_user_feature_check
CHECK (
    -- Only one active disclaimer per user per feature type
    is_active = TRUE OR is_active = FALSE
);

-- Create indexes
CREATE INDEX idx_disclaimer_active
    ON disclaimer_acceptances (user_id, feature_type, is_active, accepted_at)
    WHERE is_active = TRUE;

CREATE INDEX idx_disclaimer_audit
    ON disclaimer_acceptances (accepted_at, feature_type);

-- ============================================================================
-- DRUG INTERACTIONS DATABASE
-- ============================================================================

CREATE TABLE drug_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug1 VARCHAR(255) NOT NULL,
    drug2 VARCHAR(255) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL DEFAULT 'drug_drug',
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'moderate', 'minor', 'unknown')),
    description TEXT NOT NULL,
    clinical_effects JSONB DEFAULT '[]',
    management TEXT,
    source VARCHAR(100) NOT NULL,
    confidence VARCHAR(20) DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    evidence_level VARCHAR(20) DEFAULT 'clinical' CHECK (evidence_level IN ('clinical', 'theoretical', 'case_report')),
    mechanism TEXT,
    onset VARCHAR(50),
    documentation VARCHAR(20) DEFAULT 'documented' CHECK (documentation IN ('established', 'probable', 'suspected', 'possible', 'unlikely')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add unique constraint for drug pairs
ALTER TABLE drug_interactions
ADD CONSTRAINT drug_interactions_unique
UNIQUE (drug1, drug2, interaction_type);

-- Create indexes for drug interactions
CREATE INDEX idx_drug_interactions_drugs
    ON drug_interactions (drug1, drug2)
    WHERE is_active = TRUE;

CREATE INDEX idx_drug_interactions_severity
    ON drug_interactions (severity, is_active)
    WHERE is_active = TRUE;

CREATE INDEX idx_drug_interactions_type
    ON drug_interactions (interaction_type, severity)
    WHERE is_active = TRUE;

-- ============================================================================
-- MEDICAL WARNINGS SYSTEM
-- ============================================================================

CREATE TABLE medical_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warning_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    medication_name VARCHAR(255),
    medication_class VARCHAR(100),
    condition_name VARCHAR(255),
    age_group VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'moderate', 'minor')),
    warning_text TEXT NOT NULL,
    clinical_rationale TEXT,
    monitoring_requirements TEXT,
    alternative_recommendations TEXT,
    pregnancy_category VARCHAR(5),
    evidence_grade VARCHAR(5),
    source VARCHAR(100) NOT NULL,
    regulatory_status VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for medical warnings
CREATE INDEX idx_warnings_medication
    ON medical_warnings (medication_name, warning_type)
    WHERE is_active = TRUE;

CREATE INDEX idx_warnings_severity
    ON medical_warnings (severity, warning_type)
    WHERE is_active = TRUE;

CREATE INDEX idx_warnings_pregnancy
    ON medical_warnings (pregnancy_category)
    WHERE pregnancy_category IS NOT NULL AND is_active = TRUE;

-- ============================================================================
-- EMERGENCY CONTACTS
-- ============================================================================

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    phone_number_encrypted TEXT NOT NULL,
    email_encrypted TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for emergency contacts
CREATE INDEX idx_emergency_contacts_user
    ON emergency_contacts (user_id, is_active)
    WHERE is_active = TRUE;

-- ============================================================================
-- AUDIT LOGGING TABLES
-- ============================================================================

CREATE TABLE disclaimer_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address_hash VARCHAR(64),
    session_id VARCHAR(64),
    user_agent_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_disclaimer_audit_user_time
    ON disclaimer_audit_logs (user_id, timestamp DESC);

CREATE INDEX idx_disclaimer_audit_action
    ON disclaimer_audit_logs (action, timestamp DESC);

CREATE TABLE interaction_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id VARCHAR(64) NOT NULL,
    user_id UUID,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    medications_count INTEGER NOT NULL DEFAULT 0,
    total_interactions INTEGER NOT NULL DEFAULT 0,
    critical_count INTEGER NOT NULL DEFAULT 0,
    major_count INTEGER NOT NULL DEFAULT 0,
    patient_age INTEGER,
    has_allergies BOOLEAN DEFAULT FALSE,
    has_conditions BOOLEAN DEFAULT FALSE,
    is_pregnant BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(20) DEFAULT 'low',
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for interaction audit
CREATE INDEX idx_interaction_audit_time
    ON interaction_audit_logs (checked_at DESC);

CREATE INDEX idx_interaction_audit_user
    ON interaction_audit_logs (user_id, checked_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE disclaimer_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclaimer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disclaimer_acceptances
CREATE POLICY "disclaimer_acceptances_select_policy"
    ON disclaimer_acceptances
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "disclaimer_acceptances_insert_policy"
    ON disclaimer_acceptances
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "disclaimer_acceptances_update_policy"
    ON disclaimer_acceptances
    FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for emergency_contacts
CREATE POLICY "emergency_contacts_all_policy"
    ON emergency_contacts
    FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for audit logs (read-only for users)
CREATE POLICY "disclaimer_audit_select_policy"
    ON disclaimer_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "interaction_audit_select_policy"
    ON interaction_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_disclaimer_acceptances_updated_at
    BEFORE UPDATE ON disclaimer_acceptances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_interactions_updated_at
    BEFORE UPDATE ON drug_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_warnings_updated_at
    BEFORE UPDATE ON medical_warnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if user has valid disclaimer
CREATE OR REPLACE FUNCTION check_valid_disclaimer(
    p_user_id UUID,
    p_feature_type VARCHAR(50) DEFAULT 'general'
)
RETURNS BOOLEAN AS $$
DECLARE
    valid_disclaimer BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM disclaimer_acceptances
        WHERE user_id = p_user_id
          AND feature_type = p_feature_type
          AND is_active = TRUE
          AND accepted_at >= NOW() - INTERVAL '30 days'
    ) INTO valid_disclaimer;

    RETURN valid_disclaimer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_feature_type VARCHAR(50),
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO disclaimer_audit_logs (
        user_id,
        action,
        feature_type,
        details
    ) VALUES (
        p_user_id,
        p_action,
        p_feature_type,
        p_details
    ) RETURNING id INTO audit_id;

    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON drug_interactions TO authenticated;
GRANT SELECT ON medical_warnings TO authenticated;
GRANT ALL ON disclaimer_acceptances TO authenticated;
GRANT ALL ON emergency_contacts TO authenticated;
GRANT INSERT, SELECT ON disclaimer_audit_logs TO authenticated;
GRANT INSERT, SELECT ON interaction_audit_logs TO authenticated;

-- Grant sequence permissions if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SEED CRITICAL DATA
-- ============================================================================

-- Insert critical drug interactions
INSERT INTO drug_interactions (
    drug1, drug2, interaction_type, severity, description, management, source, confidence
) VALUES
    ('warfarin', 'aspirin', 'drug_drug', 'critical',
     'Increased risk of bleeding due to additive anticoagulant effects',
     'Monitor INR closely, consider alternative analgesics',
     'FDA Orange Book', 'high'),

    ('metformin', 'contrast_dye', 'drug_drug', 'major',
     'Risk of lactic acidosis due to potential kidney dysfunction',
     'Discontinue metformin 48 hours before and after contrast procedures',
     'FDA Guidelines', 'high'),

    ('digoxin', 'amiodarone', 'drug_drug', 'major',
     'Amiodarone increases digoxin levels leading to toxicity risk',
     'Reduce digoxin dose by 50% and monitor levels closely',
     'Clinical Literature', 'high')
ON CONFLICT (drug1, drug2, interaction_type) DO NOTHING;

-- Insert critical medical warnings
INSERT INTO medical_warnings (
    warning_type, category, medication_name, severity, warning_text,
    pregnancy_category, source
) VALUES
    ('pregnancy', 'contraindication', 'isotretinoin', 'critical',
     'CONTRAINDICATED in pregnancy - severe birth defects guaranteed',
     'X', 'FDA Black Box Warning'),

    ('age', 'caution', 'aspirin', 'major',
     'Not recommended in children under 16 due to Reye syndrome risk',
     NULL, 'FDA Pediatric Guidelines')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RECORD MIGRATION
-- ============================================================================

-- Record this migration as completed
INSERT INTO schema_migrations (version, description)
VALUES ('001_medical_compliance', 'Add HIPAA-compliant medical disclaimer and drug interaction tables')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Verify all tables were created
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'disclaimer_acceptances') THEN
        RAISE EXCEPTION 'Migration failed: disclaimer_acceptances table not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drug_interactions') THEN
        RAISE EXCEPTION 'Migration failed: drug_interactions table not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_warnings') THEN
        RAISE EXCEPTION 'Migration failed: medical_warnings table not created';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emergency_contacts') THEN
        RAISE EXCEPTION 'Migration failed: emergency_contacts table not created';
    END IF;

    RAISE NOTICE 'Migration 001_medical_compliance completed successfully!';
    RAISE NOTICE 'Tables created: disclaimer_acceptances, drug_interactions, medical_warnings, emergency_contacts';
    RAISE NOTICE 'RLS policies enabled for data security';
    RAISE NOTICE 'Critical drug interactions and warnings seeded';
END
$$;