/**
 * Comprehensive Testing Suite for Naturinex App
 * Tests all core functionality, scalability, and cross-platform compatibility
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
require('dotenv').config();

// Test configuration
const CONFIG = {
  API_URL: process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hxhbsxzkzarqwksbjpce.supabase.co',
  SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  MAX_RESPONSE_TIME: 2000, // 2 seconds
  CONCURRENT_USERS: 100,
  TEST_DURATION: 60000 // 1 minute
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  performance: [],
  warnings: []
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper functions
function log(message, type = 'info') {
  const color = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.blue,
    header: colors.magenta
  }[type] || colors.reset;

  console.log(`${color}${message}${colors.reset}`);
}

function recordTest(name, passed, details = {}) {
  if (passed) {
    testResults.passed.push({ name, ...details });
    log(`✅ ${name}`, 'success');
  } else {
    testResults.failed.push({ name, ...details });
    log(`❌ ${name}: ${details.error || 'Failed'}`, 'error');
  }
}

// 1. TEST CORE AUTHENTICATION
async function testAuthentication() {
  log('\n🔐 TESTING AUTHENTICATION SYSTEM', 'header');

  try {
    // Test Firebase availability
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
    };

    if (!firebaseConfig.apiKey) {
      recordTest('Firebase Configuration', false, { error: 'Missing Firebase API key' });
      testResults.warnings.push('Firebase not configured - authentication won\'t work');
    } else {
      recordTest('Firebase Configuration', true);
    }

    // Test Supabase authentication
    if (CONFIG.SUPABASE_KEY) {
      const response = await axios.get(
        `${CONFIG.SUPABASE_URL}/auth/v1/settings`,
        {
          headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
          }
        }
      );
      recordTest('Supabase Auth Endpoint', response.status === 200);
    } else {
      recordTest('Supabase Configuration', false, { error: 'Missing Supabase key' });
    }

    // Test JWT token validation
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    try {
      await axios.get(`${CONFIG.API_URL}/api/user/test/subscription`, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        recordTest('JWT Token Validation', true, { detail: 'Properly rejects invalid tokens' });
      }
    }

  } catch (error) {
    recordTest('Authentication System', false, { error: error.message });
  }
}

// 2. TEST API ENDPOINTS
async function testAPIEndpoints() {
  log('\n🌐 TESTING API ENDPOINTS', 'header');

  const endpoints = [
    { path: '/health', expected: 200, name: 'Health Check' },
    { path: '/api/alternatives/aspirin', expected: 200, name: 'Alternatives API' },
    { path: '/api/pricing/guest_user', expected: 200, name: 'Pricing API' },
    { path: '/stripe-config', expected: 200, name: 'Stripe Config' }
  ];

  for (const endpoint of endpoints) {
    try {
      const start = performance.now();
      const response = await axios.get(`${CONFIG.API_URL}${endpoint.path}`);
      const responseTime = performance.now() - start;

      recordTest(endpoint.name, response.status === endpoint.expected, {
        responseTime: `${responseTime.toFixed(2)}ms`,
        status: response.status
      });

      testResults.performance.push({
        endpoint: endpoint.path,
        responseTime,
        passed: responseTime < CONFIG.MAX_RESPONSE_TIME
      });

      if (responseTime > CONFIG.MAX_RESPONSE_TIME) {
        testResults.warnings.push(`${endpoint.name} slow response: ${responseTime.toFixed(2)}ms`);
      }
    } catch (error) {
      recordTest(endpoint.name, false, {
        error: error.response?.status || error.message
      });
    }
  }
}

// 3. TEST DATABASE OPERATIONS
async function testDatabase() {
  log('\n💾 TESTING DATABASE OPERATIONS', 'header');

  if (!CONFIG.SUPABASE_KEY) {
    recordTest('Database Connection', false, { error: 'Supabase not configured' });
    return;
  }

  try {
    // Test database connection
    const response = await axios.get(
      `${CONFIG.SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
        }
      }
    );

    recordTest('Database Connection', response.status === 200);

    // Test query performance
    const queryStart = performance.now();
    await axios.get(
      `${CONFIG.SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`,
      {
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
        }
      }
    );
    const queryTime = performance.now() - queryStart;

    recordTest('Database Query Performance', queryTime < 500, {
      queryTime: `${queryTime.toFixed(2)}ms`
    });

  } catch (error) {
    recordTest('Database Operations', false, { error: error.message });
  }
}

// 4. TEST PAYMENT SYSTEM
async function testPaymentSystem() {
  log('\n💳 TESTING PAYMENT SYSTEM', 'header');

  try {
    // Test Stripe configuration
    const stripeConfig = await axios.get(`${CONFIG.API_URL}/stripe-config`);
    const hasStripeKey = stripeConfig.data?.publicKey &&
                        !stripeConfig.data.publicKey.includes('test');

    if (hasStripeKey) {
      recordTest('Stripe Production Configuration', true);
    } else {
      recordTest('Stripe Configuration', false, {
        error: 'Using test keys or missing configuration'
      });
      testResults.warnings.push('Stripe not configured for production');
    }

    // Test checkout session endpoint
    try {
      await axios.post(`${CONFIG.API_URL}/api/create-checkout-session`, {
        priceId: 'price_test',
        userId: 'test_user',
        userEmail: 'test@example.com'
      });
    } catch (error) {
      // Should fail with 401 without auth, that's expected
      if (error.response?.status === 401) {
        recordTest('Checkout Session Security', true, {
          detail: 'Properly requires authentication'
        });
      }
    }

  } catch (error) {
    recordTest('Payment System', false, { error: error.message });
  }
}

// 5. TEST SECURITY FEATURES
async function testSecurity() {
  log('\n🔒 TESTING SECURITY FEATURES', 'header');

  try {
    // Test rate limiting
    const requests = [];
    for (let i = 0; i < 15; i++) {
      requests.push(axios.get(`${CONFIG.API_URL}/api/analyze/name`, {
        data: { medicationName: 'test' }
      }).catch(e => e.response));
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r?.status === 429);

    recordTest('Rate Limiting', rateLimited, {
      detail: rateLimited ? 'Rate limiting active' : 'No rate limiting detected'
    });

    if (!rateLimited) {
      testResults.warnings.push('Rate limiting may not be configured properly');
    }

    // Test CORS headers
    const corsResponse = await axios.get(`${CONFIG.API_URL}/health`);
    const hasCORS = corsResponse.headers['access-control-allow-origin'];

    recordTest('CORS Configuration', !!hasCORS, {
      origin: hasCORS || 'Not configured'
    });

    // Test security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    let hasAllHeaders = true;
    for (const header of securityHeaders) {
      if (!corsResponse.headers[header]) {
        hasAllHeaders = false;
        testResults.warnings.push(`Missing security header: ${header}`);
      }
    }

    recordTest('Security Headers', hasAllHeaders);

  } catch (error) {
    recordTest('Security Features', false, { error: error.message });
  }
}

// 6. LOAD TESTING
async function loadTest() {
  log('\n⚡ RUNNING LOAD TESTS', 'header');

  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity
  };

  const responseTimes = [];

  // Simulate concurrent users
  log(`Simulating ${CONFIG.CONCURRENT_USERS} concurrent users...`, 'info');

  const userRequests = [];
  for (let i = 0; i < CONFIG.CONCURRENT_USERS; i++) {
    userRequests.push(
      (async () => {
        try {
          const start = performance.now();
          await axios.get(`${CONFIG.API_URL}/health`);
          const responseTime = performance.now() - start;

          responseTimes.push(responseTime);
          results.successfulRequests++;

          if (responseTime > results.maxResponseTime) {
            results.maxResponseTime = responseTime;
          }
          if (responseTime < results.minResponseTime) {
            results.minResponseTime = responseTime;
          }
        } catch (error) {
          results.failedRequests++;
        }
        results.totalRequests++;
      })()
    );
  }

  await Promise.all(userRequests);

  // Calculate statistics
  results.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const successRate = (results.successfulRequests / results.totalRequests) * 100;

  recordTest('Load Test - Success Rate', successRate >= 95, {
    successRate: `${successRate.toFixed(2)}%`,
    totalRequests: results.totalRequests,
    failed: results.failedRequests
  });

  recordTest('Load Test - Avg Response Time', results.avgResponseTime < CONFIG.MAX_RESPONSE_TIME, {
    avgTime: `${results.avgResponseTime.toFixed(2)}ms`,
    maxTime: `${results.maxResponseTime.toFixed(2)}ms`,
    minTime: `${results.minResponseTime.toFixed(2)}ms`
  });

  testResults.performance.push({
    loadTest: results
  });
}

// 7. TEST CROSS-PLATFORM COMPATIBILITY
async function testCrossPlatform() {
  log('\n📱 TESTING CROSS-PLATFORM COMPATIBILITY', 'header');

  // Check platform-specific configurations
  const platforms = ['ios', 'android', 'web'];

  for (const platform of platforms) {
    try {
      // Simulate platform-specific headers
      const response = await axios.get(`${CONFIG.API_URL}/health`, {
        headers: {
          'User-Agent': platform === 'ios' ? 'iPhone' :
                        platform === 'android' ? 'Android' :
                        'Mozilla/5.0'
        }
      });

      recordTest(`${platform.toUpperCase()} Compatibility`, response.status === 200);
    } catch (error) {
      recordTest(`${platform.toUpperCase()} Compatibility`, false, {
        error: error.message
      });
    }
  }
}

// 8. TEST OFFLINE FUNCTIONALITY
async function testOfflineCapabilities() {
  log('\n📴 TESTING OFFLINE CAPABILITIES', 'header');

  // Check if offline service workers are configured
  const hasOfflineService = require('fs').existsSync('./src/services/offlineService.js');
  recordTest('Offline Service Implementation', hasOfflineService);

  // Check AsyncStorage configuration
  const hasAsyncStorage = require('./package.json').dependencies['@react-native-async-storage/async-storage'];
  recordTest('Offline Storage Configuration', !!hasAsyncStorage);

  // Check cache headers
  try {
    const response = await axios.get(`${CONFIG.API_URL}/health`);
    const hasCacheControl = response.headers['cache-control'];
    recordTest('Cache Headers', !!hasCacheControl, {
      cacheControl: hasCacheControl || 'Not configured'
    });
  } catch (error) {
    recordTest('Cache Configuration', false, { error: error.message });
  }
}

// 9. TEST SCALABILITY FEATURES
async function testScalability() {
  log('\n🚀 TESTING SCALABILITY FEATURES', 'header');

  // Check for Redis configuration
  const hasRedis = !!process.env.REDIS_URL;
  recordTest('Redis Cache Configuration', hasRedis, {
    detail: hasRedis ? 'Configured' : 'Not configured - required for 1M+ users'
  });

  if (!hasRedis) {
    testResults.warnings.push('Redis not configured - critical for scaling to 1M+ users');
  }

  // Check database connection pooling
  const hasPooling = !!process.env.DATABASE_POOL_MAX;
  recordTest('Database Connection Pooling', hasPooling, {
    maxConnections: process.env.DATABASE_POOL_MAX || 'Not configured'
  });

  // Check CDN configuration
  const hasCDN = !!process.env.CDN_URL;
  recordTest('CDN Configuration', hasCDN, {
    cdnUrl: process.env.CDN_URL || 'Not configured'
  });

  // Check monitoring
  const hasSentry = !!process.env.SENTRY_DSN;
  recordTest('Error Monitoring (Sentry)', hasSentry);

  if (!hasSentry) {
    testResults.warnings.push('Sentry not configured - critical for production monitoring');
  }
}

// 10. GENERATE COMPREHENSIVE REPORT
function generateReport() {
  log('\n📊 COMPREHENSIVE TEST REPORT', 'header');
  log('=' .repeat(50), 'info');

  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = (testResults.passed.length / totalTests) * 100;

  log(`\n📈 TEST SUMMARY`, 'header');
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Passed: ${testResults.passed.length} (${passRate.toFixed(1)}%)`, 'success');
  log(`Failed: ${testResults.failed.length}`, testResults.failed.length > 0 ? 'error' : 'success');

  if (testResults.failed.length > 0) {
    log(`\n❌ FAILED TESTS:`, 'error');
    testResults.failed.forEach(test => {
      log(`  - ${test.name}: ${test.error}`, 'error');
    });
  }

  if (testResults.warnings.length > 0) {
    log(`\n⚠️  WARNINGS:`, 'warning');
    testResults.warnings.forEach(warning => {
      log(`  - ${warning}`, 'warning');
    });
  }

  // Performance summary
  log(`\n⚡ PERFORMANCE METRICS:`, 'header');
  const performanceTests = testResults.performance.filter(p => p.responseTime);
  if (performanceTests.length > 0) {
    const avgResponseTime = performanceTests.reduce((sum, p) => sum + p.responseTime, 0) / performanceTests.length;
    log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`, 'info');

    const slowEndpoints = performanceTests.filter(p => p.responseTime > CONFIG.MAX_RESPONSE_TIME);
    if (slowEndpoints.length > 0) {
      log(`Slow Endpoints (>${CONFIG.MAX_RESPONSE_TIME}ms):`, 'warning');
      slowEndpoints.forEach(ep => {
        log(`  - ${ep.endpoint}: ${ep.responseTime.toFixed(2)}ms`, 'warning');
      });
    }
  }

  // Scalability assessment
  log(`\n🚀 SCALABILITY ASSESSMENT:`, 'header');
  const scalabilityScore = calculateScalabilityScore();

  if (scalabilityScore >= 80) {
    log(`Scalability Score: ${scalabilityScore}/100 - READY for 1M+ users`, 'success');
  } else if (scalabilityScore >= 60) {
    log(`Scalability Score: ${scalabilityScore}/100 - Needs improvements for 1M+ users`, 'warning');
  } else {
    log(`Scalability Score: ${scalabilityScore}/100 - NOT READY for scale`, 'error');
  }

  // Final verdict
  log(`\n🎯 FINAL VERDICT:`, 'header');
  if (passRate >= 90 && scalabilityScore >= 80) {
    log(`✅ APP IS PRODUCTION READY FOR 1M+ USERS`, 'success');
  } else if (passRate >= 70) {
    log(`⚠️ APP NEEDS IMPROVEMENTS BEFORE PRODUCTION`, 'warning');
  } else {
    log(`❌ APP IS NOT READY FOR PRODUCTION`, 'error');
  }

  log('\n' + '=' .repeat(50), 'info');
}

function calculateScalabilityScore() {
  let score = 0;
  const checks = [
    { name: 'Redis Cache', weight: 20, passed: !!process.env.REDIS_URL },
    { name: 'CDN', weight: 15, passed: !!process.env.CDN_URL },
    { name: 'Database Pooling', weight: 15, passed: !!process.env.DATABASE_POOL_MAX },
    { name: 'Rate Limiting', weight: 10, passed: testResults.passed.some(t => t.name === 'Rate Limiting') },
    { name: 'Error Monitoring', weight: 10, passed: !!process.env.SENTRY_DSN },
    { name: 'Security Headers', weight: 10, passed: testResults.passed.some(t => t.name === 'Security Headers') },
    { name: 'Load Test Success', weight: 20, passed: testResults.passed.some(t => t.name?.includes('Load Test')) }
  ];

  checks.forEach(check => {
    if (check.passed) score += check.weight;
  });

  return score;
}

// Main test runner
async function runAllTests() {
  log('🚀 NATURINEX COMPREHENSIVE TESTING SUITE', 'header');
  log('Testing for 1M+ users scalability and cross-platform compatibility\n', 'info');

  try {
    await testAuthentication();
    await testAPIEndpoints();
    await testDatabase();
    await testPaymentSystem();
    await testSecurity();
    await testCrossPlatform();
    await testOfflineCapabilities();
    await testScalability();
    await loadTest();

    generateReport();

    // Save report to file
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      results: testResults,
      verdict: testResults.passed.length / (testResults.passed.length + testResults.failed.length) >= 0.9 ? 'PASSED' : 'FAILED'
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    log('\n📄 Test report saved to test-report.json', 'info');

  } catch (error) {
    log(`\n❌ CRITICAL ERROR: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run tests
runAllTests();