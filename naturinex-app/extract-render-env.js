#!/usr/bin/env node

// Script to help extract Render environment variables
// Since we can't access Render directly, this will help you set them

const fs = require('fs');

console.log('📋 Render Environment Variables Setup Helper\n');
console.log('Since we cannot access Render directly, please follow these steps:\n');

console.log('1️⃣ Go to your Render Dashboard:');
console.log('   https://dashboard.render.com\n');

console.log('2️⃣ Click on your service: naturinex-app\n');

console.log('3️⃣ Go to Environment tab\n');

console.log('4️⃣ Copy each value and paste here:\n');
console.log('=' + '='.repeat(50) + '\n');

// Create template .env file with instructions
const envTemplate = `# Supabase Environment Variables
# Fill in these values from your Supabase dashboard

REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Copy these from Render Dashboard
# Go to: https://dashboard.render.com -> Your Service -> Environment

GEMINI_API_KEY=paste_from_render
STRIPE_SECRET_KEY=paste_from_render
STRIPE_WEBHOOK_SECRET=paste_from_render
FIREBASE_PROJECT_ID=paste_from_render
FIREBASE_CLIENT_EMAIL=paste_from_render
FIREBASE_PRIVATE_KEY=paste_from_render
MONGODB_URI=paste_from_render
JWT_SECRET=paste_from_render
ADMIN_SECRET=paste_from_render
GOOGLE_VISION_API_KEY=paste_from_render

# Firebase (keep your existing values)
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8

# Stripe Public Key
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# App Configuration
REACT_APP_VERSION=1.0.0
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
`;

// Save template
fs.writeFileSync('.env.template', envTemplate);
console.log('📝 Created .env.template file\n');

console.log('5️⃣ Fill in the .env.template file with values from Render\n');

console.log('6️⃣ Rename .env.template to .env\n');

console.log('7️⃣ Run the deployment script:');
console.log('   node deploy-to-supabase.js\n');

console.log('=' + '='.repeat(50) + '\n');

// Quick check for existing values
const existingEnv = {};
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      existingEnv[key.trim()] = value.trim();
    }
  });

  console.log('📊 Found existing environment variables:\n');
  const important = [
    'GEMINI_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];

  important.forEach(key => {
    if (existingEnv[key]) {
      console.log(`  ✅ ${key}: Found`);
    } else {
      console.log(`  ❌ ${key}: Missing`);
    }
  });

} catch (error) {
  console.log('⚠️  No .env file found. Please create one using the template.\n');
}

console.log('\n💡 Alternative: Quick Setup Commands\n');
console.log('If you have the values, run these commands directly:\n');
console.log('supabase secrets set GEMINI_API_KEY=your_key_here');
console.log('supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx');
console.log('supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx');
console.log('\nThen deploy:');
console.log('supabase functions deploy analyze');
console.log('supabase functions deploy stripe-webhook\n');