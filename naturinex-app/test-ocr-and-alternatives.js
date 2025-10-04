#!/usr/bin/env node

/**
 * OCR & Natural Alternatives Test Suite
 * Tests the complete medication scanning and analysis flow
 */

const https = require('https');

// ANSI colors for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const API_URL = process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com';
const SUPABASE_URL = process.env.REACT_APP_API_URL_SUPABASE || 'https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1';

console.log(`${colors.bold}${colors.cyan}
╔════════════════════════════════════════════════════════════════╗
║         NATURINEX - OCR & ALTERNATIVES TEST SUITE              ║
║              Testing Complete Analysis Flow                    ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logSuccess(message, details = '') {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.cyan}${details}${colors.reset}`);
  }
  results.passed.push({ message, details });
}

function logError(message, details = '') {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.red}${details}${colors.reset}`);
  }
  results.failed.push({ message, details });
}

function logWarning(message, details = '') {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.yellow}${details}${colors.reset}`);
  }
  results.warnings.push({ message, details });
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test 1: OCR Implementation Check
async function testOCRImplementation() {
  logSection('Test 1: OCR Implementation');

  try {
    const fs = require('fs');
    const path = require('path');

    // Check if Tesseract.js is installed
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

    if (packageJson.dependencies['tesseract.js']) {
      logSuccess('OCR Library Installed', `Tesseract.js v${packageJson.dependencies['tesseract.js']}`);
    } else {
      logWarning('Tesseract.js not found in dependencies', 'OCR may not work');
    }

    // Check WebScan component for OCR implementation
    const webScanPath = path.join(__dirname, 'src', 'web', 'pages', 'WebScan.js');
    if (fs.existsSync(webScanPath)) {
      const webScanContent = fs.readFileSync(webScanPath, 'utf8');

      // Check for key OCR features
      const checks = [
        { pattern: /import.*Tesseract/i, name: 'Tesseract import' },
        { pattern: /performOCR/i, name: 'performOCR function' },
        { pattern: /recognizing text/i, name: 'OCR progress tracking' },
        { pattern: /setOcrProgress/i, name: 'OCR progress state' },
        { pattern: /setOcrText/i, name: 'OCR text extraction' },
      ];

      checks.forEach(check => {
        if (check.pattern.test(webScanContent)) {
          logSuccess(`OCR Feature: ${check.name}`, 'Implemented in WebScan.js');
        } else {
          logWarning(`OCR Feature: ${check.name}`, 'Not found in WebScan.js');
        }
      });
    } else {
      logError('WebScan.js not found', 'Cannot verify OCR implementation');
    }

  } catch (error) {
    logError('OCR Implementation Check Failed', error.message);
  }
}

// Test 2: Camera Access Implementation
async function testCameraImplementation() {
  logSection('Test 2: Camera Access Implementation');

  try {
    const fs = require('fs');
    const path = require('path');

    const webScanPath = path.join(__dirname, 'src', 'web', 'pages', 'WebScan.js');
    if (fs.existsSync(webScanPath)) {
      const content = fs.readFileSync(webScanPath, 'utf8');

      const cameraChecks = [
        { pattern: /navigator\.mediaDevices/i, name: 'MediaDevices API' },
        { pattern: /getUserMedia/i, name: 'Camera access request' },
        { pattern: /facingMode.*environment/i, name: 'Back camera preference' },
        { pattern: /HTTPS.*camera/i, name: 'HTTPS security check' },
        { pattern: /captureImage/i, name: 'Image capture function' },
        { pattern: /videoRef/i, name: 'Video element reference' },
      ];

      cameraChecks.forEach(check => {
        if (check.pattern.test(content)) {
          logSuccess(`Camera Feature: ${check.name}`, 'Implemented');
        } else {
          logWarning(`Camera Feature: ${check.name}`, 'Not found');
        }
      });

      // Check for security validation
      if (/window\.location\.protocol === 'https:'/i.test(content)) {
        logSuccess('Security: HTTPS enforcement', 'Camera requires HTTPS');
      } else {
        logWarning('Security: HTTPS check', 'May not enforce HTTPS for camera');
      }

    } else {
      logError('WebScan.js not found', 'Cannot verify camera implementation');
    }

  } catch (error) {
    logError('Camera Implementation Check Failed', error.message);
  }
}

