const axios = require('axios');
const BASE_URL = process.env.API_URL || 'https://naturinex-app-1.onrender.com';
async function testAnalyzeEndpoint() {
  try {
    // Test the analyze/name endpoint which should trigger analytics
    const response = await axios.post(`${BASE_URL}/api/analyze/name`, {
      medicationName: 'Miralax'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    );
    // The analytics update should now work without errors
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}
testAnalyzeEndpoint();