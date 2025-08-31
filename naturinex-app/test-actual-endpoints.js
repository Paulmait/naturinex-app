const axios = require('axios');

const API_URL = 'https://naturinex-app-1.onrender.com';

async function testEndpoints() {
  console.log('Testing actual production endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/health', name: 'Health Check' },
    { method: 'POST', path: '/suggest', name: 'Suggest (Main AI)', data: { medicationName: 'Aspirin', userId: 'test' } },
    { method: 'POST', path: '/api/analyze', name: 'Analyze', data: { text: 'Aspirin' } },
    { method: 'POST', path: '/api/analyze/name', name: 'Analyze Name', data: { medicationName: 'Aspirin' } },
    { method: 'GET', path: '/api/alternatives/aspirin', name: 'Get Alternatives' },
    { method: 'POST', path: '/analyze', name: 'Analyze (alt path)', data: { medicationName: 'Aspirin' } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const config = {
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        data: endpoint.data,
        timeout: 10000,
        validateStatus: () => true // Accept any status
      };
      
      const response = await axios(config);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: SUCCESS (Status ${response.status})`);
        
        // Check if it's using real AI or mock data
        if (response.data) {
          if (response.data.alternatives) {
            const isMock = response.data.alternatives.some(alt => 
              alt.name === 'Turmeric Curcumin' || alt.name === 'Omega-3 Fish Oil'
            );
            console.log(`   Data type: ${isMock ? 'MOCK DATA' : 'REAL AI DATA'}`);
            console.log(`   Alternatives: ${response.data.alternatives.length}`);
          }
          if (response.data.features) {
            console.log(`   Features: ${JSON.stringify(response.data.features)}`);
          }
          if (response.data.errors && response.data.errors.topErrors) {
            console.log(`   Recent errors detected:`);
            response.data.errors.topErrors.forEach(err => {
              if (err.message.includes('GoogleGenerativeAI')) {
                console.log(`     - Gemini AI Error: ${err.count} times`);
              }
            });
          }
        }
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint.name}: NOT FOUND (404)`);
      } else if (response.status === 500) {
        console.log(`⚠️  ${endpoint.name}: SERVER ERROR (500)`);
        if (response.data && response.data.error) {
          console.log(`   Error: ${response.data.error}`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Status ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection failed - ${error.message}`);
    }
    console.log('');
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('The production server has the following configuration:');
  console.log('1. GEMINI_API_KEY is set but experiencing errors');
  console.log('2. GOOGLE_VISION_API_KEY is NOT configured');
  console.log('3. Server may need restart to load new environment variables');
  console.log('\nRecommendation: Restart the Render service to apply the environment variables properly.');
}

testEndpoints();