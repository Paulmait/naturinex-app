-- Medical Compliance Database Schema
-- HIPAA-compliant tables for medical disclaimer and drug interaction system
-- Created for NaturineX app medical features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DISCLAIMER ACCEPTANCE TRACKING
-- ============================================================================

-- Table for tracking disclaimer acceptances
CREATE TABLE IF NOT EXISTS disclaimer_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    feature_type VARCHAR(50) NOT NULL DEFAULT 'general',
    disclaimer_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address_hash VARCHAR(64), -- SHA-256 hashed IP for privacy
    user_agent_hash VARCHAR(64), -- SHA-256 hashed user agent
    geolocation_hash VARCHAR(64), -- SHA-256 hashed location data
    is_minor BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_contact JSONB, -- For minors only
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    audit_trail JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT disclaimer_acceptances_user_feature_unique
        UNIQUE (user_id, feature_type, is_active)
        DEFERRABLE INITIALLY DEFERRED
);

-- Index for quick lookup of active disclaimers
CREATE INDEX IF NOT EXISTS idx_disclaimer_active
    ON disclaimer_acceptances (user_id, feature_type, is_active, accepted_at)
    WHERE is_active = TRUE;

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_disclaimer_audit
    ON disclaimer_acceptances (accepted_at, feature_type);

-- ============================================================================
-- DRUG INTERACTIONS DATABASE
-- ============================================================================

-- Master table for drug interaction data
CREATE TABLE IF NOT EXISTS drug_interactions (
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
    onset VARCHAR(50), -- rapid, delayed, variable
    documentation VARCHAR(20) DEFAULT 'documented' CHECK (documentation IN ('established', 'probable', 'suspected', 'possible', 'unlikely')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure no duplicate interactions
    CONSTRAINT drug_interactions_unique
        UNIQUE (drug1, drug2, interaction_type)
);

-- Indexes for drug interaction queries
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drugs
    ON drug_interactions (drug1, drug2)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_drug_interactions_severity
    ON drug_interactions (severity, is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_drug_interactions_type
    ON drug_interactions (interaction_type, severity)
    WHERE is_active = TRUE;

-- ============================================================================
-- MEDICAL WARNINGS SYSTEM
-- ============================================================================

-- Table for storing medical warnings and alerts
CREATE TABLE IF NOT EXISTS medical_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warning_type VARCHAR(50) NOT NULL, -- age, pregnancy, allergy, condition
    category VARCHAR(50) NOT NULL, -- contraindication, caution, monitoring
    medication_name VARCHAR(255),
    medication_class VARCHAR(100),
    condition_name VARCHAR(255),
    age_group VARCHAR(50), -- pediatric, geriatric, adult
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'moderate', 'minor')),
    warning_text TEXT NOT NULL,
    clinical_rationale TEXT,
    monitoring_requirements TEXT,
    alternative_recommendations TEXT,
    pregnancy_category VARCHAR(5), -- A, B, C, D, X
    evidence_grade VARCHAR(5), -- A, B, C, D based on evidence quality
    source VARCHAR(100) NOT NULL,
    regulatory_status VARCHAR(50), -- FDA approved, off-label, etc.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for medical warnings
CREATE INDEX IF NOT EXISTS idx_warnings_medication
    ON medical_warnings (medication_name, warning_type)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_warnings_severity
    ON medical_warnings (severity, warning_type)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_warnings_pregnancy
    ON medical_warnings (pregnancy_category)
    WHERE pregnancy_category IS NOT NULL AND is_active = TRUE;

-- ============================================================================
-- EMERGENCY CONTACTS
-- ============================================================================

-- Table for storing emergency contacts (for minors)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    phone_number_encrypted TEXT NOT NULL, -- Encrypted phone number
    email_encrypted TEXT, -- Encrypted email
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure each user has only one primary contact
    CONSTRAINT emergency_contacts_primary_unique
        UNIQUE (user_id, is_primary)
        DEFERRABLE INITIALLY DEFERRED
);

-- Index for emergency contact lookup
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user
    ON emergency_contacts (user_id, is_active)
    WHERE is_active = TRUE;

-- ============================================================================
-- AUDIT LOGGING TABLES
-- ============================================================================

