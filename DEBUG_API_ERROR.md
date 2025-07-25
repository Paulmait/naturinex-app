# 🔍 Debugging "Analysis Failed" Error

## The Issue

You're getting "Analysis failed" because the app can't reach your backend API. The error is thrown in `AnalysisScreen.js` when the API call fails.

## Quick Diagnosis

### 1. Test Your Backend Server

Open a browser or use curl to test:

```bash
# Test if backend is running
curl https://naturinex-app.onrender.com/health

# Or open in browser:
https://naturinex-app.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T..."
}
```

**If you get an error or timeout**, your backend is not running!

### 2. Check Backend Logs

If using Render.com:
1. Login to https://render.com
2. Find your "naturinex-app" service
3. Check the logs for errors
4. Common issues:
   - Missing environment variables
   - Server crashed
   - Build failed

## Temporary Fix for Testing

Let's add detailed logging to see what's happening:

### Option 1: Add Debug Logging

**File:** `src/screens/AnalysisScreen.js`

Find the `analyzeMedicationByName` function and add logging:

```javascript
const analyzeMedicationByName = async (name) => {
  try {
    console.log('Starting analysis for:', name);
    console.log('API URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/analyze/name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medicationName: name }),
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status} - ${responseText}`);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
};
```

### Option 2: Use Mock Data (Immediate Testing)

If you need to test NOW without backend, temporarily use mock data:

**Create file:** `src/services/mockAnalysisService.js`

```javascript
export const getMockAnalysis = (medicationName) => {
  const mockData = {
    'advil': {
      medication: {
        name: 'Advil (Ibuprofen)',
        activeIngredient: 'Ibuprofen 200mg',
        uses: ['Pain relief', 'Fever reduction', 'Anti-inflammatory'],
        warnings: ['May cause stomach upset', 'Do not exceed recommended dose']
      },
      naturalAlternatives: [
        {
          name: 'Turmeric',
          benefits: 'Natural anti-inflammatory properties',
          usage: 'Add to food or take as supplement (500-1000mg daily)'
        },
        {
          name: 'Willow Bark',
          benefits: 'Contains natural salicin, similar to aspirin',
          usage: 'Tea or supplement form (240mg daily)'
        }
      ],
      interactions: [],
      analysisDate: new Date().toISOString()
    },
    'tylenol': {
      medication: {
        name: 'Tylenol (Acetaminophen)',
        activeIngredient: 'Acetaminophen 500mg',
        uses: ['Pain relief', 'Fever reduction'],
        warnings: ['Do not exceed 4000mg daily', 'Avoid with alcohol']
      },
      naturalAlternatives: [
        {
          name: 'Ginger',
          benefits: 'Natural pain relief and anti-nausea',
          usage: 'Fresh ginger tea or supplement (250mg 4x daily)'
        },
        {
          name: 'Feverfew',
          benefits: 'Traditional fever and headache remedy',
          usage: 'Supplement form (50-100mg daily)'
        }
      ],
      interactions: [],
      analysisDate: new Date().toISOString()
    }
  };
  
  const medication = medicationName.toLowerCase();
  return mockData[medication] || {
    medication: {
      name: medicationName,
      activeIngredient: 'Unknown',
      uses: ['Information not available'],
      warnings: ['Please consult healthcare provider']
    },
    naturalAlternatives: [
      {
        name: 'General Wellness',
        benefits: 'Maintain healthy lifestyle',
        usage: 'Consult with healthcare provider for alternatives'
      }
    ],
    interactions: [],
    analysisDate: new Date().toISOString()
  };
};
```

Then modify `AnalysisScreen.js` temporarily:

```javascript
import { getMockAnalysis } from '../services/mockAnalysisService';

const analyzeMedicationByName = async (name) => {
  try {
    // Temporary: Use mock data
    console.log('Using mock data for testing');
    return getMockAnalysis(name);
    
    // Original code (commented out):
    // const response = await fetch(`${API_URL}/api/analyze/name`, {
    //   ...
    // });
  } catch (error) {
    throw error;
  }
};
```

## Backend Requirements

Your backend server needs:

### 1. Environment Variables
```bash
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key
FIREBASE_SERVICE_ACCOUNT=your_firebase_admin_sdk_json
```

### 2. Required Endpoints
- `GET /health` - Health check
- `POST /api/analyze/name` - Analyze by medication name
- `POST /api/analyze/barcode` - Analyze by barcode
- `POST /api/analyze` - Analyze by image

### 3. CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://naturinex-app.onrender.com', '*'],
  credentials: true
}));
```

## Common Backend Issues on Render

1. **Service is sleeping** (free tier):
   - First request takes 30-50 seconds
   - Service spins down after 15 minutes of inactivity

2. **Missing environment variables**:
   - Go to Render Dashboard → Environment
   - Add all required variables

3. **Build failed**:
   - Check build logs
   - Common: missing dependencies in package.json

4. **Wrong start command**:
   - Should be: `node server.js` or `npm start`

## Quick Fix Steps

1. **Check if backend is live:**
   ```bash
   curl https://naturinex-app.onrender.com/health
   ```

2. **If offline, check Render.com:**
   - Login and check service status
   - View recent logs
   - Restart service if needed

3. **For immediate testing:**
   - Use the mock data approach above
   - This lets you test the app UI/UX

4. **Fix backend:**
   - Ensure all environment variables are set
   - Check GEMINI_API_KEY is valid
   - Verify server is running

The Firebase setup is working fine - the issue is your backend API server needs to be running!