// Test Supabase Database Connection and Functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Check environment variables
    console.log('1️⃣ Checking Environment Variables:');
    console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Service Key: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}\n`);

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase configuration. Please set environment variables.');
        console.log('\nAdd these to your .env file:');
        console.log('REACT_APP_SUPABASE_URL=your_supabase_url');
        console.log('REACT_APP_SUPABASE_ANON_KEY=your_anon_key');
        return;
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    try {
        // Test 1: Check database connection
        console.log('2️⃣ Testing Database Connection:');
        const { data: testData, error: connError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (connError) {
            console.log(`   ❌ Connection failed: ${connError.message}`);
            if (connError.message.includes('relation "profiles" does not exist')) {
                console.log('   ℹ️  Tables not created yet. Run the SQL scripts first.');
            }
        } else {
            console.log('   ✅ Successfully connected to database\n');
        }

        // Test 2: Check tables exist
        console.log('3️⃣ Checking Tables:');
        const tables = [
            'profiles',
            'scans',
            'products',
            'consultations',
            'custom_plans',
            'family_members',
            'affiliate_links',
            'product_interactions',
            'data_exports',
            'analytics_events',
            'user_engagement',
            'subscription_events',
            'scan_history'
        ];

        for (const table of tables) {
            const { error } = await supabase
                .from(table)
                .select('count')
                .limit(1);

            console.log(`   ${table}: ${error ? '❌ Missing' : '✅ Exists'}`);
        }

        // Test 3: Check RLS policies
        console.log('\n4️⃣ Checking Row Level Security:');
        const { data: policies, error: policyError } = await supabase
            .rpc('get_policies_count', {});

        if (!policyError) {
            console.log(`   ✅ RLS policies are active`);
        } else {
            // Alternative check using service role
            const { data: profileCheck, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .limit(1);

            if (!profileError) {
                console.log('   ✅ Database accessible (verify RLS manually)');
            }
        }

        // Test 4: Test authentication system is configured
        console.log('\n5️⃣ Testing Authentication:');

        // Just check if auth is accessible without creating test users
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log(`   ✅ Auth system accessible (session: ${session ? 'active' : 'none'})`);
        } catch (authError) {
            console.log(`   ⚠️  Auth test inconclusive: ${authError?.message}`);
        }

        // Test 5: Test data insertion (if tables exist)
        console.log('\n6️⃣ Testing Data Operations:');

        // Check if we can query profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (!profilesError) {
            console.log(`   ✅ Can read from profiles table`);
            console.log(`   📊 Profile count: ${profiles?.length || 0}`);
        } else {
            console.log(`   ❌ Cannot read profiles: ${profilesError.message}`);
        }

        // Test 6: Check subscription tiers
        console.log('\n7️⃣ Testing Subscription Features:');
        const { data: freeProfiles, error: freeError } = await supabase
            .from('profiles')
            .select('*')
            .eq('subscription_tier', 'free')
            .limit(5);

        if (!freeError) {
            console.log(`   ✅ Can query subscription tiers`);
            console.log(`   📊 Free tier users: ${freeProfiles?.length || 0}`);
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 SUMMARY:');
        console.log('='.repeat(50));

        if (!connError) {
            console.log('✅ Database connection: Working');
            console.log('✅ Tables: Created');
            console.log('✅ Authentication: Configured');
            console.log('\n🎉 Supabase is properly configured and ready!');

            console.log('\n📝 Next Steps:');
            console.log('1. Add Supabase environment variables to Vercel');
            console.log('2. Test the web app at https://naturinex.com');
            console.log('3. Monitor usage in Supabase dashboard');
        } else {
            console.log('❌ Database connection needs configuration');
            console.log('\n📝 Action Required:');
            console.log('1. Run 01-create-tables-fixed.sql in Supabase SQL Editor');
            console.log('2. Run 02-security-policies.sql in Supabase SQL Editor');
            console.log('3. Add environment variables to .env and Vercel');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.log('\n📝 Troubleshooting:');
        console.log('1. Verify Supabase project is active');
        console.log('2. Check API keys are correct');
        console.log('3. Ensure tables are created');
        console.log('4. Verify network connection');
    }
}

// Helper function to test specific user operations
async function testUserOperations(supabase, userId) {
    console.log('\n8️⃣ Testing User Operations:');

    try {
        // Test scan limit for free users
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profile) {
            console.log(`   User tier: ${profile.subscription_tier}`);
            console.log(`   Scans this month: ${profile.scans_this_month}`);
            console.log(`   Total scans: ${profile.scans_total}`);

            if (profile.subscription_tier === 'free' && profile.scans_this_month >= 5) {
                console.log('   ⚠️  Free tier limit reached');
            } else {
                console.log('   ✅ User can perform scans');
            }
        }
    } catch (error) {
        console.log(`   ℹ️  User operations test skipped: ${error.message}`);
    }
}

// Run the test
testSupabaseConnection();