-- Audit log for disclaimer events
CREATE TABLE IF NOT EXISTS disclaimer_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL, -- DISCLAIMER_ACCEPTED, ACCESS_BLOCKED, etc.
    feature_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address_hash VARCHAR(64),
    session_id VARCHAR(64),
    user_agent_hash VARCHAR(64),

    -- Partition key for efficient querying
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_disclaimer_audit_user_time
    ON disclaimer_audit_logs (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_disclaimer_audit_action
    ON disclaimer_audit_logs (action, timestamp DESC);

-- Audit log for drug interaction checks
CREATE TABLE IF NOT EXISTS interaction_audit_logs (
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

-- Index for interaction audit queries
CREATE INDEX IF NOT EXISTS idx_interaction_audit_time
    ON interaction_audit_logs (checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_interaction_audit_user
    ON interaction_audit_logs (user_id, checked_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE disclaimer_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclaimer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for disclaimer_acceptances
CREATE POLICY "Users can view their own disclaimer acceptances"
    ON disclaimer_acceptances
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own disclaimer acceptances"
    ON disclaimer_acceptances
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts"
    ON emergency_contacts
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for audit logs (read-only for users)
CREATE POLICY "Users can view their own audit logs"
    ON disclaimer_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own interaction audits"
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

-- Triggers for updated_at
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

-- Function to enforce disclaimer uniqueness
CREATE OR REPLACE FUNCTION enforce_disclaimer_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate previous disclaimers for same user and feature type
    UPDATE disclaimer_acceptances
    SET is_active = FALSE
    WHERE user_id = NEW.user_id
      AND feature_type = NEW.feature_type
      AND is_active = TRUE
      AND id != NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for disclaimer uniqueness
CREATE TRIGGER enforce_disclaimer_uniqueness_trigger
    AFTER INSERT ON disclaimer_acceptances
    FOR EACH ROW
    EXECUTE FUNCTION enforce_disclaimer_uniqueness();

-- Function to validate emergency contact requirements
CREATE OR REPLACE FUNCTION validate_emergency_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is a minor, ensure emergency contact is provided
    IF NEW.is_minor = TRUE AND NEW.emergency_contact IS NULL THEN
        RAISE EXCEPTION 'Emergency contact is required for minors';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for emergency contact validation
CREATE TRIGGER validate_emergency_contact_trigger
    BEFORE INSERT OR UPDATE ON disclaimer_acceptances
    FOR EACH ROW
    EXECUTE FUNCTION validate_emergency_contact();

-- ============================================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
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

-- Function to get interaction severity summary
CREATE OR REPLACE FUNCTION get_interaction_summary(
    medication_list TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{"critical": 0, "major": 0, "moderate": 0, "minor": 0}';
    med1 TEXT;
    med2 TEXT;
    interaction_severity TEXT;
BEGIN
    -- Compare each medication with every other medication
    FOR i IN 1..array_length(medication_list, 1) LOOP
        FOR j IN (i+1)..array_length(medication_list, 1) LOOP
            med1 := medication_list[i];
            med2 := medication_list[j];

            -- Check for interaction in both directions
            SELECT severity INTO interaction_severity
            FROM drug_interactions
            WHERE ((drug1 = med1 AND drug2 = med2) OR (drug1 = med2 AND drug2 = med1))
              AND is_active = TRUE
            LIMIT 1;

            -- Update severity count
            IF interaction_severity IS NOT NULL THEN
                result := jsonb_set(
                    result,
                    ARRAY[interaction_severity],
                    ((result->>interaction_severity)::INT + 1)::TEXT::JSONB
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN result;
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
-- DATA RETENTION POLICIES
-- ============================================================================

-- Function to clean up old audit logs (HIPAA requires 7 year retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete audit logs older than 7 years
    DELETE FROM disclaimer_audit_logs
    WHERE created_at < NOW() - INTERVAL '7 years';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    DELETE FROM interaction_audit_logs
    WHERE created_at < NOW() - INTERVAL '7 years';

    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert common critical drug interactions
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
     'Clinical Literature', 'high'),

    ('ace_inhibitors', 'nsaids', 'drug_drug', 'moderate',
     'NSAIDs may reduce antihypertensive effects and increase kidney toxicity',
     'Monitor blood pressure and kidney function regularly',
     'Clinical Studies', 'high')
ON CONFLICT (drug1, drug2, interaction_type) DO NOTHING;

-- Insert common medical warnings
INSERT INTO medical_warnings (
    warning_type, category, medication_name, severity, warning_text,
    pregnancy_category, source
) VALUES
    ('pregnancy', 'contraindication', 'isotretinoin', 'critical',
     'CONTRAINDICATED in pregnancy - severe birth defects guaranteed',
     'X', 'FDA Black Box Warning'),

    ('age', 'caution', 'aspirin', 'major',
     'Not recommended in children under 16 due to Reye syndrome risk',
     NULL, 'FDA Pediatric Guidelines'),

    ('age', 'monitoring', 'digoxin', 'moderate',
     'Elderly patients require dose reduction and closer monitoring',
     NULL, 'Geriatric Medicine Guidelines')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE disclaimer_acceptances IS 'HIPAA-compliant tracking of medical disclaimer acceptances with 30-day expiry';
COMMENT ON TABLE drug_interactions IS 'Comprehensive drug interaction database with severity classifications';
COMMENT ON TABLE medical_warnings IS 'Medical warnings for age groups, pregnancy, and conditions';
COMMENT ON TABLE emergency_contacts IS 'Encrypted emergency contact information for minor users';
COMMENT ON TABLE disclaimer_audit_logs IS 'Audit trail for disclaimer-related actions (7-year retention)';
COMMENT ON TABLE interaction_audit_logs IS 'Audit trail for drug interaction checks';

COMMENT ON COLUMN disclaimer_acceptances.ip_address_hash IS 'SHA-256 hashed IP address for privacy compliance';
COMMENT ON COLUMN disclaimer_acceptances.audit_trail IS 'JSON audit trail with app version, platform, compliance checks';
COMMENT ON COLUMN emergency_contacts.phone_number_encrypted IS 'AES encrypted phone number using app encryption key';

-- Grant necessary permissions
GRANT SELECT ON drug_interactions TO authenticated;
GRANT SELECT ON medical_warnings TO authenticated;
GRANT ALL ON disclaimer_acceptances TO authenticated;
GRANT ALL ON emergency_contacts TO authenticated;
GRANT INSERT, SELECT ON disclaimer_audit_logs TO authenticated;
GRANT INSERT, SELECT ON interaction_audit_logs TO authenticated;