# NaturineX Comprehensive Affiliate Program Documentation

## Overview

The NaturineX Affiliate Program is a comprehensive, multi-tier affiliate marketing system designed to help partners promote natural health alternatives and earn commissions. The system includes advanced tracking, fraud prevention, automated payouts, and extensive partner integrations.

## 🏗️ Architecture

### Core Components

1. **Database Schema** (`/database/schema/affiliate_program_schema.sql`)
   - Complete PostgreSQL schema with 11 core tables
   - Row-level security (RLS) enabled
   - Automated triggers for performance updates
   - Materialized views for dashboard optimization

2. **Services Layer**
   - `AffiliateManagementService.js` - Core affiliate operations
   - `PayoutProcessingService.js` - Automated commission payouts
   - `PartnerIntegrationService.js` - External partner integrations

3. **Frontend Components**
   - `AffiliateDashboard.js` - Main dashboard with analytics
   - `AffiliateRegistration.js` - Multi-step registration process
   - `LinkGenerator.js` - Custom link creation and QR codes
   - `MarketingAssets.js` - Asset management and downloads

4. **API Endpoints** (`/supabase/functions/affiliate-api/`)
   - Comprehensive REST API for all affiliate operations
   - Built on Supabase Edge Functions
   - Full CRUD operations with security

## 📊 Database Schema

### Main Tables

#### `affiliates`
Core affiliate information, status, and performance metrics
- Personal and business information
- Payment details (encrypted)
- Performance tracking
- Fraud prevention data

#### `referral_tracking`
Comprehensive click and conversion tracking
- Device fingerprinting
- Geographic data
- UTM parameter tracking
- Quality scoring

#### `commission_calculations`
Detailed commission calculations and validation
- Transaction linking
- Tier-based bonuses
- Quality scoring
- Fraud indicators

#### `payout_history`
Complete payout processing records
- Multiple payment methods
- Tax withholding
- Retry mechanisms
- Audit trails

#### `marketing_assets`
Asset management for affiliates
- Tier-based access control
- Download tracking
- Usage guidelines
- Version control

### Advanced Features

#### `performance_analytics`
Aggregated performance data by time periods
- Daily, weekly, monthly, quarterly views
- Geographic performance breakdown
- Device and traffic source analysis

#### `fraud_detection`
Comprehensive fraud prevention system
- Automated detection rules
- Investigation workflow
- Evidence collection
- Resolution tracking

#### `partner_integrations`
External partner management
- API configurations
- Webhook integrations
- Commission structures
- Contract management

## 🎯 Features

### 1. Multi-Tier Commission Structure

#### Tier Levels
- **Bronze** (15% commission) - Entry level
- **Silver** (20% commission) - $1,000+ monthly sales
- **Gold** (25% commission) - $5,000+ monthly sales
- **Platinum** (30% commission) - $15,000+ monthly sales
- **Healthcare** (25% commission) - Licensed professionals

#### Automatic Tier Upgrades
- Performance-based tier progression
- Monthly evaluation of metrics
- Conversion rate requirements
- Revenue thresholds

### 2. Advanced Tracking System

#### Click Tracking
- Device fingerprinting
- IP geolocation
- UTM parameter capture
- Referrer analysis
- Bot detection

#### Conversion Attribution
- 30-day cookie window
- Cross-device tracking
- Quality scoring
- Fraud detection

### 3. Fraud Prevention

#### Real-time Analysis
- Suspicious click patterns
- IP reputation checking
- Device consistency validation
- Velocity monitoring

#### Investigation Workflow
- Automated flagging
- Manual review process
- Evidence collection
- Resolution tracking

### 4. Automated Payout System

#### Payment Methods
- ACH bank transfers
- PayPal payments
- Stripe Express
- International wire transfers

#### Processing Features
- Minimum payout thresholds
- Automated weekly processing
- Retry mechanisms for failures
- Tax withholding support

### 5. Marketing Assets Management

#### Asset Types
- Banner advertisements (multiple sizes)
- Logo variations
- Social media templates
- Email templates
- Video content
- Landing page templates

#### Access Control
- Tier-based asset access
- Download tracking
- Usage analytics
- Version management

