# CRITICAL: Render Platform Issue - Phantom File

## Issue Summary
Render is trying to load a file that **DOES NOT EXIST** in the repository:
```
/opt/render/project/src/server/tier-middleware.js
```

This file:
- Has NEVER existed in the repository
- Is not in any commit history
- Persists even after:
  - Clearing cache
  - Creating new service
  - Rolling back to working commit
  - Removing all potentially problematic files

## Evidence
- Last working deployment: commit e6d8347 at 12:32 PM
- Same code now fails with phantom file error
- Error persists across multiple services
- Using wrong Node version (24.7.0 instead of specified)

## Contact Render Support IMMEDIATELY

### Support Ticket Template:
```
Subject: CRITICAL - Phantom file causing all deployments to fail

Service IDs: 
- srv-d1s36m0dl3ps738vve30 (original)
- srv-d2q8voh5pdvs73dnv0rg (new)

Issue:
All deployments are failing with an error about a file that doesn't exist:
/opt/render/project/src/server/tier-middleware.js

This file has NEVER existed in our repository. The error started appearing suddenly after 12:32 PM today. Even rolling back to previously working commits fails with the same error.

The deployments are also using Node 24.7.0 despite our .node-version file specifying 20.11.0.

This appears to be a corrupted cache or build artifact on Render's platform.

Please:
1. Completely purge all caches for both services
2. Force rebuild from scratch
3. Investigate why phantom files are being cached

This is blocking all deployments and is critical for our production service.
```

## Temporary Workaround

While waiting for Render support:

1. **Use a Different Hosting Service**
   - Deploy to Heroku, Railway, or Fly.io temporarily
   - Your code is working, it's Render that's broken

2. **Fork Your Repository**
   - Fork to a new GitHub repo
   - Deploy from the fork (might bypass cache)

3. **Create Dummy File to Match**
   - Create `src/server/tier-middleware.js` with minimal content
   - This is a hack but might unblock you

## The Real Problem

Render has either:
1. A corrupted build cache that persists across services
2. A platform bug in their build system
3. Some global cache that's affecting your account

This is NOT a code issue - your code was working at 12:32 PM and the exact same code is failing now.