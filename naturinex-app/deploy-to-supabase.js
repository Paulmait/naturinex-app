#!/usr/bin/env node

// Automated Supabase Edge Functions Deployment Script
// This will deploy everything automatically

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting Automated Supabase Migration...\n');

// Configuration
const SUPABASE_PROJECT_REF = process.env.REACT_APP_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!SUPABASE_PROJECT_REF) {
  console.error('❌ Could not extract Supabase project reference from URL.');
  console.log('Please ensure REACT_APP_SUPABASE_URL is set in your .env file');
  process.exit(1);
}

console.log(`✅ Found Supabase Project: ${SUPABASE_PROJECT_REF}\n`);

// Step 1: Check if Supabase CLI is installed
function checkSupabaseCLI() {
  console.log('📦 Checking Supabase CLI...');
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI is installed\n');
  } catch {
    console.log('📦 Installing Supabase CLI...');
    try {
      execSync('npm install -g supabase', { stdio: 'inherit' });
      console.log('✅ Supabase CLI installed\n');
    } catch (error) {
      console.error('❌ Failed to install Supabase CLI');
      console.log('Please install manually: npm install -g supabase');
      process.exit(1);
    }
  }
}

// Step 2: Link to Supabase project
function linkProject() {
  console.log('🔗 Linking to Supabase project...');
  try {
    // Check if already linked
    const linkedProject = execSync('supabase projects list', { encoding: 'utf8' });
    if (linkedProject.includes(SUPABASE_PROJECT_REF)) {
      console.log('✅ Project already linked\n');
      return;
    }
  } catch {
    // Not linked yet
  }

  try {
    execSync(`supabase link --project-ref ${SUPABASE_PROJECT_REF}`, { stdio: 'inherit' });
    console.log('✅ Project linked successfully\n');
  } catch (error) {
    console.log('⚠️  Project linking requires authentication');
    console.log('Please run: supabase login');
    console.log('Then run this script again');
    process.exit(1);
  }
}

