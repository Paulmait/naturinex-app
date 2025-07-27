// Script to run initial data ingestion
require('dotenv').config();
const mongoose = require('mongoose');
const DataIngestionOrchestrator = require('../services/dataIngestion/dataIngestionOrchestrator');

async function runInitialIngestion() {
  console.log('🚀 Starting initial data ingestion...\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/naturinex', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully\n');
    
    // Initialize orchestrator
    const orchestrator = new DataIngestionOrchestrator();
    
    // Run test ingestion first (3 remedies)
    console.log('🧪 Running test ingestion (3 remedies)...');
    await orchestrator.runTestIngestion();
    console.log('✅ Test ingestion completed\n');
    
    // Ask for confirmation before full ingestion
    console.log('⚠️  Ready to run FULL ingestion (30+ remedies)');
    console.log('This will scrape data from PubChem, WHO, and MSKCC');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run full ingestion
    console.log('🔄 Starting full data ingestion...');
    const results = await orchestrator.runFullIngestion();
    
    console.log('\n✅ Ingestion completed!');
    console.log('📊 Results:');
    console.log(`   - New remedies: ${results.success}`);
    console.log(`   - Updated remedies: ${results.updated}`);
    console.log(`   - Failed: ${results.failed}`);
    console.log(`   - Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.remedy || 'General'}: ${err.error}`);
      });
    }
    
    console.log('\n🎉 Initial data ingestion complete!');
    console.log('💡 Natural remedies are now available in MongoDB');
    console.log('🔍 Test the API: POST /api/analyze/name with {"medicationName": "aspirin"}');
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
runInitialIngestion();