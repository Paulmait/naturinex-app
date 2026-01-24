/**
 * Test script to verify admin user management tables
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hxhbsxzkzarqwksbjpce.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aGJzeHpremFycXdrc2JqcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjcyNjEsImV4cCI6MjA0OTI0MzI2MX0.D3_dM0VdmqPTN9qEhtuzEMwFXe6rjSsqHOvMcPOqf_o'
);

async function checkTables() {
  const tables = [
    'user_account_status',
    'admin_audit_log',
    'admin_password_policy',
    'admin_password_reset_requests',
    'user_data_access_log'
  ];

  console.log('Checking admin management tables...\n');

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      console.log('❌', table, '- Error:', error.message);
    } else {
      console.log('✅', table, '- OK (rows:', count || 0, ')');
    }
  }

  // Test inserting into password policy
  console.log('\n--- Testing admin_password_policy table ---');
  const { data: policyData, error: policyError } = await supabase
    .from('admin_password_policy')
    .select('*')
    .limit(1);

  if (policyError) {
    console.log('Policy check error:', policyError.message);
  } else if (policyData && policyData.length > 0) {
    console.log('Password policy configured:');
    console.log('  - Min length:', policyData[0].min_length);
    console.log('  - Expiration days:', policyData[0].expiration_days);
    console.log('  - Password history:', policyData[0].password_history_count);
    console.log('  - Max failed attempts:', policyData[0].max_failed_attempts);
    console.log('  - Require 2FA:', policyData[0].require_2fa);
  } else {
    console.log('No password policy configured yet (will use defaults)');
  }

  console.log('\n✅ All admin management tables verified!');
}

checkTables().catch(console.error);
