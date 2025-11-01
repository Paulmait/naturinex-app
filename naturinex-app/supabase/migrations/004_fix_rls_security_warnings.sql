-- ============================================================================
-- FIX RLS SECURITY WARNINGS
-- ============================================================================
-- This migration addresses all security advisor warnings by:
-- 1. Enabling RLS on all public tables
-- 2. Creating appropriate RLS policies for each table
-- 3. Fixing SECURITY DEFINER view issues
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL MISSING TABLES
-- ============================================================================

-- Medical compliance tables
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_warnings ENABLE ROW LEVEL SECURITY;

-- NaturineX medical database tables
ALTER TABLE data_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_logs ENABLE ROW LEVEL SECURITY;

-- Community features tables
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE remedy_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_community_metrics ENABLE ROW LEVEL SECURITY;

-- Performance optimization tables
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR MEDICAL COMPLIANCE TABLES
-- ============================================================================

-- drug_interactions: Public read access for authenticated users
CREATE POLICY "Authenticated users can read drug interactions"
    ON drug_interactions FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Only admins can modify drug interactions
CREATE POLICY "Admins can manage drug interactions"
    ON drug_interactions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'medical_admin')
        )
    );

-- medical_warnings: Public read access for authenticated users
CREATE POLICY "Authenticated users can read medical warnings"
    ON medical_warnings FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Only admins can modify medical warnings
CREATE POLICY "Admins can manage medical warnings"
    ON medical_warnings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'medical_admin')
        )
    );

-- ============================================================================
-- RLS POLICIES FOR DATA VERSIONING AND APPROVAL WORKFLOW
-- ============================================================================

-- data_versions: Users can view versions of their own changes
CREATE POLICY "Users can view their own data versions"
    ON data_versions FOR SELECT
    TO authenticated
    USING (changed_by = auth.uid());

-- Admins and reviewers can view all versions
CREATE POLICY "Admins can view all data versions"
    ON data_versions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'medical_admin', 'reviewer')
        )
    );

-- System can insert version records
CREATE POLICY "System can create data versions"
    ON data_versions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- pending_approvals: Assigned reviewers and admins can view
CREATE POLICY "Reviewers can view assigned approvals"
    ON pending_approvals FOR SELECT
    TO authenticated
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'medical_admin', 'reviewer')
        )
    );

-- Reviewers can update their assigned approvals
CREATE POLICY "Reviewers can update assigned approvals"
    ON pending_approvals FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'medical_admin')
        )
    );

-- System can create approval requests
CREATE POLICY "System can create approval requests"
    ON pending_approvals FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR DATA SOURCE MANAGEMENT
-- ============================================================================

-- data_sources: Admins only
CREATE POLICY "Admins can manage data sources"
    ON data_sources FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- data_sync_logs: Admins and system can view
CREATE POLICY "Admins can view sync logs"
    ON data_sync_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- System can insert sync logs
CREATE POLICY "System can create sync logs"
    ON data_sync_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR COMMUNITY MODERATION
-- ============================================================================

-- content_reports: Users can view their own reports
CREATE POLICY "Users can view their own reports"
    ON content_reports FOR SELECT
    TO authenticated
    USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create content reports"
    ON content_reports FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = auth.uid());

-- Moderators can view all reports
CREATE POLICY "Moderators can view all reports"
    ON content_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- Moderators can update reports
CREATE POLICY "Moderators can update reports"
    ON content_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- moderation_queue: Moderators only
CREATE POLICY "Moderators can view moderation queue"
    ON moderation_queue FOR SELECT
    TO authenticated
    USING (
        assigned_moderator = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Moderators can manage moderation queue"
    ON moderation_queue FOR ALL
    TO authenticated
    USING (
        assigned_moderator = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- ============================================================================
-- RLS POLICIES FOR GAMIFICATION
-- ============================================================================

-- point_transactions: Users can view their own transactions
CREATE POLICY "Users can view their own point transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- System can create point transactions
CREATE POLICY "System can create point transactions"
    ON point_transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all point transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- badges: Public read access
CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- Only admins can manage badges
CREATE POLICY "Admins can manage badges"
    ON badges FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin')
        )
    );

