-- Enable pg_cron extension for scheduled jobs
-- This runs in Supabase to enable scheduled database operations

-- Enable the pg_cron extension (requires superuser, handled by Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule daily training data stats update (runs at 3 AM UTC)
SELECT cron.schedule(
  'update-training-stats',
  '0 3 * * *',  -- Every day at 3 AM UTC
  $$SELECT update_training_stats()$$
);

-- Schedule daily cleanup of expired password reset requests (runs at 4 AM UTC)
SELECT cron.schedule(
  'cleanup-expired-resets',
  '0 4 * * *',
  $$DELETE FROM admin_password_reset_requests WHERE expires_at < NOW() AND status = 'pending'$$
);

-- Schedule weekly cleanup of old security events (runs Sunday at 5 AM UTC)
-- Keep only 90 days of security events
SELECT cron.schedule(
  'cleanup-old-security-events',
  '0 5 * * 0',
  $$DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days'$$
);

-- Schedule daily natural alternatives database refresh check (runs at 2 AM UTC)
-- This logs when the job runs - actual data fetch happens via external service
SELECT cron.schedule(
  'natural-alternatives-refresh-check',
  '0 2 * * *',
  $$INSERT INTO training_data_stats (stat_date, total_scans, created_at)
    VALUES (CURRENT_DATE, 0, NOW())
    ON CONFLICT (stat_date) DO NOTHING$$
);

-- View scheduled jobs
-- SELECT * FROM cron.job;

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - runs scheduled database operations';
