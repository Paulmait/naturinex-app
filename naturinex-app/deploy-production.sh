#!/bin/bash

# Naturinex Production Deployment Script
# For deploying to 1M+ users

set -e  # Exit on error

echo "🚀 Starting Naturinex Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if all required environment variables are set
check_env_vars() {
    echo "📋 Checking environment variables..."

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

    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi

    echo -e "${GREEN}✅ All required environment variables are set${NC}"
}

# Clean and install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm ci --production
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Run security audit
security_audit() {
    echo "🔒 Running security audit..."
    npm audit --production

    # Check for high/critical vulnerabilities
    if npm audit --production --json | grep -q '"severity":"high"\|"severity":"critical"'; then
        echo -e "${YELLOW}⚠️ Security vulnerabilities found. Consider fixing before deployment.${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ No critical security issues found${NC}"
    fi
}

# Build for production
build_production() {
    echo "🏗️ Building for production..."

    # Build web version
    echo "Building web..."
    npm run build:web

    # Build mobile versions
    echo "Building iOS..."
    eas build --platform ios --profile production --non-interactive

    echo "Building Android..."
    eas build --platform android --profile production --non-interactive

    echo -e "${GREEN}✅ Production builds completed${NC}"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    npm test -- --coverage --watchAll=false
    echo -e "${GREEN}✅ All tests passed${NC}"
}

# Deploy to hosting platforms
deploy_services() {
    echo "☁️ Deploying services..."

    # Deploy to Render
    if [ -f "render.yaml" ]; then
        echo "Deploying to Render..."
        render deploy
    fi

    # Deploy Supabase functions
    if [ -d "supabase/functions" ]; then
        echo "Deploying Supabase functions..."
        supabase functions deploy
    fi

    echo -e "${GREEN}✅ Services deployed${NC}"
}

# Update CDN and cache
update_cdn() {
    echo "🌐 Updating CDN..."

    # Purge CloudFlare cache if configured
    if [ ! -z "$CLOUDFLARE_API_KEY" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CLOUDFLARE_API_KEY" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
    fi

    echo -e "${GREEN}✅ CDN updated${NC}"
}

# Health checks
health_check() {
    echo "❤️ Running health checks..."

    # Check API
    api_response=$(curl -s -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_API_URL/health")
    if [ $api_response -eq 200 ]; then
        echo -e "${GREEN}✅ API is healthy${NC}"
    else
        echo -e "${RED}❌ API health check failed${NC}"
        exit 1
    fi

    # Check Supabase
    supabase_response=$(curl -s -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/")
    if [ $supabase_response -eq 200 ]; then
        echo -e "${GREEN}✅ Supabase is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️ Supabase health check returned: $supabase_response${NC}"
    fi
}

# Monitor deployment
monitor_deployment() {
    echo "📊 Monitoring deployment..."

    # Send deployment notification to Sentry
    if [ ! -z "$SENTRY_AUTH_TOKEN" ]; then
        sentry-cli releases new "$VERSION"
        sentry-cli releases set-commits "$VERSION" --auto
        sentry-cli releases finalize "$VERSION"
        sentry-cli releases deploys "$VERSION" new -e production
    fi

    echo -e "${GREEN}✅ Monitoring configured${NC}"
}

# Main deployment flow
main() {
    echo "================================"
    echo "  Naturinex Production Deploy  "
    echo "================================"

    # Get version
    VERSION=$(node -p "require('./package.json').version")
    echo "📱 Deploying version: $VERSION"

    # Run deployment steps
    check_env_vars
    install_dependencies
    security_audit
    run_tests
    build_production
    deploy_services
    update_cdn
    health_check
    monitor_deployment

    echo ""
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo "================================"
    echo "Version $VERSION is now live"
    echo "Monitor at: https://naturinex.com/admin/dashboard"
    echo "================================"
}

# Run main function
main "$@"