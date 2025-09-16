// K6 Load Testing Script for Naturinex
// Tests system capacity for 1M+ users
// Run with: k6 run k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginSuccessRate = new Rate('login_success');
const scanSuccessRate = new Rate('scan_success');

// Test configuration
export const options = {
  stages: [
    // Ramp-up phase
    { duration: '5m', target: 100 },   // Warm up to 100 users
    { duration: '10m', target: 500 },  // Ramp to 500 users
    { duration: '20m', target: 1000 }, // Ramp to 1000 users
    { duration: '30m', target: 5000 }, // Ramp to 5000 concurrent users
    { duration: '1h', target: 10000 }, // Sustain 10000 users
    { duration: '10m', target: 0 },    // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    errors: ['rate<0.01'], // Error rate under 1%
    login_success: ['rate>0.98'], // 98% login success
    scan_success: ['rate>0.95'], // 95% scan success
  },

  // Extended options for stress testing
  ext: {
    loadimpact: {
      projectID: 12345,
      name: 'Naturinex 1M User Test',
    },
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'https://naturinex.com';
const API_URL = __ENV.API_URL || 'https://api.naturinex.com';

// Generate test users
function generateUser() {
  const id = Math.floor(Math.random() * 1000000);
  return {
    email: `testuser${id}@test.com`,
    password: 'TestPassword123!',
  };
}

// Generate test product
function generateProduct() {
  const products = [
    '012345678901', '123456789012', '234567890123',
    '345678901234', '456789012345', '567890123456'
  ];
  return products[Math.floor(Math.random() * products.length)];
}

// Main test scenario
export default function () {
  const user = generateUser();

  // Test 1: Homepage load
  let res = http.get(BASE_URL);
  check(res, {
    'Homepage loads': (r) => r.status === 200,
    'Homepage fast': (r) => r.timings.duration < 1000,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Test 2: User registration
  res = http.post(`${API_URL}/api/auth/register`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, {
    'Registration works': (r) => r.status === 201 || r.status === 409, // 409 if already exists
  });

  sleep(1);

  // Test 3: User login
  res = http.post(`${API_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(res, {
    'Login successful': (r) => r.status === 200,
    'Login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch {
        return false;
      }
    },
  });
  loginSuccessRate.add(loginSuccess);

  if (!loginSuccess) {
    errorRate.add(1);
    return; // Skip remaining tests if login failed
  }

  // Extract token
  let token = '';
  try {
    const body = JSON.parse(res.body);
    token = body.token;
  } catch {
    errorRate.add(1);
    return;
  }

  // Test 4: Get user profile
  res = http.get(`${API_URL}/api/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  check(res, {
    'Profile loads': (r) => r.status === 200,
  });

  sleep(2);

  // Test 5: Product scan simulation
  const barcode = generateProduct();
  res = http.post(
    `${API_URL}/api/analyze`,
    JSON.stringify({
      barcode: barcode,
      image: 'base64_encoded_image_simulation',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const scanSuccess = check(res, {
    'Scan successful': (r) => r.status === 200,
    'Scan returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.product_name !== undefined;
      } catch {
        return false;
      }
    },
    'Scan fast': (r) => r.timings.duration < 2000,
  });
  scanSuccessRate.add(scanSuccess);

  sleep(3);

  // Test 6: Get scan history
  res = http.get(`${API_URL}/api/scans`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  check(res, {
    'History loads': (r) => r.status === 200,
    'History has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.scans);
      } catch {
        return false;
      }
    },
  });

  sleep(2);

  // Test 7: Subscription check
  res = http.get(`${API_URL}/api/subscription/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  check(res, {
    'Subscription check works': (r) => r.status === 200,
  });

  sleep(1);

  // Test 8: Static assets loading
  const assets = [
    '/static/js/main.js',
    '/static/css/main.css',
    '/favicon.ico',
  ];

  assets.forEach(asset => {
    res = http.get(`${BASE_URL}${asset}`);
    check(res, {
      [`${asset} loads`]: (r) => r.status === 200,
      [`${asset} cached`]: (r) => r.headers['Cache-Control'] !== undefined,
    });
  });

  sleep(5);

  // Test 9: Websocket connection (if applicable)
  // Note: K6 websocket testing requires different approach
  // This is a placeholder for WebSocket testing

  // Test 10: Logout
  res = http.post(`${API_URL}/api/auth/logout`, null, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  check(res, {
    'Logout successful': (r) => r.status === 200,
  });
}

// Setup function (runs once)
export function setup() {
  console.log('Starting load test for Naturinex');
  console.log(`Testing ${BASE_URL}`);

  // Warm up the system
  const res = http.get(BASE_URL);
  if (res.status !== 200) {
    throw new Error(`System not responding: ${res.status}`);
  }

  return { startTime: Date.now() };
}

// Teardown function (runs once)
export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`Test completed in ${duration}ms`);
}

// Custom scenario for spike testing
export const spikeTest = {
  executor: 'ramping-arrival-rate',
  startRate: 10,
  timeUnit: '1s',
  preAllocatedVUs: 500,
  maxVUs: 10000,
  stages: [
    { target: 10, duration: '30s' },
    { target: 10000, duration: '1m' },  // Spike to 10K requests/sec
    { target: 10000, duration: '3m' },  // Sustain spike
    { target: 10, duration: '1m' },     // Back to normal
  ],
};

// Custom scenario for soak testing (24 hours)
export const soakTest = {
  executor: 'constant-vus',
  vus: 1000,
  duration: '24h',
};