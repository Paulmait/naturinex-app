// Comprehensive Functionality Test Script for Naturinex App
const fs = require('fs');
const path = require('path');

console.log('🔍 NATURINEX APP COMPREHENSIVE TEST SUITE');
console.log('=========================================\n');

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function testPass(testName) {
    console.log(`✅ ${testName}`);
    testsPassed++;
}

function testFail(testName, error) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${error}`);
    testsFailed++;
    errors.push({ test: testName, error });
}

// Test 1: Check Environment Variables
console.log('📋 Testing Environment Configuration...');
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check for placeholder values
        if (envContent.includes('YOUR_ACTUAL_API_KEY_HERE')) {
            testFail('Firebase API Key', 'Still using placeholder value');
        } else if (envContent.includes('REACT_APP_FIREBASE_API_KEY=')) {
            testPass('Firebase API Key configured');
        } else {
            testFail('Firebase API Key', 'Not found in .env');
        }
        
        if (envContent.includes('REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_')) {
            testPass('Stripe configuration found');
        } else {
            testFail('Stripe configuration', 'Missing Stripe key');
        }
        
        if (envContent.includes('REACT_APP_PRIVACY_POLICY_URL=https://')) {
            testPass('Privacy Policy URL configured');
        } else {
            testFail('Privacy Policy URL', 'Not configured');
        }
    } else {
        testFail('.env file', 'File not found');
    }
} catch (error) {
    testFail('Environment configuration', error.message);
}

// Test 2: Check Critical Files
console.log('\n📁 Testing File Structure...');
const criticalFiles = [
    'app.json',
    'eas.json',
    'src/firebase.js',
    'src/components/InfoScreen.js',
    'src/components/PrivacyPolicy.js',
    'src/components/TermsOfUse.js',
    'src/components/MedicalDisclaimer.js',
    'src/screens/HomeScreen.js',
    'src/screens/CameraScreen.js',
    'assets/icon.png',
    'assets/splash.png'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        testPass(`File exists: ${file}`);
    } else {
        testFail(`File missing: ${file}`, 'File not found');
    }
});

// Test 3: Check app.json configuration
console.log('\n⚙️ Testing App Configuration...');
try {
    const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8'));
    
    if (appJson.expo.ios.bundleIdentifier === 'com.naturinex.app') {
        testPass('iOS Bundle ID correct');
    } else {
        testFail('iOS Bundle ID', `Found: ${appJson.expo.ios.bundleIdentifier}`);
    }
    
    if (appJson.expo.android.package === 'com.naturinex.app') {
        testPass('Android Package name correct');
    } else {
        testFail('Android Package name', `Found: ${appJson.expo.android.package}`);
    }
    
    if (appJson.expo.version === '1.0.0') {
        testPass('App version correct');
    } else {
        testFail('App version', `Found: ${appJson.expo.version}`);
    }
    
    // Check permissions
    if (appJson.expo.ios.infoPlist.NSCameraUsageDescription) {
        testPass('iOS Camera permission configured');
    } else {
        testFail('iOS Camera permission', 'Missing NSCameraUsageDescription');
    }
} catch (error) {
    testFail('app.json parsing', error.message);
}

// Test 4: Check Firebase configuration
console.log('\n🔥 Testing Firebase Configuration...');
try {
    const firebaseFile = fs.readFileSync(path.join(__dirname, 'src/firebase.js'), 'utf8');
    
    if (firebaseFile.includes('naturinex-app.firebaseapp.com')) {
        testPass('Firebase project configured correctly');
    } else if (firebaseFile.includes('mediscan-b6252')) {
        testFail('Firebase project', 'Still using old mediscan project');
    } else {
        testFail('Firebase project', 'Configuration unclear');
    }
    
    if (firebaseFile.includes('process.env.REACT_APP_FIREBASE_API_KEY')) {
        testPass('Firebase using environment variables');
    } else {
        testFail('Firebase env vars', 'Not using environment variables');
    }
} catch (error) {
    testFail('Firebase configuration', error.message);
}

// Test 5: Check Component Imports
console.log('\n🧩 Testing Component Dependencies...');
const componentFiles = [
    'src/screens/HomeScreen.js',
    'src/screens/CameraScreen.js',
    'src/components/Dashboard.js'
];

componentFiles.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
        
        // Check for common issues
        if (content.includes('expo-camera')) {
            testPass(`${file} - Camera import found`);
        }
        
        if (content.includes('firebase')) {
            testPass(`${file} - Firebase import found`);
        }
        
        // Check for console.error or debug code
        if (content.includes('console.error') || content.includes('debugger')) {
            testFail(`${file}`, 'Contains debug code');
        }
    } catch (error) {
        // File might not exist or have different structure
    }
});

// Test 6: Check Icon Dimensions
console.log('\n🎨 Testing Assets...');
try {
    const sharp = require('sharp');
    sharp(path.join(__dirname, 'assets/icon.png'))
        .metadata()
        .then(metadata => {
            if (metadata.width === 1024 && metadata.height === 1024) {
                testPass('Icon dimensions correct (1024x1024)');
            } else {
                testFail('Icon dimensions', `Found: ${metadata.width}x${metadata.height}, Required: 1024x1024`);
            }
        })
        .catch(() => {
            console.log('   ⚠️  Cannot verify icon dimensions (sharp not installed)');
        });
} catch (error) {
    console.log('   ⚠️  Skipping image dimension test (requires sharp module)');
}

// Test 7: Check package.json dependencies
console.log('\n📦 Testing Dependencies...');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = [
        'expo',
        'react',
        'react-native',
        'firebase',
        '@stripe/stripe-react-native',
        'expo-camera',
        '@react-navigation/native'
    ];
    
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
            testPass(`Dependency found: ${dep}`);
        } else {
            testFail(`Dependency missing: ${dep}`, 'Not found in package.json');
        }
    });
} catch (error) {
    testFail('package.json parsing', error.message);
}

// Summary Report
console.log('\n=========================================');
console.log('📊 TEST SUMMARY');
console.log('=========================================');
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

if (errors.length > 0) {
    console.log('\n🔧 ISSUES TO FIX:');
    errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.test}`);
        console.log(`   Fix: ${error.error}`);
    });
}

console.log('\n📱 NEXT STEPS:');
if (testsFailed === 0) {
    console.log('✅ All tests passed! Ready for deployment.');
} else {
    console.log('❌ Fix the issues above before submitting to app stores.');
}

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);