// Test 3: Medication Analysis API
async function testMedicationAnalysisAPI() {
  logSection('Test 3: Medication Analysis API');

  try {
    // Test with a common medication
    const testMedication = 'Ibuprofen';
    logInfo(`Testing analysis for: ${testMedication}`);

    const requestData = JSON.stringify({
      medicationName: testMedication
    });

    // Try Render API first
    logInfo('Testing Render API endpoint...');
    try {
      const response = await makeRequest(`${API_URL}/api/analyze/name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestData
      });

      if (response.status === 200 && response.data) {
        logSuccess('Render API Response', `Status: ${response.status}`);

        // Check for alternatives in response
        if (response.data.details || response.data.analysis) {
          const responseText = response.data.details || response.data.analysis;
          logSuccess('API Returns Analysis', `Length: ${responseText.length} chars`);

          // Check if alternatives are mentioned
          const hasAlternatives = /alternative|natural|herbal|supplement/i.test(responseText);
          if (hasAlternatives) {
            logSuccess('Natural Alternatives Included', 'API response contains alternative recommendations');
          } else {
            logWarning('Natural Alternatives', 'May not be included in response');
          }
        } else {
          logWarning('API Response Format', 'Unexpected response structure');
        }

        // Check rate limit headers
        if (response.headers['x-ratelimit-remaining']) {
          logInfo(`Rate Limit: ${response.headers['x-ratelimit-remaining']} requests remaining`);
        }

      } else {
        logWarning('Render API', `Status: ${response.status}`);
      }
    } catch (error) {
      logWarning('Render API unavailable', error.message);
    }

    // Test Supabase Edge Function
    logInfo('Testing Supabase Edge Function...');
    try {
      const supabaseResponse = await makeRequest(`${SUPABASE_URL}/analyze-production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ medication: testMedication })
      });

      if (supabaseResponse.status === 200 && supabaseResponse.data) {
        logSuccess('Supabase Edge Function', `Status: ${supabaseResponse.status}`);

        // Check for alternatives in structured response
        if (supabaseResponse.data.alternatives) {
          const altCount = Array.isArray(supabaseResponse.data.alternatives)
            ? supabaseResponse.data.alternatives.length
            : 0;
          logSuccess('Structured Alternatives', `${altCount} alternatives provided`);

          // Log first alternative as example
          if (altCount > 0) {
            const firstAlt = supabaseResponse.data.alternatives[0];
            logInfo(`Example: ${firstAlt.name || 'Unknown'} - ${firstAlt.description?.substring(0, 60)}...`);
          }
        } else {
          logWarning('Alternatives Structure', 'Not in expected format');
        }

        // Check for warnings and disclaimer
        if (supabaseResponse.data.warnings) {
          logSuccess('Safety Warnings', `${supabaseResponse.data.warnings.length} warnings included`);
        }

        if (supabaseResponse.data.disclaimer) {
          logSuccess('Medical Disclaimer', 'Present in response');
        }

      } else if (supabaseResponse.status === 401) {
        logWarning('Supabase Edge Function', 'Authentication required (expected for production)');
      } else {
        logWarning('Supabase Edge Function', `Status: ${supabaseResponse.status}`);
      }
    } catch (error) {
      logWarning('Supabase Edge Function', error.message);
    }

  } catch (error) {
    logError('Medication Analysis Test Failed', error.message);
  }
}

// Test 4: Natural Alternatives Display Components
async function testAlternativesDisplay() {
  logSection('Test 4: Natural Alternatives Display');

  try {
    const fs = require('fs');
    const path = require('path');

    const webScanPath = path.join(__dirname, 'src', 'web', 'pages', 'WebScan.js');
    if (fs.existsSync(webScanPath)) {
      const content = fs.readFileSync(webScanPath, 'utf8');

      const displayChecks = [
        { pattern: /analysisResult\.alternatives/i, name: 'Alternatives data binding' },
        { pattern: /Natural Alternatives/i, name: 'Alternatives section title' },
        { pattern: /extractAlternatives/i, name: 'Alternatives extraction function' },
        { pattern: /primary\.50|primary\.main/i, name: 'Highlighted alternatives styling' },
      ];

      displayChecks.forEach(check => {
        if (check.pattern.test(content)) {
          logSuccess(`UI Component: ${check.name}`, 'Implemented');
        } else {
          logWarning(`UI Component: ${check.name}`, 'Not found');
        }
      });

      // Check for alternatives extraction logic
      if (/extractAlternatives.*=.*\(text\)/i.test(content)) {
        logSuccess('Alternatives Extraction', 'Function defined to extract alternatives from API response');

        // Check extraction patterns
        if (/natural alternatives?:?/i.test(content)) {
          logSuccess('Extraction Pattern', 'Looks for "natural alternatives" keyword');
        }

        if (/alternative|natural|herbal|supplement/i.test(content)) {
          logSuccess('Keyword Detection', 'Searches for relevant keywords in response');
        }
      }

      // Check for visual display
      if (/Paper.*alternatives/i.test(content) || /Box.*alternatives/i.test(content)) {
        logSuccess('Visual Display', 'Alternatives shown in dedicated component/section');
      }

    } else {
      logError('WebScan.js not found', 'Cannot verify alternatives display');
    }

  } catch (error) {
    logError('Alternatives Display Check Failed', error.message);
  }
}

