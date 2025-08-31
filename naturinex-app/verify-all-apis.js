const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'https://naturinex-app-1.onrender.com';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    return null;
  }
}

async function testGeminiAI() {
  log('\n=== Testing Gemini AI ===', 'cyan');
  
  try {
    const response = await axios.post(
      `${API_URL}/suggest`,
      {
        medicationName: 'Aspirin',
        userId: 'test-verification'
      },
      { 
        timeout: 30000,
        validateStatus: () => true
      }
    );
    
    if (response.status === 200) {
      const data = response.data;
      
      // Check if it's real AI response
      const isMock = data.alternatives && 
        data.alternatives.some(alt => alt.name === 'Turmeric Curcumin');
      
      if (isMock) {
        log('⚠️  Gemini AI: Using MOCK data', 'yellow');
        return { status: 'mock', message: 'API key not working or not configured' };
      } else {
        log('✅ Gemini AI: WORKING with real data', 'green');
        log(`   Found ${data.alternatives?.length || 0} alternatives`, 'blue');
        return { status: 'working', alternatives: data.alternatives?.length || 0 };
      }
    } else {
      log(`❌ Gemini AI: Failed with status ${response.status}`, 'red');
      if (response.data?.error) {
        log(`   Error: ${response.data.error}`, 'red');
      }
      return { status: 'error', code: response.status };
    }
  } catch (error) {
    log('❌ Gemini AI: Connection failed', 'red');
    log(`   ${error.message}`, 'red');
    return { status: 'failed', error: error.message };
  }
}

async function testVisionAPI() {
  log('\n=== Testing Google Vision API ===', 'cyan');
  
  try {
    // Create a simple test image (1x1 white pixel)
    const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    formData.append('userId', 'test-verification');
    
    const response = await axios.post(
      `${API_URL}/api/analyze`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
        validateStatus: () => true
      }
    );
    
    if (response.status === 200) {
      const data = response.data;
      
      // Check if OCR/Vision was used
      if (data.ocrText || data.extractedText) {
        log('✅ Google Vision API: WORKING', 'green');
        log('   OCR text extraction available', 'blue');
        return { status: 'working', hasOCR: true };
      } else if (data.message && data.message.includes('Vision API not configured')) {
        log('⚠️  Google Vision API: NOT CONFIGURED', 'yellow');
        return { status: 'not_configured' };
      } else {
        log('⚠️  Google Vision API: Using fallback/mock', 'yellow');
        return { status: 'mock' };
      }
    } else if (response.status === 404) {
      log('❌ Google Vision API: Endpoint not found', 'red');
      return { status: 'not_found' };
    } else {
      log(`❌ Google Vision API: Failed with status ${response.status}`, 'red');
      return { status: 'error', code: response.status };
    }
  } catch (error) {
    log('❌ Google Vision API: Test failed', 'red');
    log(`   ${error.message}`, 'red');
    return { status: 'failed', error: error.message };
  }
}

async function testStripeIntegration() {
  log('\n=== Testing Stripe Integration ===', 'cyan');
  
  try {
    const response = await axios.get(`${API_URL}/stripe-config`, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.publishableKey) {
      log('✅ Stripe: Configuration available', 'green');
      log(`   Publishable key: ${response.data.publishableKey.substring(0, 20)}...`, 'blue');
      return { status: 'working' };
    } else {
      log('❌ Stripe: Not configured', 'red');
      return { status: 'not_configured' };
    }
  } catch (error) {
    log('❌ Stripe: Test failed', 'red');
    return { status: 'failed' };
  }
}

async function checkEnvironmentVariables() {
  log('\n=== Expected Environment Variables ===', 'cyan');
  
  const requiredVars = [
    'GEMINI_API_KEY',
    'GOOGLE_VISION_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'NODE_ENV',
    'PORT'
  ];
  
  log('Required environment variables for full functionality:', 'blue');
  requiredVars.forEach(varName => {
    log(`  - ${varName}`, 'blue');
  });
  
  return requiredVars;
}

