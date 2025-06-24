# Android Emulator Firebase Authentication Fix

## 🔧 Issue: Firebase doesn't accept IP:port format in authorized domains

Firebase authorized domains don't accept formats like `10.0.2.2:3000`. Here are the solutions:

## ✅ Solution 1: Use Computer's IP (RECOMMENDED - WORKS)

### Step 1: Add Authorized Domains in Firebase
Go to Firebase Console → Authentication → Settings → Authorized domains
Add these domains (WITHOUT ports):
- `localhost` ✅ (already added)
- `10.0.0.74` ⚠️ (MUST ADD THIS)

### Step 2: Access App from Android Emulator
- **URL to use:** `http://10.0.0.74:3000`
- **Status:** Will work once you add `10.0.0.74` to Firebase

## ❌ Solution 2: localhost with Port Forwarding (NOT WORKING)

ADB port forwarding was attempted but `http://localhost:3000` is not working in emulator.

## 🎯 IMMEDIATE FIX NEEDED:

**You must add `10.0.0.74` to Firebase authorized domains:**

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Enter: `10.0.0.74` (without :3000)
4. Click "Add"
5. Test with `http://10.0.0.74:3000` in emulator

## 📱 Current Status:
- ✅ **Desktop**: http://localhost:3000 (working)
- ❌ **Android Emulator localhost**: http://localhost:3000 (not working)
- ⚠️ **Android Emulator IP**: http://10.0.0.74:3000 (needs domain authorization)

Set up ADB port forwarding:
```bash
adb reverse tcp:3000 tcp:3000
```
Then access: `http://localhost:3000` in the emulator

## 🎯 Recommended Steps:

1. Cancel the current domain dialog
2. Add `localhost` and `10.0.0.74` (without ports)
3. Access app via `http://10.0.0.74:3000` in Android emulator
4. Test authentication

## 📱 Testing URLs:
- **Desktop**: http://localhost:3000
- **Same Network Mobile**: http://10.0.0.74:3000  
- **Android Emulator**: http://10.0.0.74:3000
