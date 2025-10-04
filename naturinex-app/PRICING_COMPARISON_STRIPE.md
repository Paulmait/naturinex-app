# 🎯 NATURINEX PRICING - ADVERTISED VS STRIPE VERIFICATION

**Date:** 2025-10-04
**Purpose:** Ensure advertised pricing matches Stripe configuration

---

## 📊 **ADVERTISED PRICING (What Users See)**

### **FREE PLAN - $0/month**
**Advertised Features:**
- ✅ 5 medication scans per month
- ✅ Basic medication information
- ✅ Save up to 10 searches
- ✅ Text-based search only
- ✅ 3 natural alternatives per scan
- ❌ No data saving (privacy-focused)
- ❌ No export capability

**From:** `src/web/pages/WebSubscription.js` (Lines 95-100)

---

### **PREMIUM PLAN - $9.99/month**
**Advertised Features (WebSubscription.js):**
- ✅ Unlimited medication lookups
- ✅ Detailed medication analysis from AI
- ✅ OCR text extraction from images
- ✅ Export search history to CSV
- ✅ Save unlimited search history
- ✅ Ad-free experience
- ✅ Early access to new features

**From:** `src/web/pages/WebSubscription.js` (Lines 86-94, Line 228)

**Payment Page Shows:** `src/components/PremiumCheckout.js` (Line 100)
- Price: **$9.99/month**

---

## 📋 **DETAILED PRICING CONFIGURATION**

### **From `src/config/pricing.js`:**

### **1. FREE TIER**
```javascript
FREE: {
  price: 0,
  scansPerMonth: 5,
  saveHistory: false,  // NO DATA SAVING
  dataRetention: 'Not saved',
  basicAnalysis: true,
  aiInsights: false,
  naturalAlternatives: 3,  // Limited to 3
  exportReports: false,
}
```

### **2. PLUS TIER - $6.99/month or $69.99/year**
```javascript
PLUS: {
  price: {
    monthly: 6.99,
    yearly: 69.99,
  },
  stripePriceIds: {
    monthly: 'price_naturinex_plus_monthly',
    yearly: 'price_naturinex_plus_yearly',
  },
  scansPerMonth: 100,
  saveHistory: true,  // 1 YEAR DATA RETENTION
  dataRetention: '1 year',
  dataRetentionDays: 365,
  aiInsights: true,
  naturalAlternatives: -1,  // UNLIMITED
  exportReports: true,
  customReports: true,
  dosageCalculator: true,
  interactionChecker: true,
}
```

### **3. PRO TIER - $12.99/month or $129.99/year**
```javascript
PRO: {
  price: {
    monthly: 12.99,
    yearly: 129.99,
  },
  stripePriceIds: {
    monthly: 'price_naturinex_pro_monthly',
    yearly: 'price_naturinex_pro_yearly',
  },
  scansPerMonth: -1,  // UNLIMITED
  saveHistory: true,  // PERMANENT DATA STORAGE
  dataRetention: 'Forever',
  aiInsights: true,
  naturalAlternatives: -1,
  exportReports: true,
  consultations: 2,  // 2 per month included
  familySharing: true,  // Up to 5 accounts
  prioritySupport: true,
  apiAccess: true,
  bulkExport: true,
}
```

---

## ⚠️ **PRICING DISCREPANCY FOUND!**

### **ISSUE: Website Shows $9.99, But Config Has 3 Tiers**

**WebSubscription.js shows:**
- Premium: **$9.99/month** (Lines 228)

**pricing.js has:**
- Plus: **$6.99/month**
- Pro: **$12.99/month**
- No "$9.99" tier defined!

### **Which Tier is "Premium" referring to?**

---

## 🔍 **STRIPE PRICE IDS TO VERIFY**

You need to verify these in your Stripe Dashboard:

### **For PLUS Tier ($6.99/month):**
```
Monthly: price_naturinex_plus_monthly
Yearly: price_naturinex_plus_yearly
```

### **For PRO Tier ($12.99/month):**
```
Monthly: price_naturinex_pro_monthly
Yearly: price_naturinex_pro_yearly
```

### **Current "Premium" ($9.99/month):**
- ❓ No Stripe Price ID defined in code
- ❓ May be using old/deprecated pricing

---

## 💡 **RECOMMENDED ACTIONS**

### **Option 1: Update Website to Match Config**
Change `WebSubscription.js` to offer both tiers:

