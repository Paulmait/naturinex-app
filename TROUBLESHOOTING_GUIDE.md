# Troubleshooting Guide - Naturinex App

## Common Issues and Solutions

### 1. "Analysis Error" When Scanning or Entering Medication Name

**Problem**: The app shows "Analysis failed" error when trying to analyze medications.

**Solutions**:

#### A. Check if Backend Server is Running
1. The backend server must be running for the app to work
2. Start the server locally:
   ```bash
   cd server
   npm install
   node index.js
   ```
3. You should see:
   ```
   🚀 Server running on port 5000
   📊 Health check available at http://localhost:5000/health
   ```

#### B. Verify API URL Configuration
1. For local development, the app should point to `http://localhost:5000`
2. Check `app.json` and look for `apiUrl` in the `extra` section
3. For local testing with your phone's IP:
   ```json
   "apiUrl": "http://YOUR_COMPUTER_IP:5000"
   ```
   Example: `"apiUrl": "http://192.168.1.100:5000"`

#### C. Check Gemini API Key
1. Open `server/.env`
2. Ensure `GEMINI_API_KEY` is set to a valid Google AI API key
3. Get a free API key from: https://makersuite.google.com/app/apikey

#### D. Network Issues
- If testing on physical device, ensure phone and computer are on same network
- Disable firewall temporarily to test
- Try using ngrok for secure tunnel:
  ```bash
  ngrok http 5000
  ```
  Then update apiUrl to the ngrok URL

### 2. Camera Issues

**Problem**: Camera doesn't work or shows errors

**Solutions**:
- The app now uses a simplified camera screen with three options:
  1. Take Photo - Uses device camera
  2. Choose from Gallery - Pick existing photo
  3. Type Name - Manual entry

### 3. Server Not Starting

**Problem**: Server fails to start

**Solutions**:
1. Check for missing environment variables:
   ```
   ❌ Missing required environment variables: ['GEMINI_API_KEY']
   ```
2. Copy `.env.example` to `.env` and fill in values
3. Install dependencies:
   ```bash
   cd server
   npm install
   ```

### 4. CORS Errors

**Problem**: "CORS policy" errors in console

**Solutions**:
1. The server is configured to accept requests from common local addresses
2. If using a different port/IP, add it to server's CORS configuration
3. In `server/index.js`, find the CORS section and add your origin

### 5. Firebase Errors

**Problem**: Firebase-related errors

**Solutions**:
1. Ensure Firebase project exists
2. Enable Authentication in Firebase Console
3. For guest mode, the app works without Firebase authentication
4. Firebase is optional for basic functionality

## Testing Checklist

### Before Testing:
- [ ] Server is running (`node server/index.js`)
- [ ] Gemini API key is configured in `server/.env`
- [ ] App is pointing to correct API URL
- [ ] Phone and computer on same network (if testing on device)

### Test Flow:
1. **Start Server**:
   ```bash
   cd server
   node index.js
   ```

2. **Start App**:
   ```bash
   cd ..
   npm start
   ```

3. **Test Features**:
   - Skip login (guest mode)
   - Type medication name (e.g., "Ibuprofen")
   - View analysis results
   - Check if natural alternatives appear

## Production Deployment

### Deploy Server to Render:
1. Push code to GitHub
2. Connect Render to your repo
3. Set environment variables in Render dashboard:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
4. Deploy and get URL
5. Update `app.json` with production API URL

### Deploy App:
1. Update `apiUrl` in `app.json` to production server URL
2. Build with EAS:
   ```bash
   eas build --platform all
   ```

## Quick Fixes

### Reset Everything:
```bash
# Clear caches
npm cache clean --force
cd ios && pod cache clean --all
cd ..
watchman watch-del-all

# Reinstall
rm -rf node_modules
npm install
cd ios && pod install
cd ..

# Start fresh
npm start --reset-cache
```

### Test API Manually:
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test analysis endpoint
curl -X POST http://localhost:5000/api/analyze/name \
  -H "Content-Type: application/json" \
  -d '{"medicationName":"Aspirin"}'
```

## Support

If issues persist:
1. Check server logs for error details
2. Use browser DevTools to inspect network requests
3. Enable debug mode in app for more logging
4. Check GitHub issues for similar problems