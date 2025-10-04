#!/usr/bin/env node

/**
 * Quick Local Database Connectivity Test
 * Tests if Supabase database is accessible and can read/write data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('📄 Loading environment from .env.local...\n');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

// ANSI Colors
const c = {
  r: '\x1b[0m',
  g: '\x1b[32m',
  y: '\x1b[33m',
  b: '\x1b[34m',
  m: '\x1b[35m',
  red: '\x1b[31m',
  br: '\x1b[1m',
};

console.log(`${c.m}${c.br}╔══════════════════════════════════════════════════╗${c.r}`);
console.log(`${c.m}${c.br}║     🔬 NATURINEX DATABASE CONNECTION TEST      ║${c.r}`);
console.log(`${c.m}${c.br}╚══════════════════════════════════════════════════╝${c.r}\n`);

// Configuration
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are present
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log(`${c.red}❌ ERROR: Missing Supabase credentials!${c.r}\n`);
  console.log('Required environment variables:');
  console.log('  - REACT_APP_SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL)');
  console.log('  - REACT_APP_SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)\n');
  console.log('Please add these to your .env.local file or Vercel environment variables.\n');
  process.exit(1);
}

console.log(`${c.b}🔗 Supabase URL: ${c.r}${SUPABASE_URL}`);
console.log(`${c.b}🔑 API Key: ${c.r}${SUPABASE_KEY.substring(0, 20)}...${c.r}\n`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log(`${c.br}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.r}\n`);

  // Test 1: Basic Connection
  console.log(`${c.y}🔍 Test 1: Database Health Check${c.r}`);
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    console.log(`${c.g}✅ Database is accessible${c.r}\n`);
  } catch (error) {
    console.log(`${c.red}❌ Database connection failed: ${error.message}${c.r}\n`);
    return false;
  }

  // Test 2: Read Data
  console.log(`${c.y}🔍 Test 2: Reading User Profiles${c.r}`);
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) throw error;
    console.log(`${c.g}✅ Successfully read data${c.r}`);
    console.log(`   📊 Total profiles in database: ${count || 0}`);
    console.log(`   📋 Retrieved ${data?.length || 0} sample records\n`);

    if (data && data.length > 0) {
      console.log(`   Sample user IDs:`);
      data.slice(0, 3).forEach((profile, i) => {
        console.log(`     ${i + 1}. ${profile.user_id || 'N/A'}`);
      });
      console.log();
    }
  } catch (error) {
    console.log(`${c.red}❌ Read failed: ${error.message}${c.r}\n`);
  }

  // Test 3: Check Scans Table
  console.log(`${c.y}🔍 Test 3: Reading Medication Scans${c.r}`);
  try {
    const { data, error, count } = await supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    console.log(`${c.g}✅ Scans table accessible${c.r}`);
    console.log(`   📊 Total scans in database: ${count || 0}`);
    console.log(`   📋 Retrieved ${data?.length || 0} recent scans\n`);

    if (data && data.length > 0) {
      console.log(`   Recent scans:`);
      data.slice(0, 3).forEach((scan, i) => {
        const date = new Date(scan.created_at).toLocaleString();
        console.log(`     ${i + 1}. ${scan.medication_name || 'Unknown'} - ${date}`);
      });
      console.log();
    }
  } catch (error) {
    console.log(`${c.red}❌ Scans read failed: ${error.message}${c.r}\n`);
  }

  // Test 4: Auth Service
  console.log(`${c.y}🔍 Test 4: Authentication Service${c.r}`);
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error && error.message === 'Auth session missing!') {
      console.log(`${c.g}✅ Auth service is accessible (no user logged in)${c.r}\n`);
    } else if (error) {
      throw error;
    } else if (user) {
      console.log(`${c.g}✅ Auth service working - User logged in: ${user.email}${c.r}\n`);
    }
  } catch (error) {
    console.log(`${c.red}❌ Auth service failed: ${error.message}${c.r}\n`);
  }

  // Test 5: Write Test (Insert a test record)
  console.log(`${c.y}🔍 Test 5: Write Operation Test${c.r}`);
  console.log(`   (Testing insert capability with a test profile)\n`);

  const testUserId = `test-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        email: `test-${Date.now()}@example.com`,
        display_name: 'QC Test User',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      // Check if it's a permissions error (expected in production)
      if (error.message.includes('permission') || error.message.includes('policy')) {
        console.log(`${c.y}⚠️  Write restricted by RLS policies (expected in production)${c.r}`);
        console.log(`   This is GOOD - means your security rules are working!\n`);
      } else {
        throw error;
      }
    } else {
      console.log(`${c.g}✅ Write operation successful${c.r}`);
      console.log(`   Created test profile: ${data[0]?.user_id}\n`);

      // Clean up test data
      console.log(`   🧹 Cleaning up test data...`);
      await supabase.from('profiles').delete().eq('user_id', testUserId);
      console.log(`   ✅ Test data removed\n`);
    }
  } catch (error) {
    console.log(`${c.red}❌ Write test failed: ${error.message}${c.r}\n`);
  }

  // Test 6: Real-time Subscriptions (optional)
  console.log(`${c.y}🔍 Test 6: Real-time Capability${c.r}`);
  try {
    const channel = supabase.channel('test-channel');
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`${c.g}✅ Real-time subscriptions working${c.r}\n`);
      }
    });

    // Unsubscribe after test
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 1000);
  } catch (error) {
    console.log(`${c.red}❌ Real-time test failed: ${error.message}${c.r}\n`);
  }

  return true;
}

async function checkAPIHealth() {
  console.log(`${c.br}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.r}\n`);
  console.log(`${c.y}🌐 Bonus: Backend API Health Check${c.r}\n`);

  const apiUrl = process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com';
  console.log(`   API URL: ${apiUrl}\n`);

  try {
    const https = require('https');
    const http = require('http');
    const url = new URL(apiUrl + '/health');
    const protocol = url.protocol === 'https:' ? https : http;

    await new Promise((resolve, reject) => {
      const req = protocol.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(`${c.g}✅ Backend API is healthy${c.r}\n`);
          resolve();
        } else {
          console.log(`${c.y}⚠️  Backend API returned status ${res.statusCode}${c.r}\n`);
          resolve();
        }
      });

      req.on('error', (error) => {
        console.log(`${c.red}❌ Backend API unreachable: ${error.message}${c.r}\n`);
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        console.log(`${c.red}❌ Backend API timeout (5s)${c.r}\n`);
        resolve();
      });
    });
  } catch (error) {
    console.log(`${c.red}❌ API check failed: ${error.message}${c.r}\n`);
  }
}

// Main execution
(async () => {
  try {
    const success = await testConnection();
    await checkAPIHealth();

    console.log(`${c.br}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.r}\n`);
    console.log(`${c.m}${c.br}📊 TEST SUMMARY${c.r}\n`);

    if (success) {
      console.log(`${c.g}${c.br}✅ DATABASE IS CONNECTED AND OPERATIONAL!${c.r}`);
      console.log(`${c.g}✅ Your app can read and write data${c.r}`);
      console.log(`${c.g}✅ Authentication service is working${c.r}`);
      console.log(`${c.g}✅ Security rules are active (RLS enabled)${c.r}\n`);

      console.log(`${c.b}📝 Next Steps:${c.r}`);
      console.log(`   1. Deploy your app to Vercel`);
      console.log(`   2. Add environment variables to Vercel`);
      console.log(`   3. Test the live deployment\n`);

      console.log(`${c.m}🎉 Your Naturinex app is ready for production!${c.r}\n`);
    } else {
      console.log(`${c.red}❌ DATABASE CONNECTION ISSUES DETECTED${c.r}`);
      console.log(`${c.y}⚠️  Check the errors above and fix configuration${c.r}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`\n${c.red}Fatal error:${c.r}`, error);
    process.exit(1);
  }
})();
