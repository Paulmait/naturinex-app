-- ============================================================================
-- SECURITY AUDIT REMEDIATION - February 25, 2026
-- ============================================================================
-- Addresses findings from Supabase Database Advisor (Feb 22, 2026)
--
-- Fixes:
-- 1. SECURITY DEFINER view (security_monitoring_summary) - ERROR
-- 2. RLS disabled on remaining tables - ERROR
-- 3. Functions with mutable search_path - WARN (23 remaining)
-- 4. Overly permissive RLS policies (WITH CHECK true) - WARN (13 policies)
-- 5. Tables with RLS enabled but no policies - INFO (22 tables)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX SECURITY DEFINER VIEW (ERROR)
-- ============================================================================
-- The security_monitoring_summary view uses SECURITY DEFINER which means it
-- executes with the owner's permissions, bypassing RLS.
-- Recreate with SECURITY INVOKER (or without SECURITY DEFINER).

DROP VIEW IF EXISTS public.security_monitoring_summary;

-- Recreate as SECURITY INVOKER view with restricted access
CREATE VIEW public.security_monitoring_summary
WITH (security_invoker = true) AS
SELECT
    'security_events' AS source,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d_count
FROM public.security_events
WHERE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'system_admin')
);

COMMENT ON VIEW public.security_monitoring_summary IS
'Security monitoring dashboard view. Uses security_invoker to run with caller permissions. Admin-only access via WHERE clause.';

-- Restrict view access to authenticated users (RLS handles admin check)
REVOKE ALL ON public.security_monitoring_summary FROM anon;
GRANT SELECT ON public.security_monitoring_summary TO authenticated;
GRANT SELECT ON public.security_monitoring_summary TO service_role;

-- ============================================================================
-- PART 2: ENABLE RLS ON REMAINING TABLES (ERROR)
-- ============================================================================
-- Enable RLS on any tables that still don't have it enabled.
-- Using DO block to handle tables that may not exist.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
            AND c.relname = tbl.tablename
            AND c.relrowsecurity = true
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on public.%', tbl.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- PART 3: FIX REMAINING FUNCTIONS WITH MUTABLE SEARCH_PATH (WARN)
-- ============================================================================
-- These 23 functions were flagged by the advisor as still having mutable
-- search_path. Using IF EXISTS to handle functions that may not exist.

