require('dotenv').config();
const { initializeFirebase, isFirebaseAvailable, getFirestore, getAuth } = require('./config/firebase-init');

console.log('🧪 Testing Naturinex Server Full Features\n');

// Test 1: Environment Variables
console.log('1️⃣ Checking Environment Variables:');
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'STRIPE_SECRET_KEY', 
  'STRIPE_WEBHOOK_SECRET',
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('KEY') || varName.includes('SECRET') ? '***hidden***' : value.substring(0, 50) + '...'}`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allEnvVarsPresent = false;
  }
});

// Test 2: Firebase Initialization
console.log('\n2️⃣ Testing Firebase Initialization:');
initializeFirebase();
if (isFirebaseAvailable()) {
  console.log('✅ Firebase Admin SDK initialized successfully');
  
  // Test Firestore
  const db = getFirestore();
  if (db) {
    console.log('✅ Firestore is accessible');
  } else {
    console.log('❌ Firestore not accessible');
  }
  
  // Test Auth
  const auth = getAuth();
  if (auth) {
    console.log('✅ Firebase Auth is accessible');
  } else {
    console.log('❌ Firebase Auth not accessible');
  }
} else {
  console.log('❌ Firebase Admin SDK failed to initialize');
}

// Test 3: MongoDB Connection
console.log('\n3️⃣ Testing MongoDB Connection:');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  
  // Test 4: Check Collections
  console.log('\n4️⃣ Checking MongoDB Collections:');
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.log('❌ Error listing collections:', err);
    } else {
      console.log(`✅ Found ${collections.length} collections:`);
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Test 5: Stripe Connection
    console.log('\n5️⃣ Testing Stripe Connection:');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    stripe.products.list({ limit: 1 })
      .then(products => {
        console.log('✅ Stripe connected successfully');
        console.log(`   Found ${products.data.length} products`);
      })
      .catch(err => {
        console.log('❌ Stripe connection failed:', err.message);
      })
      .finally(() => {
        // Test 6: Gemini API
        console.log('\n6️⃣ Testing Gemini API:');
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          console.log('✅ Gemini API initialized');
        } catch (error) {
          console.log('❌ Gemini API initialization failed:', error.message);
        }
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('===========');
        if (allEnvVarsPresent && isFirebaseAvailable()) {
          console.log('✅ All systems operational!');
          console.log('✅ Server is ready for full production use');
        } else {
          console.log('⚠️  Some features may be limited');
          console.log('   Check the errors above and fix any missing configurations');
        }
        
        // Exit
        process.exit(0);
      });
  });
}).catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});