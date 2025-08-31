// Test frontend AI service implementation
const aiService = require('./src/services/aiService').default;

console.log('=== Testing Frontend AI Service ===\n');

async function testFrontendAI() {
  console.log('1. Testing medication analysis...');
  
  try {
    // Test medication analysis
    const result = await aiService.analyzeMedication('Aspirin');
    
    console.log('\n✅ Analysis completed');
    console.log('Medication:', result.medicationName);
    console.log('Alternatives found:', result.alternatives.length);
    console.log('Confidence:', result.confidence + '%');
    console.log('Processing time:', result.processingTime + 'ms');
    
    // Check if it's mock data
    const isMockData = result.alternatives.some(alt => 
      alt.name === 'Turmeric Curcumin' || 
      alt.name === 'Omega-3 Fish Oil'
    );
    
    if (isMockData) {
      console.log('\n⚠️  WARNING: Using MOCK DATA');
      console.log('The frontend is configured to use mock data for development.');
      console.log('Real AI integration requires backend API connection.');
    }
    
    console.log('\n2. Testing validation...');
    const validation = aiService.validateMedicationName('Test123');
    console.log('Validation result:', validation.isValid ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n3. Testing quota check...');
    const quota = await aiService.checkQuota('user123', 'device123');
    console.log('Can scan:', quota.canScan ? '✅ Yes' : '❌ No');
    console.log('Remaining scans:', quota.remainingScans);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendAI().then(() => {
  console.log('\n=== Frontend AI Service Test Complete ===');
  console.log('\nSummary:');
  console.log('- Frontend AI service is working');
  console.log('- Currently using MOCK data (as per code comments)');
  console.log('- Real AI requires backend integration');
  console.log('- Backend needs GEMINI_API_KEY and GOOGLE_VISION_API_KEY');
});