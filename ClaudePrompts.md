
# ClaudePrompts.md – Naturinex Claude Code Task Prompts

This file contains a curated set of Claude CLI prompts for refactoring, securing, and improving the Naturinex app.

---

## 🔁 1. AI Fallback Logic (Gemini → OpenAI)

```bash
edit src/utils/aiSuggest.ts to:
• Use Gemini API as default
• Fallback to OpenAI API if Gemini response is slow, erroring, or empty
• Add timeout wrapper (6 seconds max per call)
• Log fallback reason to Firestore under /logs/aiFallbacks
```

---

## 💳 2. Stripe Webhook Debugging

```bash
edit firebase/functions/stripeWebhook.ts to:
• Validate Stripe signature securely
• Handle subscription.created, updated, and checkout.session.completed
• Log all received events to /logs/stripeEvents/{eventId}
• Update Firestore user’s `isPro: true` if payment successful
• Add error logging if webhook fails
```

---

## 🔐 3. Firestore Security Rules Testing

```bash
edit firebase/firestore.rules to:
• Restrict reads/writes to authenticated users only
• Allow /users/{uid} access only if request.auth.uid == uid
• Only allow /admin/** if user has customClaim isAdmin == true
• Add testable condition for `proScanCount` usage tracking
• Suggest matching unit tests if possible
```

---

## 🧼 4. Code Cleanup and Folder Refactor

```bash
analyze folder structure and:
• Move AI utils into src/utils/ai/
• Group Firestore-related services under src/services/firebase/
• Rename redundant files like `App1.tsx`, `index2.ts` to better names
• Remove unused imports and console.logs across all screens
• Suggest cleaner abstraction for OCR + result display logic
```

---

## 🧪 5. Testing Scripts for OCR + AI

```bash
create test/ocr-ai.test.ts to:
• Mock an image upload with Tesseract.js OCR
• Simulate slow Gemini API response and trigger fallback to OpenAI
• Verify AI result is parsed and logged
• Include mock Firestore user context for isolated testing
```

---

## 📱 6. App Store Metadata + Screens

```bash
generate App Store screenshots and metadata for:
• iOS and Android (light/dark mode)
• Splash screens in 1242x2688, 828x1792, 2048x2732, etc.
• App icon packs (1024x1024, 512x512, rounded square)
• Generate `naturinex/branding/` folder with optimized PNG files
• Metadata: title, subtitle, keywords, privacy policy links
```

---

Last updated: 2025-07-20
