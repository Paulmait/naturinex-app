# Naturinex Features Documentation

## Subscription Tiers

### Free Account ($0/month)
- **3 scans per month**
- Basic natural alternatives (2 per scan)
- Basic analysis without dosage recommendations
- No scan history saved
- No PDF export
- Single device only
- Screenshots blocked (upgrade CTA shown)
- Sharing blocked (upgrade CTA shown)

### Premium ($9.99/month or $99.99/year - Save $19.89, 2 months free!)
- **25 scans per month** (10 per day max)
- Full scan history (1 year retention)
- Use on up to **3 devices**
- Screenshots allowed
- Sharing allowed
- **Advanced AI analysis** with:
  - 5+ natural alternatives per scan
  - Detailed dosage recommendations
  - Research citations from peer-reviewed studies
  - Drug interaction warnings
  - Effectiveness scores
  - Quality markers and cost estimates
- **PDF report export** - Professional wellness reports
- Export scan history to CSV
- Priority support
- No ads

## Feature Implementation Details

### Scan Limits
- Enforced via `src/services/rateLimiter.js`
- Tracked in Supabase `scans` table
- Free users: 3 scans/month
- Premium users: 25 scans/month (10 per day max)

### Scan History
- **Mobile**: `src/components/ScanHistory.js`
  - Premium users: Full history with pagination
  - Free users: Upgrade prompt
- **Web**: `src/web/pages/WebHistory.js`
  - Search and filter functionality
  - Export to CSV
  - Premium-gated

### PDF Export
- Service: `src/services/PdfExportService.js`
- Mobile: Uses `expo-print` for native PDF generation
- Web: Uses `jspdf` for browser-based PDF generation
- Professional report format with:
  - Medication name and scan date
  - Natural alternatives with descriptions
  - Medical disclaimer
  - Naturinex branding

### Differentiated AI Analysis
- Service: `src/services/aiService.js`
- **Free tier response**:
  - 2 alternatives maximum
  - Basic descriptions
  - Limited warnings
  - Upgrade prompt included
- **Premium tier response**:
  - 5+ alternatives
  - Full dosage recommendations
  - Research citations
  - Contraindications
  - Drug interactions
  - Effectiveness scores
  - Quality markers
  - Cost estimates

## API Endpoints

### Rate Limiting
- 429 response when scan limit reached
- Returns upgrade prompt for free users

### Scan Tracking
- Each scan recorded with:
  - `user_id`
  - `medication_name`
  - `natural_alternatives` (JSONB)
  - `created_at` timestamp

## Database Schema

### scans table
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  device_fingerprint TEXT,
  medication_name TEXT NOT NULL,
  natural_alternatives JSONB NOT NULL,
  scan_source TEXT DEFAULT 'manual',
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### profiles table
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);
```

## Upgrade Flow

1. User attempts premium feature (history, export, more scans)
2. Premium gate shows upgrade prompt
3. User redirected to subscription page
4. Stripe checkout initiated
5. Webhook updates user's subscription tier
6. Features unlocked immediately

## Files Modified

- `src/config/pricing.js` - Pricing tiers and limits
- `src/services/rateLimiter.js` - Scan limit enforcement
- `src/services/aiService.js` - Tiered AI analysis
- `src/services/PdfExportService.js` - PDF generation (NEW)
- `src/components/ScanHistory.js` - Mobile history UI
- `src/screens/AnalysisScreen.js` - PDF export integration
- `src/web/pages/WebHistory.js` - Web history UI
- `src/web/pages/WebSubscription.js` - Unified pricing display
- `src/services/AccountSecurityService.js` - Device/IP tracking
- `src/services/ScreenshotProtectionService.js` - Screenshot blocking

## Security Features

### Device Tracking
- Each user limited to max devices per tier (Free: 1, Premium: 3)
- Device fingerprinting via `deviceFingerprintService.js`
- IP address logged with each scan
- Suspicious activity detection (multiple IPs in 24h)

### Account Sharing Prevention
- Device registration required
- Automatic device limit enforcement
- Security events logged for audit
- Users can manage devices in profile

### Screenshot Protection (Free Tier)
- Screenshots blocked on analysis screens
- Upgrade CTA shown on screenshot attempt
- Premium users can screenshot freely

### Database Tables
- `user_devices` - Registered devices per user
- `security_events` - Audit trail for security events
