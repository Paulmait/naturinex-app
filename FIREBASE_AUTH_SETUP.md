# Firebase Authentication Setup & Migration Guide

## 🚨 Immediate Fix: Google Sign-in Domain Authorization

### Step 1: Add Authorized Domains in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `naturinex-app`
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Add ALL these domains:
   ```
   localhost
   127.0.0.1
   naturinex-webapp.vercel.app
   naturinex-webapp-*.vercel.app
   naturinex.com
   www.naturinex.com
   naturinex.ai
   www.naturinex.ai
   ```

### Step 2: Configure Google Cloud OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `naturinex-app (398613963385)`
3. Navigate to: **APIs & Services** → **OAuth consent screen**
4. Under "Authorized domains", add the same domains
5. Save changes

### Step 3: Update OAuth Client Configuration
1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click on your Web OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", add:
   ```
   http://localhost:3000
   http://localhost:3002
   https://naturinex-webapp.vercel.app
   https://naturinex.com
   https://naturinex.ai
   ```
4. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/__/auth/handler
   https://naturinex-webapp.vercel.app/__/auth/handler
   https://naturinex.com/__/auth/handler
   https://naturinex.ai/__/auth/handler
   ```

## 📱 Authentication Options (Post Dynamic Links Shutdown)

### Current Authentication Methods (Will Continue Working):
✅ **Email/Password** - No changes needed
✅ **Google Sign-in (OAuth)** - No changes needed
✅ **Apple Sign-in** - No changes needed
✅ **Phone Authentication** - No changes needed

### Affected Feature:
❌ **Email Link Authentication for Mobile Apps** - Will stop working August 25, 2025

### Recommended Migration Strategy:

#### Option 1: Use Standard Email/Password (Recommended)
- Already implemented in your app
- Most reliable and simple
- Add email verification for security

#### Option 2: Implement Magic Links with Custom Solution
```javascript
// Alternative magic link implementation
// Use your backend to generate and verify tokens
const sendMagicLink = async (email) => {
  // Generate secure token
  const token = generateSecureToken();
  
  // Store token in database with expiry
  await storeToken(email, token);
  
  // Send email with custom link
  await sendEmail(email, `https://naturinex.com/auth/verify?token=${token}`);
};
```

#### Option 3: Use Third-Party Auth Providers
- **Auth0** - Full authentication service
- **Supabase Auth** - Open source alternative
- **Clerk** - Modern auth solution
- **NextAuth.js** - For Next.js apps

## 🔒 Current Working Authentication Setup

Your app currently supports:
1. **Email/Password Authentication** ✅
2. **Google OAuth** ✅ (after domain authorization)
3. **Password Reset via Email** ✅

## 📋 Action Items

### Immediate (Do Now):
- [ ] Add domains to Firebase Authorized domains
- [ ] Configure Google Cloud OAuth settings
- [ ] Test Google Sign-in on localhost
- [ ] Deploy and test on Vercel

### Before August 2025:
- [ ] Evaluate if email link auth is needed
- [ ] If yes, implement custom magic link solution
- [ ] Update mobile app authentication if using email links

## 🎯 Testing Checklist

After adding authorized domains, test:
1. Google Sign-in on localhost:3002
2. Google Sign-in on Vercel deployment
3. Email/Password registration
4. Password reset flow

## 📝 Notes

- The Dynamic Links shutdown only affects **email link authentication** for mobile apps
- Standard OAuth and email/password authentication are NOT affected
- Your current setup will continue working without changes
- Only consider migration if you specifically need passwordless email links

## 🔗 Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Dynamic Links Migration Guide](https://firebase.google.com/support/dynamic-links-faq)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)