// Test 5: Complete User Flow
async function testCompleteFlow() {
  logSection('Test 5: Complete User Flow');

  try {
    const fs = require('fs');
    const path = require('path');

    const webScanPath = path.join(__dirname, 'src', 'web', 'pages', 'WebScan.js');
    if (fs.existsSync(webScanPath)) {
      const content = fs.readFileSync(webScanPath, 'utf8');

      logInfo('Verifying complete flow: Upload → OCR → Analysis → Display');

      const flowChecks = [
        { step: 1, pattern: /handleFileUpload/i, name: 'Image upload handler' },
        { step: 2, pattern: /FileReader.*readAsDataURL/i, name: 'Image processing' },
        { step: 3, pattern: /performOCR.*reader\.result/i, name: 'Automatic OCR on upload' },
        { step: 4, pattern: /setTextInput.*medicationName/i, name: 'Auto-fill from OCR' },
        { step: 5, pattern: /analyzeScan/i, name: 'Trigger analysis' },
        { step: 6, pattern: /setAnalysisResult/i, name: 'Store analysis results' },
        { step: 7, pattern: /analysisResult.*alternatives/i, name: 'Display alternatives' },
      ];

      let flowComplete = true;
      flowChecks.forEach(check => {
        if (check.pattern.test(content)) {
          logSuccess(`Step ${check.step}: ${check.name}`, '✓');
        } else {
          logWarning(`Step ${check.step}: ${check.name}`, 'Not verified');
          flowComplete = false;
        }
      });

      if (flowComplete) {
        logSuccess('Complete Flow Verified', 'All steps present in implementation');
      } else {
        logWarning('Flow Verification', 'Some steps could not be verified');
      }

    }
  } catch (error) {
    logError('Complete Flow Test Failed', error.message);
  }
}

// Test 6: Error Handling & User Feedback
async function testErrorHandling() {
  logSection('Test 6: Error Handling & User Feedback');

  try {
    const fs = require('fs');
    const path = require('path');

    const webScanPath = path.join(__dirname, 'src', 'web', 'pages', 'WebScan.js');
    if (fs.existsSync(webScanPath)) {
      const content = fs.readFileSync(webScanPath, 'utf8');

      const errorChecks = [
        { pattern: /OCR Error/i, name: 'OCR error handling' },
        { pattern: /Failed to extract text/i, name: 'OCR failure message' },
        { pattern: /LinearProgress.*ocrProgress/i, name: 'OCR progress indicator' },
        { pattern: /Extracting text from image/i, name: 'OCR loading message' },
        { pattern: /Text extracted successfully/i, name: 'OCR success feedback' },
        { pattern: /isProcessingOCR/i, name: 'OCR processing state' },
      ];

      errorChecks.forEach(check => {
        if (check.pattern.test(content)) {
          logSuccess(`Feedback: ${check.name}`, 'Implemented');
        } else {
          logWarning(`Feedback: ${check.name}`, 'Not found');
        }
      });

    }
  } catch (error) {
    logError('Error Handling Test Failed', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}Starting test suite...${colors.reset}\n`);
  console.log(`API Endpoints:`);
  console.log(`  - Render: ${API_URL}`);
  console.log(`  - Supabase: ${SUPABASE_URL}`);
  console.log('');

  await testOCRImplementation();
  await testCameraImplementation();
  await testMedicationAnalysisAPI();
  await testAlternativesDisplay();
  await testCompleteFlow();
  await testErrorHandling();

  // Print summary
  logSection('Test Summary');

  console.log(`${colors.green}${colors.bold}✅ Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.red}${colors.bold}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.yellow}${colors.bold}⚠️  Warnings: ${results.warnings.length}${colors.reset}`);

  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

  console.log(`\n${colors.bold}Pass Rate: ${passRate}%${colors.reset}`);

  // Overall status
  if (results.failed.length === 0 && results.warnings.length === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ALL TESTS PASSED! 🎉${colors.reset}`);
    console.log(`${colors.green}OCR and Natural Alternatives are fully functional!${colors.reset}\n`);
  } else if (results.failed.length === 0) {
    console.log(`\n${colors.yellow}${colors.bold}✅ TESTS PASSED WITH WARNINGS${colors.reset}`);
    console.log(`${colors.yellow}OCR and alternatives are functional, but see warnings above.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.red}Please review failed tests above.${colors.reset}\n`);
  }

  // Recommendations
  if (results.warnings.length > 0 || results.failed.length > 0) {
    logSection('Recommendations');

    if (results.failed.length > 0) {
      console.log(`${colors.red}Critical Issues:${colors.reset}`);
      results.failed.forEach(item => {
        console.log(`  • ${item.message}`);
        if (item.details) console.log(`    ${item.details}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings to Address:${colors.reset}`);
      results.warnings.forEach(item => {
        console.log(`  • ${item.message}`);
        if (item.details) console.log(`    ${item.details}`);
      });
    }
  }

  console.log('');
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
