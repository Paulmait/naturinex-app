# 📚 Complete Supabase Setup Guide for Naturinex

## 🚀 Quick Overview
This guide will help you set up the complete Supabase database for Naturinex with all tables, security policies, and configurations needed for production.

## 📋 Prerequisites
1. A Supabase account and project created
2. Your Supabase project URL and anon key

## 🔧 Step-by-Step Setup Instructions

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button

### Step 2: Create Database Tables (MUST RUN FIRST!)

Copy and paste the contents of `01-create-tables.sql` into the SQL editor and click **RUN**.

This creates:
- User profiles table
- Scans table for medication tracking
- Products table for in-app purchases
- Subscription tracking tables
- Analytics and engagement tables
- All necessary indexes and triggers

**Expected Result:** You should see "Success. No rows returned" message.

### Step 3: Apply Security Policies (RUN AFTER TABLES ARE CREATED)

Copy and paste the contents of `02-security-policies.sql` into the SQL editor and click **RUN**.

This adds:
- Row Level Security (RLS) on all tables
- User access controls
- Subscription tier restrictions
- Rate limiting functions
- API key validation

**Expected Result:** You should see multiple "CREATE POLICY" success messages.

### Step 4: Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable these providers:
   - Email (already enabled by default)
   - Google OAuth (optional)
   - Apple OAuth (optional)

3. Set up email templates:
   - Go to **Authentication** → **Email Templates**
   - Customize templates for your brand

### Step 5: Set Environment Variables

Add these to your Vercel project environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For React Native app
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Edge Functions (if using)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 6: Enable Realtime (Optional but Recommended)

1. Go to **Database** → **Replication** in Supabase
2. Enable replication for these tables:
   - `profiles` - for subscription updates
   - `scans` - for real-time scan syncing
   - `subscription_events` - for payment updates

### Step 7: Create Edge Functions for Stripe Webhook

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Initialize Supabase in your project:
```bash
supabase init
```

3. Create the webhook function:
```bash
supabase functions new stripe-webhook
```

4. Deploy the function:
```bash
supabase functions deploy stripe-webhook
```

5. Get your webhook URL:
```
https://[project-id].supabase.co/functions/v1/stripe-webhook
```

6. Add this URL to Stripe Dashboard → Webhooks

### Step 8: Test Your Setup

Run this test query in SQL Editor to verify everything works:

```sql
-- Test query to verify setup
SELECT
    'Tables Created' as check_item,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
    'RLS Policies Active' as check_item,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public';
```

You should see:
- Tables Created: 14+
- RLS Policies Active: 20+

## 🔍 Troubleshooting

### Error: "relation 'profiles' does not exist"
**Solution:** You need to run `01-create-tables.sql` FIRST before running the security policies.

### Error: "permission denied for schema public"
**Solution:** Make sure you're running the SQL as the postgres user (default in SQL Editor).

### Error: "type 'subscription_status' already exists"
**Solution:** The tables have already been created. You can skip step 2.

### Error in Vercel: "Module not found: @supabase/supabase-js"
**Solution:** The package has been installed. Push the changes:
```bash
git add package.json package-lock.json
git commit -m "fix: add Supabase dependency"
git push
```

## 📊 Database Schema Overview

### Core Tables
- **profiles** - User accounts and subscription info
- **scans** - Medication scan history
- **products** - In-app purchase products
- **consultations** - Healthcare consultations
- **custom_plans** - Personalized wellness plans

### Supporting Tables
- **product_interactions** - Purchase tracking
- **affiliate_links** - Affiliate program
- **family_members** - Pro tier family sharing
- **data_exports** - Export history
- **analytics_events** - User behavior
- **user_engagement** - Engagement metrics
- **subscription_events** - Payment history

## 🔐 Security Features

1. **Row Level Security (RLS)** - Users can only access their own data
2. **Tier-Based Access** - Features locked by subscription level
3. **Rate Limiting** - Prevents abuse and ensures fair usage
4. **Scan Limits** - Free tier limited to 5 scans/month
5. **API Key Validation** - Secure API access for Pro users
6. **Family Sharing** - Controlled access for family members

## 🎯 Next Steps

After setup is complete:

1. **Test Authentication**
   - Create a test user account
   - Verify profile is created automatically

2. **Test Scan Limits**
   - Create scans as free user
   - Verify limit enforcement after 5 scans

3. **Configure Stripe**
   - Add webhook endpoint
   - Set up subscription products

4. **Monitor Usage**
   - Check Database → Tables for data
   - Review Auth → Users for signups
   - Monitor usage in Settings → Usage

## 📞 Support

If you encounter issues:
1. Check Supabase logs: Database → Logs
2. Review error messages carefully
3. Verify all steps were completed in order
4. Check environment variables are set correctly

## ✅ Setup Checklist

- [ ] Created Supabase project
- [ ] Ran 01-create-tables.sql
- [ ] Ran 02-security-policies.sql
- [ ] Configured authentication providers
- [ ] Added environment variables to Vercel
- [ ] Enabled realtime (optional)
- [ ] Set up Stripe webhook
- [ ] Tested basic queries
- [ ] Verified RLS policies are active
- [ ] Created test user account

## 🚀 You're Ready!

Once all steps are complete, your Supabase backend is ready to handle:
- 1M+ users
- Automatic subscription management
- Secure data access
- Real-time updates
- Analytics tracking
- Family sharing
- And much more!

Your database is now production-ready with enterprise-grade security and scalability! 🎉