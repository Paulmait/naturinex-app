const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://naturinex-app-1.onrender.com';

async function testAnalyzeEndpoint() {
  try {
    console.log('Testing /api/analyze endpoint with simulated image scan...\n');
    
    // Test the analyze/name endpoint which should trigger analytics
    const response = await axios.post(`${BASE_URL}/api/analyze/name`, {
      medicationName: 'Miralax'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
    // The analytics update should now work without errors
    console.log('\n✅ If no Firebase analytics errors appear in the server logs, the fix is working!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAnalyzeEndpoint();