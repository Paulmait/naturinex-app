const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3003';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testEndpoint(name, method, endpoint, data, headers = {}) {
  try {
    console.log(`\n${colors.blue}Testing ${name}...${colors.reset}`);
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`${colors.green}✓ ${name} - Status: ${response.status}${colors.reset}`);
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    }
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ ${name} - Error: ${error.response?.status || error.message}${colors.reset}`);
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log(`${colors.yellow}Starting API endpoint tests...${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}`);
  
  const results = [];
  
  // Test 1: Health check
  results.push(await testEndpoint('Health Check', 'GET', '/health'));
  
  // Test 2: Root endpoint
  results.push(await testEndpoint('Root Endpoint', 'GET', '/'));
  
  // Test 3: Analyze by name
  results.push(await testEndpoint('Analyze by Name', 'POST', '/api/analyze/name', {
    medicationName: 'Aspirin'
  }, { 'Content-Type': 'application/json' }));
  
  // Test 4: Analyze by barcode
  results.push(await testEndpoint('Analyze by Barcode', 'POST', '/api/analyze/barcode', {
    barcode: '123456789'
  }, { 'Content-Type': 'application/json' }));
  
  // Test 5: Search
  results.push(await testEndpoint('Search Products', 'GET', '/api/search?q=aspirin'));
  
  // Test 6: Data ingestion basic (requires admin key)
  const adminKey = process.env.ADMIN_API_KEY || 'test-admin-key';
  results.push(await testEndpoint('Data Ingestion Basic', 'POST', '/api/data/ingest-basic', {}, {
    'Content-Type': 'application/json',
    'X-Admin-Key': adminKey
  }));
  
  // Test 7: Get pricing tiers
  results.push(await testEndpoint('Get Pricing Tiers', 'GET', '/api/pricing/tiers'));
  
  // Test 8: Validate coupon
  results.push(await testEndpoint('Validate Coupon', 'POST', '/api/pricing/validate-coupon', {
    couponCode: 'WELLNESS20'
  }, { 'Content-Type': 'application/json' }));
  
  // Test 9: AI suggestions
  results.push(await testEndpoint('AI Suggestions', 'POST', '/suggest', {
    text: 'natural remedy for headache'
  }, { 'Content-Type': 'application/json' }));
  
  // Test 10: Analyze image (if test image exists)
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  if (fs.existsSync(testImagePath)) {
    const form = new FormData();
    form.append('image', fs.createReadStream(testImagePath));
    
    results.push(await testEndpoint('Analyze Image', 'POST', '/api/analyze', form, {
      ...form.getHeaders()
    }));
  } else {
    console.log(`${colors.yellow}⚠ Skipping image analysis test (no test image found)${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.yellow}========== TEST SUMMARY ==========${colors.reset}`);
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.blue}Total: ${results.length}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  }
}

// Run tests
runTests().catch(console.error);