### 6. Custom Link Generation

#### Features
- Custom path creation
- QR code generation
- Campaign tracking
- Expiration dates
- Performance analytics

#### Social Media Integration
- Platform-specific templates
- Optimized content for each channel
- Hashtag suggestions
- Posting guidelines

### 7. Partner Integrations

#### Supplement Stores
- Product catalog synchronization
- Inventory tracking
- Commission management
- Order processing

#### Health Blogs
- Content integration tools
- Widget embeddings
- Article templates
- SEO optimization

#### Healthcare Providers
- HIPAA-compliant integrations
- Professional dashboards
- Patient education tools
- Credential verification

## 🔧 Setup Instructions

### Database Setup

1. **Run the main schema**:
   ```sql
   \i database/schema/affiliate_program_schema.sql
   ```

2. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%affiliate%';
   ```

### Supabase Edge Functions

1. **Deploy the affiliate API**:
   ```bash
   supabase functions deploy affiliate-api
   ```

2. **Set environment variables**:
   ```bash
   supabase secrets set ENCRYPTION_KEY=your-encryption-key
   supabase secrets set STRIPE_SECRET_KEY=your-stripe-key
   ```

### Frontend Integration

1. **Import services**:
   ```javascript
   import affiliateManagementService from './services/AffiliateManagementService';
   import payoutProcessingService from './services/PayoutProcessingService';
   ```

2. **Initialize tracking**:
   ```javascript
   affiliateManagementService.init(userId);
   ```

## 📱 Usage Examples

### Register New Affiliate

```javascript
const registrationData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1-555-123-4567',
  website: 'https://healthblog.com',
  businessType: 'individual',
  paymentMethod: 'bank_transfer',
  bankDetails: {
    accountHolderName: 'John Doe',
    bankName: 'Chase Bank',
    accountNumber: '1234567890',
    routingNumber: '123456789'
  }
};

const result = await affiliateManagementService.registerAffiliate(registrationData);
```

### Track Referral Click

```javascript
const trackingData = {
  affiliateCode: 'NAT123ABC',
  productId: 'prod_123',
  utmParams: {
    source: 'blog',
    medium: 'article',
    campaign: 'natural_health'
  }
};

const result = await affiliateManagementService.trackClick(trackingData);
```

### Generate Custom Link

```javascript
const linkData = {
  linkName: 'Homepage - Instagram Bio',
  originalUrl: 'https://naturinex.com',
  campaignName: 'Instagram Campaign 2025'
};

