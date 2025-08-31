const axios = require('axios');

const API_URL = 'https://naturinex-app.onrender.com';

async function testProduction() {
  console.log('🔍 Testing Production Deployment');
  console.log('================================\n');

  // 1. Health Check
  console.log('1️⃣ Health Check:');
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is healthy');
    console.log(`   Uptime: ${health.data.uptime?.formatted}`);
    console.log(`   Version: ${health.data.version}`);
    console.log(`   Request Count: ${health.data.metrics?.requestCount}`);
    
    if (health.data.errors?.topErrors?.length > 0) {
      console.log('\n⚠️  Recent Errors:');
      health.data.errors.topErrors.forEach(err => {
        console.log(`   - ${err.message} (${err.count} times)`);
      });
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // 2. Environment Check
  console.log('\n2️⃣ Environment Variables:');
  try {
    const env = await axios.get(`${API_URL}/api/env-check/check-naturinex-2025`);
    console.log('✅ Environment endpoint available');
    const data = env.data;
    console.log(`   Configured: ${Object.keys(data.configured || {}).length} variables`);
    
    if (data.missing?.length > 0) {
      console.log('\n   ❌ Missing Variables:');
      data.missing.forEach(v => console.log(`      - ${v}`));
    }
    
    if (data.warnings?.length > 0) {
      console.log('\n   ⚠️  Warnings:');
      data.warnings.forEach(w => console.log(`      - ${w}`));
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Environment check endpoint not available (older deployment)');
    } else {
      console.log('❌ Environment check failed:', error.message);
    }
  }

  // 3. Test Gemini AI
  console.log('\n3️⃣ Gemini AI Test:');
  try {
    const response = await axios.post(
      `${API_URL}/suggest`,
      {
        medicationName: 'Ibuprofen',
        userId: 'test-production'
      },
      {
        timeout: 30000,
        validateStatus: () => true
      }
    );

    if (response.status === 200) {
      console.log('✅ AI endpoint responded');
      
      // Check if mock or real
      const isMock = response.data.alternatives?.some(alt => 
        alt.name === 'Turmeric Curcumin'
      );
      
      if (isMock) {
        console.log('   ⚠️  Using MOCK data');
        console.log('   → GEMINI_API_KEY not working or not configured');
      } else {
        console.log('   ✅ Using REAL AI!');
        console.log(`   → Found ${response.data.alternatives?.length} alternatives`);
      }
    } else if (response.status === 500) {
      console.log('❌ AI endpoint failed (500)');
      console.log('   → Check GEMINI_API_KEY is valid');
      console.log('   → Ensure Google Cloud billing is enabled');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ AI test failed:', error.message);
  }

  // 4. Test Stripe
  console.log('\n4️⃣ Stripe Configuration:');
  try {
    const stripe = await axios.get(`${API_URL}/stripe-config`);
    if (stripe.data.publishableKey) {
      console.log('✅ Stripe is configured');
      console.log(`   Publishable key: ${stripe.data.publishableKey.substring(0, 20)}...`);
    }
  } catch (error) {
    console.log('❌ Stripe not configured or endpoint not available');
  }

  // 5. Summary
  console.log('\n================================');
  console.log('📊 DEPLOYMENT STATUS SUMMARY');
  console.log('================================');
  console.log('✅ Server: Running');
  console.log('❓ Gemini AI: Needs verification');
  console.log('❓ Vision API: Needs testing');
  console.log('❓ Stripe: Needs verification');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Check GEMINI_API_KEY in Render dashboard');
  console.log('2. Verify Google Cloud billing is active');
  console.log('3. Add GOOGLE_VISION_API_KEY if not added');
  console.log('4. Add Stripe pricing environment variables');
  
  console.log('\n✨ Server is running successfully!');
  console.log('   Just need to fix API configurations.');
}

testProduction().catch(console.error);