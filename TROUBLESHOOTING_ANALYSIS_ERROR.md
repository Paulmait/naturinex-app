# 🔧 Fixing "Analyzing Failed" Error in Naturinex

## Common Causes & Solutions

### 1. Firebase Not Configured ❌
**Symptoms:** 
- Error when trying to sign up/login
- "Analyzing failed" after scanning

**Solution:**
1. Follow the Firebase Setup Guide
2. Make sure all 6 Firebase config values are real (not placeholders)
3. Verify Firestore database is created

### 2. Backend API Not Responding ❌
**Symptoms:**
- Login works but scanning fails
- Network errors in console

**Quick Test:**
```bash
# Test if your API is running
curl https://naturinex-app.onrender.com/api/health

# Should return something like:
# {"status":"ok","timestamp":"..."}
```

**Solution:**
1. Check if your backend server is deployed and running
2. Verify the API URL in app.json is correct
3. Make sure your backend has the `/suggest` endpoint

### 3. CORS Issues ❌
**Symptoms:**
- Works on web but not mobile
- "Network request failed" errors

**Solution:**
In your backend server, ensure CORS is configured:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://naturinex-app.onrender.com', '*'],
  credentials: true
}));
```

### 4. Missing Environment Variables ❌
**Symptoms:**
- Some features work, others don't
- Inconsistent behavior

**Solution:**
Create `.env` file in root:
```bash
REACT_APP_FIREBASE_API_KEY=your_actual_key
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step-by-Step Testing Process

### 1. Test with Expo Go
```bash
# Start the app
npm start

# Press 'a' for Android or 'i' for iOS
# Or scan QR code with Expo Go app
```

### 2. Test Each Feature
1. **Test Authentication**
   - Try to sign up with email/password
   - Check Firebase Console > Authentication
   - User should appear there

2. **Test Basic Functionality**
   - Login with test account
   - Try entering "Advil" as medication name
   - Click analyze

3. **Check Console Logs**
   ```bash
   # In terminal running Expo
   # Look for error messages
   ```

### 3. Common Error Messages & Fixes

**"Network request failed"**
- Backend server is down
- Wrong API URL
- CORS not configured

**"Permission denied"**
- Firestore rules are too restrictive
- User not authenticated properly

**"Cannot read property 'uid' of null"**
- Authentication state lost
- Need to re-login

## Debug Mode Testing

Add this to your scanning component temporarily:

```javascript
const handleScan = async () => {
  console.log("Starting scan...");
  console.log("API URL:", API_URL);
  console.log("User:", user?.uid);
  
  try {
    const res = await fetch(`${API_URL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationName: medicationName.trim() })
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    
    setSuggestions(data.suggestions);
  } catch (error) {
    console.error("Detailed error:", error);
    alert(`Error: ${error.message}`);
  }
};
```

## Quick Backend Verification

Your backend should have these endpoints:

```javascript
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Suggestion endpoint
app.post('/suggest', async (req, res) => {
  const { medicationName } = req.body;
  // AI logic here
  res.json({ suggestions: "..." });
});

// Stripe endpoints
app.post('/create-checkout-session', async (req, res) => {
  // Stripe logic
});
```

## If Everything Else Fails

1. **Check Backend Logs**
   - Login to Render.com
   - Check your service logs
   - Look for crash or error messages

2. **Test with Postman**
   ```bash
   POST https://naturinex-app.onrender.com/suggest
   Content-Type: application/json
   
   {
     "medicationName": "Advil"
   }
   ```

3. **Minimal Test**
   - Create a simple test without authentication
   - Verify basic API connectivity first

The most common issue is Firebase configuration. Once that's set up correctly, the app should work!