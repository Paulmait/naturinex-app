# 🔍 Improve Scan Tracking & NLP Implementation Plan

## 1. Device ID Tracking for Scan Limits

### Current Issues:
- Only tracking by IP address (can be shared/changed)
- No persistent device identification
- Easy to bypass scan limits

### Solution:
```javascript
// server/utils/deviceTracking.js
const crypto = require('crypto');

function generateDeviceId(req) {
  // Combine multiple factors for unique device fingerprint
  const factors = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || req.connection.remoteAddress,
    // Add screen resolution, timezone from client
  ];
  
  return crypto
    .createHash('sha256')
    .update(factors.join('|'))
    .digest('hex');
}

// Track scans by device ID + IP combination
const scanTracking = new Map(); // deviceId -> { count, firstScan, lastScan }
```

### Client-Side Device ID:
```javascript
// src/utils/deviceId.js
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getDeviceId() {
  let deviceId = await AsyncStorage.getItem('deviceId');
  
  if (!deviceId) {
    // Generate unique device ID
    const factors = [
      Device.modelName,
      Device.osVersion,
      await Application.getIosIdForVendorAsync() || '',
      Device.deviceYearClass,
    ];
    
    deviceId = factors.join('-');
    await AsyncStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}
```

## 2. Improve Product Name Extraction

### Current Issues:
- Extracting wrong text: "NEEDED FOR STOMACH", "BOT", "equate"
- Not identifying actual product names
- Missing brand/product recognition

### Enhanced Extraction Logic:
```javascript
// server/services/productExtraction.js
function extractProductInfo(detectedText) {
  // Clean and normalize text
  const lines = detectedText.split('\n').map(line => line.trim());
  
  // Pattern matching for common formats
  const patterns = {
    // Prescription format: "DRUG_NAME DOSAGE FORM"
    prescription: /^([A-Z]+(?:\s+[A-Z]+)*)\s+(\d+(?:\.\d+)?)\s*(MG|ML|MCG|G|IU)/i,
    
    // OTC format: Brand name patterns
    otc: {
      brands: ['equate', 'walgreens', 'cvs', 'rite aid', 'kirkland'],
      products: ['aspirin', 'ibuprofen', 'acetaminophen', 'stomach relief', 'allergy relief'],
    },
    
    // Skip lines with these patterns
    skip: /^(NDC|Rx#|TAKE|USE|CAUTION|PROVIDER|compare to)/i,
  };
  
  // Intelligent extraction
  let productName = null;
  let brandName = null;
  let activeIngredient = null;
  
  for (const line of lines) {
    // Skip instruction/caution lines
    if (patterns.skip.test(line)) continue;
    
    // Check for prescription pattern
    const rxMatch = line.match(patterns.prescription);
    if (rxMatch) {
      productName = rxMatch[1];
      break;
    }
    
    // Check for brand names
    const lowerLine = line.toLowerCase();
    for (const brand of patterns.otc.brands) {
      if (lowerLine.includes(brand)) {
        brandName = line;
      }
    }
    
    // Check for active ingredients
    if (line.includes('active ingredient')) {
      const nextLineIndex = lines.indexOf(line) + 1;
      if (nextLineIndex < lines.length) {
        activeIngredient = lines[nextLineIndex];
      }
    }
  }
  
  return {
    productName: productName || brandName || activeIngredient || 'Unknown Product',
    brandName,
    activeIngredient,
    fullText: detectedText
  };
}
```

## 3. NLP Integration for Better Recognition

