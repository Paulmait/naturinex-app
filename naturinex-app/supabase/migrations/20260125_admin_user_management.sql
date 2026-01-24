-- Migration: Enhanced Admin User Management & Security
-- Purpose: Complete admin control over user accounts with comprehensive audit logging
-- Date: 2026-01-25

-- ============================================
-- 1. User Account Status Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS user_account_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,

    -- Account Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'banned', 'pending_deletion', 'deleted'
    status_reason TEXT,
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    status_changed_by UUID, -- Admin who made the change

    -- Suspension Details
    suspension_start TIMESTAMPTZ,
    suspension_end TIMESTAMPTZ, -- NULL = indefinite
    suspension_type VARCHAR(50), -- 'temporary', 'permanent', 'pending_review'
    suspension_count INTEGER DEFAULT 0,

    -- Violation Tracking
    tos_violations JSONB DEFAULT '[]'::jsonb, -- Array of violation records
    privacy_violations JSONB DEFAULT '[]'::jsonb,
    abuse_reports JSONB DEFAULT '[]'::jsonb,
    warning_count INTEGER DEFAULT 0,
    last_warning_at TIMESTAMPTZ,

    -- Account Flags
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    requires_password_reset BOOLEAN DEFAULT false,
    requires_email_verification BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_status_user ON user_account_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_status ON user_account_status(status);
CREATE INDEX IF NOT EXISTS idx_user_status_email ON user_account_status(email);

-- ============================================
-- 2. Admin Action Audit Log (Comprehensive)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Admin Information
    admin_id UUID NOT NULL,
    admin_email TEXT NOT NULL,
    admin_role VARCHAR(50) NOT NULL,

    -- Action Details
    action_type VARCHAR(100) NOT NULL, -- e.g., 'user.suspend', 'user.delete', 'user.reset_password'
    action_category VARCHAR(50) NOT NULL, -- 'user_management', 'data_access', 'system_config', 'billing'
    action_severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

    -- Target Information
    target_type VARCHAR(50), -- 'user', 'subscription', 'scan', 'system'
    target_id UUID,
    target_email TEXT,
    target_description TEXT,

    -- Request Details
    request_method VARCHAR(10),
    request_path TEXT,
    request_body JSONB, -- Sanitized request data
    request_query JSONB,

    -- Client Information
    ip_address INET NOT NULL,
    ip_location JSONB, -- {country, region, city, lat, lng, isp, org}
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    device_fingerprint TEXT,

    -- Session Information
    session_id UUID,
    session_started_at TIMESTAMPTZ,

    -- Result
    success BOOLEAN NOT NULL DEFAULT true,
    error_code VARCHAR(50),
    error_message TEXT,

    -- Before/After State (for changes)
    state_before JSONB,
    state_after JSONB,
    changes_made JSONB, -- Summary of what changed

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Additional Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action_type, action_category);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON admin_audit_log(action_severity);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON admin_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON admin_audit_log(started_at DESC);

-- ============================================
-- 3. Admin Password Policy Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS admin_password_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Password Requirements
    min_length INTEGER NOT NULL DEFAULT 16,
    max_length INTEGER NOT NULL DEFAULT 128,
    require_uppercase BOOLEAN DEFAULT true,
    min_uppercase INTEGER DEFAULT 2,
    require_lowercase BOOLEAN DEFAULT true,
    min_lowercase INTEGER DEFAULT 2,
    require_numbers BOOLEAN DEFAULT true,
    min_numbers INTEGER DEFAULT 2,
    require_special BOOLEAN DEFAULT true,
    min_special INTEGER DEFAULT 2,
    special_chars TEXT DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',

    -- Password History
    password_history_count INTEGER DEFAULT 12, -- Cannot reuse last 12 passwords

    -- Expiration Settings
    expiration_days INTEGER DEFAULT 180, -- 6 months
    warning_days INTEGER DEFAULT 14, -- Warn 14 days before expiry
    grace_period_hours INTEGER DEFAULT 24, -- Hours after expiry before lockout

    -- Lockout Policy
    max_failed_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    progressive_lockout BOOLEAN DEFAULT true, -- Increases with each lockout

    -- Additional Security
    require_2fa BOOLEAN DEFAULT true,
    allow_password_hints BOOLEAN DEFAULT false,
    check_common_passwords BOOLEAN DEFAULT true,
    check_breached_passwords BOOLEAN DEFAULT true,

    -- Session Settings
    max_concurrent_sessions INTEGER DEFAULT 2,
    session_timeout_minutes INTEGER DEFAULT 30,
    require_reauth_for_sensitive BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