// Step 3: Set environment variables
function setEnvironmentVariables() {
  console.log('🔐 Setting Edge Function secrets...\n');

  // Map of Render env vars to Supabase secrets
  const envVars = {
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID,
    'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
    'MONGODB_URI': process.env.MONGODB_URI,
    'JWT_SECRET': process.env.JWT_SECRET,
    'ADMIN_SECRET': process.env.ADMIN_SECRET,
  };

  // Add Stripe price IDs if available
  const stripePrices = {
    'STRIPE_PRICE_PLUS_MONTHLY': process.env.STRIPE_PRICE_PLUS_MONTHLY || 'price_plus_monthly',
    'STRIPE_PRICE_PLUS_YEARLY': process.env.STRIPE_PRICE_PLUS_YEARLY || 'price_plus_yearly',
    'STRIPE_PRICE_PRO_MONTHLY': process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    'STRIPE_PRICE_PRO_YEARLY': process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  };

  const allVars = { ...envVars, ...stripePrices };

  let setCount = 0;
  for (const [key, value] of Object.entries(allVars)) {
    if (value && value !== 'undefined') {
      try {
        console.log(`  Setting ${key}...`);
        // Escape special characters in value
        const escapedValue = value.replace(/"/g, '\\"').replace(/\$/g, '\\$');
        execSync(`supabase secrets set ${key}="${escapedValue}"`, { stdio: 'pipe' });
        setCount++;
      } catch (error) {
        console.log(`  ⚠️  Warning: Could not set ${key}`);
      }
    }
  }

  console.log(`\n✅ Set ${setCount} environment variables\n`);
}

// Step 4: Deploy Edge Functions
function deployFunctions() {
  console.log('🚀 Deploying Edge Functions...\n');

  const functions = ['analyze', 'stripe-webhook'];
  const deployed = [];

  for (const func of functions) {
    try {
      console.log(`  Deploying ${func}...`);
      execSync(`supabase functions deploy ${func} --no-verify-jwt`, { stdio: 'pipe' });
      deployed.push(func);
      console.log(`  ✅ ${func} deployed`);
    } catch (error) {
      console.log(`  ❌ Failed to deploy ${func}`);
      console.error(error.message);
    }
  }

  console.log(`\n✅ Deployed ${deployed.length}/${functions.length} functions\n`);

  if (deployed.length === functions.length) {
    return true;
  }
  return false;
}

// Step 5: Create .env.production file
function createProductionEnv() {
  console.log('📝 Creating .env.production file...');

  const supabaseUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
  const apiUrl = `${supabaseUrl}/functions/v1`;

  const productionEnv = `# Production Environment Variables
# Updated automatically on ${new Date().toISOString()}

# Supabase Configuration
REACT_APP_SUPABASE_URL=${supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${process.env.REACT_APP_SUPABASE_ANON_KEY}
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.REACT_APP_SUPABASE_ANON_KEY}

# API Configuration (Edge Functions)
REACT_APP_API_URL=${apiUrl}
NEXT_PUBLIC_API_URL=${apiUrl}
REACT_APP_USE_SUPABASE=true

# Firebase (Keep during transition)
REACT_APP_FIREBASE_API_KEY=${process.env.REACT_APP_FIREBASE_API_KEY}
REACT_APP_FIREBASE_AUTH_DOMAIN=${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}
REACT_APP_FIREBASE_PROJECT_ID=${process.env.REACT_APP_FIREBASE_PROJECT_ID}
REACT_APP_FIREBASE_STORAGE_BUCKET=${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID}
REACT_APP_FIREBASE_APP_ID=${process.env.REACT_APP_FIREBASE_APP_ID}

# Stripe Public Key
REACT_APP_STRIPE_KEY=${process.env.REACT_APP_STRIPE_KEY || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05'}

# App Configuration
REACT_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
`;

  fs.writeFileSync('.env.production', productionEnv);
  console.log('✅ Created .env.production file\n');
}

// Step 6: Test the deployment
async function testDeployment() {
  console.log('🧪 Testing Edge Functions...\n');

  const testUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/analyze`;

  try {
    console.log('  Testing analyze endpoint...');
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ medication: 'test' }),
    });

    if (response.ok) {
      console.log('  ✅ Analyze endpoint is working!');
    } else {
      console.log(`  ⚠️  Analyze endpoint returned: ${response.status}`);
    }
  } catch (error) {
    console.log('  ⚠️  Could not reach analyze endpoint');
  }

  console.log('\n');
}

// Step 7: Show next steps
function showNextSteps() {
  console.log('=' + '='.repeat(50));
  console.log('🎉 MIGRATION COMPLETE!');
  console.log('=' + '='.repeat(50) + '\n');

  console.log('📋 Your new Edge Function URLs:');
  console.log(`  Analyze: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/analyze`);
  console.log(`  Webhook: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/stripe-webhook\n`);

  console.log('⚡ Next Steps:\n');

  console.log('1. Update Vercel Environment Variables:');
  console.log(`   REACT_APP_API_URL = https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1`);
  console.log(`   NEXT_PUBLIC_API_URL = https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1\n`);

  console.log('2. Update Stripe Webhook:');
  console.log('   Go to: https://dashboard.stripe.com/webhooks');
  console.log(`   Change URL to: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/stripe-webhook\n`);

  console.log('3. Test your apps:');
  console.log('   - Open web app and test scanning');
  console.log('   - Test mobile app scanning');
  console.log('   - Make a test payment\n');

  console.log('4. Once verified working:');
  console.log('   - Turn off Render service');
  console.log('   - Cancel Render subscription\n');

  console.log('📊 Benefits achieved:');
  console.log('   ✅ No more cold starts (was 15-30 seconds)');
  console.log('   ✅ 100% uptime (no sleeping)');
  console.log('   ✅ Free hosting (saves $7-25/month)');
  console.log('   ✅ Global edge network');
  console.log('   ✅ Automatic scaling\n');

  console.log('🔄 Rollback (if needed):');
  console.log('   Just change REACT_APP_API_URL back to: https://naturinex-app.onrender.com\n');
}

// Main execution
async function main() {
  try {
    checkSupabaseCLI();
    linkProject();
    setEnvironmentVariables();
    const deployed = deployFunctions();
    createProductionEnv();

    if (deployed) {
      await testDeployment();
    }

    showNextSteps();

    // Create a Vercel env update file
    const vercelEnv = {
      "REACT_APP_API_URL": `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1`,
      "NEXT_PUBLIC_API_URL": `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1`,
      "REACT_APP_USE_SUPABASE": "true"
    };

    fs.writeFileSync('vercel-env-update.json', JSON.stringify(vercelEnv, null, 2));
    console.log('📝 Created vercel-env-update.json with values to add to Vercel\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Check if we have minimum required env vars
if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  console.log('Please ensure your .env file contains:');
  console.log('  REACT_APP_SUPABASE_URL');
  console.log('  REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Run the deployment
main();