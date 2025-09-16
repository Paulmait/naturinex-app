-- Performance Optimization for NaturineX Medical Database
-- Advanced indexing, query optimization, and performance monitoring

-- ============================================================================
-- ADVANCED INDEXING STRATEGIES
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_alternatives_compound
    ON medication_alternatives (medication_id, effectiveness_rating DESC, confidence_level, is_active)
    WHERE is_active = TRUE AND approved_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_natural_alternatives_compound
    ON natural_alternatives (evidence_level, is_active, approved_at DESC)
    WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_feedback_compound
    ON user_feedback (medication_alternative_id, moderation_status, overall_satisfaction DESC)
    WHERE is_active = TRUE AND moderation_status = 'approved';

-- Partial indexes for specific use cases
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medications_otc
    ON medications (name, drug_class)
    WHERE is_otc = TRUE AND is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alternatives_high_evidence
    ON natural_alternatives (name, evidence_level, updated_at DESC)
    WHERE evidence_level IN ('strong', 'moderate') AND is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_studies_recent_high_quality
    ON clinical_studies (publication_date DESC, evidence_level, study_type)
    WHERE publication_date >= '2015-01-01' AND peer_reviewed = TRUE AND retracted = FALSE;

-- Text search optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medications_fulltext
    ON medications USING gin(to_tsvector('english', name || ' ' || COALESCE(generic_name, '') || ' ' || array_to_string(brand_names, ' ')))
    WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alternatives_fulltext
    ON natural_alternatives USING gin(to_tsvector('english', name || ' ' || COALESCE(scientific_name, '') || ' ' || COALESCE(description, '')))
    WHERE is_active = TRUE;

