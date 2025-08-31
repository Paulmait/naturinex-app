# URGENT: Manual Fix Required in Render Dashboard

## The Problem
Render is ignoring our `render.yaml` configuration and using cached/old settings. The phantom file `/opt/render/project/src/server/tier-middleware.js` doesn't exist in our repository but Render keeps trying to load it.

## Manual Fix Steps

### Option 1: Update Settings in Render Dashboard (Recommended)

1. **Go to your Render Dashboard:**
   https://dashboard.render.com/web/srv-d1s36m0dl3ps738vve30

2. **Click on "Settings" tab**

3. **Update Build Command:**
   ```bash
   rm -rf src && cd server && npm install
   ```

4. **Update Start Command:**
   ```bash
   cd server && node index.js
   ```

5. **Click "Save Changes"**

6. **Manual Deploy:**
   - Click "Manual Deploy" → "Deploy latest commit"

### Option 2: Clear Build Cache and Redeploy

1. **In Render Dashboard:**
   - Go to Settings
   - Scroll to "Build & Deploy"
   - Click "Clear build cache"
   
2. **Then trigger new deployment:**
   - Manual Deploy → Deploy latest commit

### Option 3: Create New Service (Nuclear Option)

If the above doesn't work, the service might be corrupted:

1. **Create a new Web Service in Render**
2. **Use these settings:**
   - **GitHub Repo:** https://github.com/Paulmait/naturinex-app
   - **Branch:** master
   - **Root Directory:** Leave empty
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && node index.js`

3. **Copy all environment variables** from old service to new one

4. **Delete the old service** once new one is working

## Why This Is Happening

The error shows:
```
/opt/render/project/src/server/tier-middleware.js:148
```

But our actual server files are in `/opt/render/project/server/`, not `/opt/render/project/src/server/`.

This phantom file path suggests:
1. Render has cached an old build
2. Dashboard settings are overriding render.yaml
3. There's a deployment configuration mismatch

## Verification After Fix

Once deployed successfully, test with:

```bash
# Check if server is healthy
curl https://naturinex-app.onrender.com/health

# Test AI functionality
curl -X POST https://naturinex-app.onrender.com/suggest \
  -H "Content-Type: application/json" \
  -d '{"medicationName":"Aspirin","userId":"test"}'

# Check environment variables (if endpoint deploys)
curl https://naturinex-app.onrender.com/api/env-check/check-naturinex-2025
```

## Current Repository Structure (Correct)

```
/
├── server/           # ← Server files are here
│   ├── index.js     # ← Main server file
│   ├── package.json
│   └── ...
├── src/             # ← Client/React Native files
│   ├── services/
│   ├── screens/
│   └── ...
├── render.yaml      # ← Deployment config (being ignored?)
└── package.json     # ← Client package.json
```

## The Phantom File
The file `/opt/render/project/src/server/tier-middleware.js` that Render is trying to load:
- **Does NOT exist** in our repository
- Has **never existed** in our commit history
- Is likely from a **cached or corrupted build**

## Contact Render Support

If manual fixes don't work, contact Render support with:
- Service ID: srv-d1s36m0dl3ps738vve30
- Issue: Phantom file causing deployment failure
- File: `/opt/render/project/src/server/tier-middleware.js` (doesn't exist)
- Request: Clear all caches and rebuild from scratch

---

**Updated:** August 31, 2025
**Priority:** CRITICAL - Deployment Blocked