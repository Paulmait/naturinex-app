const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'https://naturinex-app-1.onrender.com';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, data = null, headers = {}) {
  log(`\n=== Testing ${name} ===`, 'cyan');
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      data,
      timeout: 30000
    };

    const response = await axios(config);
    
    log(`✅ ${name} - Success`, 'green');
    log(`Status: ${response.status}`, 'green');
    
    // Check if response contains mock data indicators
    const responseData = response.data;
    const isMockData = checkIfMockData(responseData);
    
    if (isMockData) {
      log(`⚠️  Using MOCK DATA (AI/OCR not configured)`, 'yellow');
    } else {
      log(`✓ Using REAL AI/OCR Service`, 'green');
    }
    
    // Show relevant response details
    if (responseData.alternatives) {
      log(`Alternatives found: ${responseData.alternatives.length}`, 'blue');
      responseData.alternatives.forEach((alt, i) => {
        log(`  ${i + 1}. ${alt.name} - ${alt.category}`, 'blue');
      });
    }
    
    if (responseData.confidence) {
      log(`Confidence: ${responseData.confidence}%`, 'blue');
    }
    
    if (responseData.processingTime) {
      log(`Processing time: ${responseData.processingTime}ms`, 'blue');
    }
    
    return { success: true, isMockData, data: responseData };
    
  } catch (error) {
    log(`❌ ${name} - Failed`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

function checkIfMockData(data) {
  // Check for indicators that this is mock data
  const mockIndicators = [
    'Turmeric Curcumin', // Default mock alternative
    'Omega-3 Fish Oil',  // Default mock alternative
    'Magnesium Glycinate', // Default mock alternative
    data.alternatives && data.alternatives.length === 3, // Mock always returns 3
    data.confidence && data.confidence >= 70 && data.confidence <= 100, // Mock range
    data.processingTime && data.processingTime >= 1000 && data.processingTime <= 3000 // Mock range
  ];
  
  // Count how many mock indicators are present
  const mockCount = mockIndicators.filter(indicator => indicator).length;
  
  // If 3 or more indicators, it's likely mock data
  return mockCount >= 3;
}

async function runTests() {
  log('\n===================================', 'cyan');
  log('   OCR & AI Configuration Test    ', 'cyan');
  log('===================================', 'cyan');
  log(`Testing API: ${API_URL}`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  
  const results = [];
  
  // Test 1: Health Check
  const healthResult = await testEndpoint(
    'Health Check',
    'GET',
    '/health'
  );
  results.push({ name: 'Health Check', ...healthResult });
  
  // Test 2: Text Analysis with medication name
  const textAnalysisResult = await testEndpoint(
    'Text Analysis (Medication Name)',
    'POST',
    '/api/analyze/name',
    { 
      medicationName: 'Ibuprofen',
      userId: 'test-user-001'
    }
  );
  results.push({ name: 'Text Analysis', ...textAnalysisResult });
  
  // Test 3: Alternative suggestions
  const alternativesResult = await testEndpoint(
    'Get Alternatives',
    'GET',
    '/api/alternatives/aspirin'
  );
  results.push({ name: 'Get Alternatives', ...alternativesResult });
  
  // Test 4: Barcode analysis
  const barcodeResult = await testEndpoint(
    'Barcode Analysis',
    'POST',
    '/api/analyze/barcode',
    {
      barcode: '0300650122223',
      userId: 'test-user-001'
    }
  );
  results.push({ name: 'Barcode Analysis', ...barcodeResult });
  
  // Test 5: Suggest endpoint
  const suggestResult = await testEndpoint(
    'AI Suggestions',
    'POST',
    '/suggest',
    { 
      medicationName: 'Metformin',
      userId: 'test-user-001'
    }
  );
  results.push({ name: 'AI Suggestions', ...suggestResult });
  
  // Print Summary
  log('\n===================================', 'cyan');
  log('           TEST SUMMARY           ', 'cyan');
  log('===================================', 'cyan');
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const mockCount = results.filter(r => r.isMockData).length;
  const realCount = results.filter(r => r.success && !r.isMockData).length;
  
  log(`\nTotal Tests: ${results.length}`, 'blue');
  log(`✅ Successful: ${successCount}`, 'green');
  log(`❌ Failed: ${failureCount}`, failureCount > 0 ? 'red' : 'green');
  log(`⚠️  Using Mock Data: ${mockCount}`, mockCount > 0 ? 'yellow' : 'green');
  log(`✓ Using Real AI/OCR: ${realCount}`, realCount > 0 ? 'green' : 'yellow');
  
  log('\n=== Configuration Status ===', 'cyan');
  
  // Check specific services
  const hasRealAI = realCount > 0;
  const hasOCR = false; // OCR endpoints not found in current deployment
  
  if (hasRealAI) {
    log('✅ AI Service: CONFIGURED (Using Gemini AI)', 'green');
  } else {
    log('⚠️  AI Service: NOT CONFIGURED (Using mock data)', 'yellow');
    log('   → Set GEMINI_API_KEY environment variable in Render', 'yellow');
  }
  
  if (hasOCR) {
    log('✅ OCR Service: CONFIGURED (Using Google Vision)', 'green');
  } else {
    log('⚠️  OCR Service: NOT CONFIGURED', 'yellow');
    log('   → Google Vision API not implemented in current deployment', 'yellow');
    log('   → Set GOOGLE_VISION_API_KEY if implementing OCR', 'yellow');
  }
  
  log('\n=== Recommendations ===', 'cyan');
  
  if (mockCount > 0) {
    log('1. Configure environment variables in Render dashboard:', 'blue');
    log('   - GEMINI_API_KEY for AI functionality', 'blue');
    log('   - GOOGLE_VISION_API_KEY for OCR (if needed)', 'blue');
    log('2. Restart the service after adding API keys', 'blue');
    log('3. The system is currently functional with mock data', 'blue');
  } else {
    log('✅ All services properly configured!', 'green');
    log('   System is using real AI for analysis', 'green');
  }
  
  // Test results details
  log('\n=== Detailed Results ===', 'cyan');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const dataType = result.isMockData ? '(Mock)' : '(Real)';
    const displayType = result.success ? dataType : '';
    log(`${status} ${result.name} ${displayType}`, result.success ? 'green' : 'red');
  });
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});