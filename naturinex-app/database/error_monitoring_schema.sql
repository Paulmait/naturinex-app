-- Error and Monitoring Tables for NaturineX App
-- This script creates the necessary tables for comprehensive error handling,
-- offline support, and monitoring analytics

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    error_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    user_message TEXT,
    technical_message TEXT,
    error_name VARCHAR(255),
    error_code VARCHAR(100),
    status_code INTEGER,
    stack_trace TEXT,
    component_stack TEXT,
    context VARCHAR(255),
    additional_data JSONB,
    recovery_suggestions TEXT[],
    device_info JSONB,
    app_info JSONB,
    is_recoverable BOOLEAN DEFAULT true,
    user_reported BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_id ON error_logs(error_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    device_info JSONB,
    app_version VARCHAR(50),
    platform VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    interaction_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    crash_count INTEGER DEFAULT 0,
    device_info JSONB,
    app_version VARCHAR(50),
    platform VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(start_time);

-- Crash Reports Table
CREATE TABLE IF NOT EXISTS crash_reports (
    id BIGSERIAL PRIMARY KEY,
    crash_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_name VARCHAR(255),
    error_message TEXT,
    stack_trace TEXT,
    device_info JSONB,
    app_state JSONB,
    breadcrumbs JSONB,
    tags JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crash_reports
CREATE INDEX IF NOT EXISTS idx_crash_reports_user_id ON crash_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_crash_reports_session_id ON crash_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_crash_reports_created_at ON crash_reports(created_at);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB,
    device_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_session_id ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Offline Sync Queue Table (for tracking what needs to be synced)
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id BIGSERIAL PRIMARY KEY,
    operation_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL,
    operation_data JSONB NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_attempted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' -- pending, processing, completed, failed
);

-- Indexes for offline_sync_queue
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_user_id ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_status ON offline_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_priority ON offline_sync_queue(priority);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_created_at ON offline_sync_queue(created_at);

-- Feature Usage Table
CREATE TABLE IF NOT EXISTS feature_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for feature_usage
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_name);

-- App Health Metrics Table (for system-wide monitoring)
CREATE TABLE IF NOT EXISTS app_health_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- counter, gauge, histogram
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for app_health_metrics
CREATE INDEX IF NOT EXISTS idx_app_health_metrics_metric_name ON app_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_app_health_metrics_timestamp ON app_health_metrics(timestamp);

-- Views for common queries

-- Error Summary View
CREATE OR REPLACE VIEW error_summary AS
SELECT
    category,
    severity,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence,
    AVG(CASE WHEN resolved THEN 1 ELSE 0 END) as resolution_rate
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY category, severity
ORDER BY error_count DESC;

-- Performance Summary View
CREATE OR REPLACE VIEW performance_summary AS
SELECT
    metric_name,
    COUNT(*) as sample_count,
    AVG(metric_value) as avg_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY metric_name
ORDER BY avg_value DESC;

-- User Session Summary View
CREATE OR REPLACE VIEW session_summary AS
SELECT
    DATE(start_time) as session_date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(duration) as avg_duration,
    AVG(interaction_count) as avg_interactions,
    SUM(error_count) as total_errors,
    SUM(crash_count) as total_crashes
FROM user_sessions
WHERE start_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE(start_time)
ORDER BY session_date DESC;

-- Functions for common operations

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
    p_user_id UUID,
    p_feature_name VARCHAR(100),
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO feature_usage (user_id, feature_name, metadata)
    VALUES (p_user_id, p_feature_name, p_metadata)
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET
        usage_count = feature_usage.usage_count + 1,
        last_used_at = NOW(),
        metadata = CASE
            WHEN p_metadata IS NOT NULL THEN p_metadata
            ELSE feature_usage.metadata
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get user error stats
CREATE OR REPLACE FUNCTION get_user_error_stats(p_user_id UUID)
RETURNS TABLE (
    total_errors BIGINT,
    critical_errors BIGINT,
    resolved_errors BIGINT,
    recent_errors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_errors,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_errors,
        COUNT(*) FILTER (WHERE resolved = true) as resolved_errors,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_errors
    FROM error_logs
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old data (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data(days_to_keep INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
    -- Clean old error logs (keep critical errors longer)
    DELETE FROM error_logs
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND severity != 'critical';

    -- Clean old analytics events
    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;

    -- Clean old performance metrics
    DELETE FROM performance_metrics
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;

    -- Clean processed sync queue items
    DELETE FROM offline_sync_queue
    WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '1 day' * 7; -- Keep completed items for 7 days

    RAISE NOTICE 'Cleaned monitoring data older than % days', days_to_keep;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_error_logs_updated_at
    BEFORE UPDATE ON error_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crash_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

-- Policies for analytics_events
CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage sessions" ON user_sessions
    FOR ALL WITH CHECK (true);

-- Policies for crash_reports
CREATE POLICY "Users can view their own crash reports" ON crash_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert crash reports" ON crash_reports
    FOR INSERT WITH CHECK (true);

-- Policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert performance metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- Policies for offline_sync_queue
CREATE POLICY "Users can manage their own sync queue" ON offline_sync_queue
    FOR ALL USING (auth.uid() = user_id);

-- Policies for feature_usage
CREATE POLICY "Users can view their own feature usage" ON feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage feature usage" ON feature_usage
    FOR ALL WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON error_logs TO authenticated;
GRANT UPDATE ON user_sessions TO authenticated;
GRANT UPDATE ON offline_sync_queue TO authenticated;

-- Create a schedule for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_old_monitoring_data(90);');

COMMENT ON TABLE error_logs IS 'Comprehensive error logging with categorization and recovery tracking';
COMMENT ON TABLE analytics_events IS 'User interaction and application events for analytics';
COMMENT ON TABLE user_sessions IS 'User session tracking for engagement analytics';
COMMENT ON TABLE crash_reports IS 'Application crash reports with detailed context';
COMMENT ON TABLE performance_metrics IS 'Application performance metrics and monitoring';
COMMENT ON TABLE offline_sync_queue IS 'Queue for operations that need to be synced when online';
COMMENT ON TABLE feature_usage IS 'Feature usage tracking for product insights';
COMMENT ON TABLE app_health_metrics IS 'System-wide health and performance metrics';