const result = await affiliateManagementService.generateCustomLink(affiliateId, linkData);
```

### Process Commission Payout

```javascript
const result = await payoutProcessingService.processAffiliatePayout(affiliate);
```

## 🔒 Security Features

### Data Encryption
- Payment details encrypted with AES-256
- API keys securely stored
- PII data protection

### Access Control
- Row-level security on all tables
- Tier-based asset access
- API rate limiting

### Fraud Prevention
- Real-time risk scoring
- Pattern recognition
- IP reputation checking
- Device fingerprinting

### Compliance
- GDPR compliance features
- Data retention policies
- Right to deletion
- Audit trails

## 📈 Analytics & Reporting

### Dashboard Metrics
- Total clicks and conversions
- Commission earnings
- Conversion rates
- Geographic performance
- Device analytics

### Performance Reports
- PDF report generation
- Custom date ranges
- Trend analysis
- Competitor insights

### Real-time Analytics
- Live click tracking
- Conversion monitoring
- Revenue calculations
- Quality scoring

## 🔄 API Endpoints

### Authentication
All API calls require Bearer token authentication:
```
Authorization: Bearer your-api-key
```

### Core Endpoints

#### Affiliate Management
- `POST /affiliate-api` - Register new affiliate
- `PUT /affiliate-api` - Update affiliate information
- `GET /affiliate-api` - Get affiliate details

#### Tracking
- `POST /affiliate-api` - Track clicks and conversions
- `GET /affiliate-api` - Get tracking statistics

#### Commissions
- `GET /affiliate-api` - Get commission history
- `POST /affiliate-api` - Calculate commissions

#### Payouts
- `POST /affiliate-api` - Process payouts
- `GET /affiliate-api` - Get payout history

### Example API Call

```javascript
const response = await fetch('/supabase/functions/affiliate-api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    action: 'track_click',
    data: {
      affiliateCode: 'NAT123ABC',
      productId: 'prod_123',
      visitorInfo: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://google.com'
      }
    }
  })
});
```

## 🚀 Deployment

### Production Checklist

1. **Database**
   - [ ] Run all schema migrations
   - [ ] Set up automated backups
   - [ ] Configure connection pooling
   - [ ] Enable query performance monitoring

2. **Environment Variables**
   - [ ] Set encryption keys
   - [ ] Configure payment processor keys
   - [ ] Set up email service credentials
   - [ ] Configure fraud detection thresholds

3. **Security**
   - [ ] Enable SSL/TLS
   - [ ] Configure rate limiting
   - [ ] Set up IP whitelisting
   - [ ] Enable audit logging

4. **Monitoring**
   - [ ] Set up error tracking
   - [ ] Configure performance monitoring
   - [ ] Enable fraud detection alerts
   - [ ] Set up payout failure notifications

## 📞 Support & Maintenance

### Monitoring

#### Key Metrics to Watch
- Affiliate registration rate
- Click-to-conversion ratio
- Fraud detection accuracy
- Payout success rate
- API response times

#### Alerts Setup
- Failed payout notifications
- High fraud score alerts
- API error rate monitoring
- Database performance alerts

### Regular Maintenance

#### Weekly Tasks
- Review fraud reports
- Process manual payouts
- Update marketing assets
- Analyze performance trends

#### Monthly Tasks
- Tier eligibility reviews
- Commission rate adjustments
- Partner integration updates
- Performance optimizations

## 📋 Troubleshooting

### Common Issues

#### Registration Problems
- Email verification failures
- Payment method validation errors
- Duplicate affiliate codes

#### Tracking Issues
- Cookie blocking
- Cross-domain tracking
- Mobile app attribution

#### Payout Failures
- Invalid bank details
- Insufficient funds
- Payment processor errors

### Debug Tools

#### Affiliate Dashboard
- Real-time tracking status
- Commission calculation breakdown
- Fraud score details
- Link performance metrics

#### Admin Tools
- Affiliate approval workflow
- Fraud investigation interface
- Payout processing dashboard
- System health monitoring

## 🔮 Future Enhancements

### Planned Features
- Machine learning fraud detection
- Advanced attribution modeling
- Mobile app deep linking
- Blockchain-based transparency
- AI-powered optimization

### Integration Roadmap
- Shopify app store
- WordPress plugin
- Salesforce integration
- HubSpot connector
- Zapier automation

---

## Files Created

### Database Schema
- `C:\Users\maito\mediscan-app\naturinex-app\database\schema\affiliate_program_schema.sql`

### Services
- `C:\Users\maito\mediscan-app\naturinex-app\src\services\AffiliateManagementService.js`
- `C:\Users\maito\mediscan-app\naturinex-app\src\services\PayoutProcessingService.js`
- `C:\Users\maito\mediscan-app\naturinex-app\src\services\PartnerIntegrationService.js`

### Components
- `C:\Users\maito\mediscan-app\naturinex-app\src\components\affiliate\AffiliateDashboard.js`
- `C:\Users\maito\mediscan-app\naturinex-app\src\components\affiliate\AffiliateRegistration.js`
- `C:\Users\maito\mediscan-app\naturinex-app\src\components\affiliate\LinkGenerator.js`
- `C:\Users\maito\mediscan-app\naturinex-app\src\components\affiliate\MarketingAssets.js`

### API
- `C:\Users\maito\mediscan-app\naturinex-app\supabase\functions\affiliate-api\index.ts`
- `C:\Users\maito\mediscan-app\naturinex-app\supabase\functions\_shared\cors.ts`

### Documentation
- `C:\Users\maito\mediscan-app\naturinex-app\docs\AFFILIATE_PROGRAM_DOCUMENTATION.md`

The affiliate program is now complete with all requested features including multi-tier commissions, fraud prevention, automated payouts, marketing assets, partner integrations, and comprehensive tracking systems.