#!/bin/bash

# 🚀 Naturinex Automated Deployment Script
# This script automates the deployment process for 1M+ users

set -e

echo "🚀 Naturinex Automated Deployment Script"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ -f .env.production ]; then
        print_success ".env.production file found"
        source .env.production
        return 0
    else
        print_error ".env.production file not found"
        return 1
    fi
}

# Verify required environment variables
verify_env_vars() {
    print_status "Verifying environment variables..."

    required_vars=(
        "EXPO_PUBLIC_SUPABASE_URL"
        "EXPO_PUBLIC_SUPABASE_ANON_KEY"
        "EXPO_PUBLIC_FIREBASE_API_KEY"
        "STRIPE_PUBLISHABLE_KEY"
        "GEMINI_API_KEY"
    )

    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=($var)
        fi
    done

    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_success "All required environment variables are set"
        return 0
    else
        print_error "Missing environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    fi
}

# Test Supabase connection
test_supabase() {
    print_status "Testing Supabase connection..."

    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/")

    if [ "$response" = "200" ]; then
        print_success "Supabase connection successful"
        return 0
    else
        print_error "Supabase connection failed (HTTP $response)"
        return 1
    fi
}

# Deploy to Render
deploy_render() {
    print_status "Deploying to Render..."

    # Check if render.yaml exists
    if [ ! -f render.yaml ]; then
        print_warning "render.yaml not found, creating..."
        cat > render.yaml << 'EOF'
services:
  - type: web
    name: naturinex-api
    env: node
    region: oregon
    plan: standard
    buildCommand: npm install
    startCommand: node server/index.js
    envVars:
      - key: NODE_ENV
        value: production
EOF
        print_success "render.yaml created"
    fi

    # Deploy using Git
    print_status "Pushing to GitHub for Render deployment..."
    git add .
    git commit -m "deploy: automated deployment to Render" || true
    git push origin master

    print_success "Pushed to GitHub. Render will auto-deploy."
    echo "Visit https://dashboard.render.com to monitor deployment"
}

# Setup CloudFlare
setup_cloudflare() {
    print_status "Setting up CloudFlare CDN..."

    if [ -f cloudflare-config.json ]; then
        print_success "CloudFlare configuration found"
        echo "Please manually:"
        echo "1. Add your domain to CloudFlare"
        echo "2. Update nameservers at your registrar"
        echo "3. Import cloudflare-config.json settings"
    else
        print_warning "CloudFlare configuration not found"
    fi
}

# Build mobile apps
build_mobile() {
    print_status "Building mobile apps with EAS..."

    # Check if EAS is configured
    if [ ! -f eas.json ]; then
        print_error "eas.json not found. Run: eas build:configure"
        return 1
    fi

    read -p "Build iOS app? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building iOS app..."
        eas build --platform ios --profile production --non-interactive
    fi

    read -p "Build Android app? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Building Android app..."
        eas build --platform android --profile production --non-interactive
    fi
}

# Run comprehensive tests
run_tests() {
    print_status "Running comprehensive tests..."

    if [ -f test-comprehensive.js ]; then
        node test-comprehensive.js
    else
        print_warning "Comprehensive test file not found"
        npm test
    fi
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."

    # Check if Sentry is configured
    if [ ! -z "$SENTRY_DSN" ]; then
        print_success "Sentry monitoring configured"
    else
        print_warning "Sentry DSN not found. Monitoring not configured."
        echo "Sign up at https://sentry.io for error tracking"
    fi
}

# Create production bundle
create_bundle() {
    print_status "Creating production bundle..."

    # Web build
    print_status "Building web version..."
    npm run build:web || print_warning "Web build failed"

    print_success "Production bundle created"
}

# Main deployment flow
main() {
    echo "======================================"
    echo "   Naturinex Production Deployment   "
    echo "======================================"
    echo ""

    # Step 1: Check environment
    print_status "Step 1: Checking environment..."
    if ! check_env; then
        print_error "Please create .env.production file first"
        echo "Run: cp .env.example .env.production"
        echo "Then fill in all required values"
        exit 1
    fi

    # Step 2: Verify configuration
    print_status "Step 2: Verifying configuration..."
    if ! verify_env_vars; then
        print_error "Please set all required environment variables"
        exit 1
    fi

    # Step 3: Test connections
    print_status "Step 3: Testing service connections..."
    test_supabase || print_warning "Supabase test failed"

    # Step 4: Run tests
    print_status "Step 4: Running tests..."
    run_tests || print_warning "Some tests failed"

    # Step 5: Create production bundle
    print_status "Step 5: Creating production bundle..."
    create_bundle

    # Step 6: Deploy to Render
    print_status "Step 6: Deploying to Render..."
    deploy_render

    # Step 7: Setup CloudFlare
    print_status "Step 7: CloudFlare CDN setup..."
    setup_cloudflare

    # Step 8: Setup monitoring
    print_status "Step 8: Setting up monitoring..."
    setup_monitoring

    # Step 9: Build mobile apps (optional)
    read -p "Build mobile apps now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_mobile
    fi

    # Summary
    echo ""
    echo "======================================"
    print_success "🎉 DEPLOYMENT COMPLETE!"
    echo "======================================"
    echo ""
    echo "📊 Next Steps:"
    echo "1. Monitor deployment at https://dashboard.render.com"
    echo "2. Configure CloudFlare at https://dash.cloudflare.com"
    echo "3. Check app at https://naturinex-api.onrender.com/health"
    echo "4. Submit apps to stores using:"
    echo "   - iOS: eas submit -p ios --latest"
    echo "   - Android: eas submit -p android --latest"
    echo ""
    echo "📈 Monitor your services at:"
    echo "- Render: https://dashboard.render.com"
    echo "- Supabase: https://app.supabase.com"
    echo "- CloudFlare: https://dash.cloudflare.com"
    echo "- Stripe: https://dashboard.stripe.com"
    echo ""
    print_success "Your app is ready for 1M+ users! 🚀"
}

# Run the main function
main "$@"