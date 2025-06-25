# 🧪 Naturinex App - Quick Testing Guide

## 🚀 **IMMEDIATE TESTING CHECKLIST**

### **Prerequisites ✅**
- ✅ Server running on http://localhost:5000
- ✅ Client running on http://localhost:3001 (Updated URL)
- ✅ Firebase security rules deployed
- ✅ All dependencies installed
- ✅ Asset folders created for logos

---

## 📱 **TEST 1: Free Tier Access**

1. **Open App:** http://localhost:3001
2. **Expected:** Homepage loads with Naturinex branding
3. **Test Free Scan:**
   - Enter a medication name (e.g., "Aspirin")
   - Click "Get Natural Alternatives"
   - Should work WITHOUT requiring login
4. **Verify Branding:** All text should show "Naturinex"

---

## 🔐 **TEST 2: User Authentication**

1. **Sign Up/Login:**
   - Click "Sign Up" or login button
   - Use Google authentication
   - Complete onboarding process
2. **Expected:** User dashboard loads successfully
3. **Verify:** User-specific features become available

---

## 🤖 **TEST 3: AI Functionality**

1. **Authenticated Scan:**
   - Enter medication name
   - Select user tier (basic/premium)
   - Click "Get Alternatives"
2. **Expected Results:**
   - AI response appears
   - Response includes natural alternatives
   - Watermark shows "Naturinex" branding

---

## 💳 **TEST 4: Premium Features**

1. **Upgrade Flow:**
   - Go to Profile tab
   - Click "Upgrade to Premium"
   - Test Stripe checkout (use test cards)
2. **Premium Benefits:**
   - Advanced AI analysis
   - No watermarks
   - Permanent storage

---

## 📊 **TEST 5: Admin Features**

1. **Admin Access (if admin email configured):**
   - Login with admin email
   - Access analytics dashboard
   - View user statistics

---

## 🔒 **TEST 6: Security Verification**

1. **Data Protection:**
   - Login as different users
   - Verify users can't see each other's data
2. **Rate Limiting:**
   - Make multiple rapid AI requests
   - Should get rate limited after 10 requests/minute

---

## 🎯 **QUICK HEALTH CHECKS**

### **API Endpoints**
- **Health:** http://localhost:5000/health
- **AI Suggestion:** POST to http://localhost:5000/suggest
- **Stripe Config:** http://localhost:5000/stripe-config

### **Browser Console Checks**
1. Open Developer Tools (F12)
2. Check Console for errors
3. Verify no "Permission denied" errors
4. Check Network tab for failed requests

---

## 🐛 **TROUBLESHOOTING**

### **Issue: App won't load**
```bash
# Check if servers are running
cd c:\Users\maito\mediscan-app\server
npm start

cd c:\Users\maito\mediscan-app\client  
npm start
```

### **Issue: Authentication errors**
- Check Firebase console for auth status
- Verify project ID in firebase.js
- Check browser console for errors

### **Issue: AI not working**
- Verify GEMINI_API_KEY in server/.env
- Check server logs for API errors
- Test health endpoint first

### **Issue: Database errors**
- Verify security rules are deployed
- Check user permissions
- Test with authenticated user

---

## 📈 **SUCCESS INDICATORS**

✅ **Working Correctly:**
- App loads with Naturinex branding
- Free tier scans work without login
- Google authentication works
- AI provides medication alternatives
- Premium upgrade flow works
- User data is properly isolated
- Rate limiting prevents abuse

---

## 🎉 **TESTING COMPLETE!**

If all tests pass, your Naturinex app is:
- **Fully functional** ✅
- **Properly secured** ✅  
- **Ready for users** ✅
- **Production-ready** ✅

---

*Happy testing! 🚀*
