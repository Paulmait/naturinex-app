-- Two-Factor Authentication Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- Table for user 2FA settings
CREATE TABLE IF NOT EXISTS user_2fa_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Phone 2FA
    phone_2fa_enabled BOOLEAN DEFAULT FALSE,
    phone_number TEXT,

    -- TOTP (Authenticator App) 2FA
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_secret_encrypted TEXT,

    -- Biometric 2FA
    biometric_enabled BOOLEAN DEFAULT FALSE,

    -- Backup codes
    backup_codes JSONB, -- Array of encrypted backup codes
    backup_codes_used JSONB DEFAULT '[]'::jsonb, -- Array of used backup code indices

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Table for phone verification (temporary storage)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    INDEX(user_id, verification_code),
    INDEX(expires_at)
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_2fa_settings
CREATE POLICY "Users can view their own 2FA settings" ON user_2fa_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON user_2fa_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON user_2fa_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings" ON user_2fa_settings
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for phone_verifications
CREATE POLICY "Users can view their own phone verifications" ON phone_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone verifications" ON phone_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone verifications" ON phone_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_2fa_settings_updated_at
    BEFORE UPDATE ON user_2fa_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired phone verifications (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_phone_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_verifications
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at);

-- Example of how to check if a user has 2FA enabled
CREATE OR REPLACE FUNCTION user_has_2fa_enabled(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_2fa BOOLEAN := FALSE;
BEGIN
    SELECT (
        COALESCE(phone_2fa_enabled, FALSE) OR
        COALESCE(totp_enabled, FALSE) OR
        COALESCE(biometric_enabled, FALSE)
    ) INTO has_2fa
    FROM user_2fa_settings
    WHERE user_id = user_uuid;

    RETURN COALESCE(has_2fa, FALSE);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Example of how to get user's 2FA methods
CREATE OR REPLACE FUNCTION get_user_2fa_methods(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    methods JSONB := '[]'::jsonb;
    settings RECORD;
BEGIN
    SELECT * INTO settings
    FROM user_2fa_settings
    WHERE user_id = user_uuid;

    IF NOT FOUND THEN
        RETURN methods;
    END IF;

    IF settings.phone_2fa_enabled THEN
        methods := methods || '["phone"]'::jsonb;
    END IF;

    IF settings.totp_enabled THEN
        methods := methods || '["totp"]'::jsonb;
    END IF;

    IF settings.biometric_enabled THEN
        methods := methods || '["biometric"]'::jsonb;
    END IF;

    RETURN methods;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_2fa_settings TO authenticated;
GRANT ALL ON phone_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_2fa_enabled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_2fa_methods(UUID) TO authenticated;