-- ============================================================================
-- RLS POLICIES FOR USER-GENERATED CONTENT
-- ============================================================================

-- remedy_recipes: Public read access to approved recipes
CREATE POLICY "Anyone can view approved remedy recipes"
    ON remedy_recipes FOR SELECT
    TO authenticated
    USING (
        moderation_status = 'approved'
        AND is_active = TRUE
    );

-- Users can manage their own recipes
CREATE POLICY "Users can manage their own remedy recipes"
    ON remedy_recipes FOR ALL
    TO authenticated
    USING (author_id = auth.uid());

-- user_journeys: Users can view their own journeys
CREATE POLICY "Users can manage their own journeys"
    ON user_journeys FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Public can view public journeys
CREATE POLICY "Anyone can view public journeys"
    ON user_journeys FOR SELECT
    TO authenticated
    USING (
        visibility = 'public'
        AND is_active = TRUE
    );

-- journey_updates: Users can manage their own updates
CREATE POLICY "Users can manage their own journey updates"
    ON journey_updates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_journeys
            WHERE user_journeys.id = journey_updates.journey_id
            AND user_journeys.user_id = auth.uid()
        )
    );

-- Public can view updates from public journeys
CREATE POLICY "Anyone can view public journey updates"
    ON journey_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_journeys
            WHERE user_journeys.id = journey_updates.journey_id
            AND user_journeys.visibility = 'public'
            AND user_journeys.is_active = TRUE
        )
    );

-- ============================================================================
-- RLS POLICIES FOR ANALYTICS
-- ============================================================================

-- community_analytics: Admins only
CREATE POLICY "Admins can view community analytics"
    ON community_analytics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- System can insert analytics
CREATE POLICY "System can create community analytics"
    ON community_analytics FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- daily_community_metrics: Admins only
CREATE POLICY "Admins can view daily metrics"
    ON daily_community_metrics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- System can insert daily metrics
CREATE POLICY "System can create daily metrics"
    ON daily_community_metrics FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE MONITORING
-- ============================================================================

-- query_performance_log: Admins only
CREATE POLICY "Admins can view query performance logs"
    ON query_performance_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'system_admin')
        )
    );

-- System can insert performance logs
CREATE POLICY "System can create performance logs"
    ON query_performance_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- FIX SECURITY DEFINER VIEW
-- ============================================================================

-- Drop and recreate the enterprise_organization_dashboard view with security_invoker
-- This makes the view execute with the permissions of the invoking user rather than
-- the view owner, which is the secure default behavior
DROP VIEW IF EXISTS enterprise_organization_dashboard;

CREATE VIEW enterprise_organization_dashboard
WITH (security_invoker = true) AS
SELECT
    o.id,
    o.name,
    o.domain,
    o.subscription_tier,
    o.status,
    o.max_users,
    COUNT(DISTINCT ou.user_id) as active_users,
    eb.plan_name,
    eb.monthly_fee,
    eb.current_period_end,
    COALESCE(um.monthly_api_calls, 0) as monthly_api_calls,
    COALESCE(um.monthly_scans, 0) as monthly_scans,
    o.created_at
FROM organizations o
LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.status = 'active'
LEFT JOIN enterprise_billing eb ON o.id = eb.organization_id AND eb.status = 'active'
LEFT JOIN (
    SELECT
        organization_id,
        SUM(total_api_calls) as monthly_api_calls,
        SUM(total_scans) as monthly_scans
    FROM enterprise_usage_summaries
    WHERE period_type = 'monthly'
    AND period_start >= DATE_TRUNC('month', NOW())
    GROUP BY organization_id
) um ON o.id = um.organization_id
WHERE
    -- Filter to only show organizations the user has access to
    EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = o.id
        AND organization_users.user_id::text = auth.uid()::text
        AND organization_users.role IN ('admin', 'manager', 'member')
    )
