# Supabase Advisor Resolutions

**Migration file:** `supabase/migrations/20260225_security_audit_fixes.sql`

---

## ERROR Level Findings

### 1. SECURITY DEFINER view exposed via API

| | Before | After |
|---|--------|-------|
| **View** | `public.security_monitoring_summary` | `public.security_monitoring_summary` |
| **Security** | `SECURITY DEFINER` (runs as owner) | `SECURITY INVOKER` (runs as caller) |
| **Access** | Any API user could read | Admin-only via WHERE clause |
| **API exposure** | Yes (anon + authenticated) | authenticated only (with admin check) |

### 2. RLS disabled on public tables

| | Before | After |
|---|--------|-------|
| **Tables** | Multiple tables without RLS | All public tables have RLS enabled |
| **Method** | N/A | Dynamic DO block enables RLS on any remaining tables |
| **Risk** | Unrestricted API access | All access controlled by RLS policies |

---

## WARN Level Findings

### 3. Functions with mutable search_path (23 functions)

All functions now have `SET search_path = ''` to prevent schema injection attacks.

**Fixed functions include:**
- `get_active_device_count`, `validate_admin_password`, `increment_device_scan`
- `check_device_scan_limit`, `register_device`, `deregister_device`
- `check_rate_limit` (new signatures), `check_anonymous_rate_limit`, `check_user_rate_limit`
- `save_scan_with_retention`, `update_user_engagement`, `track_user_activity`
- `get_user_stats`, `track_failed_login`, `track_password_reset`
- `cleanup_expired_resets`, `save_training_data`, `update_training_stats`
- `check_subscription_status`, `update_subscription_tier`
- `log_security_event`, `check_suspicious_activity`, `block_device`
- Plus dynamic catch-all for any remaining functions

### 4. Overly permissive RLS policies (13 policies)

| Table | Before | After |
|-------|--------|-------|
| `community_analytics` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `daily_community_metrics` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `data_sync_logs` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `data_versions` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `pending_approvals` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `point_transactions` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `query_performance_log` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `failed_login_tracking` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `password_reset_tracking` | `INSERT TO authenticated WITH CHECK (true)` | `INSERT TO service_role WITH CHECK (true)` |
| `user_engagement` | `ALL TO authenticated` | `ALL TO service_role` |

**Rationale:** These are system/analytics tables that should only be written to by server-side code using the service_role key. Authenticated users should not be able to insert arbitrary analytics or log data.

---

## INFO Level Findings

### 5. Tables with RLS enabled but no policies (22 tables)

All tables now have at minimum:
- **service_role full access** policy for server-side operations
- **Admin read access** policy for dashboard/monitoring

| Table Group | Tables | Read Policy |
|-------------|--------|-------------|
| Admin | `admin_permissions`, `admin_security_alerts`, `admin_sessions`, `fraud_detection`, `password_rotation_log` | Admin role check |
| Enterprise | `enterprise_api_keys`, `enterprise_audit_log`, `enterprise_billing`, `enterprise_integrations`, `enterprise_invoices`, `enterprise_support_tickets`, `enterprise_usage_analytics`, `enterprise_usage_summaries`, `enterprise_wellness_participation`, `enterprise_wellness_programs`, `enterprise_white_label` | Org admin/manager check |
| Other | `affiliate_tiers`, `study_evidence` | Authenticated read |
| Other | `expert_answers`, `expert_questions`, `organization_users`, `organizations`, `partner_integrations` | Admin role check |

---

## Verification

After applying the migration, re-run the Supabase Advisor. Expected results:
- **ERROR findings:** 0
- **WARN findings:** 0 (or significantly reduced)
- **INFO findings:** 0 (or significantly reduced)

```sql
-- Quick verification queries

-- Check tables without RLS
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = tablename AND c.relrowsecurity = true
);
-- Should return 0 rows

-- Check functions without search_path
SELECT p.proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proconfig IS NULL AND p.prokind = 'f'
AND p.proname NOT LIKE 'pg_%';
-- Should return 0 rows

-- Check tables with RLS but no policies
SELECT t.tablename FROM pg_tables t
WHERE t.schemaname = 'public'
AND EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND c.relname = t.tablename AND c.relrowsecurity = true)
AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.tablename);
-- Should return 0 rows
```
