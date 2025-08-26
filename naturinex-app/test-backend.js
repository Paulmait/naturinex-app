// Quick backend connectivity test
const API_URL = 'https://naturinex-app.onrender.com';

console.log('Testing backend connectivity...\n');

// Test 1: Health check
console.log('1. Testing health endpoint...');
fetch(`${API_URL}/health`)
  .then(res => {
    console.log(`   Status: ${res.status}`);
    return res.text();
  })
  .then(data => {
    console.log(`   Response: ${data}`);
  })
  .catch(err => {
    console.log(`   ERROR: ${err.message}`);
    console.log('   Backend server appears to be DOWN!');
  });

// Test 2: API health check
console.log('\n2. Testing API health endpoint...');
fetch(`${API_URL}/api/health`)
  .then(res => {
    console.log(`   Status: ${res.status}`);
    return res.text();
  })
  .then(data => {
    console.log(`   Response: ${data}`);
  })
  .catch(err => {
    console.log(`   ERROR: ${err.message}`);
  });

// Test 3: Analyze endpoint
console.log('\n3. Testing analyze endpoint...');
fetch(`${API_URL}/api/analyze/name`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ medicationName: 'Advil' }),
})
  .then(res => {
    console.log(`   Status: ${res.status}`);
    return res.text();
  })
  .then(data => {
    console.log(`   Response: ${data.substring(0, 100)}...`);
  })
  .catch(err => {
    console.log(`   ERROR: ${err.message}`);
  });

console.log('\nIf all tests fail, your backend is not running!');
console.log('Check https://render.com to see if your service is active.');