-- GIN indexes for JSONB fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medications_uses_gin
    ON medications USING gin(common_uses)
    WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alternatives_uses_gin
    ON natural_alternatives USING gin(therapeutic_uses)
    WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alternatives_safety_gin
    ON natural_alternatives USING gin(safety_profile)
    WHERE is_active = TRUE;

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Optimized search function with ranking
CREATE OR REPLACE FUNCTION search_medical_content_optimized(
    search_term TEXT,
    content_types TEXT[] DEFAULT ARRAY['medications', 'alternatives'],
    limit_count INTEGER DEFAULT 20,
    min_relevance REAL DEFAULT 0.1
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    content_type TEXT,
    relevance_score REAL,
    evidence_level TEXT,
    safety_rating TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH medication_results AS (
        SELECT
            m.id,
            m.name,
            'medication'::TEXT as content_type,
            ts_rank(
                setweight(to_tsvector('english', m.name), 'A') ||
                setweight(to_tsvector('english', COALESCE(m.generic_name, '')), 'A') ||
                setweight(to_tsvector('english', array_to_string(m.brand_names, ' ')), 'B') ||
                setweight(to_tsvector('english', COALESCE(m.drug_class, '')), 'C'),
                plainto_tsquery('english', search_term)
            ) as relevance_score,
            NULL::TEXT as evidence_level,
            CASE
                WHEN m.side_effects IS NOT NULL AND jsonb_array_length(m.side_effects->'serious') > 0 THEN 'high_risk'
                WHEN m.contraindications IS NOT NULL AND array_length(m.contraindications, 1) > 3 THEN 'moderate_risk'
                ELSE 'low_risk'
            END as safety_rating
        FROM medications m
        WHERE 'medications' = ANY(content_types)
          AND m.is_active = TRUE
          AND m.status = 'active'
          AND (
              to_tsvector('english', m.name) @@ plainto_tsquery('english', search_term) OR
              to_tsvector('english', COALESCE(m.generic_name, '')) @@ plainto_tsquery('english', search_term) OR
              m.brand_names && ARRAY[search_term] OR
              similarity(m.name, search_term) > 0.3
          )
    ),
    alternative_results AS (
        SELECT
            na.id,
            na.name,
            'alternative'::TEXT as content_type,
            ts_rank(
                setweight(to_tsvector('english', na.name), 'A') ||
                setweight(to_tsvector('english', COALESCE(na.scientific_name, '')), 'A') ||
                setweight(to_tsvector('english', array_to_string(na.therapeutic_uses, ' ')), 'B') ||
                setweight(to_tsvector('english', COALESCE(na.description, '')), 'C'),
                plainto_tsquery('english', search_term)
            ) as relevance_score,
            na.evidence_level,
            COALESCE(na.safety_profile->>'pregnancy', 'unknown') as safety_rating
        FROM natural_alternatives na
        WHERE 'alternatives' = ANY(content_types)
          AND na.is_active = TRUE
          AND (
              to_tsvector('english', na.name) @@ plainto_tsquery('english', search_term) OR
              to_tsvector('english', COALESCE(na.scientific_name, '')) @@ plainto_tsquery('english', search_term) OR
              na.therapeutic_uses && ARRAY[search_term] OR
              similarity(na.name, search_term) > 0.3
          )
    )
    SELECT * FROM (
        SELECT * FROM medication_results
        UNION ALL
        SELECT * FROM alternative_results
    ) combined_results
    WHERE relevance_score >= min_relevance
    ORDER BY relevance_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fast medication alternative lookup
CREATE OR REPLACE FUNCTION get_medication_alternatives_fast(
    medication_name TEXT,
    min_effectiveness REAL DEFAULT 0.0,
    include_feedback BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    alternative_id UUID,
    alternative_name TEXT,
    scientific_name TEXT,
    effectiveness_rating REAL,
    evidence_level TEXT,
    safety_score INTEGER,
    study_count INTEGER,
    user_rating REAL
) AS $$
BEGIN
    RETURN QUERY
    WITH med_lookup AS (
        SELECT id
        FROM medications
        WHERE (name ILIKE medication_name OR generic_name ILIKE medication_name)
          AND is_active = TRUE
        LIMIT 1
    ),
    base_alternatives AS (
        SELECT
            ma.alternative_id,
            na.name as alternative_name,
            na.scientific_name,
            ma.effectiveness_rating,
            na.evidence_level,
            CASE na.evidence_level
                WHEN 'strong' THEN 5
                WHEN 'moderate' THEN 4
                WHEN 'limited' THEN 3
                ELSE 2
            END as safety_score,
            ma.study_count
        FROM medication_alternatives ma
        JOIN natural_alternatives na ON ma.alternative_id = na.id
        JOIN med_lookup ml ON ma.medication_id = ml.id
        WHERE ma.is_active = TRUE
          AND ma.approved_at IS NOT NULL
          AND ma.effectiveness_rating >= min_effectiveness
          AND na.is_active = TRUE
    )
    SELECT
        ba.alternative_id,
        ba.alternative_name,
        ba.scientific_name,
        ba.effectiveness_rating,
        ba.evidence_level,
        ba.safety_score,
        ba.study_count,
        CASE
            WHEN include_feedback THEN COALESCE(
                (SELECT AVG(effectiveness_rating)::REAL
                 FROM user_feedback uf
                 JOIN medication_alternatives ma2 ON uf.medication_alternative_id = ma2.id
                 WHERE ma2.alternative_id = ba.alternative_id
                   AND uf.moderation_status = 'approved'), 0.0)
            ELSE 0.0
        END as user_rating
    FROM base_alternatives ba
    ORDER BY ba.effectiveness_rating DESC, ba.safety_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Materialized view for popular alternatives with aggregated data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_alternatives AS
SELECT
    na.id,
    na.name,
    na.scientific_name,
    na.evidence_level,
    COUNT(DISTINCT ma.medication_id) as medication_count,
    AVG(ma.effectiveness_rating) as avg_effectiveness,
    COUNT(DISTINCT uf.id) as feedback_count,
    AVG(uf.overall_satisfaction) as avg_satisfaction,
    COUNT(DISTINCT se.study_id) as study_count,
    COUNT(DISTINCT pr.id) as professional_review_count,
    na.updated_at
FROM natural_alternatives na
LEFT JOIN medication_alternatives ma ON na.id = ma.alternative_id AND ma.is_active = TRUE
LEFT JOIN user_feedback uf ON ma.id = uf.medication_alternative_id AND uf.moderation_status = 'approved'
LEFT JOIN study_evidence se ON na.id = se.alternative_id AND se.is_active = TRUE
LEFT JOIN professional_reviews pr ON ma.id = pr.medication_alternative_id AND pr.is_active = TRUE
WHERE na.is_active = TRUE
GROUP BY na.id, na.name, na.scientific_name, na.evidence_level, na.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_popular_alternatives_id ON mv_popular_alternatives (id);

-- Materialized view for medication statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_medication_stats AS
SELECT
    m.id,
    m.name,
    m.drug_class,
    COUNT(DISTINCT ma.alternative_id) as alternative_count,
    AVG(ma.effectiveness_rating) as avg_alternative_effectiveness,
    COUNT(DISTINCT sh.id) as search_count,
    COUNT(DISTINCT uf.id) as feedback_count,
    m.updated_at
FROM medications m
LEFT JOIN medication_alternatives ma ON m.id = ma.medication_id AND ma.is_active = TRUE
LEFT JOIN search_history sh ON m.name = sh.medication
LEFT JOIN user_feedback uf ON ma.id = uf.medication_alternative_id AND uf.moderation_status = 'approved'
WHERE m.is_active = TRUE
GROUP BY m.id, m.name, m.drug_class, m.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_medication_stats_id ON mv_medication_stats (id);

-- ============================================================================
-- AUTOMATED VIEW REFRESH
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_alternatives;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_medication_stats;

    -- Update statistics
    ANALYZE mv_popular_alternatives;
    ANALYZE mv_medication_stats;

    -- Log refresh
    INSERT INTO data_sync_logs (
        source_id,
        sync_type,
        sync_status,
        started_at,
        completed_at,
        records_processed
    ) VALUES (
        (SELECT id FROM data_sources WHERE name = 'Internal Views' LIMIT 1),
        'view_refresh',
        'completed',
        NOW(),
        NOW(),
        2
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Table to track slow queries
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT,
    execution_time_ms INTEGER NOT NULL,
    rows_examined INTEGER,
    rows_returned INTEGER,
    table_scans INTEGER,
    index_scans INTEGER,
    user_id UUID,
    session_id VARCHAR(64),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_performance_time
    ON query_performance_log (execution_time_ms DESC, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_performance_hash
    ON query_performance_log (query_hash, executed_at DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query(
    query_text TEXT,
    execution_time_ms INTEGER,
    rows_examined INTEGER DEFAULT NULL,
    rows_returned INTEGER DEFAULT NULL,
    user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    query_hash VARCHAR(64);
BEGIN
    -- Only log queries that take more than 1 second
    IF execution_time_ms > 1000 THEN
        -- Generate hash of query for grouping
        query_hash := encode(digest(query_text, 'sha256'), 'hex');

        INSERT INTO query_performance_log (
            query_hash,
            query_text,
            execution_time_ms,
            rows_examined,
            rows_returned,
            user_id
        ) VALUES (
            query_hash,
            query_text,
            execution_time_ms,
            rows_examined,
            rows_returned,
            user_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATABASE MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
BEGIN
    -- Update statistics for all main tables
    ANALYZE medications;
    ANALYZE natural_alternatives;
    ANALYZE medication_alternatives;
    ANALYZE clinical_studies;
    ANALYZE study_evidence;
    ANALYZE user_feedback;
    ANALYZE professional_reviews;
    ANALYZE data_versions;

    -- Update search vectors for any new data
    UPDATE medications
    SET search_vector =
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(generic_name, '')), 'A') ||
        setweight(to_tsvector('english', array_to_string(brand_names, ' ')), 'B') ||
        setweight(to_tsvector('english', COALESCE(drug_class, '')), 'C') ||
        setweight(to_tsvector('english', array_to_string(common_uses, ' ')), 'D')
    WHERE search_vector IS NULL OR updated_at > NOW() - INTERVAL '1 day';

    UPDATE natural_alternatives
    SET search_vector =
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(scientific_name, '')), 'A') ||
        setweight(to_tsvector('english', array_to_string(common_names, ' ')), 'B') ||
        setweight(to_tsvector('english', array_to_string(therapeutic_uses, ' ')), 'C') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'D')
    WHERE search_vector IS NULL OR updated_at > NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up old audit logs (keep 7 years as required by HIPAA)
    DELETE FROM disclaimer_audit_logs
    WHERE created_at < NOW() - INTERVAL '7 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;

    DELETE FROM interaction_audit_logs
    WHERE created_at < NOW() - INTERVAL '7 years';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;

    -- Clean up old sync logs (keep 1 year)
    DELETE FROM data_sync_logs
    WHERE started_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;

    -- Clean up old query performance logs (keep 3 months)
    DELETE FROM query_performance_log
    WHERE executed_at < NOW() - INTERVAL '3 months';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;

    -- Clean up expired user feedback based on data retention policy
    UPDATE user_feedback
    SET is_active = FALSE
    WHERE data_retention_expiry < NOW() AND is_active = TRUE;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING AND OPTIMIZATION SETTINGS
-- ============================================================================

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS JSONB AS $$
DECLARE
    metrics JSONB := '{}';
    table_sizes JSONB;
    index_usage JSONB;
    slow_queries JSONB;
BEGIN
    -- Table sizes
    WITH table_size_data AS (
        SELECT
            schemaname,
            tablename,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
    )
    SELECT jsonb_agg(to_jsonb(table_size_data)) INTO table_sizes FROM table_size_data;

    -- Index usage statistics
    WITH index_usage_data AS (
        SELECT
            indexrelname as index_name,
            idx_scan as scans,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 10
    )
    SELECT jsonb_agg(to_jsonb(index_usage_data)) INTO index_usage FROM index_usage_data;

    -- Recent slow queries
    WITH slow_query_data AS (
        SELECT
            query_hash,
            AVG(execution_time_ms) as avg_time_ms,
            COUNT(*) as occurrences,
            MAX(executed_at) as last_occurrence
        FROM query_performance_log
        WHERE executed_at > NOW() - INTERVAL '24 hours'
        GROUP BY query_hash
        ORDER BY avg_time_ms DESC
        LIMIT 5
    )
    SELECT jsonb_agg(to_jsonb(slow_query_data)) INTO slow_queries FROM slow_query_data;

    -- Build final metrics object
    metrics := jsonb_build_object(
        'table_sizes', table_sizes,
        'index_usage', index_usage,
        'slow_queries', slow_queries,
        'generated_at', NOW()
    );

    RETURN metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED MAINTENANCE JOBS
-- ============================================================================

-- Note: These would typically be set up as cron jobs or scheduled tasks
-- Example maintenance schedule:

/*
-- Daily maintenance (run at 2 AM)
SELECT update_table_statistics();
SELECT refresh_performance_views();

-- Weekly maintenance (run Sundays at 3 AM)
SELECT cleanup_old_data();
REINDEX INDEX CONCURRENTLY idx_medications_search;
REINDEX INDEX CONCURRENTLY idx_alternatives_search;

-- Monthly maintenance (run first of month at 4 AM)
VACUUM ANALYZE;
SELECT get_database_metrics();
*/

-- Function to run daily maintenance
CREATE OR REPLACE FUNCTION run_daily_maintenance()
RETURNS JSONB AS $$
DECLARE
    start_time TIMESTAMP;
    metrics JSONB;
    maintenance_log JSONB := '{}';
BEGIN
    start_time := NOW();

    -- Update statistics
    PERFORM update_table_statistics();
    maintenance_log := jsonb_set(maintenance_log, '{statistics_updated}', 'true');

    -- Refresh views
    PERFORM refresh_performance_views();
    maintenance_log := jsonb_set(maintenance_log, '{views_refreshed}', 'true');

    -- Get current metrics
    metrics := get_database_metrics();
    maintenance_log := jsonb_set(maintenance_log, '{metrics}', metrics);

    -- Record completion
    maintenance_log := jsonb_set(maintenance_log, '{completed_at}', to_jsonb(NOW()));
    maintenance_log := jsonb_set(maintenance_log, '{duration_seconds}', to_jsonb(EXTRACT(EPOCH FROM (NOW() - start_time))));

    RETURN maintenance_log;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant execute permissions on performance functions
GRANT EXECUTE ON FUNCTION search_medical_content_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_medication_alternatives_fast TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_metrics TO authenticated;

-- Grant select on materialized views
GRANT SELECT ON mv_popular_alternatives TO authenticated;
GRANT SELECT ON mv_medication_stats TO authenticated;

-- Grant select on performance monitoring (for admins only)
-- GRANT SELECT ON query_performance_log TO admin_role;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION search_medical_content_optimized IS 'Optimized full-text search across medications and alternatives with relevance ranking';
COMMENT ON FUNCTION get_medication_alternatives_fast IS 'Fast lookup of alternatives for a medication with optional user feedback';
COMMENT ON FUNCTION refresh_performance_views IS 'Refresh all materialized views for better query performance';
COMMENT ON FUNCTION update_table_statistics IS 'Update database statistics and search vectors for optimal query planning';
COMMENT ON FUNCTION cleanup_old_data IS 'Clean up old data according to retention policies';
COMMENT ON FUNCTION get_database_metrics IS 'Get comprehensive database performance metrics';
COMMENT ON FUNCTION run_daily_maintenance IS 'Run daily maintenance tasks and return performance report';

COMMENT ON MATERIALIZED VIEW mv_popular_alternatives IS 'Aggregated statistics for natural alternatives including ratings and study counts';
COMMENT ON MATERIALIZED VIEW mv_medication_stats IS 'Aggregated statistics for medications including search frequency and alternatives count';

COMMENT ON TABLE query_performance_log IS 'Log of slow queries for performance monitoring and optimization';

-- Final optimization message
DO $$
BEGIN
    RAISE NOTICE 'Performance optimization completed!';
    RAISE NOTICE 'Created % indexes for improved query performance', 15;
    RAISE NOTICE 'Created % materialized views for faster aggregations', 2;
    RAISE NOTICE 'Created % optimized search functions', 2;
    RAISE NOTICE 'Set up performance monitoring and maintenance procedures';
    RAISE NOTICE 'Remember to schedule daily maintenance jobs in your environment';
END $$;