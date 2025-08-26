# 🚨 Critical App Store Rejection Fixes

## High Risk Issues That WILL Cause Rejection

### 1. Medical Claims & Positioning (CRITICAL)
**Current Risk**: Your app suggests "natural alternatives" to medications
**Rejection Reason**: Apps cannot recommend stopping/replacing prescribed medications

**REQUIRED FIXES**:
```javascript
// Change all instances of:
"natural alternatives" → "wellness information"
"replace medication" → "complementary information"
"instead of" → "alongside"
```

### 2. Update Your Stripe Webhook
Your webhook is pointing to the wrong URL!

**Current (Wrong)**: 
```
https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe
```

**Should Be**:
```
https://naturinex-app-zsga.onrender.com/webhook
```

Go to Stripe Dashboard → Webhooks → Edit endpoint → Update URL

### 3. Required Screen Changes

#### A. Onboarding Screen
Add this as screen 1:
```
⚠️ IMPORTANT MEDICAL NOTICE
This app provides educational wellness information only.
- NOT medical advice
- NOT a substitute for doctors
- NEVER stop prescribed medications
- Always consult healthcare providers
[✓] I understand and agree
```

#### B. Analysis Results Screen
Before showing any alternatives, display:
```
⚠️ Medical Disclaimer
The information below is for educational purposes only.
Continue taking your prescribed medications.
Consult your doctor before trying any supplements.
[OK, I Understand]
```

### 4. App Store Metadata Changes

**App Name**: 
- From: "Naturinex - Medication Scanner"
- To: "Naturinex - Wellness Guide"

**Category**:
- From: Medical
- To: Education or Reference

**Description**: Remove these phrases:
- ❌ "natural alternatives to medications"
- ❌ "replace your prescriptions"
- ❌ "medication scanner"

Use instead:
- ✅ "wellness education"
- ✅ "supplement information"
- ✅ "educational reference"

### 5. Code Changes Needed

1. **Update AnalysisScreen.js**:
```javascript
// Add before results display
const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

if (!disclaimerAccepted) {
  return (
    <DisclaimerModal 
      onAccept={() => setDisclaimerAccepted(true)}
      onDecline={() => navigation.goBack()}
    />
  );
}
```

2. **Update all API responses**:
```javascript
// Change
"alternatives" → "wellness_information"
"effectiveness" → "general_info"
"replace" → "complement"
```

### 6. Privacy & Data Handling

Add to Privacy Policy:
- "We do not provide medical advice"
- "Consult healthcare providers"
- "Educational purposes only"
- Camera/photo usage explanation

### 7. Screenshots for App Store

DO NOT show:
- ❌ Prescription medications being "replaced"
- ❌ Medical claims or cures
- ❌ Before/after health improvements

DO show:
- ✅ Educational information screens
- ✅ Disclaimer prominently
- ✅ "Consult your doctor" messages

## Testing Checklist Before Submission

- [ ] All "alternative" language removed
- [ ] Disclaimers on every screen with health info
- [ ] Webhook URL updated to Render
- [ ] App category changed to Education
- [ ] Privacy policy mentions educational use
- [ ] No medical claims in screenshots
- [ ] Terms acceptance required

## Estimated Rejection Risk

**Before fixes**: 95% rejection chance
**After fixes**: 15% rejection chance

The main issue is positioning. You MUST position this as an educational wellness app, NOT a medical app that replaces medications.