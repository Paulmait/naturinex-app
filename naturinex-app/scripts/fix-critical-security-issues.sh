#!/bin/bash

###############################################################################
# Critical Security Fixes - Automated Setup Script
#
# This script automates the setup for fixing the 5 critical security issues
# identified in the expert codebase review.
#
# Usage: bash scripts/fix-critical-security-issues.sh
#
# IMPORTANT: Review each step before running. Some steps require manual action.
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

###############################################################################
# Pre-flight Checks
###############################################################################

log_info "Starting critical security fixes setup..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Please run this script from the project root."
    exit 1
fi

log_success "In correct directory"

# Check for git
if ! command -v git &> /dev/null; then
    log_error "git is not installed. Please install git first."
    exit 1
fi

log_success "Git is available"

# Check for Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

log_success "Node.js is available ($(node --version))"

# Check for npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm first."
    exit 1
fi

log_success "npm is available ($(npm --version))"

echo

###############################################################################
# Fix #1: Update .gitignore for Secrets
###############################################################################

log_info "Fix #1: Updating .gitignore to prevent secret leaks"

if grep -q ".env.production" .gitignore 2>/dev/null; then
    log_warning ".env.production already in .gitignore"
else
    if confirm "Add secret files to .gitignore?"; then
        cat >> .gitignore << 'EOF'

# Environment files - NEVER commit these!
.env
.env.local
.env.production
.env.development
*.secret
*.backup.SECURE

EOF
        log_success ".gitignore updated"
        git add .gitignore
        git commit -m "security: prevent secret files from being committed"
    else
        log_warning "Skipped .gitignore update"
    fi
fi

echo

###############################################################################
# Fix #1: Check if secrets are in git
###############################################################################

log_info "Checking if .env.production is tracked in git..."

if git ls-files --error-unmatch .env.production &> /dev/null; then
    log_error ".env.production is tracked in git! This is a CRITICAL security issue!"
    log_warning "You need to remove it from git history using git filter-repo or BFG"
    log_warning "See CRITICAL_SECURITY_FIXES_IMPLEMENTATION_GUIDE.md for instructions"

    if [ -f .env.production ]; then
        log_info "Creating backup of .env.production..."
        cp .env.production .env.production.backup.SECURE
        log_success "Backup created: .env.production.backup.SECURE"
        log_warning "Store this file in a password manager, then delete it from disk"
    fi
else
    log_success ".env.production is not tracked in git"
fi

echo

###############################################################################
# Fix #2: Install Dependencies for Crypto Fixes
###############################################################################

log_info "Fix #2: Installing cryptographic libraries"

if confirm "Install crypto-js for secure hashing?"; then
    npm install crypto-js
    npm install --save-dev @types/crypto-js
    log_success "crypto-js installed"
else
    log_warning "Skipped crypto-js installation"
fi

echo

###############################################################################
# Fix #3: Verify expo-crypto for Secure RNG
###############################################################################

log_info "Fix #3: Verifying expo-crypto is installed"

if npm list expo-crypto &> /dev/null; then
    log_success "expo-crypto is already installed"
else
    log_warning "expo-crypto not found"
    if confirm "Install expo-crypto for secure random number generation?"; then
        npx expo install expo-crypto
        log_success "expo-crypto installed"
    else
        log_warning "Skipped expo-crypto installation"
    fi
fi

echo

###############################################################################
# Fix #4: Install Input Validation Libraries
###############################################################################

log_info "Fix #4: Installing input validation libraries"

if confirm "Install validator for SQL injection prevention?"; then
    npm install validator
    npm install --save-dev @types/validator
    log_success "validator installed"
else
    log_warning "Skipped validator installation"
fi

echo

###############################################################################
# Fix #5: Install Schema Validation Library
###############################################################################

log_info "Fix #5: Installing Joi for medical data validation"

if confirm "Install Joi for schema validation?"; then
    npm install joi
    npm install --save-dev @types/joi
    log_success "Joi installed"
else
    log_warning "Skipped Joi installation"
fi

echo

###############################################################################
# Create Utility Directories
###############################################################################

log_info "Creating utility directories and files"

# Create directories
mkdir -p src/utils
mkdir -p src/validation
mkdir -p __tests__/utils
mkdir -p __tests__/api
mkdir -p __tests__/services

log_success "Directories created"

echo

###############################################################################
# Install Security Tools
###############################################################################

log_info "Installing security scanning tools"

if confirm "Install security scanning tools (snyk, husky)?"; then
    npm install --save-dev snyk husky lint-staged
    log_success "Security tools installed"

    # Initialize husky
    if confirm "Initialize git hooks with husky?"; then
        npx husky install
        log_success "Husky initialized"
    fi
else
    log_warning "Skipped security tools installation"
fi

echo

###############################################################################
# Generate New Secrets Template
###############################################################################

log_info "Creating .env.production.template"

if [ ! -f .env.production.template ]; then
    cat > .env.production.template << 'EOF'
# Production Environment Variables Template
# Copy this file to .env.production and fill in real values
# NEVER commit .env.production to git!

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Authentication - Generate with: openssl rand -base64 32
JWT_SECRET=GENERATE_NEW_SECRET_HERE
SESSION_SECRET=GENERATE_NEW_SECRET_HERE

