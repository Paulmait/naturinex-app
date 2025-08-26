# Quick App Store Connect Checklist

## Fill These Fields Now:

### 1. App Information Tab
- ✅ Name: Naturinex Wellness Guide
- ✅ Subtitle: Natural Product Scanner & Info
- **Primary Category**: Medical
- **Content Rights**: Click "Set Up" → No → Yes

### 2. Pricing Tab
- **Price**: Free (Tier 0)

### 3. App Privacy Tab
- **Privacy Policy URL**: https://naturinex.com/privacy-policy
- Click "Get Started" on questionnaire
- Data Collection: Yes
- Select: Identifiers, Usage Data
- Link to User: None
- Tracking: No

### 4. Prepare for Submission Tab
Once build completes:
- **Build**: Select your new build
- **Screenshots**: Already in assets/app-store-screenshots/
- **Description**: Copy from APP_STORE_LISTING.md
- **Keywords**: natural wellness,ingredient scanner,product analyzer,wellness guide,supplement info
- **Support URL**: https://naturinex.com/support
- **Marketing URL**: https://naturinex.com

### 5. Age Rating
Already set to 17+ ✅

### 6. Review Information
- **Demo account**: Not required
- **Notes**: "Age verification and medical disclaimer shown on first launch"

## Build Status Command:
```bash
eas build:list --platform ios --limit 1
```

## Once Build Completes:
```bash
eas submit --platform ios --profile production
```