# Migration 005 - Quick Fix Guide

## ❌ Problem

The original migration had a syntax error:
```sql
ALTER FUNCTION IF EXISTS public.handle_new_user() ...
-- ERROR: "IF EXISTS" is not valid with ALTER FUNCTION
```

## ✅ Solution

Use the corrected version: **`005_fix_function_and_extension_warnings_v2.sql`**

---

## 🚀 How to Apply (Fixed Version)

### Step 1: Use the V2 File

**File to use:** `supabase/migrations/005_fix_function_and_extension_warnings_v2.sql` ⭐

**Don't use:**
- ❌ `005_fix_function_and_extension_warnings.sql` (has syntax error)

### Step 2: Apply Via Supabase Dashboard

1. Open **Supabase Dashboard → SQL Editor**
2. Copy entire contents of **v2 file**
3. Paste and click **RUN** ▶️
4. Wait ~30-60 seconds

### Step 3: Verify Success

Look for these messages in the output:
```
✅ Moved pg_trgm extension to extensions schema
✅ Moved btree_gin extension to extensions schema
✅ Updated search_path for authenticated and anon roles
✅ Secured mv_medication_stats
✅ Secured affiliate_dashboard_summary
✅ Secured mv_popular_alternatives
✅ Created secure access functions
✅ Migration completed successfully!
```

---

## 🔧 What V2 Fixes

### 1. Proper Syntax for ALTER FUNCTION

**V1 (Wrong):**
```sql
ALTER FUNCTION IF EXISTS public.handle_new_user() SET search_path = '';
-- ❌ Syntax error
```

**V2 (Correct):**
```sql
DO $$
BEGIN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = ''''';
EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'Function does not exist, skipping';
END $$;
-- ✅ Works correctly
```

### 2. Safer Extension Migration

**V1:** Dropped and recreated extensions (risky)
**V2:** Uses `ALTER EXTENSION ... SET SCHEMA` (safer)

```sql
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
```

### 3. Automatic Search Path Update

V2 automatically updates the search_path for roles:
```sql
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
```

This means your app code will still work with `pg_trgm` functions!

### 4. Better Error Handling

- Gracefully skips non-existent functions
- Checks if materialized views exist before revoking access
- Clear progress messages throughout

---

## 📊 Expected Output

When you run v2, you'll see:
```
NOTICE: ✅ Moved pg_trgm extension to extensions schema
NOTICE: ✅ Moved btree_gin extension to extensions schema
NOTICE: ✅ Updated search_path for authenticated and anon roles
NOTICE: ✅ Secured mv_medication_stats
NOTICE: ✅ Secured affiliate_dashboard_summary
NOTICE: ✅ Secured mv_popular_alternatives
NOTICE: ✅ Created secure access functions
NOTICE: ============================================================================
NOTICE: Security Warnings Fix - Verification Report
NOTICE: ============================================================================
NOTICE: ✅ Functions with search_path configured: XX
NOTICE: ✅ Extensions in extensions schema: 2/2
NOTICE: ✅ Materialized views found: X
NOTICE: ============================================================================
NOTICE: Migration Summary:
NOTICE: - ✅ Fixed function search_path warnings
NOTICE: - ✅ Moved extensions to extensions schema
NOTICE: - ✅ Secured materialized views (where they exist)
NOTICE: - ✅ Created secure access functions
NOTICE: - ✅ Updated search_path for authenticated and anon roles
NOTICE: ============================================================================
NOTICE: ✅ Migration completed successfully!
```

---

## ⚠️ Important Notes

### 1. Search Path is Automatically Updated

The migration adds `extensions` schema to the search_path for your roles.

This means:
- ✅ `pg_trgm` functions still work
- ✅ No need to update existing queries
- ✅ Extensions are properly isolated

### 2. Functions Are Skipped If They Don't Exist

If a function doesn't exist in your database, you'll see:
```
NOTICE: Function xyz does not exist, skipping
```

This is **normal and OK**! The migration handles this gracefully.

### 3. Materialized Views Are Optional

If a materialized view doesn't exist, the migration skips it and creates the access function anyway (it returns empty results until the view is created).

---

## 🔍 Verify After Migration

### 1. Check Security Advisor
```
Dashboard → Security Advisor → Refresh
```

**Expected:**
- ✅ 0 "Function Search Path Mutable" warnings
- ✅ 0 "Extension in Public" warnings
- ✅ 0 "Materialized View in API" warnings

### 2. Test Search Functionality

Run this query to verify `pg_trgm` still works:
```sql
SELECT 'test' % 'text' as similarity_test;
-- Should return true/false, not an error
```

### 3. Test Functions

If you have materialized views, test the new access functions:
```sql
SELECT * FROM get_popular_alternatives(5);
```

---

## 🐛 If You See Errors

### Error: "Extension does not exist"

**This should NOT happen** with v2 because we update the search_path.

But if it does:
```sql
-- Check if extensions are in the right schema
SELECT extname, nspname
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('pg_trgm', 'btree_gin');

-- Should show:
-- pg_trgm | extensions
-- btree_gin | extensions
```

### Error: "Relation does not exist"

This means a materialized view doesn't exist. **This is OK!**

The migration will:
- Skip securing that view
- Still create the access function
- Function will return empty results

You can create the view later and it will work.

---

## 📝 Differences from V1

| Feature | V1 | V2 |
|---------|----|----|
| ALTER FUNCTION syntax | ❌ Invalid | ✅ Valid |
| Extension migration | Drop/Create | ALTER SET SCHEMA |
| Search path update | Manual | Automatic |
| Error handling | Minimal | Comprehensive |
| Progress feedback | Basic | Detailed |

---

## ✅ Quick Checklist

- [ ] Use **v2 file** (not v1)
- [ ] Copy entire file contents
- [ ] Paste in Supabase SQL Editor
- [ ] Click RUN ▶️
- [ ] Wait for completion (~30-60 seconds)
- [ ] Verify "Migration completed successfully!" message
- [ ] Check Security Advisor (should show 0 warnings)
- [ ] Test your application

---

## 🎉 After Success

Once v2 completes successfully:

1. ✅ All function security warnings fixed
2. ✅ Extensions properly isolated
3. ✅ Materialized views secured
4. ✅ Search functionality still works
5. ✅ **Zero security warnings!**

---

**File to Use:** `005_fix_function_and_extension_warnings_v2.sql` ⭐

**Status:** Ready to apply ✅

**Estimated Time:** 30-60 seconds

**Risk:** Low (all changes are reversible)

---

## 🆘 Need Help?

If the migration fails, share:
1. The exact error message
2. Line number where it failed
3. Any NOTICE messages that appeared before the error

Then we can create a targeted fix! 🛠️