# Encryption - Generate with: openssl rand -base64 32
ENCRYPTION_KEY=GENERATE_NEW_SECRET_HERE

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NODE_ENV=production
API_URL=https://api.yourdomain.com

# Feature Flags
ENABLE_2FA=true
ENABLE_BIOMETRIC=true
ENABLE_OFFLINE_MODE=true
EOF
    log_success ".env.production.template created"
    log_warning "Remember to generate actual secrets using: openssl rand -base64 32"
else
    log_warning ".env.production.template already exists"
fi

echo

###############################################################################
# Update package.json Scripts
###############################################################################

log_info "Adding security scripts to package.json"

if confirm "Add security scripts to package.json?"; then
    # Create a temporary file with updated scripts
    node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add security scripts
pkg.scripts = pkg.scripts || {};
pkg.scripts['security:check'] = 'npm audit && snyk test';
pkg.scripts['security:fix'] = 'npm audit fix';
pkg.scripts['security:monitor'] = 'snyk monitor';
pkg.scripts['precommit'] = 'npm run security:check && npm run test';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json updated');
EOF
    log_success "Security scripts added to package.json"
else
    log_warning "Skipped package.json update"
fi

echo

###############################################################################
# Create Quick Reference Card
###############################################################################

log_info "Creating SECURITY_QUICK_REFERENCE.md"

cat > SECURITY_QUICK_REFERENCE.md << 'EOF'
# Security Quick Reference Card

## Critical Security Fixes Checklist

### Fix #1: Secrets Rotation
- [ ] Remove .env.production from git history
- [ ] Generate new secrets: `openssl rand -base64 32`
- [ ] Rotate Supabase keys (Dashboard → Settings → API)
- [ ] Rotate Stripe keys (Dashboard → Developers → API Keys)
- [ ] Deploy new secrets to Vercel/EAS

### Fix #2: Secure Hash Function
- [ ] Install crypto-js: `npm install crypto-js`
- [ ] Replace simpleHash() with generateSecureHash() in stripeService.js
- [ ] Use SHA-256 for idempotency keys
- [ ] Test payment processing

### Fix #3: Secure Random Number Generation
- [ ] Verify expo-crypto: `npm list expo-crypto`
- [ ] Remove fallbackRandomBytes() from encryptionService.js
- [ ] Use Crypto.getRandomBytesAsync() for all RNG
- [ ] Never fall back to Math.random()

### Fix #4: SQL Injection Prevention
- [ ] Install validator: `npm install validator`
- [ ] Create InputSanitizer utility
- [ ] Sanitize all user input before queries
- [ ] Test with malicious input

### Fix #5: Medical Data Validation
- [ ] Install Joi: `npm install joi`
- [ ] Create validation schemas
- [ ] Validate all medical data submissions
- [ ] Add audit logging

## Security Commands

### Generate Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate encryption key
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

### Security Scanning
```bash
# Check for vulnerabilities
npm run security:check

# Fix vulnerabilities
npm run security:fix

# Monitor dependencies
npm run security:monitor
```

### Git Security
```bash
# Check if file is tracked
git ls-files | grep .env

# Remove from history (use git-filter-repo)
pip install git-filter-repo
git filter-repo --path .env.production --invert-paths
```

## Critical Don'ts

- ❌ NEVER commit .env files to git
- ❌ NEVER use Math.random() for cryptography
- ❌ NEVER use weak hash functions for payments
- ❌ NEVER pass unsanitized input to database
- ❌ NEVER skip input validation on medical data

## Resources

- Full Guide: `CRITICAL_SECURITY_FIXES_IMPLEMENTATION_GUIDE.md`
- Expert Review: `EXPERT_CODEBASE_REVIEW.md`
- Security Verification: `SECURITY_COMPLETE_VERIFICATION.md`

---

**Status:** Implementation in progress
**Last Updated:** 2025-10-21
**Priority:** CRITICAL
EOF

log_success "SECURITY_QUICK_REFERENCE.md created"

echo

###############################################################################
# Final Summary
###############################################################################

echo
echo "========================================================================="
log_success "Critical Security Fixes Setup Complete!"
echo "========================================================================="
echo
echo "📋 Next Steps:"
echo
echo "1. Read CRITICAL_SECURITY_FIXES_IMPLEMENTATION_GUIDE.md for detailed instructions"
echo "2. Generate new secrets using: openssl rand -base64 32"
echo "3. Remove .env.production from git history (if tracked)"
echo "4. Implement the code changes for each fix"
echo "5. Run tests: npm test"
echo "6. Deploy to production"
echo
echo "🔐 Dependencies Installed:"
npm list --depth=0 | grep -E 'crypto-js|validator|joi|expo-crypto|snyk|husky' || true
echo
echo "📖 Documentation Created:"
echo "   - CRITICAL_SECURITY_FIXES_IMPLEMENTATION_GUIDE.md"
echo "   - SECURITY_QUICK_REFERENCE.md"
echo "   - .env.production.template"
echo
log_warning "IMPORTANT: Review each fix carefully before implementing!"
log_warning "Total estimated time: 6-8 hours"
log_warning "All 5 fixes are CRITICAL and must be completed before production"
echo
echo "========================================================================="
