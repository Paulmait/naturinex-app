#!/bin/bash

# Stripe Webhook Testing Script
# This script helps test the webhook handler locally

echo "🧪 Stripe Webhook Local Testing"
echo "==============================="
echo ""

# Check if webhook secret is set
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "⚠️  Warning: STRIPE_WEBHOOK_SECRET not set in environment"
    echo "Using test secret: whsec_test_secret"
    WEBHOOK_SECRET="whsec_test_secret"
else
    WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
fi

# Function URL (adjust if needed)
WEBHOOK_URL="http://localhost:5001/naturinex-app/us-central1/api/stripe-webhook"

# Test checkout.session.completed
echo "📦 Testing checkout.session.completed event..."

# Create test payload
PAYLOAD='{
  "id": "evt_test_checkout",
  "type": "checkout.session.completed",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "cs_test_123",
      "object": "checkout.session",
      "amount_total": 1499,
      "currency": "usd",
      "customer": "cus_test_123",
      "customer_email": "test@example.com",
      "payment_status": "paid",
      "mode": "subscription",
      "subscription": "sub_test_123",
      "metadata": {
        "userId": "test_user_123",
        "plan": "premium",
        "billingCycle": "monthly"
      }
    }
  }
}'

# Generate timestamp
TIMESTAMP=$(date +%s)

# Create signature (this is a simplified version - use Stripe CLI for real testing)
echo "Sending request to: $WEBHOOK_URL"
echo ""

# Send request with curl
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=$TIMESTAMP,v1=test_signature" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "==============================="
echo ""

# Test invoice.payment_failed
echo "📦 Testing invoice.payment_failed event..."

PAYLOAD_FAILED='{
  "id": "evt_test_invoice_failed",
  "type": "invoice.payment_failed",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "in_test_123",
      "object": "invoice",
      "amount_due": 1499,
      "currency": "usd",
      "customer": "cus_test_123",
      "customer_email": "test@example.com",
      "subscription": "sub_test_123",
      "attempt_count": 1,
      "next_payment_attempt": 1234654290,
      "hosted_invoice_url": "https://invoice.stripe.com/test"
    }
  }
}'

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=$TIMESTAMP,v1=test_signature" \
  -d "$PAYLOAD_FAILED" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "==============================="
echo ""
echo "✅ Tests completed!"
echo ""
echo "💡 For real webhook testing with proper signatures:"
echo "1. Install Stripe CLI: https://stripe.com/docs/stripe-cli"
echo "2. Run: stripe listen --forward-to $WEBHOOK_URL"
echo "3. In another terminal: stripe trigger checkout.session.completed"