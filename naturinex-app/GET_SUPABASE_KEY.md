# 🔑 How to Get Your Supabase Anon Key

## 📍 Quick Instructions

### Step 1: Go to Supabase Dashboard
Visit: **https://supabase.com/dashboard**

### Step 2: Select Your Project
Click on: **`naturinex-app`** project

### Step 3: Navigate to API Settings
1. Left sidebar → Click **Settings** (⚙️ icon)
2. Click **API** section

### Step 4: Copy the Anon Key
You'll see a section called **Project API keys**:

```
┌─────────────────────────────────────────────────────────┐
│ Project API keys                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ anon public                                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...   │  ← COPY THIS
│ [Copy]                                                  │
│                                                          │
│ ─────────────────────────────────────────────────────   │
│                                                          │
│ service_role                                            │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...   │  ← DO NOT USE THIS
│ [Copy]                                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANT:**
- ✅ Copy the **"anon public"** key (first one)
- ❌ DO NOT use the **"service_role"** key (that's a server secret!)

### Step 5: Add to .env.local
1. Open: `C:\Users\maito\mediscan-app\naturinex-app\.env.local`
2. Find line 34: `REACT_APP_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE`
3. Replace `PASTE_YOUR_ANON_KEY_HERE` with your copied key

**Example:**
```bash
# Before:
REACT_APP_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE

# After:
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

### Step 6: Save the File
Press **Ctrl+S** to save `.env.local`

---

## 🧪 Test Database Connection

After adding the key, run this test:

```bash
node test-database-local.js
```

**Expected Output:**
```
✅ Database is accessible
✅ Successfully read data
📊 Total profiles in database: X
📊 Total scans in database: Y
✅ Auth service is accessible
```

---

## 🎯 What You Should Have in .env.local

After adding the key, your `.env.local` should look like this:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=398613963385
REACT_APP_FIREBASE_APP_ID=1:398613963385:web:91b3c8e67976c252f0aaa8

# Backend API
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_51QTj9RRq...

# Google OAuth
REACT_APP_GOOGLE_WEB_CLIENT_ID=398613963385-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com

# Support
REACT_APP_SUPPORT_EMAIL=guampaul@gmail.com

# Supabase (NEW - ADD YOUR KEY)
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← YOUR KEY HERE
REACT_APP_API_URL_SUPABASE=https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1
```

---

## 🔍 Visual Guide

### Screenshot Reference:

```
Supabase Dashboard
  └── naturinex-app project
      └── Settings (left sidebar)
          └── API
              └── Project API keys
                  ├── anon public       ← COPY THIS ONE ✅
                  └── service_role      ← DO NOT USE ❌
```

---

## ✅ Checklist

- [ ] Go to https://supabase.com/dashboard
- [ ] Select naturinex-app project
- [ ] Click Settings → API
- [ ] Copy "anon public" key
- [ ] Open `.env.local` file
- [ ] Paste key on line 34
- [ ] Save file (Ctrl+S)
- [ ] Run test: `node test-database-local.js`

---

## 🎯 After Adding the Key

Once you add the key, I can run the complete database test to verify:

1. ✅ Database connection works
2. ✅ Can read user profiles
3. ✅ Can read medication scans
4. ✅ Can access all tables
5. ✅ Auth service working
6. ✅ Real-time subscriptions enabled

---

## 📞 Need Help?

If you can't find the anon key:

1. Make sure you're logged into Supabase
2. Verify you're in the correct project (naturinex-app)
3. Check you have access permissions to the project
4. The key should start with `eyJhbG...`

---

**File Location:**
```
C:\Users\maito\mediscan-app\naturinex-app\.env.local
```

**Line to Edit:**
```
Line 34: REACT_APP_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE
```

**Once you add the key, tell me and I'll run the complete database test!** 🚀
