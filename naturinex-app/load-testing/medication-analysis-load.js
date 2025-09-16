import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const httpReqFailed = new Rate('http_req_failed');
const medicationAnalysisTime = new Trend('medication_analysis_duration');
const errorRate = new Rate('error_rate');
const apiCalls = new Counter('api_calls_total');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Ramp up to 50 users over 5 minutes
    { duration: '10m', target: 100 }, // Ramp up to 100 users over 10 minutes
    
    // Steady state
    { duration: '15m', target: 100 }, // Stay at 100 users for 15 minutes
    
    // Peak load
    { duration: '5m', target: 200 },  // Spike to 200 users
    { duration: '10m', target: 200 }, // Maintain peak for 10 minutes
    
    // Ramp down
    { duration: '5m', target: 50 },   // Ramp down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  
  thresholds: {
    // API response time thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_duration{endpoint:analyze}': ['p(95)<3000'], // Analysis endpoint under 3s
    'http_req_duration{endpoint:ocr}': ['p(95)<5000'], // OCR endpoint under 5s
    
    // Error rate thresholds
    'http_req_failed': ['rate<0.05'], // Error rate under 5%
    'error_rate': ['rate<0.02'], // Business logic error rate under 2%
    
    // Success rate thresholds
    'checks': ['rate>0.95'], // 95% of checks should pass
    
    // Custom metric thresholds
    'medication_analysis_duration': ['p(95)<4000'], // Analysis under 4s
  },
};

// Test data
const medications = [
  'Aspirin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin',
  'Amlodipine', 'Metoprolol', 'Omeprazole', 'Losartan', 'Gabapentin',
  'Hydrochlorothiazide', 'Sertraline', 'Montelukast', 'Fluticasone',
  'Pantoprazole', 'Tramadol', 'Duloxetine', 'Rosuvastatin', 'Escitalopram'
];

const apiBaseUrl = __ENV.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
const authToken = __ENV.AUTH_TOKEN || '';

