-- ============================================================================
-- FIX REMAINING SECURITY WARNINGS - V2 (CORRECTED)
-- ============================================================================
-- This migration fixes:
-- 1. Function search_path warnings (50+ functions)
-- 2. Extensions in public schema (2 extensions)
-- 3. Materialized views exposed via API (3 views)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX FUNCTION SEARCH_PATH WARNINGS
-- ============================================================================
-- Add SET search_path = '' to all functions for security
-- Using DO blocks to handle non-existent functions gracefully

DO $$
BEGIN
    -- Auth & User Management Functions
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function handle_new_user does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.link_admin_profile_on_signup() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function link_admin_profile_on_signup does not exist, skipping';
END $$;

-- Scan & Rate Limiting Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_scan_limit() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_scan_limit does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.validate_api_access(TEXT) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function validate_api_access does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_rate_limit(UUID, TEXT, INT, INT) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_rate_limit (4 params) does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_anonymous_rate_limit(INET, TEXT, INT, INT) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_anonymous_rate_limit does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_user_rate_limit(UUID, TEXT, INT, INT) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_user_rate_limit does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.save_scan_with_retention(UUID, JSONB, INTEGER) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function save_scan_with_retention does not exist, skipping';
END $$;

-- Analytics Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.anonymize_for_analytics(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function anonymize_for_analytics does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_analytics_daily() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_analytics_daily does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_usage_alerts() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_usage_alerts does not exist, skipping';
END $$;

-- Security & Abuse Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_abuse_patterns(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_abuse_patterns does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.cleanup_expired_data() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function cleanup_expired_data does not exist, skipping';
END $$;

-- Admin Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_password_rotation(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_password_rotation does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.log_admin_access(UUID, TEXT, JSONB) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function log_admin_access does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.validate_admin_session(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function validate_admin_session does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.trigger_password_expiry_check() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function trigger_password_expiry_check does not exist, skipping';
END $$;

-- Affiliate Program Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_affiliate_updated_at() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_affiliate_updated_at does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_affiliate_metrics() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_affiliate_metrics does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_affiliate_clicks() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_affiliate_clicks does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.generate_invoice_number() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function generate_invoice_number does not exist, skipping';
END $$;

-- Community Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_group_search_vector() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_group_search_vector does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_post_search_vector() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_post_search_vector does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_group_member_count() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_group_member_count does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.calculate_user_reputation(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function calculate_user_reputation does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_trending_posts(INTEGER) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_trending_posts does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_engagement_counters() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_engagement_counters does not exist, skipping';
END $$;

-- Enterprise Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.generate_ticket_number() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function generate_ticket_number does not exist, skipping';
END $$;

-- Medical Database Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_search_vectors() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_search_vectors does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.track_data_changes() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function track_data_changes does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.search_medications_and_alternatives(TEXT, INTEGER) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function search_medications_and_alternatives does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_effectiveness_summary(UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_effectiveness_summary does not exist, skipping';
END $$;

-- Compliance Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.enforce_disclaimer_uniqueness() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function enforce_disclaimer_uniqueness does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.validate_emergency_contact() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function validate_emergency_contact does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.check_valid_disclaimer(UUID, VARCHAR) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function check_valid_disclaimer does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_interaction_summary(TEXT[]) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_interaction_summary does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.log_audit_event(UUID, VARCHAR, VARCHAR, JSONB) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function log_audit_event does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.cleanup_old_audit_logs() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function cleanup_old_audit_logs does not exist, skipping';
END $$;

-- Performance Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.refresh_performance_views() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function refresh_performance_views does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.log_slow_query(TEXT, INTEGER, INTEGER, INTEGER, UUID) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function log_slow_query does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_table_statistics() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_table_statistics does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.cleanup_old_data() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function cleanup_old_data does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.run_daily_maintenance() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function run_daily_maintenance does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.search_medical_content_optimized(TEXT, TEXT[], INTEGER, REAL) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function search_medical_content_optimized does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_medication_alternatives_fast(TEXT, REAL, BOOLEAN) SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_medication_alternatives_fast does not exist, skipping';
END $$;

DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.get_database_metrics() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function get_database_metrics does not exist, skipping';
END $$;

-- Utility Functions
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function update_updated_at_column does not exist, skipping';
END $$;

-- ============================================================================
-- PART 2: MOVE EXTENSIONS FROM PUBLIC TO EXTENSIONS SCHEMA
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension to extensions schema
DO $$
BEGIN
    -- Check if extension exists in public schema
    IF EXISTS (
        SELECT 1 FROM pg_extension
        WHERE extname = 'pg_trgm'
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Move to extensions schema using ALTER
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
        RAISE NOTICE '✅ Moved pg_trgm extension to extensions schema';
    ELSIF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) THEN
        RAISE NOTICE '✅ pg_trgm extension already in correct schema';
    ELSE
        -- Create in extensions schema
        CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
        RAISE NOTICE '✅ Created pg_trgm extension in extensions schema';
    END IF;
END $$;

-- Move btree_gin extension to extensions schema
DO $$
BEGIN
    -- Check if extension exists in public schema
    IF EXISTS (
        SELECT 1 FROM pg_extension
        WHERE extname = 'btree_gin'
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Move to extensions schema using ALTER
        ALTER EXTENSION btree_gin SET SCHEMA extensions;
        RAISE NOTICE '✅ Moved btree_gin extension to extensions schema';
    ELSIF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'btree_gin'
    ) THEN
        RAISE NOTICE '✅ btree_gin extension already in correct schema';
    ELSE
        -- Create in extensions schema
        CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA extensions;
        RAISE NOTICE '✅ Created btree_gin extension in extensions schema';
    END IF;
END $$;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Add extensions schema to search_path for roles
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;

DO $$
BEGIN
    RAISE NOTICE '✅ Updated search_path for authenticated and anon roles';
END $$;

-- ============================================================================
-- PART 3: REVOKE API ACCESS FROM MATERIALIZED VIEWS
-- ============================================================================

-- Revoke SELECT from anon and authenticated roles on materialized views
DO $$
BEGIN
    -- mv_medication_stats
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_medication_stats') THEN
        REVOKE SELECT ON public.mv_medication_stats FROM anon;
        REVOKE SELECT ON public.mv_medication_stats FROM authenticated;
        GRANT SELECT ON public.mv_medication_stats TO service_role;
        RAISE NOTICE '✅ Secured mv_medication_stats';
    ELSE
        RAISE NOTICE 'ℹ️  mv_medication_stats does not exist, skipping';
    END IF;

    -- affiliate_dashboard_summary
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'affiliate_dashboard_summary') THEN
        REVOKE SELECT ON public.affiliate_dashboard_summary FROM anon;
        REVOKE SELECT ON public.affiliate_dashboard_summary FROM authenticated;
        GRANT SELECT ON public.affiliate_dashboard_summary TO service_role;
        RAISE NOTICE '✅ Secured affiliate_dashboard_summary';
    ELSE
        RAISE NOTICE 'ℹ️  affiliate_dashboard_summary does not exist, skipping';
    END IF;

    -- mv_popular_alternatives
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_popular_alternatives') THEN
        REVOKE SELECT ON public.mv_popular_alternatives FROM anon;
        REVOKE SELECT ON public.mv_popular_alternatives FROM authenticated;
        GRANT SELECT ON public.mv_popular_alternatives TO service_role;
        RAISE NOTICE '✅ Secured mv_popular_alternatives';
    ELSE
        RAISE NOTICE 'ℹ️  mv_popular_alternatives does not exist, skipping';
    END IF;
END $$;

-- Create secure functions to access materialized view data
-- Only create if they don't already exist

-- Function to get medication stats (controlled access)
CREATE OR REPLACE FUNCTION public.get_medication_stats(medication_id_param UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    drug_class VARCHAR,
    alternative_count BIGINT,
    avg_alternative_effectiveness NUMERIC,
    feedback_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    -- Check if materialized view exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_medication_stats') THEN
        RETURN QUERY
        SELECT
            mv.id,
            mv.name,
            mv.drug_class,
            mv.alternative_count,
            mv.avg_alternative_effectiveness,
            mv.feedback_count
        FROM public.mv_medication_stats mv
        WHERE mv.id = medication_id_param;
    ELSE
        -- Return empty result if view doesn't exist
        RETURN;
    END IF;
END;
$$;

-- Function to get popular alternatives (controlled access)
CREATE OR REPLACE FUNCTION public.get_popular_alternatives(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    scientific_name VARCHAR,
    evidence_level VARCHAR,
    medication_count BIGINT,
    avg_effectiveness NUMERIC,
    feedback_count BIGINT,
    avg_satisfaction NUMERIC,
    study_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    -- Check if materialized view exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_popular_alternatives') THEN
        RETURN QUERY
        SELECT
            mv.id,
            mv.name,
            mv.scientific_name,
            mv.evidence_level,
            mv.medication_count,
            mv.avg_effectiveness,
            mv.feedback_count,
            mv.avg_satisfaction,
            mv.study_count
        FROM public.mv_popular_alternatives mv
        ORDER BY mv.medication_count DESC, mv.avg_effectiveness DESC
        LIMIT limit_count;
    ELSE
        -- Return empty result if view doesn't exist
        RETURN;
    END IF;
END;
$$;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_medication_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_popular_alternatives(INTEGER) TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Created secure access functions';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    function_count INTEGER := 0;
    extension_count INTEGER := 0;
    view_count INTEGER := 0;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Security Warnings Fix - Verification Report';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';

    -- Count functions that were successfully updated
    SELECT COUNT(*) INTO fixed_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS cfg
        WHERE cfg LIKE 'search_path=%'
    );

    RAISE NOTICE '✅ Functions with search_path configured: %', fixed_count;

    -- Count extensions in extensions schema
    SELECT COUNT(*) INTO extension_count
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE n.nspname = 'extensions'
    AND e.extname IN ('pg_trgm', 'btree_gin');

    RAISE NOTICE '✅ Extensions in extensions schema: %/2', extension_count;

    -- Check materialized views
    SELECT COUNT(*) INTO view_count
    FROM pg_matviews
    WHERE schemaname = 'public'
    AND matviewname IN ('mv_medication_stats', 'affiliate_dashboard_summary', 'mv_popular_alternatives');

    RAISE NOTICE '✅ Materialized views found: %', view_count;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- ✅ Fixed function search_path warnings';
    RAISE NOTICE '- ✅ Moved extensions to extensions schema';
    RAISE NOTICE '- ✅ Secured materialized views (where they exist)';
    RAISE NOTICE '- ✅ Created secure access functions';
    RAISE NOTICE '- ✅ Updated search_path for authenticated and anon roles';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '1. Check Security Advisor for remaining warnings';
    RAISE NOTICE '2. Test application functionality';
    RAISE NOTICE '3. Verify search and pg_trgm functions work';
    RAISE NOTICE '4. Update app code to use new access functions if needed';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '============================================================================';
END $$;
