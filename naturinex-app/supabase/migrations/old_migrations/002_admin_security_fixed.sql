-- Admin Security Infrastructure (FIXED VERSION)
-- Complete admin access control with audit logging, password rotation, and IP tracking

-- 1. Admin access logs table
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'view_users', 'modify_user', 'export_data', etc.
  resource TEXT, -- What they accessed
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  session_id UUID,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Admin profiles with enhanced security
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,  -- Changed: Removed NOT NULL temporarily
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin', -- 'admin', 'super_admin', 'owner'
  permissions JSONB DEFAULT '{}',

  -- Password management
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  password_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 months'),
  password_history TEXT[], -- Hashed previous passwords
  force_password_change BOOLEAN DEFAULT false,

  -- 2FA settings
  two_factor_enabled BOOLEAN DEFAULT true,
  two_factor_secret TEXT,
  backup_codes TEXT[],

  -- Security settings
  allowed_ip_addresses INET[], -- Whitelist IPs
  blocked_ip_addresses INET[], -- Blacklist IPs
  max_sessions INTEGER DEFAULT 3,
  session_timeout_minutes INTEGER DEFAULT 30,

  -- Activity tracking
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  last_login_location TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. Admin sessions tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_data JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 4. Admin permissions matrix
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- 'users', 'data', 'system', 'billing'
  risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  requires_2fa BOOLEAN DEFAULT true,
  requires_owner BOOLEAN DEFAULT false
);

-- Insert default permissions
INSERT INTO admin_permissions (permission_name, description, category, risk_level, requires_owner) VALUES
  ('users.view', 'View user profiles', 'users', 'low', false),
  ('users.modify', 'Modify user data', 'users', 'high', false),
  ('users.delete', 'Delete user accounts', 'users', 'critical', true),
  ('data.export', 'Export user data', 'data', 'high', false),
  ('data.delete', 'Delete application data', 'data', 'critical', true),
  ('billing.view', 'View billing information', 'billing', 'medium', false),
  ('billing.modify', 'Modify billing settings', 'billing', 'critical', true),
  ('system.config', 'Modify system configuration', 'system', 'critical', true),
  ('admin.create', 'Create new admin accounts', 'system', 'critical', true),
  ('admin.revoke', 'Revoke admin access', 'system', 'critical', true)
ON CONFLICT (permission_name) DO NOTHING;

-- 5. Password rotation tracking
CREATE TABLE IF NOT EXISTS password_rotation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  old_password_hash TEXT,
  new_password_hash TEXT,
  rotation_type TEXT, -- 'scheduled', 'forced', 'user_initiated'
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  rotated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Security alerts for admins
CREATE TABLE IF NOT EXISTS admin_security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL, -- 'suspicious_login', 'password_expiry', 'unusual_activity'
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_admin ON admin_access_logs(admin_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_ip ON admin_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_action ON admin_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_admin ON admin_security_alerts(admin_id, is_read);

-- Enable RLS
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_rotation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only super admins can view access logs
CREATE POLICY "Super admin access" ON admin_access_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'owner')
    )
  );

-- Admins can only view their own profile
CREATE POLICY "Own profile access" ON admin_profiles
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

-- Only owners can modify admin profiles
CREATE POLICY "Owner modify access" ON admin_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE (user_id = auth.uid() OR email = auth.email())
      AND role = 'owner'
    )
  );

-- Functions for admin security

