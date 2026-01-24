/**
 * Setup Admin Account
 *
 * This script sets up an admin account in Supabase.
 * Run with: SUPABASE_SERVICE_ROLE_KEY=xxx ADMIN_EMAIL=xxx node scripts/setup-my-admin.js
 *
 * The email is passed via environment variable to avoid hardcoding.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hxhbsxzkzarqwksbjpce.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.log('\nGet it from: https://supabase.com/dashboard/project/hxhbsxzkzarqwksbjpce/settings/api');
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.error('Error: ADMIN_EMAIL environment variable not set');
  console.log('\nUsage: ADMIN_EMAIL=your@email.com SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/setup-my-admin.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupAdmin() {
  console.log(`\nSetting up admin account for: ${ADMIN_EMAIL}`);
  console.log('---');

  try {
    // Calculate password expiration (6 months from now)
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setMonth(passwordExpiresAt.getMonth() + 6);

    // Create user_account_status entry
    const { data: statusData, error: statusError } = await supabase
      .from('user_account_status')
      .upsert({
        user_id: '00000000-0000-0000-0000-000000000001', // Placeholder - will be updated when Firebase UID is known
        email: ADMIN_EMAIL,
        status: 'active',
        is_verified: true,
        is_premium: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select();

    if (statusError) {
      console.log('User status:', statusError.message);
    } else {
      console.log('✓ User account status created/updated');
    }

    // Create admin_analytics_access entry
    const { error: analyticsError } = await supabase
      .from('admin_analytics_access')
      .upsert({
        admin_id: '00000000-0000-0000-0000-000000000001',
        can_view_user_analytics: true,
        can_view_revenue_analytics: true,
        can_view_scan_analytics: true,
        can_view_engagement_analytics: true,
        can_view_error_analytics: true,
        can_view_performance_analytics: true,
        can_export_reports: true,
        can_schedule_reports: true,
        can_view_realtime: true,
        historical_data_days: 365,
        granted_at: new Date().toISOString()
      }, { onConflict: 'admin_id' });

    if (analyticsError) {
      console.log('Analytics access:', analyticsError.message);
    } else {
      console.log('✓ Analytics access granted (full access)');
    }

    // Log the setup action
    const { error: auditError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: '00000000-0000-0000-0000-000000000001',
        admin_email: ADMIN_EMAIL,
        admin_role: 'owner',
        action_type: 'admin.account_setup',
        action_category: 'system_config',
        action_severity: 'high',
        target_type: 'system',
        ip_address: '127.0.0.1',
        user_agent: 'setup-script',
        success: true,
        metadata: {
          setup_type: 'initial_owner_setup',
          timestamp: new Date().toISOString()
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    if (auditError) {
      console.log('Audit log:', auditError.message);
    } else {
      console.log('✓ Setup logged in audit trail');
    }

    console.log('\n=== ADMIN SETUP COMPLETE ===');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Role: owner (full access)`);
    console.log(`Password Expires: ${passwordExpiresAt.toISOString()}`);

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Sign up/login in the Naturinex app with this email');
    console.log('2. In Firebase Console, add to users collection:');
    console.log('   { "metadata": { "isAdmin": true, "adminRole": "owner" } }');
    console.log('3. Create entry in Firebase "admins" collection');
    console.log('4. Run: node scripts/create-admin.js ' + ADMIN_EMAIL + ' owner');
    console.log('   (requires GOOGLE_APPLICATION_CREDENTIALS)');

  } catch (error) {
    console.error('Setup error:', error.message);
    process.exit(1);
  }
}

// Run
setupAdmin();
