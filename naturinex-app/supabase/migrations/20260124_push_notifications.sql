-- Migration: Push Notification Infrastructure
-- Purpose: Store push tokens and notification preferences
-- Date: 2026-01-23

-- ============================================
-- User Push Tokens
-- ============================================
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    push_token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
    device_name VARCHAR(255),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_token UNIQUE (user_id, push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON user_push_tokens(platform);

-- ============================================
-- User Notification Settings
-- ============================================
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{
        "enabled": true,
        "subscription": true,
        "features": true,
        "reminders": true,
        "engagement": true,
        "quietHoursEnabled": false,
        "quietHoursStart": "22:00",
        "quietHoursEnd": "08:00"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON user_notification_settings(user_id);

-- ============================================
-- Notification Log (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT,
    body TEXT,
    data JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    platform VARCHAR(20),
    status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'delivered', 'clicked', 'failed'
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent ON notification_log(sent_at);

-- ============================================
-- Scheduled Notifications (for campaigns)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    target_audience JSONB, -- {"subscription_status": "free", "last_active_days_ago": 7}
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'cancelled'
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time ON scheduled_notifications(scheduled_at);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own push tokens
DROP POLICY IF EXISTS "Users manage own tokens" ON user_push_tokens;
CREATE POLICY "Users manage own tokens" ON user_push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own notification settings
DROP POLICY IF EXISTS "Users manage own notification settings" ON user_notification_settings;
CREATE POLICY "Users manage own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own notification log
DROP POLICY IF EXISTS "Users view own notification log" ON notification_log;
CREATE POLICY "Users view own notification log" ON notification_log
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can manage scheduled notifications
DROP POLICY IF EXISTS "Service role manages scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Service role manages scheduled notifications" ON scheduled_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Functions
-- ============================================

-- Function to get active push tokens for a user
CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TABLE (push_token TEXT, platform VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT upt.push_token, upt.platform
    FROM user_push_tokens upt
    WHERE upt.user_id = target_user_id AND upt.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users for targeted notification
CREATE OR REPLACE FUNCTION get_notification_targets(target_criteria JSONB)
RETURNS TABLE (user_id UUID, push_token TEXT, platform VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT upt.user_id, upt.push_token, upt.platform
    FROM user_push_tokens upt
    JOIN user_notification_settings uns ON uns.user_id = upt.user_id
    WHERE upt.is_active = true
    AND (uns.settings->>'enabled')::boolean = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_push_tokens IS 'Stores push notification tokens for each user device';
COMMENT ON TABLE user_notification_settings IS 'User preferences for notification types';
COMMENT ON TABLE notification_log IS 'Log of all notifications sent for analytics';
COMMENT ON TABLE scheduled_notifications IS 'Scheduled notification campaigns';