### Using Natural Language Processing:
```javascript
// server/services/nlpService.js
const natural = require('natural');
const classifier = new natural.BayesClassifier();

// Train classifier with product categories
const trainingData = [
  // Pain relievers
  { text: 'aspirin 325mg pain reliever', category: 'pain_relief' },
  { text: 'ibuprofen advil motrin', category: 'pain_relief' },
  
  // Stomach/Digestive
  { text: 'omeprazole prilosec heartburn', category: 'digestive' },
  { text: 'pepto bismol stomach relief', category: 'digestive' },
  
  // Allergies
  { text: 'loratadine claritin allergy', category: 'allergy' },
  { text: 'cetirizine zyrtec allergies', category: 'allergy' },
];

// Product knowledge base
const productDatabase = {
  'omeprazole': {
    category: 'digestive',
    commonBrands: ['Prilosec', 'Zegerid'],
    naturalAlternatives: [
      'Ginger root for nausea and digestion',
      'Probiotics for gut health',
      'Chamomile tea for stomach comfort',
      'Aloe vera juice for acid reflux'
    ]
  },
  'aspirin': {
    category: 'pain_relief',
    commonBrands: ['Bayer', 'Ecotrin'],
    naturalAlternatives: [
      'Turmeric for inflammation',
      'Willow bark (natural aspirin source)',
      'Capsaicin cream for topical pain',
      'Omega-3 fatty acids'
    ]
  },
  'bismuth subsalicylate': {
    category: 'digestive',
    commonBrands: ['Pepto-Bismol', 'Kaopectate'],
    naturalAlternatives: [
      'Peppermint oil for upset stomach',
      'Activated charcoal for gas',
      'BRAT diet (bananas, rice, applesauce, toast)',
      'Fennel seeds for bloating'
    ]
  }
};
```

## 4. Implementation Steps

### Server Updates:
```javascript
// server/index.js - Update analyze endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  const deviceId = req.headers['x-device-id'] || generateDeviceId(req);
  const ipAddress = req.ip;
  
  // Check scan limits
  const scanKey = `${deviceId}-${ipAddress}`;
  const scanCount = await checkScanLimit(scanKey);
  
  if (scanCount >= 3 && !req.user?.isPremium) {
    return res.status(429).json({
      error: 'Free scan limit reached',
      scansUsed: scanCount
    });
  }
  
  // Process image with Vision API
  const detectedText = await detectText(imagePath);
  
  // Enhanced extraction with NLP
  const productInfo = extractProductInfo(detectedText);
  const category = classifier.classify(productInfo.productName);
  const alternatives = productDatabase[productInfo.activeIngredient?.toLowerCase()] || 
                      getDefaultAlternatives(category);
  
  // Log scan with device tracking
  await logScan({
    deviceId,
    ipAddress,
    productName: productInfo.productName,
    timestamp: new Date()
  });
  
  res.json({
    productInfo,
    category,
    naturalAlternatives: alternatives,
    scansRemaining: Math.max(0, 3 - scanCount - 1)
  });
});
```

### Client Updates:
```javascript
// src/services/api.js
import { getDeviceId } from '../utils/deviceId';

export const analyzeImage = async (imageUri) => {
  const deviceId = await getDeviceId();
  
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'scan.jpg',
  });
  
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'X-Device-Id': deviceId,
    },
    body: formData,
  });
  
  return response.json();
};
```

## 5. Database Schema for Tracking

```sql
-- Firestore collections
scans {
  deviceId: string,
  ipAddress: string,
  userId?: string,
  productName: string,
  timestamp: timestamp,
  isGuest: boolean
}

deviceLimits {
  deviceId: string,
  scanCount: number,
  firstScan: timestamp,
  lastScan: timestamp,
  resetDate: timestamp
}

products {
  name: string,
  category: string,
  aliases: array,
  naturalAlternatives: array,
  description: string
}
```

## 6. Benefits

1. **Accurate Scan Tracking**: Device ID + IP prevents easy bypass
2. **Better Product Recognition**: NLP identifies products correctly
3. **Helpful Alternatives**: Curated wellness suggestions
4. **User Experience**: Always get meaningful results
5. **Analytics**: Track popular products for insights

## 7. Next Steps

1. Install NLP dependencies: `npm install natural`
2. Implement device ID tracking
3. Build product database
4. Train NLP classifier
5. Update analyze endpoint
6. Test with real products

This will ensure users always get positive, helpful wellness alternatives!