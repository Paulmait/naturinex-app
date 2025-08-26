# 🚨 URGENT: Fix Firebase Errors on Render

## The Issue:
Your deployed server is showing Firebase errors: "Unable to detect a Project Id"

## Quick Fix - Add Missing Environment Variables to Render:

### 1. Go to Render Dashboard:
https://dashboard.render.com/

### 2. Click on your service: `naturinex-app`

### 3. Go to "Environment" tab

### 4. Check if these are present:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 5. If missing, add them:

```
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[YOUR PRIVATE KEY HERE]\n-----END PRIVATE KEY-----\n
```

## Important Notes:

1. **Private Key Format**: 
   - Must include the BEGIN/END headers
   - Replace actual newlines with `\n`
   - Should be one long string

2. **Get Private Key from**:
   - Your local `server/.env` file
   - Or from Firebase Console → Project Settings → Service Accounts

3. **After Adding**:
   - Click "Save Changes"
   - Service will auto-redeploy
   - Check logs for "Firebase Admin initialized with service account"

## Verify Fix:
After deployment, test the analyze endpoint again. The errors should be gone.

## Alternative: Disable Firebase Temporarily
If you want to deploy without Firebase for now, you can set:
```
DISABLE_FIREBASE=true
```
This will skip Firebase initialization entirely.