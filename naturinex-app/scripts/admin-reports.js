/**
 * Admin Reports Script
 *
 * Run SQL queries against Supabase to generate admin reports
 *
 * Usage:
 *   node scripts/admin-reports.js [report-type]
 *
 * Reports:
 *   all         - Run all reports
 *   users       - User status summary
 *   audit       - Recent admin actions
 *   suspended   - Suspended users list
 *   access      - Data access log (GDPR)
 *   policy      - Password policy settings
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://hxhbsxzkzarqwksbjpce.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aGJzeHpremFycXdrc2JqcGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NjcyNjEsImV4cCI6MjA0OTI0MzI2MX0.D3_dM0VdmqPTN9qEhtuzEMwFXe6rjSsqHOvMcPOqf_o';

// Use service key if available, otherwise anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// Report functions
async function userStatusReport() {
  console.log('\n=== USER STATUS REPORT ===\n');

  const { data, error } = await supabase
    .from('user_account_status')
    .select('status, email, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      console.log('Table not found - this is expected if no users have been managed yet.');
      console.log('The table will be populated when admin actions are taken.');
      return;
    }
    console.log('Note:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No user status records found.');
    console.log('This table gets populated when admins take actions on users.');
    return;
  }

  // Group by status
  const statusCounts = {};
  data.forEach(user => {
    statusCounts[user.status] = (statusCounts[user.status] || 0) + 1;
  });

  console.log('Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log(`\nTotal Records: ${data.length}`);
}

async function auditLogReport() {
  console.log('\n=== AUDIT LOG REPORT (Last 30 Days) ===\n');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('admin_email, action_type, action_severity, target_type, success, started_at')
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) {
    if (error.code === '42P01') {
      console.log('Audit log table not found - migration may not have run.');
      return;
    }
    console.log('Note:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No audit log entries found.');
    console.log('Entries will appear when admins perform actions.');
    return;
  }

  // Summary by action type
  const actionCounts = {};
  const severityCounts = {};

  data.forEach(log => {
    actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    severityCounts[log.action_severity] = (severityCounts[log.action_severity] || 0) + 1;
  });

  console.log('Actions by Type:');
  Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([action, count]) => {
      console.log(`  ${action}: ${count}`);
    });

  console.log('\nActions by Severity:');
  Object.entries(severityCounts).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });

  console.log('\nRecent Actions:');
  data.slice(0, 10).forEach(log => {
    const time = new Date(log.started_at).toLocaleString();
    const status = log.success ? '✓' : '✗';
    console.log(`  ${status} [${log.action_severity}] ${log.action_type} by ${log.admin_email} at ${time}`);
  });

  console.log(`\nTotal entries (last 30 days): ${data.length}`);
}

async function suspendedUsersReport() {
  console.log('\n=== SUSPENDED USERS REPORT ===\n');

  const { data, error } = await supabase
    .from('user_account_status')
    .select('*')
    .eq('status', 'suspended')
    .order('updated_at', { ascending: false });

  if (error) {
    console.log('Note:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No suspended users found.');
    return;
  }

  console.log(`Total Suspended: ${data.length}\n`);

  data.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`  Reason: ${user.status_reason || 'Not specified'}`);
    console.log(`  Since: ${new Date(user.updated_at).toLocaleString()}`);
    console.log(`  Suspension End: ${user.suspension_end ? new Date(user.suspension_end).toLocaleString() : 'Indefinite'}`);
    console.log(`  Warning Count: ${user.warning_count || 0}`);
    console.log('');
  });
}

async function dataAccessReport() {
  console.log('\n=== DATA ACCESS LOG (GDPR COMPLIANCE) ===\n');

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data, error } = await supabase
    .from('user_data_access_log')
    .select('admin_email, user_email, data_type, access_reason, accessed_at')
    .gte('accessed_at', ninetyDaysAgo.toISOString())
    .order('accessed_at', { ascending: false })
    .limit(50);

  if (error) {
    console.log('Note:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data access records found in the last 90 days.');
    console.log('Records are created when admins view user data.');
    return;
  }

  // Group by admin
  const adminAccess = {};
  data.forEach(log => {
    adminAccess[log.admin_email] = (adminAccess[log.admin_email] || 0) + 1;
  });

  console.log('Access by Admin:');
  Object.entries(adminAccess)
    .sort((a, b) => b[1] - a[1])
    .forEach(([admin, count]) => {
      console.log(`  ${admin}: ${count} accesses`);
    });

  console.log('\nRecent Access Events:');
  data.slice(0, 10).forEach(log => {
    const time = new Date(log.accessed_at).toLocaleString();
    console.log(`  ${log.admin_email} accessed ${log.data_type} for ${log.user_email}`);
    console.log(`    Reason: ${log.access_reason}`);
    console.log(`    Time: ${time}`);
    console.log('');
  });

  console.log(`Total records (last 90 days): ${data.length}`);
}

async function passwordPolicyReport() {
  console.log('\n=== PASSWORD POLICY CONFIGURATION ===\n');

  const { data, error } = await supabase
    .from('admin_password_policy')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('Note:', error.message);
    console.log('\nUsing default policy values:');
    console.log('  Minimum Length: 16 characters');
    console.log('  Uppercase Required: 2');
    console.log('  Lowercase Required: 2');
    console.log('  Numbers Required: 2');
    console.log('  Special Characters Required: 2');
    console.log('  Expiration: 180 days (6 months)');
    console.log('  Password History: 12 (cannot reuse)');
    console.log('  Max Failed Attempts: 5');
    console.log('  Lockout Duration: 30 minutes');
    console.log('  2FA Required: Yes');
    return;
  }

  if (!data) {
    console.log('No custom policy configured - using defaults.');
    return;
  }

  console.log('Current Policy:');
  console.log(`  Minimum Length: ${data.min_length} characters`);
  console.log(`  Maximum Length: ${data.max_length} characters`);
  console.log(`  Uppercase Required: ${data.require_uppercase ? data.min_uppercase : 'No'}`);
  console.log(`  Lowercase Required: ${data.require_lowercase ? data.min_lowercase : 'No'}`);
  console.log(`  Numbers Required: ${data.require_numbers ? data.min_numbers : 'No'}`);
  console.log(`  Special Characters Required: ${data.require_special ? data.min_special : 'No'}`);
  console.log(`  Expiration: ${data.expiration_days} days`);
  console.log(`  Warning Before Expiry: ${data.warning_days} days`);
  console.log(`  Password History: ${data.password_history_count} (cannot reuse)`);
  console.log(`  Max Failed Attempts: ${data.max_failed_attempts}`);
  console.log(`  Lockout Duration: ${data.lockout_duration_minutes} minutes`);
  console.log(`  2FA Required: ${data.require_2fa ? 'Yes' : 'No'}`);
  console.log(`  Last Updated: ${data.updated_at ? new Date(data.updated_at).toLocaleString() : 'Default'}`);
}

async function tableCheckReport() {
  console.log('\n=== DATABASE TABLE STATUS ===\n');

  const tables = [
    'user_account_status',
    'admin_audit_log',
    'admin_password_policy',
    'admin_password_reset_requests',
    'user_data_access_log',
    'admin_analytics_access',
    'training_data_consent',
    'training_scan_data',
    'user_push_tokens',
    'notification_log'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('permission denied') || error.code === 'PGRST301') {
        console.log(`✓ ${table} - exists (RLS protected)`);
      } else if (error.code === '42P01') {
        console.log(`✗ ${table} - NOT FOUND`);
      } else {
        console.log(`? ${table} - ${error.message}`);
      }
    } else {
      console.log(`✓ ${table} - ${count || 0} rows`);
    }
  }
}

// Main execution
async function runAllReports() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           NATURINEX ADMIN REPORTS                          ║');
  console.log('║           Generated: ' + new Date().toLocaleString().padEnd(36) + '║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await tableCheckReport();
  await passwordPolicyReport();
  await userStatusReport();
  await suspendedUsersReport();
  await auditLogReport();
  await dataAccessReport();

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('Report generation complete.');
}

// Parse command line arguments
const reportType = process.argv[2] || 'all';

switch (reportType.toLowerCase()) {
  case 'all':
    runAllReports();
    break;
  case 'users':
    userStatusReport();
    break;
  case 'audit':
    auditLogReport();
    break;
  case 'suspended':
    suspendedUsersReport();
    break;
  case 'access':
    dataAccessReport();
    break;
  case 'policy':
    passwordPolicyReport();
    break;
  case 'tables':
    tableCheckReport();
    break;
  default:
    console.log(`Unknown report type: ${reportType}`);
    console.log('Available: all, users, audit, suspended, access, policy, tables');
}
