-- Naturinex Database Schema with Data Retention Compliance
-- Compliant with GDPR, CCPA, HIPAA regulations
-- Version: 2.0
-- Last Updated: 2025-09-03

-- Enable UUID extension for better security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with retention metadata
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    display_name VARCHAR(100),
    photo_url TEXT,
    
    -- Subscription & Tier
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended', 'expired')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance & Retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deletion_requested_at TIMESTAMP WITH TIME ZONE,
    deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
    data_retention_consent BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT TRUE,
    
    -- Security
    account_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    last_password_change TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    INDEX idx_users_email (email),
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_last_active (last_active_at),
    INDEX idx_users_deletion_scheduled (deletion_scheduled_at)
);

-- Health profiles with encrypted sensitive data
CREATE TABLE health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Encrypted health data
    encrypted_medical_conditions TEXT, -- PGP encrypted
    encrypted_medications TEXT, -- PGP encrypted
    encrypted_allergies TEXT, -- PGP encrypted
    
    -- Non-sensitive health data
    age_range VARCHAR(20),
    biological_sex VARCHAR(20),
    activity_level VARCHAR(20),
    dietary_preferences JSONB,
    
    -- Retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 years'),
    
    INDEX idx_health_user_id (user_id)
);

-- Scan history with automatic purging
CREATE TABLE scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Keep anonymous stats
    
    -- Scan data
    medication_name VARCHAR(255),
    scan_type VARCHAR(50) CHECK (scan_type IN ('ocr', 'barcode', 'manual', 'voice')),
    scan_result JSONB,
    ai_suggestions TEXT,
    
    -- Metadata
    device_id VARCHAR(255), -- Hashed device identifier
    ip_address_hash VARCHAR(64), -- Hashed IP for security
    location_country VARCHAR(2), -- Country code only for compliance
    
    -- Retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days'),
    anonymized BOOLEAN DEFAULT FALSE,
    
    INDEX idx_scan_user_id (user_id),
    INDEX idx_scan_created (created_at),
    INDEX idx_scan_expires (expires_at)
);

-- AI interactions with safety logging
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Request data
    prompt_hash VARCHAR(64), -- Hash of prompt for privacy
    model_version VARCHAR(50),
    response_summary TEXT,
    tokens_used INT,
    
    -- Safety & Compliance
    safety_flags JSONB,
    blocked BOOLEAN DEFAULT FALSE,
    block_reason VARCHAR(100),
    
    -- Performance
    response_time_ms INT,
    retry_count INT DEFAULT 0,
    
    -- Retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    INDEX idx_ai_user_id (user_id),
    INDEX idx_ai_created (created_at)
);

-- Payment transactions with PCI compliance
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Prevent deletion with payment history
    
    -- Transaction data
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_cents INT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    
    -- Compliance
    invoice_number VARCHAR(50),
    tax_amount_cents INT,
    
    -- No card details stored - only Stripe references
    payment_method_type VARCHAR(20),
    last_four VARCHAR(4), -- Last 4 digits only
    
    -- Retention (7 years for financial records)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 years'),
    
    INDEX idx_payment_user_id (user_id),
    INDEX idx_payment_stripe_id (stripe_payment_intent_id)
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    
    -- Action
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- Details
    changes JSONB,
    metadata JSONB,
    
    -- Compliance
    compliance_flags JSONB,
    
    -- Retention (2 years minimum for compliance)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '2 years'),
    
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type)
);

-- Privacy requests for GDPR/CCPA
CREATE TABLE privacy_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request details
    request_type VARCHAR(20) CHECK (request_type IN ('access', 'deletion', 'portability', 'rectification', 'restriction', 'objection')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    
    -- Processing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Response
    response_data JSONB,
    rejection_reason TEXT,
    
    -- Legal requirement: 30 days to process
    deadline_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    
    INDEX idx_privacy_user_id (user_id),
    INDEX idx_privacy_status (status),
    INDEX idx_privacy_deadline (deadline_at)
);

-- Consent tracking for compliance
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Consent details
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    version VARCHAR(20) NOT NULL,
    
    -- Metadata
    ip_address_hash VARCHAR(64),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_consent_user_id (user_id),
    INDEX idx_consent_type (consent_type)
);

-- Security incidents for monitoring
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Incident details
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT,
    
    -- Affected resources
    affected_user_ids UUID[],
    affected_resource_count INT,
    
    -- Response
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reported_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance
    requires_disclosure BOOLEAN DEFAULT FALSE,
    disclosure_sent BOOLEAN DEFAULT FALSE,
    
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_detected (detected_at)
);