**PLUS - $6.99/month:**
- 100 scans/month
- 1 year data retention
- AI insights
- Unlimited alternatives
- Export reports

**PRO - $12.99/month:**
- Unlimited scans
- Permanent data storage
- 2 consultations/month
- Family sharing (5 accounts)
- Priority support
- API access

### **Option 2: Simplify to Single Premium Tier**
Keep $9.99/month but update `pricing.js`:

```javascript
PREMIUM: {
  price: {
    monthly: 9.99,
    yearly: 99.99,
  },
  stripePriceIds: {
    monthly: 'price_naturinex_premium_monthly',
    yearly: 'price_naturinex_premium_yearly',
  },
  // Features from WebSubscription.js
  scansPerMonth: -1,  // Unlimited
  saveHistory: true,
  aiInsights: true,
  ocrExtraction: true,
  exportReports: true,
}
```

---

## 🎯 **STRIPE DASHBOARD VERIFICATION CHECKLIST**

### **Step 1: Check Existing Products**
Go to Stripe Dashboard → Products

Verify you have products for:
- [ ] Naturinex Plus Monthly ($6.99/month)
- [ ] Naturinex Plus Yearly ($69.99/year)
- [ ] Naturinex Pro Monthly ($12.99/month)
- [ ] Naturinex Pro Yearly ($129.99/year)

OR (if using single premium tier):
- [ ] Naturinex Premium Monthly ($9.99/month)
- [ ] Naturinex Premium Yearly ($99.99/year)

### **Step 2: Verify Price IDs**
For each product, copy the **Price ID** (starts with `price_`)

**Current Price IDs in code:**
```javascript
// PLUS Tier
monthly: 'price_naturinex_plus_monthly'  // ← Verify this exists
yearly: 'price_naturinex_plus_yearly'    // ← Verify this exists

// PRO Tier
monthly: 'price_naturinex_pro_monthly'   // ← Verify this exists
yearly: 'price_naturinex_pro_yearly'     // ← Verify this exists
```

### **Step 3: Match Features to Stripe Metadata**
In Stripe, add metadata to each price:

**For Plus ($6.99/month):**
```
scans_per_month: 100
data_retention_days: 365
ai_insights: true
natural_alternatives: unlimited
export_reports: true
```

**For Pro ($12.99/month):**
```
scans_per_month: unlimited
data_retention: permanent
consultations_per_month: 2
family_sharing: 5
priority_support: true
api_access: true
```

---

## 🎨 **IN-APP PURCHASES (Additional Revenue)**

From `pricing.js`:

### **One-Time Purchases:**

1. **Detailed Report - $0.99**
   - Stripe Price ID: `price_detailed_report`
   - Comprehensive PDF with citations

2. **Expert Consultation - $19.99**
   - Stripe Price ID: `price_expert_consultation`
   - 30-minute video with naturopath

3. **Custom Protocol - $9.99**
   - Stripe Price ID: `price_custom_protocol`
   - Personalized natural medication plan

4. **Priority Analysis - $2.99**
   - Stripe Price ID: `price_priority_analysis`
   - Skip the queue

5. **Interaction Check - $1.99**
   - Stripe Price ID: `price_interaction_check`
   - Drug-herb interaction checker

**Action:** Verify these products exist in Stripe Dashboard

---

## 🎁 **PROMOTIONAL CAMPAIGNS**

From `pricing.js`:

### **Active Promotions:**

1. **New Year 2025 - 40% off**
   - Code: `NATURAL2025`
   - Valid until: Feb 1, 2025
   - Applies to: Yearly plans only

2. **First Time User - 50% off**
   - Code: `WELCOME50`
   - Valid for: 30 days after signup
   - Applies to: First month only

3. **Friend Referral - 1 month free**
   - Code: `FRIEND`
   - Both users get reward

**Action:** Create these coupon codes in Stripe Dashboard

---

## 🔐 **WEBHOOK VERIFICATION**

### **Required Stripe Webhooks:**

Your backend should be listening for:

1. **`checkout.session.completed`**
   - When user completes payment
   - Update Firestore: `subscriptionType`, `subscriptionStartDate`

2. **`customer.subscription.created`**
   - New subscription started
   - Store `stripeCustomerId`, `stripeSubscriptionId`

3. **`customer.subscription.deleted`**
   - User cancelled subscription
   - Update to 'free' tier

4. **`invoice.payment_succeeded`**
   - Recurring payment successful
   - Extend subscription period

