# Web App Functionality Checklist

## 🔍 Features to Test on https://naturinex.com

### 1. ✅ Homepage (/)
- [ ] Page loads without errors
- [ ] Navigation bar displays correctly
- [ ] "Get Started" button → redirects to login
- [ ] "Start Free" button → redirects to login
- [ ] Pricing plans display (Free and Premium)
- [ ] Features section shows all 6 features with icons

### 2. 🔐 Authentication (/login)
- [ ] Sign Up with email/password
- [ ] Sign In with existing account
- [ ] Google Sign-In button (may not work without Google OAuth setup)
- [ ] Password reset link
- [ ] Toggle between Sign Up and Sign In
- [ ] Error messages display properly
- [ ] Successful login → redirects to Dashboard

### 3. 📊 Dashboard (/dashboard)
- [ ] Welcome message displays
- [ ] Recent scans section
- [ ] Quick stats cards
- [ ] "New Scan" button works
- [ ] Navigation to other sections

### 4. 💊 Scan Feature (/scan)
- [ ] Upload image button
- [ ] Text input option
- [ ] Camera option (web camera)
- [ ] Scan submission works
- [ ] Results display with medication info
- [ ] Save scan to history

### 5. 📜 History (/history)
- [ ] List of previous scans
- [ ] Search functionality
- [ ] Filter options
- [ ] View scan details
- [ ] Delete scan option
- [ ] Export/Download feature

### 6. 💳 Subscription (/subscription)
- [ ] Current plan displays
- [ ] Upgrade button (if on Free plan)
- [ ] Cancel button (if on Premium)
- [ ] Payment processing with Stripe
- [ ] Subscription status updates

### 7. 👤 Profile (/profile)
- [ ] User information displays
- [ ] Edit profile option
- [ ] Change password
- [ ] Notification settings
- [ ] Delete account option
- [ ] Sign out button

### 8. 📱 Responsive Design
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Navigation menu adapts to screen size

## 🔧 API Endpoints to Verify

Backend should be running at: https://naturinex-app-zsga.onrender.com

### Health Check
```bash
curl https://naturinex-app-zsga.onrender.com/api/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

### Analyze Medication (requires API key)
```bash
curl -X POST https://naturinex-app-zsga.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"aspirin"}'
```

## 🚨 Common Issues & Solutions

### Issue 1: Firebase Auth Error
**Error**: `auth/api-key-not-valid`
**Solution**: Add Firebase environment variables to Vercel with `REACT_APP_` prefix

### Issue 2: Blank Page
**Cause**: JavaScript error during initialization
**Solution**: Check browser console for errors, usually missing env vars

### Issue 3: API Calls Fail
**Cause**: Backend not running or wrong URL
**Solution**: Verify backend is live at Render

### Issue 4: Styling Missing
**Cause**: CSS not loading properly
**Solution**: Hard refresh (Ctrl+Shift+R)

### Issue 5: Payment Not Working
**Cause**: Stripe keys not configured
**Solution**: Add Stripe public key to Vercel env vars

## 📝 About Vercel Environment Variables

### Variables to KEEP in Vercel:
✅ All variables starting with `REACT_APP_` (frontend variables)

### Variables you can REMOVE from Vercel:
These are backend variables that belong in Render, not Vercel:
- ❌ FIREBASE_CLIENT_EMAIL
- ❌ STRIPE_PRICE_BASIC_A_ANNUAL
- ❌ STRIPE_PRICE_BASIC_A_MONTHLY
- ❌ STRIPE_PRICE_BASIC_B_ANNUAL
- ❌ STRIPE_PRICE_BASIC_B_MONTHLY
- ❌ STRIPE_PRICE_BASIC_C_ANNUAL
- ❌ STRIPE_PRICE_BASIC_C_MONTHLY

**Answer**: YES, you can delete these from Vercel. They're not used by the frontend.

## 🎯 Quick Test Sequence

1. **Visit**: https://naturinex.com
2. **Click**: "Get Started" button
3. **Sign Up**: Create a test account
4. **Dashboard**: Should load after signup
5. **Scan**: Try the text input with "aspirin"
6. **History**: Check if scan was saved
7. **Profile**: Verify user info displays
8. **Sign Out**: Test logout functionality

## ✅ If Everything Works:
- All pages load without errors
- Authentication works (sign up/in/out)
- Scan feature processes medication names
- History saves and displays scans
- Profile shows user information

## ❌ If Something Doesn't Work:
1. Open browser console (F12)
2. Check for red error messages
3. Most issues are from missing environment variables
4. Verify backend is running at Render
5. Check network tab for failed API calls