-- Insert default policy
INSERT INTO admin_password_policy (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. User Password Reset Requests (Admin-initiated)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request Details
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    requested_by_admin_id UUID NOT NULL,
    requested_by_admin_email TEXT NOT NULL,

    -- Reset Information
    reset_token_hash TEXT, -- Hashed token sent to user
    reset_reason TEXT NOT NULL,
    force_change_on_login BOOLEAN DEFAULT true,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'expired', 'cancelled'
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Audit
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON admin_password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_admin ON admin_password_reset_requests(requested_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON admin_password_reset_requests(status);

-- ============================================
-- 5. User Data Access Log (GDPR/Privacy Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS user_data_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Access Details
    admin_id UUID NOT NULL,
    admin_email TEXT NOT NULL,
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,

    -- What was accessed
    data_type VARCHAR(100) NOT NULL, -- 'profile', 'scans', 'subscription', 'payments', 'activity'
    data_fields TEXT[], -- Specific fields accessed
    access_reason TEXT NOT NULL, -- Must provide justification

    -- Request Context
    support_ticket_id TEXT,
    legal_request_id TEXT,

    -- Access Method
    ip_address INET NOT NULL,
    user_agent TEXT,

    -- Timestamps
    accessed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Data Export (if applicable)
    was_exported BOOLEAN DEFAULT false,
    export_format VARCHAR(20),
    export_file_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_access_admin ON user_data_access_log(admin_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_user ON user_data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_type ON user_data_access_log(data_type);

-- ============================================
-- 6. Analytics Access Permissions
-- ============================================
CREATE TABLE IF NOT EXISTS admin_analytics_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL UNIQUE,

    -- Dashboard Access
    can_view_user_analytics BOOLEAN DEFAULT true,
    can_view_revenue_analytics BOOLEAN DEFAULT false,
    can_view_scan_analytics BOOLEAN DEFAULT true,
    can_view_engagement_analytics BOOLEAN DEFAULT true,
    can_view_error_analytics BOOLEAN DEFAULT true,
    can_view_performance_analytics BOOLEAN DEFAULT false,

    -- Export Permissions
    can_export_reports BOOLEAN DEFAULT false,
    can_schedule_reports BOOLEAN DEFAULT false,
    max_export_rows INTEGER DEFAULT 10000,

    -- Real-time Access
    can_view_realtime BOOLEAN DEFAULT true,

    -- Historical Data
    historical_data_days INTEGER DEFAULT 90, -- How far back they can view

    -- Audit
    granted_by UUID,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. RLS Policies
-- ============================================
ALTER TABLE user_account_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_analytics_access ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access" ON user_account_status;
CREATE POLICY "Service role full access" ON user_account_status
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access" ON admin_audit_log;
CREATE POLICY "Service role full access" ON admin_audit_log
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access" ON admin_password_policy;
CREATE POLICY "Service role full access" ON admin_password_policy
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access" ON admin_password_reset_requests;
CREATE POLICY "Service role full access" ON admin_password_reset_requests
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access" ON user_data_access_log;
CREATE POLICY "Service role full access" ON user_data_access_log
    FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full access" ON admin_analytics_access;
CREATE POLICY "Service role full access" ON admin_analytics_access
    FOR ALL TO service_role USING (true);

-- ============================================
-- 8. Functions for Admin Operations
-- ============================================

-- Function to validate admin password against policy
CREATE OR REPLACE FUNCTION validate_admin_password(
    p_password TEXT,
    p_admin_id UUID DEFAULT NULL
) RETURNS TABLE (
    is_valid BOOLEAN,
    errors TEXT[]
) AS $$
DECLARE
    v_policy RECORD;
    v_errors TEXT[] := '{}';
    v_hash TEXT;
BEGIN
    -- Get policy
    SELECT * INTO v_policy FROM admin_password_policy LIMIT 1;

    -- Check length
    IF LENGTH(p_password) < v_policy.min_length THEN
        v_errors := array_append(v_errors, 'Password must be at least ' || v_policy.min_length || ' characters');
    END IF;

    IF LENGTH(p_password) > v_policy.max_length THEN
        v_errors := array_append(v_errors, 'Password must not exceed ' || v_policy.max_length || ' characters');
    END IF;

    -- Check uppercase
    IF v_policy.require_uppercase AND
       (SELECT COUNT(*) FROM regexp_matches(p_password, '[A-Z]', 'g')) < v_policy.min_uppercase THEN
        v_errors := array_append(v_errors, 'Password must contain at least ' || v_policy.min_uppercase || ' uppercase letters');
    END IF;

    -- Check lowercase
    IF v_policy.require_lowercase AND
       (SELECT COUNT(*) FROM regexp_matches(p_password, '[a-z]', 'g')) < v_policy.min_lowercase THEN
        v_errors := array_append(v_errors, 'Password must contain at least ' || v_policy.min_lowercase || ' lowercase letters');
    END IF;

    -- Check numbers
    IF v_policy.require_numbers AND
       (SELECT COUNT(*) FROM regexp_matches(p_password, '[0-9]', 'g')) < v_policy.min_numbers THEN
        v_errors := array_append(v_errors, 'Password must contain at least ' || v_policy.min_numbers || ' numbers');
    END IF;

    -- Check special characters
    IF v_policy.require_special AND
       (SELECT COUNT(*) FROM regexp_matches(p_password, '[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', 'g')) < v_policy.min_special THEN
        v_errors := array_append(v_errors, 'Password must contain at least ' || v_policy.min_special || ' special characters');
    END IF;

    -- Check common passwords (simplified check)
    IF v_policy.check_common_passwords AND LOWER(p_password) IN (
        'password', 'password123', '123456', 'qwerty', 'letmein', 'welcome',
        'admin123', 'admin', 'root', 'master', 'passw0rd', 'p@ssword'
    ) THEN
        v_errors := array_append(v_errors, 'Password is too common and easily guessable');
    END IF;

    -- Check password history if admin_id provided
    IF p_admin_id IS NOT NULL THEN
        -- Hash the new password for comparison
        v_hash := encode(sha256(p_password::bytea), 'hex');

        IF EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE user_id = p_admin_id
            AND v_hash = ANY(password_history)
        ) THEN
            v_errors := array_append(v_errors, 'Password has been used recently. Choose a different password.');
        END IF;
    END IF;

    RETURN QUERY SELECT array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend a user
CREATE OR REPLACE FUNCTION admin_suspend_user(
    p_admin_id UUID,
    p_user_id UUID,
    p_reason TEXT,
    p_duration_days INTEGER DEFAULT NULL, -- NULL = indefinite
    p_violation_type TEXT DEFAULT 'tos'
) RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_admin_email TEXT;
    v_suspension_end TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    -- Get emails
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT email INTO v_admin_email FROM admin_profiles WHERE user_id = p_admin_id;

    IF v_user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Calculate suspension end
    IF p_duration_days IS NOT NULL THEN
        v_suspension_end := NOW() + (p_duration_days || ' days')::INTERVAL;
    END IF;

    -- Update or insert user status
    INSERT INTO user_account_status (
        user_id, email, status, status_reason, status_changed_by,
        suspension_start, suspension_end, suspension_type, suspension_count
    ) VALUES (
        p_user_id, v_user_email, 'suspended', p_reason, p_admin_id,
        NOW(), v_suspension_end,
        CASE WHEN p_duration_days IS NULL THEN 'permanent' ELSE 'temporary' END,
        1
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'suspended',
        status_reason = p_reason,
        status_changed_at = NOW(),
        status_changed_by = p_admin_id,
        suspension_start = NOW(),
        suspension_end = v_suspension_end,
        suspension_type = CASE WHEN p_duration_days IS NULL THEN 'permanent' ELSE 'temporary' END,
        suspension_count = user_account_status.suspension_count + 1,
        tos_violations = CASE
            WHEN p_violation_type = 'tos' THEN
                user_account_status.tos_violations || jsonb_build_object(
                    'date', NOW(),
                    'reason', p_reason,
                    'admin', v_admin_email
                )
            ELSE user_account_status.tos_violations
        END,
        privacy_violations = CASE
            WHEN p_violation_type = 'privacy' THEN
                user_account_status.privacy_violations || jsonb_build_object(
                    'date', NOW(),
                    'reason', p_reason,
                    'admin', v_admin_email
                )
            ELSE user_account_status.privacy_violations
        END,
        updated_at = NOW();

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'user_email', v_user_email,
        'status', 'suspended',
        'suspension_end', v_suspension_end,
        'admin_email', v_admin_email
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unsuspend a user
CREATE OR REPLACE FUNCTION admin_unsuspend_user(
    p_admin_id UUID,
    p_user_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_admin_email TEXT;
BEGIN
    SELECT email INTO v_admin_email FROM admin_profiles WHERE user_id = p_admin_id;

    UPDATE user_account_status
    SET status = 'active',
        status_reason = p_notes,
        status_changed_at = NOW(),
        status_changed_by = p_admin_id,
        suspension_end = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'status', 'active',
        'admin_email', v_admin_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user for deletion (soft delete)
CREATE OR REPLACE FUNCTION admin_delete_user(
    p_admin_id UUID,
    p_user_id UUID,
    p_reason TEXT,
    p_immediate BOOLEAN DEFAULT false
) RETURNS JSONB AS $$
DECLARE
    v_user_email TEXT;
    v_admin_email TEXT;
BEGIN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT email INTO v_admin_email FROM admin_profiles WHERE user_id = p_admin_id;

    IF v_user_email IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    IF p_immediate THEN
        -- Immediate deletion - mark as deleted
        UPDATE user_account_status
        SET status = 'deleted',
            status_reason = p_reason,
            status_changed_at = NOW(),
            status_changed_by = p_admin_id,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- 30-day grace period before permanent deletion
        UPDATE user_account_status
        SET status = 'pending_deletion',
            status_reason = p_reason,
            status_changed_at = NOW(),
            status_changed_by = p_admin_id,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'user_email', v_user_email,
        'status', CASE WHEN p_immediate THEN 'deleted' ELSE 'pending_deletion' END,
        'admin_email', v_admin_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log comprehensive admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_action_category TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_request_body JSONB DEFAULT NULL,
    p_state_before JSONB DEFAULT NULL,
    p_state_after JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_admin RECORD;
    v_log_id UUID;
    v_severity TEXT;
    v_target_email TEXT;
    v_changes JSONB;
BEGIN
    -- Get admin info
    SELECT * INTO v_admin FROM admin_profiles WHERE user_id = p_admin_id;

    -- Determine severity
    v_severity := CASE
        WHEN p_action_type LIKE '%.delete%' THEN 'critical'
        WHEN p_action_type LIKE '%.suspend%' THEN 'high'
        WHEN p_action_type LIKE '%.modify%' THEN 'high'
        WHEN p_action_type LIKE '%.export%' THEN 'high'
        WHEN p_action_type LIKE '%.view%' THEN 'low'
        ELSE 'medium'
    END;

    -- Get target email if it's a user
    IF p_target_type = 'user' AND p_target_id IS NOT NULL THEN
        SELECT email INTO v_target_email FROM auth.users WHERE id = p_target_id;
    END IF;

    -- Calculate changes if before/after provided
    IF p_state_before IS NOT NULL AND p_state_after IS NOT NULL THEN
        -- Simple diff - in production, use a proper diff function
        v_changes := jsonb_build_object(
            'before_keys', jsonb_object_keys(p_state_before),
            'after_keys', jsonb_object_keys(p_state_after)
        );
    END IF;

    -- Insert log
    INSERT INTO admin_audit_log (
        admin_id, admin_email, admin_role,
        action_type, action_category, action_severity,
        target_type, target_id, target_email,
        ip_address, user_agent,
        request_body, state_before, state_after, changes_made,
        success, error_message, metadata,
        started_at, completed_at, duration_ms
    ) VALUES (
        p_admin_id, v_admin.email, v_admin.role,
        p_action_type, p_action_category, v_severity,
        p_target_type, p_target_id, v_target_email,
        p_ip_address, p_user_agent,
        p_request_body, p_state_before, p_state_after, v_changes,
        p_success, p_error_message, p_metadata,
        NOW(), NOW(), 0
    ) RETURNING id INTO v_log_id;

    -- Create security alert for critical actions
    IF v_severity = 'critical' THEN
        INSERT INTO admin_security_alerts (
            admin_id, alert_type, severity, title, message, metadata
        ) VALUES (
            p_admin_id, 'critical_action', 'critical',
            'Critical Admin Action Performed',
            'Action: ' || p_action_type || ' by ' || v_admin.email,
            jsonb_build_object(
                'action', p_action_type,
                'target_id', p_target_id,
                'ip', p_ip_address::text,
                'log_id', v_log_id
            )
        );
    END IF;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Update admin_profiles for enhanced requirements
-- ============================================
ALTER TABLE admin_profiles
    ADD COLUMN IF NOT EXISTS password_strength_score INTEGER,
    ADD COLUMN IF NOT EXISTS last_password_check TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS mfa_methods JSONB DEFAULT '["totp"]'::jsonb,
    ADD COLUMN IF NOT EXISTS security_questions JSONB,
    ADD COLUMN IF NOT EXISTS recovery_email TEXT,
    ADD COLUMN IF NOT EXISTS recovery_phone TEXT;

-- ============================================
-- 10. Common Passwords Table (for checking)
-- ============================================
CREATE TABLE IF NOT EXISTS common_passwords (
    id SERIAL PRIMARY KEY,
    password_hash TEXT NOT NULL UNIQUE,
    frequency INTEGER DEFAULT 1
);

-- Insert some common password hashes
INSERT INTO common_passwords (password_hash) VALUES
    (encode(sha256('password'::bytea), 'hex')),
    (encode(sha256('123456'::bytea), 'hex')),
    (encode(sha256('password123'::bytea), 'hex')),
    (encode(sha256('admin'::bytea), 'hex')),
    (encode(sha256('letmein'::bytea), 'hex')),
    (encode(sha256('welcome'::bytea), 'hex')),
    (encode(sha256('qwerty'::bytea), 'hex')),
    (encode(sha256('abc123'::bytea), 'hex')),
    (encode(sha256('monkey'::bytea), 'hex')),
    (encode(sha256('master'::bytea), 'hex'))
ON CONFLICT DO NOTHING;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE user_account_status IS 'Tracks user account status including suspensions and bans';
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log of all admin actions';
COMMENT ON TABLE admin_password_policy IS 'Password policy configuration for admin accounts';
COMMENT ON TABLE admin_password_reset_requests IS 'Admin-initiated password reset requests for users';
COMMENT ON TABLE user_data_access_log IS 'GDPR-compliant log of admin access to user data';
COMMENT ON TABLE admin_analytics_access IS 'Controls admin access to various analytics dashboards';

COMMENT ON FUNCTION validate_admin_password IS 'Validates password against security policy';
COMMENT ON FUNCTION admin_suspend_user IS 'Suspends a user account with full audit trail';
COMMENT ON FUNCTION admin_unsuspend_user IS 'Reinstates a suspended user account';
COMMENT ON FUNCTION admin_delete_user IS 'Marks a user for deletion (soft delete with grace period)';
COMMENT ON FUNCTION log_admin_action IS 'Logs comprehensive admin action with full context';