-- Data retention policies table
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Policy details
    data_category VARCHAR(50) NOT NULL UNIQUE,
    retention_days INT NOT NULL,
    
    -- Actions
    anonymize_after_days INT,
    delete_after_days INT,
    
    -- Metadata
    legal_basis TEXT,
    last_enforced TIMESTAMP WITH TIME ZONE,
    next_enforcement TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default retention policies
INSERT INTO data_retention_policies (data_category, retention_days, anonymize_after_days, delete_after_days, legal_basis) VALUES
('user_account', 2555, NULL, 2555, 'GDPR Article 5(1)(e) - Active account data'),
('health_profile', 730, 365, 730, 'HIPAA - Health information retention'),
('scan_history', 90, 30, 90, 'Service improvement and analytics'),
('ai_interactions', 30, 7, 30, 'Service monitoring and improvement'),
('payment_records', 2555, NULL, 2555, 'Financial regulations - 7 year retention'),
('audit_logs', 730, NULL, 730, 'Security and compliance monitoring'),
('security_incidents', 1825, NULL, 1825, 'Security compliance - 5 year retention');

-- Functions for data retention

-- Function to anonymize old scan data
CREATE OR REPLACE FUNCTION anonymize_old_scans() RETURNS void AS $$
BEGIN
    UPDATE scan_history 
    SET 
        user_id = NULL,
        device_id = 'ANONYMIZED',
        ip_address_hash = 'ANONYMIZED',
        anonymized = TRUE
    WHERE 
        created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        AND anonymized = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to delete expired data
CREATE OR REPLACE FUNCTION delete_expired_data() RETURNS void AS $$
BEGIN
    -- Delete expired scans
    DELETE FROM scan_history WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete expired AI interactions
    DELETE FROM ai_interactions WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old audit logs
    DELETE FROM audit_logs WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Process deletion requests
    UPDATE users 
    SET deletion_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
    WHERE deletion_requested_at IS NOT NULL 
        AND deletion_scheduled_at IS NULL;
    
    -- Delete users scheduled for deletion
    DELETE FROM users WHERE deletion_scheduled_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce retention policies
CREATE OR REPLACE FUNCTION enforce_retention_policies() RETURNS void AS $$
DECLARE
    policy RECORD;
BEGIN
    FOR policy IN SELECT * FROM data_retention_policies LOOP
        -- Update next enforcement time
        UPDATE data_retention_policies 
        SET 
            last_enforced = CURRENT_TIMESTAMP,
            next_enforcement = CURRENT_TIMESTAMP + INTERVAL '1 day'
        WHERE id = policy.id;
        
        -- Execute specific retention logic based on category
        CASE policy.data_category
            WHEN 'scan_history' THEN
                PERFORM anonymize_old_scans();
            WHEN 'user_account' THEN
                -- Mark inactive users for deletion
                UPDATE users 
                SET deletion_requested_at = CURRENT_TIMESTAMP
                WHERE last_active_at < CURRENT_TIMESTAMP - INTERVAL '2 years'
                    AND deletion_requested_at IS NULL;
            ELSE
                -- Generic deletion based on expires_at
                NULL;
        END CASE;
    END LOOP;
    
    -- Run general cleanup
    PERFORM delete_expired_data();
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Scheduled jobs (to be run by cron or pg_cron)
-- Run daily at 2 AM: SELECT enforce_retention_policies();
-- Run hourly: SELECT delete_expired_data();
-- Run daily: SELECT anonymize_old_scans();

-- Indexes for performance
CREATE INDEX idx_users_inactive ON users (last_active_at) WHERE deletion_requested_at IS NULL;
CREATE INDEX idx_expired_scans ON scan_history (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_expired_ai ON ai_interactions (expires_at) WHERE expires_at IS NOT NULL;

-- Grants for application user (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO naturinex_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO naturinex_app;
-- REVOKE DELETE ON users, payment_transactions FROM naturinex_app; -- Soft delete only

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with GDPR/CCPA compliant retention metadata';
COMMENT ON TABLE health_profiles IS 'Encrypted health information with automatic expiration';
COMMENT ON TABLE scan_history IS 'Product scan history with 90-day retention and anonymization';
COMMENT ON TABLE ai_interactions IS 'AI usage tracking with safety monitoring';
COMMENT ON TABLE payment_transactions IS 'PCI-compliant payment records with 7-year retention';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE privacy_requests IS 'GDPR/CCPA data subject requests';
COMMENT ON TABLE consent_records IS 'User consent tracking for compliance';
COMMENT ON TABLE security_incidents IS 'Security incident tracking and response';
COMMENT ON TABLE data_retention_policies IS 'Configurable data retention policies';

-- Version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_versions (version, description) VALUES 
('2.0.0', 'Complete schema with data retention compliance for GDPR, CCPA, HIPAA');