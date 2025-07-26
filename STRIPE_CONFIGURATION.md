# 💳 Stripe Dashboard Configuration Guide

## Required Settings in Stripe Dashboard

### 1. Customer Portal Configuration
**Path**: Settings > Billing > Customer portal

Enable these features:
- ✅ Customers can update payment methods
- ✅ Customers can cancel subscriptions
- ✅ Customers can update billing addresses
- ✅ Show invoice history

### 2. Email Settings
**Path**: Settings > Emails

Enable these emails:
- ✅ Successful payments (receipt)
- ✅ Failed payment notifications
- ✅ Subscription renewal reminders
- ✅ Card expiring soon notifications

### 3. Retry Settings for Failed Payments
**Path**: Settings > Subscriptions and emails > Manage failed payments

Recommended settings:
- **Smart Retries**: Enable (Stripe's ML-based retry)
- **Maximum retry attempts**: 4
- **Retry schedule**: 
  - 1st retry: 3 days
  - 2nd retry: 5 days
  - 3rd retry: 7 days
  - Final retry: 14 days

### 4. Invoice Settings
**Path**: Settings > Invoices

Configure:
- **Payment terms**: Due upon receipt
- **Footer text**: "Thank you for choosing Naturinex!"
- **Auto-advance**: Enable (automatically finalize drafts)

### 5. Subscription Settings
**Path**: Products > Subscription settings

Set up:
- **Proration behavior**: Always invoice immediately
- **Billing cycle anchor**: Customer's subscription date
- **Trial settings**: None (or set if you want free trials)

## Why Payments Might Fail

### Common Reasons:
1. **Insufficient Funds** (Most common)
2. **Card Declined by Bank**
3. **Expired Card**
4. **Incorrect CVC/ZIP**
5. **International Transaction Blocks**

### What Happens on Failed Payment:
1. Stripe sends `invoice.payment_failed` webhook
2. Your server receives it at `/webhook`
3. Customer gets email notification
4. Stripe retries based on smart schedule
5. After final failure, subscription suspended

## Webhook Handling for Failed Payments

Your server already handles this correctly:

```javascript
// When payment fails:
1. Updates user status to 'past_due'
2. Records failure timestamp
3. Notifies user via email (Stripe automatic)
4. Retries based on smart schedule
```

## Test Your Integration

### Test Cards for Different Scenarios:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995
- **Expired Card**: 4000 0000 0000 0069

### Test Webhook Locally:
```bash
stripe listen --forward-to localhost:5000/webhook
stripe trigger invoice.payment_failed
```

## Customer Communication

### Email Templates to Configure:
1. **Payment Failed** - Friendly reminder with update link
2. **Card Expiring** - Proactive notification
3. **Subscription Cancelled** - Win-back opportunity

## Important URLs for Customers

Make sure these work:
- Update Payment Method: Use Stripe Customer Portal
- Cancel Subscription: Through app or portal
- View Invoices: Customer portal link

## Monitoring

Check these metrics weekly:
- Failed payment rate (target: <5%)
- Recovery rate (target: >70%)
- Churn from payment failures
- Average retry success by attempt

## Support Process

When customer contacts about failed payment:
1. Check Stripe Dashboard for exact error
2. Guide them to update payment method
3. Manually retry if needed
4. Offer grace period for good customers