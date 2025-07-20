
# Claude Code Prompts – Expo + EAS Migration for Naturinex (mediscan-app)

These prompts are for use inside Cursor with Claude Code Agent, to help you migrate from Capacitor to Expo, and prepare for iOS testing.

---

## ✅ 1. Convert Capacitor/React project to Expo project

```bash
create a new React Native + Expo project and migrate existing app files from /mediscan-app/:
• Convert existing components to React Native format
• Replace Capacitor plugins with Expo equivalents (camera, file access, barcode scanner)
• Organize folder structure into: /src/components, /src/screens, /src/utils
```

---

## ✅ 2. Setup Expo config and permissions

```bash
edit app.config.js to:
• Set app name to "Naturinex"
• Add iOS bundleIdentifier and Android package
• Include permissions for camera, media library, internet
• Set splash screen and icon
```

---

## ✅ 3. Add EAS Build support

```bash
initialize EAS Build config:
• Create eas.json with build profiles for development, preview, production
• Set distribution to 'internal' for preview testing
• Add ios.simulator = false for production builds
```

---

## ✅ 4. Configure iPhone testing with Expo Go

```bash
edit metro.config.js and package.json to:
• Ensure Expo is properly configured for QR code preview
• Add scripts:
  "start": "expo start",
  "build:ios": "eas build -p ios",
  "submit:ios": "eas submit -p ios"
```

---

## ✅ 5. Migrate Firebase and Stripe logic

```bash
create /src/services/firebase.js and /src/services/stripe.js:
• Move logic from mediscan-app related to auth, scan logging, payments
• Replace web-only SDKs with Firebase JS SDK compatible with React Native
• Secure API keys using .env and expo-constants
```

---

## ✅ 6. Test and fallback logic for AI + OCR

```bash
refactor src/utils/aiSuggest.ts and ocr.ts to:
• Use expo-image-picker to get image
• Send to Gemini Vision API
• Fallback to OpenAI if response is empty
• Log all actions to Firestore logs collection
```

---

## ✅ 7. Optional – App Store readiness

```bash
generate iOS-ready assets:
• icons (1024x1024)
• splash screen (1242x2688 and other sizes)
• app metadata for App Store Connect
• basic .ipa deploy guide for TestFlight using EAS
```

---

Last updated: 2025-07-20