5. **`invoice.payment_failed`**
   - Payment failed
   - Notify user, retry payment

**Webhook Endpoint:**
- Should be: `https://naturinex-app-zsga.onrender.com/api/stripe-webhook`
- OR: `https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/stripe-webhook`

---

## ✅ **WHAT TO VERIFY IN STRIPE DASHBOARD**

### **1. Products Match Advertised Pricing** ✅
- [ ] Check if products exist
- [ ] Verify prices are correct ($6.99, $12.99 OR $9.99)
- [ ] Confirm billing intervals (monthly/yearly)

### **2. Price IDs Match Code** ✅
- [ ] Copy Price IDs from Stripe
- [ ] Update `pricing.js` if needed
- [ ] Test checkout flow

### **3. Metadata Matches Features** ✅
- [ ] Add metadata to each price
- [ ] Include scan limits, features
- [ ] Makes it easy to verify user access

### **4. Webhooks Are Active** ✅
- [ ] Configure webhook endpoint
- [ ] Select all subscription events
- [ ] Get webhook signing secret
- [ ] Add to environment variables

### **5. Coupons Are Created** ✅
- [ ] Create `NATURAL2025` (40% off)
- [ ] Create `WELCOME50` (50% off)
- [ ] Create `FRIEND` (1 month free)
- [ ] Set expiration dates

---

## 🎯 **RECOMMENDED STRIPE CONFIGURATION**

### **Product 1: Naturinex Plus**
- **Monthly:** $6.99/month (Price ID: `price_naturinex_plus_monthly`)
- **Yearly:** $69.99/year (Price ID: `price_naturinex_plus_yearly`)
- **Metadata:**
  ```
  tier: plus
  scans_per_month: 100
  data_retention_days: 365
  features: ai_insights,export_reports,custom_reports
  ```

### **Product 2: Naturinex Pro**
- **Monthly:** $12.99/month (Price ID: `price_naturinex_pro_monthly`)
- **Yearly:** $129.99/year (Price ID: `price_naturinex_pro_yearly`)
- **Metadata:**
  ```
  tier: pro
  scans_per_month: unlimited
  data_retention: permanent
  features: all_plus_features,consultations,family_sharing,priority_support,api_access
  consultations_per_month: 2
  family_accounts: 5
  ```

---

## 🚨 **CRITICAL ISSUE TO FIX**

### **WebSubscription.js shows $9.99 but pricing.js doesn't have this tier!**

**You need to decide:**

**A) Update Website to show both tiers:**
- Plus: $6.99/month
- Pro: $12.99/month

**B) Update pricing.js to match website:**
- Single Premium tier: $9.99/month
- Simplify the offering

**C) Use $9.99 as a middle tier:**
- Plus: $6.99/month (100 scans, 1 year retention)
- Premium: $9.99/month (unlimited scans, 1 year retention)
- Pro: $12.99/month (unlimited scans, permanent storage, family)

---

## 📝 **STRIPE PRICE IDS YOU NEED TO CREATE**

If you don't have these in Stripe, create them:

```bash
# Stripe CLI commands (if using CLI)
stripe prices create \
  --product prod_xxxxx \
  --unit-amount 699 \
  --currency usd \
  --recurring interval=month \
  --lookup-key price_naturinex_plus_monthly

stripe prices create \
  --product prod_xxxxx \
  --unit-amount 6999 \
  --currency usd \
  --recurring interval=year \
  --lookup-key price_naturinex_plus_yearly
```

---

## ✅ **FINAL RECOMMENDATION**

### **Immediate Actions:**

1. **Decide on Pricing Strategy**
   - Stick with $9.99 Premium OR
   - Use 2-tier ($6.99 Plus + $12.99 Pro)

2. **Update Code to Match**
   - If keeping $9.99: Update `pricing.js`
   - If using 2-tier: Update `WebSubscription.js`

3. **Verify in Stripe**
   - Check products exist
   - Confirm Price IDs
   - Test checkout flow

4. **Add Webhook Secret**
   - Get from Stripe Dashboard
   - Add to environment variables
   - Test webhook delivery

5. **Test Complete Flow**
   - Sign up → Upgrade → Payment → Access features
   - Verify user gets correct tier
   - Check Firestore updates correctly

---

**Created:** 2025-10-04
**Status:** ⚠️ **PRICING MISMATCH DETECTED - NEEDS VERIFICATION**
**Next Step:** Check Stripe Dashboard and decide on pricing strategy