async function runFullVerification() {
  log('================================================', 'magenta');
  log('     NATURINEX API VERIFICATION SUITE', 'magenta');
  log('================================================', 'magenta');
  log(`Server: ${API_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}`, 'blue');
  
  // 1. Check server health
  log('\n=== Server Health Check ===', 'cyan');
  const health = await checkHealth();
  
  if (health) {
    log('✅ Server is healthy', 'green');
    log(`   Version: ${health.version}`, 'blue');
    log(`   Uptime: ${health.uptime?.formatted || 'N/A'}`, 'blue');
    log(`   Features: ${health.features?.join(', ') || 'N/A'}`, 'blue');
    
    if (health.errors?.topErrors?.length > 0) {
      log('⚠️  Recent errors detected:', 'yellow');
      health.errors.topErrors.forEach(err => {
        log(`   - ${err.message.substring(0, 50)}...`, 'yellow');
      });
    }
  } else {
    log('❌ Server is not responding', 'red');
    process.exit(1);
  }
  
  // 2. Test all APIs
  const results = {
    server: health ? 'healthy' : 'down',
    gemini: await testGeminiAI(),
    vision: await testVisionAPI(),
    stripe: await testStripeIntegration()
  };
  
  // 3. Show environment variables needed
  const envVars = await checkEnvironmentVariables();
  
  // 4. Final Summary
  log('\n================================================', 'magenta');
  log('              VERIFICATION SUMMARY', 'magenta');
  log('================================================', 'magenta');
  
  const summary = {
    '✅ Working': [],
    '⚠️  Partial/Mock': [],
    '❌ Not Working': []
  };
  
  // Categorize results
  if (results.server === 'healthy') summary['✅ Working'].push('Server');
  
  if (results.gemini.status === 'working') {
    summary['✅ Working'].push('Gemini AI (Real data)');
  } else if (results.gemini.status === 'mock') {
    summary['⚠️  Partial/Mock'].push('Gemini AI (Mock data)');
  } else {
    summary['❌ Not Working'].push('Gemini AI');
  }
  
  if (results.vision.status === 'working') {
    summary['✅ Working'].push('Google Vision API');
  } else if (results.vision.status === 'mock' || results.vision.status === 'not_configured') {
    summary['⚠️  Partial/Mock'].push('Google Vision API');
  } else {
    summary['❌ Not Working'].push('Google Vision API');
  }
  
  if (results.stripe.status === 'working') {
    summary['✅ Working'].push('Stripe Integration');
  } else {
    summary['❌ Not Working'].push('Stripe Integration');
  }
  
  // Print summary
  Object.entries(summary).forEach(([category, items]) => {
    if (items.length > 0) {
      log(`\n${category}:`, category.includes('✅') ? 'green' : category.includes('⚠️') ? 'yellow' : 'red');
      items.forEach(item => {
        log(`  • ${item}`, category.includes('✅') ? 'green' : category.includes('⚠️') ? 'yellow' : 'red');
      });
    }
  });
  
  // Recommendations
  log('\n=== Recommendations ===', 'cyan');
  
  if (results.gemini.status !== 'working') {
    log('1. Gemini AI needs attention:', 'yellow');
    log('   - Verify GEMINI_API_KEY is correct in Render', 'yellow');
    log('   - Check Google Cloud billing is enabled', 'yellow');
    log('   - Ensure Generative Language API is enabled', 'yellow');
  }
  
  if (results.vision.status !== 'working') {
    log('2. Vision API needs configuration:', 'yellow');
    log('   - Add GOOGLE_VISION_API_KEY to Render environment', 'yellow');
    log('   - Enable Cloud Vision API in Google Cloud Console', 'yellow');
  }
  
  if (results.gemini.status === 'working' && results.vision.status === 'working') {
    log('🎉 All AI services are properly configured and working!', 'green');
    log('   Your app is ready for production use.', 'green');
  }
  
  // Overall status
  const allWorking = results.gemini.status === 'working' && 
                     results.vision.status === 'working' && 
                     results.stripe.status === 'working';
  
  log('\n================================================', 'magenta');
  if (allWorking) {
    log('        ✅ ALL SYSTEMS OPERATIONAL', 'green');
  } else {
    log('        ⚠️  PARTIAL FUNCTIONALITY', 'yellow');
  }
  log('================================================', 'magenta');
  
  return results;
}

// Run the verification
runFullVerification()
  .then(results => {
    log('\nVerification complete!', 'cyan');
    process.exit(0);
  })
  .catch(error => {
    log('\n❌ Verification failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  });