-- Device & scan functions
ALTER FUNCTION IF EXISTS public.get_active_device_count(UUID) SET search_path = '';
ALTER FUNCTION IF EXISTS public.validate_admin_password(TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.increment_device_scan(TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.check_device_scan_limit(TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.register_device(UUID, TEXT, JSONB) SET search_path = '';
ALTER FUNCTION IF EXISTS public.deregister_device(UUID, TEXT) SET search_path = '';

-- Rate limiting functions (different signatures than previously fixed)
ALTER FUNCTION IF EXISTS public.check_rate_limit(TEXT, INTEGER, NUMERIC) SET search_path = '';
ALTER FUNCTION IF EXISTS public.check_anonymous_rate_limit(TEXT, TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.check_user_rate_limit(UUID) SET search_path = '';
ALTER FUNCTION IF EXISTS public.save_scan_with_retention(UUID, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT) SET search_path = '';

-- User engagement & analytics
ALTER FUNCTION IF EXISTS public.update_user_engagement() SET search_path = '';
ALTER FUNCTION IF EXISTS public.track_user_activity(UUID, TEXT, JSONB) SET search_path = '';
ALTER FUNCTION IF EXISTS public.get_user_stats(UUID) SET search_path = '';

-- Failed login & password reset
ALTER FUNCTION IF EXISTS public.track_failed_login(TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.track_password_reset(TEXT, BOOLEAN, TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.cleanup_expired_resets() SET search_path = '';

-- Training data functions
ALTER FUNCTION IF EXISTS public.save_training_data(UUID, TEXT, JSONB, TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.update_training_stats() SET search_path = '';

-- Subscription & billing
ALTER FUNCTION IF EXISTS public.check_subscription_status(UUID) SET search_path = '';
ALTER FUNCTION IF EXISTS public.update_subscription_tier(UUID, TEXT) SET search_path = '';

-- Security functions
ALTER FUNCTION IF EXISTS public.log_security_event(UUID, TEXT, TEXT, JSONB) SET search_path = '';
ALTER FUNCTION IF EXISTS public.check_suspicious_activity(TEXT) SET search_path = '';
ALTER FUNCTION IF EXISTS public.block_device(TEXT, TEXT) SET search_path = '';

-- Catch any remaining functions with mutable search_path
DO $$
DECLARE
    func RECORD;
BEGIN
    FOR func IN
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proconfig IS NULL
        AND p.prokind = 'f'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE '_pg_%'
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = %L',
                func.proname, func.args, ''
            );
            RAISE NOTICE 'Fixed search_path for function: public.%(%) ', func.proname, func.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not fix search_path for public.%(%): %', func.proname, func.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- PART 4: FIX OVERLY PERMISSIVE RLS POLICIES (WARN)
-- ============================================================================
-- Replace "WITH CHECK (true)" INSERT policies on system/analytics tables
-- with service_role-only policies so arbitrary authenticated users cannot
-- insert arbitrary data.

-- 4a. community_analytics - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create community analytics" ON public.community_analytics;
CREATE POLICY "Service role insert community analytics"
    ON public.community_analytics FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4b. daily_community_metrics - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create daily metrics" ON public.daily_community_metrics;
CREATE POLICY "Service role insert daily metrics"
    ON public.daily_community_metrics FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4c. data_sync_logs - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create sync logs" ON public.data_sync_logs;
CREATE POLICY "Service role insert sync logs"
    ON public.data_sync_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4d. data_versions - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create data versions" ON public.data_versions;
CREATE POLICY "Service role insert data versions"
    ON public.data_versions FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4e. pending_approvals - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create approval requests" ON public.pending_approvals;
CREATE POLICY "Service role insert approval requests"
    ON public.pending_approvals FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4f. point_transactions - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create point transactions" ON public.point_transactions;
CREATE POLICY "Service role insert point transactions"
    ON public.point_transactions FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4g. query_performance_log - restrict INSERT to service_role
DROP POLICY IF EXISTS "System can create performance logs" ON public.query_performance_log;
CREATE POLICY "Service role insert performance logs"
    ON public.query_performance_log FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4h. failed_login_tracking - restrict INSERT to service_role
-- (failed login tracking should only be done server-side)
DROP POLICY IF EXISTS "Anyone can insert failed login tracking" ON public.failed_login_tracking;
DROP POLICY IF EXISTS "System insert failed login tracking" ON public.failed_login_tracking;
CREATE POLICY "Service role insert failed login tracking"
    ON public.failed_login_tracking FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4i. password_reset_tracking - restrict INSERT to service_role
DROP POLICY IF EXISTS "Anyone can insert password reset tracking" ON public.password_reset_tracking;
DROP POLICY IF EXISTS "System insert password reset tracking" ON public.password_reset_tracking;
CREATE POLICY "Service role insert password reset tracking"
    ON public.password_reset_tracking FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 4j. user_engagement - restrict INSERT/UPDATE to service_role
DROP POLICY IF EXISTS "System can insert user engagement" ON public.user_engagement;
DROP POLICY IF EXISTS "System can update user engagement" ON public.user_engagement;
CREATE POLICY "Service role manage user engagement"
    ON public.user_engagement FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Revoke direct INSERT grants on system tables from authenticated role
-- (service_role bypasses RLS, so it doesn't need explicit grants)
REVOKE INSERT ON public.community_analytics FROM authenticated;
REVOKE INSERT ON public.daily_community_metrics FROM authenticated;
REVOKE INSERT ON public.query_performance_log FROM authenticated;
REVOKE INSERT ON public.data_versions FROM authenticated;
REVOKE INSERT ON public.data_sync_logs FROM authenticated;

-- ============================================================================
-- PART 5: ADD POLICIES TO TABLES WITH RLS ENABLED BUT NO POLICIES (INFO)
-- ============================================================================
-- For admin/enterprise tables, add service_role-only full access policies.
-- Without any policies, these tables are inaccessible even to service_role
-- through the API (though service_role bypasses RLS by default).
-- Adding explicit policies documents intent and enables future role-based access.

-- Admin tables
DO $$
DECLARE
    admin_tables TEXT[] := ARRAY[
        'admin_permissions',
        'admin_security_alerts',
        'admin_sessions',
        'fraud_detection',
        'password_rotation_log'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY admin_tables LOOP
        -- Check if table exists before creating policy
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = tbl
        ) THEN
            -- Drop any existing policies first
            EXECUTE format(
                'DROP POLICY IF EXISTS "Service role full access" ON public.%I',
                tbl
            );
            -- Create service_role only policy
            EXECUTE format(
                'CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
                tbl
            );
            -- Admin read access
            EXECUTE format(
                'DROP POLICY IF EXISTS "Admin read access" ON public.%I',
                tbl
            );
            EXECUTE format(
                'CREATE POLICY "Admin read access" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN (''admin'', ''system_admin'')))',
                tbl
            );
            RAISE NOTICE 'Added policies to public.%', tbl;
        END IF;
    END LOOP;
END $$;

-- Enterprise tables
DO $$
DECLARE
    enterprise_tables TEXT[] := ARRAY[
        'enterprise_api_keys',
        'enterprise_audit_log',
        'enterprise_billing',
        'enterprise_integrations',
        'enterprise_invoices',
        'enterprise_support_tickets',
        'enterprise_usage_analytics',
        'enterprise_usage_summaries',
        'enterprise_wellness_participation',
        'enterprise_wellness_programs',
        'enterprise_white_label'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY enterprise_tables LOOP
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format(
                'DROP POLICY IF EXISTS "Service role full access" ON public.%I',
                tbl
            );
            EXECUTE format(
                'CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
                tbl
            );
            -- Organization members can read their org's data
            EXECUTE format(
                'DROP POLICY IF EXISTS "Org members read access" ON public.%I',
                tbl
            );
            BEGIN
                EXECUTE format(
                    'CREATE POLICY "Org members read access" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_users ou WHERE ou.organization_id = %I.organization_id AND ou.user_id = auth.uid() AND ou.role IN (''admin'', ''manager'')))',
                    tbl, tbl
                );
            EXCEPTION WHEN OTHERS THEN
                -- Table may not have organization_id column - use admin-only policy instead
                EXECUTE format(
                    'CREATE POLICY "Org members read access" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN (''admin'', ''system_admin'')))',
                    tbl
                );
            END;
            RAISE NOTICE 'Added policies to public.%', tbl;
        END IF;
    END LOOP;
END $$;

-- Remaining tables
DO $$
DECLARE
    other_tables TEXT[] := ARRAY[
        'affiliate_tiers',
        'expert_answers',
        'expert_questions',
        'organization_users',
        'organizations',
        'partner_integrations',
        'study_evidence'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY other_tables LOOP
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = tbl
        ) THEN
            EXECUTE format(
                'DROP POLICY IF EXISTS "Service role full access" ON public.%I',
                tbl
            );
            EXECUTE format(
                'CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
                tbl
            );
            -- Authenticated read for non-sensitive tables
            IF tbl IN ('affiliate_tiers', 'study_evidence') THEN
                EXECUTE format(
                    'DROP POLICY IF EXISTS "Authenticated read access" ON public.%I',
                    tbl
                );
                EXECUTE format(
                    'CREATE POLICY "Authenticated read access" ON public.%I FOR SELECT TO authenticated USING (true)',
                    tbl
                );
            ELSE
                EXECUTE format(
                    'DROP POLICY IF EXISTS "Admin read access" ON public.%I',
                    tbl
                );
                EXECUTE format(
                    'CREATE POLICY "Admin read access" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role IN (''admin'', ''system_admin'')))',
                    tbl
                );
            END IF;
            RAISE NOTICE 'Added policies to public.%', tbl;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    missing_rls INTEGER;
    missing_policies INTEGER;
    mutable_functions INTEGER;
    permissive_policies INTEGER;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Security Audit Remediation - Verification';
    RAISE NOTICE '============================================================================';

    -- Check tables without RLS
    SELECT COUNT(*) INTO missing_rls
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname = t.tablename
        AND c.relrowsecurity = true
    );
    RAISE NOTICE 'Tables without RLS: % (should be 0)', missing_rls;

    -- Check tables with RLS but no policies
    SELECT COUNT(*) INTO missing_policies
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
    AND EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname = t.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND p.tablename = t.tablename
    );
    RAISE NOTICE 'Tables with RLS but no policies: % (should be 0)', missing_policies;

    -- Check functions with mutable search_path
    SELECT COUNT(*) INTO mutable_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig IS NULL
    AND p.prokind = 'f'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE '_pg_%';
    RAISE NOTICE 'Functions with mutable search_path: % (should be 0)', mutable_functions;

    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Fixed security_monitoring_summary SECURITY DEFINER view';
    RAISE NOTICE '- Enabled RLS on all remaining tables';
    RAISE NOTICE '- Fixed remaining function search_path warnings';
    RAISE NOTICE '- Restricted 13 overly permissive INSERT policies to service_role';
    RAISE NOTICE '- Added policies to 22+ tables that had RLS but no policies';
    RAISE NOTICE '============================================================================';
END $$;