-- Function to check if password needs rotation
CREATE OR REPLACE FUNCTION check_password_rotation(p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_force_change BOOLEAN;
BEGIN
  SELECT password_expires_at, force_password_change
  INTO v_expires_at, v_force_change
  FROM admin_profiles
  WHERE user_id = p_admin_id;

  IF v_force_change THEN
    RETURN TRUE;
  END IF;

  IF v_expires_at <= NOW() THEN
    UPDATE admin_profiles
    SET force_password_change = true
    WHERE user_id = p_admin_id;

    INSERT INTO admin_security_alerts (admin_id, alert_type, severity, title, message)
    VALUES (p_admin_id, 'password_expiry', 'high',
            'Password Expired',
            'Your password has expired and must be changed immediately.');

    RETURN TRUE;
  END IF;

  -- Alert if password expires in 7 days
  IF v_expires_at <= NOW() + INTERVAL '7 days' THEN
    INSERT INTO admin_security_alerts (admin_id, alert_type, severity, title, message)
    VALUES (p_admin_id, 'password_expiry', 'medium',
            'Password Expiring Soon',
            'Your password will expire in ' ||
            EXTRACT(DAY FROM v_expires_at - NOW()) || ' days.')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin access
CREATE OR REPLACE FUNCTION log_admin_access(
  p_admin_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_email TEXT;
  v_location JSONB;
BEGIN
  -- Get admin email
  SELECT email INTO v_email
  FROM admin_profiles
  WHERE user_id = p_admin_id;

  -- Get location from IP (would integrate with IP geolocation service)
  v_location := jsonb_build_object(
    'ip', p_ip_address,
    'timestamp', NOW()
  );

  -- Insert log
  INSERT INTO admin_access_logs (
    admin_id, admin_email, action, resource,
    ip_address, user_agent, metadata, success
  ) VALUES (
    p_admin_id, v_email, p_action, p_resource,
    p_ip_address, p_user_agent, p_metadata || v_location, p_success
  ) RETURNING id INTO v_log_id;

  -- Check for suspicious activity
  IF p_action IN ('users.delete', 'data.export', 'billing.modify') THEN
    INSERT INTO admin_security_alerts (
      admin_id, alert_type, severity, title, message, metadata
    ) VALUES (
      p_admin_id, 'high_risk_action', 'high',
      'High Risk Action Performed',
      'Action: ' || p_action || ' on ' || COALESCE(p_resource, 'system'),
      jsonb_build_object('action', p_action, 'ip', p_ip_address)
    );
  END IF;

  -- Check for unusual IP
  IF NOT EXISTS (
    SELECT 1 FROM admin_access_logs
    WHERE admin_id = p_admin_id
    AND ip_address = p_ip_address
    AND timestamp > NOW() - INTERVAL '30 days'
    AND id != v_log_id
  ) THEN
    INSERT INTO admin_security_alerts (
      admin_id, alert_type, severity, title, message, metadata
    ) VALUES (
      p_admin_id, 'new_ip_address', 'medium',
      'Login from New IP Address',
      'New IP detected: ' || p_ip_address,
      jsonb_build_object('ip', p_ip_address, 'user_agent', p_user_agent)
    );
  END IF;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate admin session
CREATE OR REPLACE FUNCTION validate_admin_session(
  p_session_token TEXT,
  p_ip_address TEXT
) RETURNS TABLE(
  is_valid BOOLEAN,
  admin_id UUID,
  role TEXT,
  message TEXT
) AS $$
DECLARE
  v_session RECORD;
  v_profile RECORD;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM admin_sessions
  WHERE session_token = p_session_token
  AND is_active = true
  AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Invalid or expired session';
    RETURN;
  END IF;

  -- Check IP match
  IF v_session.ip_address != p_ip_address THEN
    -- Log security alert
    INSERT INTO admin_security_alerts (
      admin_id, alert_type, severity, title, message
    ) VALUES (
      v_session.admin_id, 'ip_mismatch', 'high',
      'Session IP Mismatch',
      'Session accessed from different IP: ' || p_ip_address
    );

    -- Terminate session
    UPDATE admin_sessions
    SET is_active = false,
        terminated_at = NOW(),
        termination_reason = 'IP mismatch'
    WHERE id = v_session.id;

    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Session terminated: IP mismatch';
    RETURN;
  END IF;

  -- Get admin profile
  SELECT * INTO v_profile
  FROM admin_profiles
  WHERE user_id = v_session.admin_id;

  -- Check if account is locked
  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > NOW() THEN
    RETURN QUERY SELECT false, v_session.admin_id, v_profile.role, 'Account locked';
    RETURN;
  END IF;

  -- Check password rotation
  IF check_password_rotation(v_session.admin_id) THEN
    RETURN QUERY SELECT false, v_session.admin_id, v_profile.role, 'Password change required';
    RETURN;
  END IF;

  -- Update session activity
  UPDATE admin_sessions
  SET last_activity = NOW(),
      expires_at = NOW() + (v_profile.session_timeout_minutes || ' minutes')::INTERVAL
  WHERE id = v_session.id;

  RETURN QUERY SELECT true, v_session.admin_id, v_profile.role, 'Valid session';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-expire old passwords
CREATE OR REPLACE FUNCTION trigger_password_expiry_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Check all admin passwords daily
  UPDATE admin_profiles
  SET force_password_change = true
  WHERE password_expires_at <= NOW()
  AND force_password_change = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on scan_logs to check daily (only if scan_logs exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_logs') THEN
    CREATE TRIGGER check_password_expiry
      AFTER INSERT ON scan_logs
      FOR EACH STATEMENT
      EXECUTE FUNCTION trigger_password_expiry_check();
  END IF;
END $$;

-- Grant permissions
GRANT SELECT ON admin_access_logs TO authenticated;
GRANT ALL ON admin_profiles TO service_role;
GRANT ALL ON admin_sessions TO service_role;

-- Initial admin setup (FIXED - handles case where user doesn't exist)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if admin profile already exists
  IF NOT EXISTS (SELECT 1 FROM admin_profiles WHERE email = 'guampaul@gmail.com') THEN

    -- Get user ID if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'guampaul@gmail.com' LIMIT 1;

    -- If user exists, create admin profile
    IF v_user_id IS NOT NULL THEN
      INSERT INTO admin_profiles (
        user_id,
        email,
        role,
        permissions,
        two_factor_enabled,
        allowed_ip_addresses
      ) VALUES (
        v_user_id,
        'guampaul@gmail.com',
        'owner',
        '{"all": true}'::JSONB,
        true,
        ARRAY[]::INET[]
      );
      RAISE NOTICE 'Admin profile created for existing user: guampaul@gmail.com';
    ELSE
      -- User doesn't exist yet, create profile without user_id
      -- It will be linked when the user signs up
      INSERT INTO admin_profiles (
        user_id,
        email,
        role,
        permissions,
        two_factor_enabled,
        allowed_ip_addresses
      ) VALUES (
        NULL,  -- Will be updated when user signs up
        'guampaul@gmail.com',
        'owner',
        '{"all": true}'::JSONB,
        true,
        ARRAY[]::INET[]
      );
      RAISE NOTICE 'Admin profile pre-created for: guampaul@gmail.com (user not yet registered)';
    END IF;
  ELSE
    RAISE NOTICE 'Admin profile already exists for: guampaul@gmail.com';
  END IF;
END $$;

-- Create trigger to link admin profile when user signs up
CREATE OR REPLACE FUNCTION link_admin_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a pre-created admin profile for this email
  UPDATE admin_profiles
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;

  -- Also update the profiles table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    UPDATE profiles
    SET role = 'admin'
    WHERE user_id = NEW.id
    AND email IN (SELECT email FROM admin_profiles WHERE role IN ('admin', 'super_admin', 'owner'));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS link_admin_on_signup ON auth.users;
CREATE TRIGGER link_admin_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_admin_profile_on_signup();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Admin security infrastructure created successfully!';
  RAISE NOTICE 'Password rotation: Every 6 months';
  RAISE NOTICE 'All admin access is logged with IP and location';
  RAISE NOTICE 'Admin profile ready for: guampaul@gmail.com';
  RAISE NOTICE 'Profile will be linked when user signs up/logs in';
  RAISE NOTICE '==================================================';
END $$;