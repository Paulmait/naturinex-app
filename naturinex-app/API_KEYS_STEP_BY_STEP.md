# 🔑 API KEYS - STEP BY STEP GUIDE
## Getting All Your Keys in Order

---

## 1️⃣ STRIPE KEYS (PAYMENTS)

### Step 1: Access Stripe Dashboard
🔗 **Visit**: https://dashboard.stripe.com/apikeys

### Step 2: Sign In or Sign Up
- If you have an account: **Sign in**
- If you don't: **Click "Sign up"** (takes 2-3 minutes)

### Step 3: Get Your Keys

#### For Testing (Recommended First):
1. Make sure you're in **"Test mode"** (toggle at top of dashboard)
2. You'll see:
   - **Publishable key**: `pk_test_...` (safe to expose)
   - **Secret key**: Click "Reveal test key token" → `sk_test_...` (NEVER expose)

#### For Production (Later):
1. Toggle to **"Live mode"** (top of dashboard)
2. You'll see:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: Click "Reveal live key token" → `sk_live_...`

### What to Copy:
```
Publishable Key: pk_test_51...
Secret Key: sk_test_51...
```

---

## 2️⃣ GOOGLE GEMINI API (AI ANALYSIS)

### Step 1: Access Google AI Studio
🔗 **Visit**: https://makersuite.google.com/app/apikey

### Step 2: Sign In
- Use your Google account
- Accept terms if prompted

### Step 3: Create API Key
1. Click **"Create API Key"**
2. Choose:
   - **"Create API key in new project"** (if first time)
   - Or select existing project
3. **Copy the key** (starts with `AIza...`)

### What to Copy:
```
Gemini API Key: AIzaSy...
```

⚠️ **Important**: Save this key! You won't be able to see it again.

---

## 3️⃣ GOOGLE VISION API (OCR)

### Step 1: Enable Vision API
🔗 **Visit**: https://console.cloud.google.com/apis/library/vision.googleapis.com

1. Select the **same project** you used for Gemini (or create new)
2. Click **"Enable"**
3. Wait 30 seconds for it to activate

### Step 2: Create API Key
🔗 **Visit**: https://console.cloud.google.com/apis/credentials

1. Click **"Create Credentials"** → **"API Key"**
2. **Copy the API key**
3. (Optional) Click **"Restrict Key"**:
   - Under "API restrictions": Select **"Restrict key"**
   - Check **"Cloud Vision API"**
   - Click **"Save"**

### What to Copy:
```
Vision API Key: AIzaSy...
```

💡 **Tip**: You can use the same project for both Gemini and Vision APIs.

---

## 4️⃣ SENTRY DSN (ERROR TRACKING - OPTIONAL)

### Step 1: Create Sentry Account
🔗 **Visit**: https://sentry.io/signup/

1. Sign up (free tier available)
2. Confirm email

### Step 2: Create Project
1. Click **"Create Project"**
2. Select platform: **"React Native"**
3. Set alert frequency: **"Alert me on every new issue"** (recommended)
4. Name your project: **"naturinex"**
5. Click **"Create Project"**

### Step 3: Get DSN
1. You'll see the setup page
2. Copy the **DSN** (looks like: `https://abc123@o123.ingest.sentry.io/456`)
3. Or find it later in: **Settings** → **Projects** → **naturinex** → **Client Keys (DSN)**

### What to Copy:
```
Sentry DSN: https://abc123@o123.ingest.sentry.io/456
```

---

## 📋 QUICK CHECKLIST

As you get each key, check it off:

- [ ] Stripe Publishable Key (pk_test_... or pk_live_...)
- [ ] Stripe Secret Key (sk_test_... or sk_live_...)
- [ ] Google Gemini API Key (AIza...)
- [ ] Google Vision API Key (AIza...)
- [ ] Sentry DSN (https://...) - Optional

---

## 🔒 SECURITY REMINDERS

✅ **Safe to expose** (client-side):
- Stripe Publishable Key (pk_...)
- Supabase Anon Key (already added)
- Supabase URL (already added)

❌ **NEVER expose** (server-side only):
- Stripe Secret Key (sk_...)
- Supabase Service Role Key (already added)
- JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY (already added)

⚠️ **Sensitive** (prefer server-side but can be client-side with restrictions):
- Gemini API Key (restrict by app/domain)
- Vision API Key (restrict by app/domain)

---

## 💾 WHERE TO SAVE

**Option 1**: Password Manager (Recommended)
- 1Password, LastPass, Bitwarden, etc.
- Create a secure note: "Naturinex API Keys"

**Option 2**: Secure File
- Create a file on your computer (NOT in the git repo!)
- Encrypt it or store in a secure location

**Option 3**: Environment Variable Manager
- Tools like Doppler, Vault, AWS Secrets Manager

---

## 🆘 TROUBLESHOOTING

### "I can't find the API keys page"
- Make sure you're logged in
- Check you're on the correct project/account
- Some dashboards have the keys under "Settings" or "Developers"

### "My Gemini key doesn't work"
- Make sure it starts with `AIza`
- Check you've enabled the Generative Language API
- Verify no billing issues (free tier should work)

### "Vision API says 'not enabled'"
- Go to: https://console.cloud.google.com/apis/library/vision.googleapis.com
- Click "Enable" and wait 1-2 minutes
- Try creating the API key again

### "Stripe won't let me get the secret key"
- You might need to verify your email first
- Check you're in the right mode (test vs live)
- Try refreshing the page

---

**When you have each key, come back and paste it in the chat!**

I'll add them to EAS one by one as you get them. 🚀
