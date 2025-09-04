#!/usr/bin/env node

/**
 * Resend API Connection Test
 * Tests the Resend API key and configuration
 */

require('dotenv').config();

async function testResendAPI() {
  console.log('🧪 Testing Resend API Connection...\n');

  // Check if API key is set
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.log('\nPlease add to your .env file:');
    console.log('RESEND_API_KEY=re_your_actual_api_key_here');
    process.exit(1);
  }

  if (apiKey === 're_your_resend_api_key' || apiKey.includes('your_')) {
    console.error('❌ RESEND_API_KEY appears to be a placeholder');
    console.log('\nPlease replace with your actual Resend API key from:');
    console.log('https://resend.com/api-keys');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  try {
    // Test 1: Initialize Resend
    console.log('\n1. Initializing Resend client...');
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);
    console.log('✅ Resend client initialized');

    // Test 2: Get API key details (verify authentication)
    console.log('\n2. Verifying API authentication...');
    try {
      // Try to send a test email to verify API key works
      const testEmail = {
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: 'delivered@resend.dev', // Resend's test email
        subject: 'API Test - NaturineX',
        html: '<p>Testing Resend API connection</p>',
        text: 'Testing Resend API connection'
      };

      console.log('   Sending test email to:', testEmail.to);
      console.log('   From:', testEmail.from);

      const result = await resend.emails.send(testEmail);
      
      if (result.data) {
        console.log('✅ API authentication successful!');
        console.log('   Email ID:', result.data.id);
      } else if (result.error) {
        console.error('❌ API Error:', result.error);
        
        if (result.error.message && result.error.message.includes('401')) {
          console.log('\n🔧 Fix: Your API key is invalid. Please:');
          console.log('1. Go to https://resend.com/api-keys');
          console.log('2. Create a new API key with "Full access"');
          console.log('3. Update RESEND_API_KEY in your .env file');
        }
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('\n🔧 Fix: Authentication issue detected');
        console.log('1. Verify your API key at: https://resend.com/api-keys');
        console.log('2. Ensure the key has "Full access" permissions');
        console.log('3. Check that the key starts with "re_"');
        console.log('4. Make sure there are no extra spaces in the .env file');
      } else if (error.message.includes('403')) {
        console.log('\n🔧 Fix: Permission issue detected');
        console.log('1. Your API key may not have the required permissions');
        console.log('2. Create a new API key with "Full access" at: https://resend.com/api-keys');
      }
    }

    // Test 3: Check domain configuration
    console.log('\n3. Checking domain configuration...');
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    
    if (!fromEmail) {
      console.log('⚠️  RESEND_FROM_EMAIL not set');
      console.log('   Using default: onboarding@resend.dev');
      console.log('   To use custom domain, add to .env:');
      console.log('   RESEND_FROM_EMAIL=noreply@yourdomain.com');
    } else {
      console.log('✅ From email configured:', fromEmail);
      
      if (!fromEmail.includes('@')) {
        console.error('❌ Invalid from email format');
      } else {
        const domain = fromEmail.split('@')[1];
        console.log('   Domain:', domain);
        
        if (domain === 'resend.dev') {
          console.log('   ℹ️ Using Resend test domain (good for testing)');
        } else {
          console.log('   ℹ️ Custom domain - ensure DNS records are configured');
          console.log('   Check domain status at: https://resend.com/domains');
        }
      }
    }

    // Test 4: Environment check
    console.log('\n4. Environment configuration...');
    const requiredEnvVars = [
      'RESEND_API_KEY',
      'NODE_ENV'
    ];

    const optionalEnvVars = [
      'RESEND_FROM_EMAIL',
      'RESEND_WEBHOOK_SECRET',
      'APP_URL'
    ];

    console.log('Required variables:');
    for (const varName of requiredEnvVars) {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${varName.includes('KEY') || varName.includes('SECRET') ? '***' : value}`);
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
      }
    }

    console.log('\nOptional variables:');
    for (const varName of optionalEnvVars) {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
      } else {
        console.log(`   ⚠️ ${varName}: Not set (optional)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log('='.repeat(50));
    
    if (apiKey && !apiKey.includes('your_')) {
      console.log('✅ Resend API is properly configured');
      console.log('\nNext steps:');
      console.log('1. Deploy to Render/Vercel');
      console.log('2. Add environment variables in deployment platform');
      console.log('3. Configure webhook endpoints');
      console.log('4. Test email sending in production');
    } else {
      console.log('❌ Resend API needs configuration');
      console.log('\nRequired actions:');
      console.log('1. Get API key from https://resend.com/api-keys');
      console.log('2. Update .env file with actual values');
      console.log('3. Run this test again');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nDebug information:');
    console.log('- Error type:', error.constructor.name);
    console.log('- API Key format:', apiKey ? (apiKey.startsWith('re_') ? 'Valid format' : 'Invalid format') : 'Not set');
    console.log('- Node version:', process.version);
    process.exit(1);
  }
}

// Run the test
testResendAPI().catch(console.error);