const fs = require('fs');
const path = require('path');

// STEP 1: Fill in your credentials here
const credentials = {
  // Firebase
  firebaseApiKey: "YOUR_FIREBASE_API_KEY",
  firebaseAuthDomain: "naturinex-app.firebaseapp.com",
  firebaseProjectId: "naturinex-app",
  firebaseStorageBucket: "naturinex-app.appspot.com",
  firebaseMessagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  firebaseAppId: "YOUR_FIREBASE_APP_ID",
  
  // Google OAuth
  googleExpoClientId: "YOUR_GOOGLE_EXPO_CLIENT_ID",
  googleIosClientId: "YOUR_GOOGLE_IOS_CLIENT_ID",
  googleAndroidClientId: "YOUR_GOOGLE_ANDROID_CLIENT_ID",
  
  // Apple
  appleId: "your-apple-id@email.com",
  ascAppId: "YOUR_ASC_APP_ID",
  appleTeamId: "YOUR_APPLE_TEAM_ID"
};

// STEP 2: Run this script to update all files
console.log('🔧 Updating Naturinex credentials...\n');

// Update app.json
try {
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Update Firebase and Google OAuth credentials
  appJson.expo.extra.firebaseApiKey = credentials.firebaseApiKey;
  appJson.expo.extra.firebaseAuthDomain = credentials.firebaseAuthDomain;
  appJson.expo.extra.firebaseProjectId = credentials.firebaseProjectId;
  appJson.expo.extra.firebaseStorageBucket = credentials.firebaseStorageBucket;
  appJson.expo.extra.firebaseMessagingSenderId = credentials.firebaseMessagingSenderId;
  appJson.expo.extra.firebaseAppId = credentials.firebaseAppId;
  appJson.expo.extra.googleExpoClientId = credentials.googleExpoClientId;
  appJson.expo.extra.googleIosClientId = credentials.googleIosClientId;
  appJson.expo.extra.googleAndroidClientId = credentials.googleAndroidClientId;
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json');
} catch (error) {
  console.error('❌ Error updating app.json:', error.message);
}

// Update eas.json
try {
  const easJsonPath = path.join(__dirname, 'eas.json');
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  
  easJson.submit.production.ios.appleId = credentials.appleId;
  easJson.submit.production.ios.ascAppId = credentials.ascAppId;
  easJson.submit.production.ios.appleTeamId = credentials.appleTeamId;
  
  fs.writeFileSync(easJsonPath, JSON.stringify(easJson, null, 2));
  console.log('✅ Updated eas.json');
} catch (error) {
  console.error('❌ Error updating eas.json:', error.message);
}

// Update firebase.js
try {
  const firebasePath = path.join(__dirname, 'src', 'firebase.js');
  let firebaseContent = fs.readFileSync(firebasePath, 'utf8');
  
  // Replace old project references
  firebaseContent = firebaseContent.replace(/mediscan-b6252/g, credentials.firebaseProjectId);
  
  fs.writeFileSync(firebasePath, firebaseContent);
  console.log('✅ Updated firebase.js');
} catch (error) {
  console.error('❌ Error updating firebase.js:', error.message);
}

console.log('\n🎉 Configuration update complete!');
console.log('\n📋 Next steps:');
console.log('1. Make sure google-play-key.json is in the client directory');
console.log('2. Run: bash test-build.sh');
console.log('3. Build: eas build --platform all --profile production');
console.log('4. Submit: eas submit --platform ios/android --profile production');

// Check for remaining placeholders
const remainingPlaceholders = Object.entries(credentials).filter(([key, value]) => 
  value.includes('YOUR_') || value.includes('your-')
);

if (remainingPlaceholders.length > 0) {
  console.log('\n⚠️  Warning: You still need to update these placeholders:');
  remainingPlaceholders.forEach(([key, value]) => {
    console.log(`   - ${key}: ${value}`);
  });
}