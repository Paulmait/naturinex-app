#!/bin/bash

# Render Setup Script
# This script helps you set up your Render deployment

echo "🚀 NaturineX Render Setup Script"
echo "================================"
echo ""

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI not found. Install it with:"
    echo "   npm install -g @render-oss/cli"
    echo ""
fi

# Check for required files
echo "📁 Checking required files..."

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found"
    exit 1
else
    echo "✅ render.yaml found"
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
else
    echo "✅ package.json found"
fi

echo ""
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. Create a Render account at https://render.com"
echo ""
echo "2. Connect your GitHub repository:"
echo "   - Go to Render Dashboard"
echo "   - Click 'New +' → 'Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Select the repository with render.yaml"
echo ""
echo "3. Set environment variables in Render Dashboard:"
echo ""
echo "   Required variables:"
echo "   ------------------"
echo "   RESEND_API_KEY         = Get from https://resend.com/api-keys"
echo "   RESEND_FROM_EMAIL      = noreply@yourdomain.com"
echo "   FIREBASE_PROJECT_ID    = Your Firebase project ID"
echo "   FIREBASE_PRIVATE_KEY   = Your Firebase private key"
echo "   FIREBASE_CLIENT_EMAIL  = Your Firebase client email"
echo "   GEMINI_API_KEY         = Your Gemini API key"
echo "   STRIPE_SECRET_KEY      = Your Stripe secret key"
echo "   STRIPE_WEBHOOK_SECRET  = Your Stripe webhook secret"
echo ""
echo "   Auto-generated:"
echo "   ---------------"
echo "   JWT_SECRET             = Click 'Generate' in Render"
echo "   ENCRYPTION_KEY         = Click 'Generate' in Render"
echo ""
echo "4. Configure webhooks:"
echo "   - Resend: https://your-app.onrender.com/api/webhooks/resend"
echo "   - Stripe: https://your-app.onrender.com/api/webhooks/stripe"
echo ""
echo "5. Run database migrations after deployment:"
echo "   Use Render Shell or connect externally"
echo ""
echo "📝 Configuration Files:"
echo "   - render.yaml: Blueprint configuration"
echo "   - .env.render: Environment variables template"
echo "   - RENDER_DEPLOYMENT.md: Full deployment guide"
echo ""
echo "🧪 Test your deployment:"
echo "   curl https://your-app.onrender.com/health"
echo ""
echo "📚 Full guide: See RENDER_DEPLOYMENT.md"
echo ""
echo "Ready to deploy? Push to GitHub and Render will auto-deploy!"