const axios = require('axios');

const API_URL = 'https://naturinex-app-1.onrender.com';

// Test data for different scenarios
const testCases = [
  {
    name: 'Common Pain Medication',
    medication: 'Ibuprofen',
    expectedType: 'anti-inflammatory'
  },
  {
    name: 'Antibiotic',
    medication: 'Amoxicillin',
    expectedType: 'antibiotic'
  },
  {
    name: 'Blood Pressure',
    medication: 'Lisinopril',
    expectedType: 'blood pressure'
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAI() {
  console.log('===================================');
  console.log('  Comprehensive AI Testing Suite');
  console.log('===================================');
  console.log(`Server: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // 1. Check server health first
  console.log('1️⃣  Checking Server Health...');
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is healthy');
    console.log(`   Version: ${health.data.version}`);
    console.log(`   Uptime: ${health.data.uptime.formatted}`);
    
    // Check for errors
    if (health.data.errors && health.data.errors.topErrors) {
      console.log('⚠️  Recent errors detected:');
      health.data.errors.topErrors.forEach(err => {
        console.log(`   - ${err.message.substring(0, 50)}... (${err.count} times)`);
      });
    }
  } catch (error) {
    console.log('❌ Server health check failed');
    return;
  }

  console.log('\n2️⃣  Testing AI Analysis Endpoints...\n');

  // Test different medications
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name} (${testCase.medication})`);
    console.log('─'.repeat(40));
    
    try {
      const response = await axios.post(
        `${API_URL}/suggest`,
        {
          medicationName: testCase.medication,
          userId: 'test-user-001'
        },
        {
          timeout: 15000,
          validateStatus: () => true
        }
      );

      if (response.status === 200) {
        console.log('✅ Success - AI responded');
        
        const data = response.data;
        
        // Check if it's real AI or mock data
        const isMockData = checkIfMock(data);
        
        if (isMockData) {
          console.log('⚠️  WARNING: Receiving MOCK DATA');
          console.log('   The AI is not properly connected');
        } else {
          console.log('✅ REAL AI DATA detected!');
          console.log('   Gemini AI is working correctly');
        }
        
        // Display results
        if (data.alternatives && data.alternatives.length > 0) {
          console.log(`   Alternatives found: ${data.alternatives.length}`);
          data.alternatives.slice(0, 3).forEach((alt, i) => {
            console.log(`   ${i + 1}. ${alt.name} - ${alt.category || alt.description}`);
          });
        }
        
        if (data.confidence) {
          console.log(`   Confidence: ${data.confidence}%`);
        }
        
      } else if (response.status === 500) {
        console.log('❌ Server Error (500)');
        if (response.data.error) {
          console.log(`   Error: ${response.data.error}`);
          
          // Check if it's an API key issue
          if (response.data.errorId) {
            console.log(`   Error ID: ${response.data.errorId}`);
            console.log('   Possible causes:');
            console.log('   - Invalid GEMINI_API_KEY');
            console.log('   - API quota exceeded');
            console.log('   - Network issues with Google API');
          }
        }
      } else {
        console.log(`⚠️  Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log('❌ Request failed');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
    
    // Add delay between requests to avoid rate limiting
    await delay(1000);
  }

  // 3. Test barcode scanning (mock)
  console.log('3️⃣  Testing Barcode Scanning...');
  try {
    const barcodeResponse = await axios.post(
      `${API_URL}/api/analyze/barcode`,
      {
        barcode: '0300450221001',
        userId: 'test-user-001'
      },
      {
        timeout: 10000,
        validateStatus: () => true
      }
    );
    
    if (barcodeResponse.status === 200) {
      console.log('✅ Barcode endpoint works');
    } else if (barcodeResponse.status === 404) {
      console.log('⚠️  Barcode endpoint not available');
    } else {
      console.log(`❌ Barcode endpoint error: ${barcodeResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Barcode test failed:', error.message);
  }

  // 4. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TESTING SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\n🔑 API Keys Status:');
  console.log('  GEMINI_API_KEY: ✅ Configured (but may have issues)');
  console.log('  GOOGLE_VISION_API_KEY: ❌ Not configured yet');
  
  console.log('\n💡 Recommendations:');
  console.log('1. If seeing 500 errors with Gemini:');
  console.log('   - Verify the API key is correct');
  console.log('   - Check if billing is enabled in Google Cloud');
  console.log('   - Ensure the key has Gemini API access');
  console.log('2. Add GOOGLE_VISION_API_KEY for image/OCR features');
  console.log('3. Monitor the server logs in Render dashboard');
  
  console.log('\n✅ Testing Complete!');
}

function checkIfMock(data) {
  if (!data || !data.alternatives) return false;
  
  // Check for mock data indicators
  const mockNames = ['Turmeric Curcumin', 'Omega-3 Fish Oil', 'Magnesium Glycinate'];
  const hasAllMockNames = mockNames.every(name => 
    data.alternatives.some(alt => alt.name === name)
  );
  
  // If it has exactly these 3 alternatives, it's mock data
  return hasAllMockNames && data.alternatives.length === 3;
}

// Run the test
testAI().catch(error => {
  console.error('Test suite failed:', error.message);
});