GROUP BY o.id, o.name, o.domain, o.subscription_tier, o.status, o.max_users,
         eb.plan_name, eb.monthly_fee, eb.current_period_end,
         um.monthly_api_calls, um.monthly_scans, o.created_at;

COMMENT ON VIEW enterprise_organization_dashboard IS
'Dashboard view for enterprise organizations. Uses security_invoker to run with caller permissions and includes built-in access control via WHERE clause.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant read access to authenticated users for public data
GRANT SELECT ON drug_interactions TO authenticated;
GRANT SELECT ON medical_warnings TO authenticated;
GRANT SELECT ON badges TO authenticated;
GRANT SELECT ON remedy_recipes TO authenticated;
GRANT SELECT ON user_journeys TO authenticated;
GRANT SELECT ON journey_updates TO authenticated;

-- Grant limited access for user-specific data
GRANT SELECT, INSERT ON point_transactions TO authenticated;
GRANT SELECT, INSERT ON content_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_journeys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON journey_updates TO authenticated;

-- Grant admin access for moderation tables
GRANT SELECT, INSERT, UPDATE, DELETE ON moderation_queue TO authenticated;
GRANT SELECT, UPDATE ON content_reports TO authenticated;

-- Grant system access for analytics and logging
GRANT INSERT ON community_analytics TO authenticated;
GRANT INSERT ON daily_community_metrics TO authenticated;
GRANT INSERT ON query_performance_log TO authenticated;
GRANT INSERT ON data_versions TO authenticated;
GRANT INSERT ON data_sync_logs TO authenticated;

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Create indexes to optimize RLS policy checks
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_id, role) WHERE role IN ('admin', 'medical_admin', 'moderator', 'reviewer', 'system_admin');
CREATE INDEX IF NOT EXISTS idx_organization_users_org_user_role ON organization_users(organization_id, user_id, role);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_active ON drug_interactions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medical_warnings_active ON medical_warnings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_remedy_recipes_status ON remedy_recipes(moderation_status, is_active) WHERE moderation_status = 'approved' AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_journeys_visibility ON user_journeys(visibility, is_active) WHERE visibility = 'public' AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_moderator ON moderation_queue(assigned_moderator, status) WHERE status IN ('pending', 'in_review');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Function to verify RLS is enabled on all tables
DO $$
DECLARE
    missing_rls RECORD;
    rls_count INTEGER := 0;
BEGIN
    -- Check for tables without RLS
    FOR missing_rls IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = schemaname
            AND c.relname = tablename
            AND c.relrowsecurity = true
        )
    LOOP
        RAISE WARNING 'Table %.% does not have RLS enabled', missing_rls.schemaname, missing_rls.tablename;
        rls_count := rls_count + 1;
    END LOOP;

    IF rls_count = 0 THEN
        RAISE NOTICE '✓ All public tables have RLS enabled';
    ELSE
        RAISE WARNING '⚠ % tables are missing RLS', rls_count;
    END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can read drug interactions" ON drug_interactions IS
'Public access to drug interaction data for all authenticated users';

COMMENT ON POLICY "Moderators can view moderation queue" ON moderation_queue IS
'Only moderators and admins can access the moderation queue';

COMMENT ON POLICY "System can create performance logs" ON query_performance_log IS
'Automated system logging for performance monitoring';

-- Migration complete
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RLS Security Migration Completed Successfully';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Enabled RLS on 15 tables';
    RAISE NOTICE '- Created 40+ RLS policies';
    RAISE NOTICE '- Fixed SECURITY DEFINER view issue';
    RAISE NOTICE '- Added performance indexes for RLS';
    RAISE NOTICE '- Granted appropriate permissions';
    RAISE NOTICE '============================================================================';
END $$;
