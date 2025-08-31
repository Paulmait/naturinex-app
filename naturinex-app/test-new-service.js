const axios = require('axios');

const NEW_API_URL = 'https://naturinex-app-1.onrender.com';

async function testNewService() {
  console.log('Testing new Render service...\n');
  console.log(`URL: ${NEW_API_URL}`);
  console.log('Time:', new Date().toISOString());
  console.log('=' .repeat(50));

  // 1. Test Health
  console.log('\n1. Testing Health Endpoint...');
  try {
    const health = await axios.get(`${NEW_API_URL}/health`);
    console.log('✅ Server is healthy!');
    console.log('   Version:', health.data.version);
    console.log('   Uptime:', health.data.uptime?.formatted || 'Just started');
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // 2. Test Environment Check
  console.log('\n2. Testing Environment Variables...');
  try {
    const env = await axios.get(`${NEW_API_URL}/api/env-check/check-naturinex-2025`);
    console.log('✅ Environment check endpoint available');
    console.log('   Configured:', Object.keys(env.data.configured || {}).length, 'variables');
    console.log('   Missing:', env.data.missing?.length || 0, 'variables');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Environment check endpoint not deployed yet');
    } else {
      console.log('❌ Environment check failed:', error.message);
    }
  }

  // 3. Test Gemini AI
  console.log('\n3. Testing Gemini AI...');
  try {
    const response = await axios.post(
      `${NEW_API_URL}/suggest`,
      {
        medicationName: 'Aspirin',
        userId: 'test-new-service'
      },
      {
        timeout: 30000,
        validateStatus: () => true
      }
    );

    if (response.status === 200) {
      console.log('✅ Gemini AI endpoint responded');
      const isMock = response.data.alternatives?.some(alt => 
        alt.name === 'Turmeric Curcumin'
      );
      if (isMock) {
        console.log('   ⚠️  Using MOCK data (API key not working)');
      } else {
        console.log('   ✅ Using REAL AI data!');
      }
    } else {
      console.log(`❌ Gemini AI failed: Status ${response.status}`);
      if (response.data?.error) {
        console.log('   Error:', response.data.error);
      }
    }
  } catch (error) {
    console.log('❌ Gemini AI test failed:', error.message);
  }

  // 4. Test Stripe Config
  console.log('\n4. Testing Stripe Configuration...');
  try {
    const stripe = await axios.get(`${NEW_API_URL}/stripe-config`);
    if (stripe.data.publishableKey) {
      console.log('✅ Stripe configured');
      console.log('   Key starts with:', stripe.data.publishableKey.substring(0, 10));
    } else {
      console.log('⚠️  Stripe not configured');
    }
  } catch (error) {
    console.log('❌ Stripe test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ New service basic tests complete!');
  console.log('='.repeat(50));
}

testNewService().catch(console.error);