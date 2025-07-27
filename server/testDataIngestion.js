const mongoose = require('mongoose');
const DataIngestionOrchestrator = require('./services/dataIngestion/dataIngestionOrchestrator');
require('dotenv').config();

async function testDataIngestion() {
  console.log('🧪 Testing Data Ingestion System...\n');
  
  // Check environment
  console.log('Environment Check:');
  console.log(`✓ Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Present' : '❌ Missing'}`);
  console.log(`✓ MongoDB URI: ${process.env.MONGODB_URI ? 'Present' : 'Using default localhost'}`);
  console.log('\n');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naturinex-test';
    console.log(`📊 Connecting to MongoDB: ${mongoUri.includes('localhost') ? 'Local' : 'Cloud'}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully\n');
    
    // Initialize orchestrator
    const orchestrator = new DataIngestionOrchestrator();
    
    // Test with limited herbs
    console.log('🌿 Testing scraping for: Turmeric, Ginger, Echinacea\n');
    
    // Run test ingestion
    const startTime = Date.now();
    await orchestrator.runTestIngestion();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n⏱️  Test completed in ${duration} seconds`);
    
    // Show sample data if available
    const NaturalRemedy = require('./models/naturalRemedySchema');
    const sample = await NaturalRemedy.findOne({ name: /turmeric/i });
    
    if (sample) {
      console.log('\n📋 Sample Data Retrieved:');
      console.log('Name:', sample.name);
      console.log('Scientific Name:', sample.scientificName);
      console.log('Category:', sample.category);
      console.log('Safety Score:', sample.qualityScore);
      console.log('Data Sources:', sample.dataSources.map(d => d.name).join(', '));
      console.log('Conditions:', sample.conditions.slice(0, 3).map(c => c.name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MongoDB is running (or set MONGODB_URI for cloud)');
    console.error('2. Check GEMINI_API_KEY is set in .env');
    console.error('3. Verify internet connection for API calls');
  } finally {
    // Disconnect
    await mongoose.disconnect();
    console.log('\n👋 Test complete, disconnected from MongoDB');
  }
}

// Run test
testDataIngestion();