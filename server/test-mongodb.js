const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');
  
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully!\n');
    
    // Get database info
    const db = mongoose.connection.db;
    console.log('📊 Database Information:');
    console.log(`   Database Name: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`   Collections: ${collections.map(c => c.name).join(', ') || 'None yet'}\n`);
    
    // Test creating a natural remedy document
    console.log('🧪 Testing Natural Remedy Schema...');
    const NaturalRemedy = require('./models/naturalRemedySchema');
    
    const testRemedy = {
      name: 'Test Herb',
      commonNames: ['Test Common Name'],
      scientificName: 'Testus herbicus',
      category: 'herb',
      description: 'A test herb for connection verification',
      conditions: [{
        name: 'Test Condition',
        effectiveness: 'moderate',
        evidence: {
          quality: 'low',
          studies: 0
        }
      }],
      safety: {
        generalSafety: 'safe',
        sideEffects: [],
        contraindications: [],
        pregnancySafety: 'unknown'
      },
      interactions: {
        medications: [],
        herbs: [],
        conditions: []
      },
      dosage: {
        recommended: 'Test dosage',
        forms: ['test'],
        duration: 'As needed'
      },
      preparation: ['Test preparation'],
      activeCompounds: [],
      qualityScore: 50,
      dataSources: [{
        name: 'Test Source',
        url: 'https://test.com',
        lastAccessed: new Date()
      }],
      lastValidated: new Date()
    };
    
    const doc = await NaturalRemedy.create(testRemedy);
    console.log('✅ Test document created successfully');
    console.log(`   Document ID: ${doc._id}\n`);
    
    // Query test
    console.log('🔍 Testing query functionality...');
    const found = await NaturalRemedy.findOne({ name: 'Test Herb' });
    console.log(`✅ Query successful: Found ${found ? 'document' : 'nothing'}\n`);
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await NaturalRemedy.deleteOne({ _id: doc._id });
    console.log('✅ Test document deleted\n');
    
    // Test data ingestion collections
    console.log('📥 Checking data ingestion setup...');
    const requiredCollections = ['naturalRemedies', 'ingestionLogs'];
    for (const collName of requiredCollections) {
      const exists = collections.some(c => c.name === collName);
      console.log(`   ${collName}: ${exists ? '✅ Exists' : '❌ Missing (will be created on first use)'}`);
    }
    
    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ All tests passed! MongoDB is properly configured.');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check if MONGODB_URI is set in .env file');
    console.error('   2. Verify your IP is whitelisted in MongoDB Atlas Network Access');
    console.error('   3. Confirm database user credentials are correct');
    console.error('   4. Ensure your cluster is running (not paused)');
    process.exit(1);
  }
}

// Run the test
testConnection();