// Setup function
export function setup() {
  console.log('Starting NaturineX Load Test');
  console.log(`Target URL: ${apiBaseUrl}`);
  console.log(`Test duration: ~50 minutes`);
  
  // Verify API is accessible
  const healthCheck = http.get(`${apiBaseUrl}/api/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }
  
  return { apiBaseUrl, authToken };
}

// Main test function
export default function(data) {
  const { apiBaseUrl, authToken } = data;
  
  // Generate test data
  const userId = `load-test-user-${randomString(8)}`;
  const medicationName = randomItem(medications);
  const sessionId = `session-${randomString(16)}`;
  
  // Common headers
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test/1.0',
    'X-Session-ID': sessionId,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Test medication analysis workflow
  testMedicationAnalysis(apiBaseUrl, headers, medicationName, userId);
  
  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

function testMedicationAnalysis(baseUrl, headers, medicationName, userId) {
  const startTime = Date.now();
  
  // Step 1: Analyze medication
  const analyzePayload = {
    medicationName: medicationName,
    userId: userId,
    analysisType: 'comprehensive',
    includeInteractions: true,
    includeSideEffects: true
  };
  
  const analyzeResponse = http.post(
    `${baseUrl}/api/medication/analyze`,
    JSON.stringify(analyzePayload),
    { 
      headers: { ...headers },
      tags: { endpoint: 'analyze' },
      timeout: '30s'
    }
  );
  
  apiCalls.add(1);
  
  const analyzeSuccess = check(analyzeResponse, {
    'analyze: status is 200': (r) => r.status === 200,
    'analyze: response time < 5s': (r) => r.timings.duration < 5000,
    'analyze: has medication data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.analysis && data.analysis.medication;
      } catch {
        return false;
      }
    },
    'analyze: no server errors': (r) => r.status < 500,
  });
  
  if (!analyzeSuccess) {
    errorRate.add(1);
    return;
  }
  
  let analysisData;
  try {
    analysisData = JSON.parse(analyzeResponse.body);
  } catch (e) {
    errorRate.add(1);
    return;
  }
  
  // Step 2: Check drug interactions if medication analysis successful
  if (analyzeResponse.status === 200 && analysisData.analysis) {
    const interactionPayload = {
      medications: [medicationName, 'Aspirin'], // Test interaction with common drug
      userId: userId
    };
    
    const interactionResponse = http.post(
      `${baseUrl}/api/interactions/check`,
      JSON.stringify(interactionPayload),
      {
        headers: { ...headers },
        tags: { endpoint: 'interactions' },
        timeout: '15s'
      }
    );
    
    apiCalls.add(1);
    
    check(interactionResponse, {
      'interactions: status is 200 or 404': (r) => [200, 404].includes(r.status),
      'interactions: response time < 3s': (r) => r.timings.duration < 3000,
      'interactions: valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
  }
  
  // Step 3: Save scan result
  const scanPayload = {
    medicationName: medicationName,
    userId: userId,
    analysisResults: analysisData.analysis || {},
    scanMethod: 'manual',
    timestamp: new Date().toISOString()
  };
  
  const saveResponse = http.post(
    `${baseUrl}/api/scans/save`,
    JSON.stringify(scanPayload),
    {
      headers: { ...headers },
      tags: { endpoint: 'save_scan' },
      timeout: '10s'
    }
  );
  
  apiCalls.add(1);
  
  check(saveResponse, {
    'save: status is 200 or 201': (r) => [200, 201].includes(r.status),
    'save: response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  // Record total analysis time
  const totalTime = Date.now() - startTime;
  medicationAnalysisTime.add(totalTime);
  
  // Track HTTP request failures
  httpReqFailed.add(analyzeResponse.status >= 400);
  httpReqFailed.add(saveResponse.status >= 400);
}

// OCR Performance Test
export function ocrLoadTest() {
  const baseUrl = __ENV.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
  
  // Mock image data (base64 encoded small image)
  const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AP/Z';
  
  const ocrPayload = {
    imageData: mockImageData,
    userId: `ocr-test-${randomString(8)}`,
    ocrSettings: {
      language: 'eng',
      confidence: 0.8
    }
  };
  
  const startTime = Date.now();
  
  const response = http.post(
    `${baseUrl}/api/ocr/process`,
    JSON.stringify(ocrPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'k6-ocr-test/1.0'
      },
      tags: { endpoint: 'ocr' },
      timeout: '30s'
    }
  );
  
  const processingTime = Date.now() - startTime;
  
  check(response, {
    'ocr: status is 200': (r) => r.status === 200,
    'ocr: response time < 10s': (r) => r.timings.duration < 10000,
    'ocr: has extracted text': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.extractedText !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  sleep(2);
}

// Stress test for database operations
export function databaseStressTest() {
  const baseUrl = __ENV.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
  const userId = `db-test-${randomString(8)}`;
  
  // Test concurrent database operations
  const operations = [
    // Fetch user scans
    () => http.get(`${baseUrl}/api/user/${userId}/scans`, {
      tags: { endpoint: 'get_scans' }
    }),
    
    // Fetch analytics
    () => http.get(`${baseUrl}/api/analytics/summary?userId=${userId}`, {
      tags: { endpoint: 'analytics' }
    }),
    
    // Search medications
    () => http.get(`${baseUrl}/api/medications/search?q=${randomItem(medications)}`, {
      tags: { endpoint: 'search' }
    })
  ];
  
  // Execute operations concurrently
  const responses = operations.map(op => op());
  
  responses.forEach((response, index) => {
    check(response, {
      [`db_op_${index}: status is 200 or 404`]: (r) => [200, 404].includes(r.status),
      [`db_op_${index}: response time < 3s`]: (r) => r.timings.duration < 3000,
    });
  });
  
  sleep(1);
}

// Memory and resource stress test
export function resourceStressTest() {
  const baseUrl = __ENV.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
  
  // Generate large payload to test memory handling
  const largeMedicationList = [];
  for (let i = 0; i < 100; i++) {
    largeMedicationList.push(`TestMedication${i}_${randomString(20)}`);
  }
  
  const largePayload = {
    medications: largeMedicationList,
    userId: `stress-test-${randomString(8)}`,
    metadata: {
      testType: 'resource_stress',
      timestamp: new Date().toISOString(),
      largeData: randomString(1000) // 1KB of random data
    }
  };
  
  const response = http.post(
    `${baseUrl}/api/interactions/batch-check`,
    JSON.stringify(largePayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'k6-stress-test/1.0'
      },
      tags: { endpoint: 'batch_interactions' },
      timeout: '60s'
    }
  );
  
  check(response, {
    'stress: handles large payload': (r) => r.status !== 413, // Not payload too large
    'stress: no memory errors': (r) => r.status !== 500,
    'stress: reasonable response time': (r) => r.timings.duration < 30000,
  });
  
  sleep(3);
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total API calls made: ${apiCalls.value}`);
  
  // Optional: Clean up test data
  const cleanupResponse = http.delete(`${data.apiBaseUrl}/api/test/cleanup`, {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      testType: 'load_test',
      timestamp: new Date().toISOString()
    })
  });
  
  if (cleanupResponse.status === 200) {
    console.log('Test data cleanup completed');
  }
}

// Helper function to generate realistic test scenarios
function generateTestScenario() {
  const scenarios = [
    'new_user_first_scan',
    'returning_user_multiple_scans',
    'premium_user_advanced_analysis',
    'guest_user_limited_access'
  ];
  
  return randomItem(scenarios);
}

// Export alternative test configurations
export const smokeTest = {
  stages: [
    { duration: '1m', target: 1 },
    { duration: '2m', target: 5 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.1'],
  }
};

export const stressTest = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '10m', target: 1000 },
    { duration: '5m', target: 0 }
  ],
  thresholds: {
    'http_req_duration': ['p(95)<10000'],
    'http_req_failed': ['rate<0.2'],
  }
};

export const spikeTest = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '30s', target: 1000 }, // Sudden spike
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    'http_req_duration': ['p(95)<15000'],
    'http_req_failed': ['rate<0.3'],
  }
};