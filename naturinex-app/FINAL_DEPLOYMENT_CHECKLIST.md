# ✅ FINAL DEPLOYMENT CHECKLIST

## 1. Stripe Webhook Events ✅
**Add these events in Stripe Dashboard:**
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- charge.refund.updated
- checkout.session.async_payment_succeeded

**How**: Stripe Dashboard > Webhooks > Your endpoint > Update details > Select events

## 2. Firebase Service Account 🔑
**Get from Firebase Console:**
1. Go to **Service accounts** tab
2. Click **"Generate new private key"**
3. Download JSON file
4. Extract these values:
   - `client_email` → FIREBASE_CLIENT_EMAIL
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `project_id` → FIREBASE_PROJECT_ID (already have: naturinex-app)

**Add to server/.env:**
```env
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## 3. Other Required ENV Variables
```env
# Gemini API (for medication analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB (already have)
MONGODB_URI=mongodb+srv://...

# Stripe (already have)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Deploy Server to Render
1. Push changes to GitHub
2. Add Firebase env vars to Render
3. Wait for deployment
4. Test endpoints

## 5. Client Side Updates
```bash
# Update Expo SDK
npm install expo@~52.0.0
npx expo install --fix

# Test locally
npx expo start -c
```

## 6. App Store Credentials
1. Apple Developer Account ($99/year)
2. Update eas.json with real Apple ID
3. Host privacy/terms on GitHub Pages

## 7. Final Testing
- [ ] Guest user gets 3 free scans
- [ ] Subscription upgrade works
- [ ] Stripe webhooks process
- [ ] Firebase data saves
- [ ] Camera captures photos
- [ ] Analysis returns results

## 🚀 Ready to Deploy!
Once all boxes checked, run:
```bash
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
```

## Timeline
- Today: Firebase + Stripe setup (1 hour)
- Tomorrow: SDK update + credentials (2 hours)
- Day 3: Build and submit (1 hour)
- Day 4-5: App store review

**You're 90% done! Just need credentials and hosting.**