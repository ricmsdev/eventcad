#!/bin/bash

# ===========================================
# EventCAD+ Security Check Script
# ===========================================
# This script performs security checks on the project

set -e

echo "🔒 EventCAD+ Security Check"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Checking for security issues..."

# 1. Check for .env files in git
echo "1. Checking for sensitive files in git..."
if git ls-files | grep -E "\.(env|key|pem|crt|p12|pfx)$" > /dev/null; then
    print_status 1 "Found sensitive files in git repository"
    git ls-files | grep -E "\.(env|key|pem|crt|p12|pfx)$"
else
    print_status 0 "No sensitive files found in git"
fi

# 2. Check for hardcoded secrets
echo "2. Checking for hardcoded secrets..."
SECRETS_FOUND=0

# Check for common secret patterns
if grep -r -i "password.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.log > /dev/null 2>&1; then
    print_warning "Potential hardcoded passwords found"
    grep -r -i "password.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.log || true
    SECRETS_FOUND=1
fi

if grep -r -i "secret.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.log > /dev/null 2>&1; then
    print_warning "Potential hardcoded secrets found"
    grep -r -i "secret.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=*.log || true
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    print_status 0 "No hardcoded secrets found"
fi

# 3. Check for vulnerable dependencies
echo "3. Checking for vulnerable dependencies..."
if [ -f "package.json" ]; then
    if npm audit --audit-level=moderate > /dev/null 2>&1; then
        print_status 0 "No high/moderate vulnerabilities found in dependencies"
    else
        print_status 1 "Vulnerabilities found in dependencies"
        npm audit --audit-level=moderate
    fi
fi

# 4. Check Docker security
echo "4. Checking Docker security..."
if [ -f "docker-compose.yml" ]; then
    # Check for exposed ports
    if grep -q "ports:" docker-compose.yml; then
        print_warning "Docker ports are exposed. Review for production."
    fi
    
    # Check for root user
    if grep -r "user: root" . --include="*.yml" --include="*.yaml" > /dev/null 2>&1; then
        print_status 1 "Docker containers running as root"
    else
        print_status 0 "Docker containers not running as root"
    fi
fi

# 5. Check for proper .gitignore
echo "5. Checking .gitignore configuration..."
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        print_status 0 ".env files are ignored"
    else
        print_status 1 ".env files are not ignored"
    fi
    
    if grep -q "node_modules" .gitignore; then
        print_status 0 "node_modules are ignored"
    else
        print_status 1 "node_modules are not ignored"
    fi
else
    print_status 1 "No .gitignore file found"
fi

# 6. Check for HTTPS in production configs
echo "6. Checking HTTPS configuration..."
if grep -r "http://" . --exclude-dir=node_modules --exclude-dir=.git --include="*.ts" --include="*.js" --include="*.json" | grep -v "localhost" > /dev/null 2>&1; then
    print_warning "HTTP URLs found in code (not localhost)"
else
    print_status 0 "No HTTP URLs found in production code"
fi

# 7. Check for proper CORS configuration
echo "7. Checking CORS configuration..."
if grep -r "cors" . --exclude-dir=node_modules --exclude-dir=.git --include="*.ts" --include="*.js" > /dev/null 2>&1; then
    print_status 0 "CORS configuration found"
else
    print_warning "CORS configuration not found"
fi

# 8. Check for rate limiting
echo "8. Checking rate limiting..."
if grep -r "rate.*limit" . --exclude-dir=node_modules --exclude-dir=.git --include="*.ts" --include="*.js" > /dev/null 2>&1; then
    print_status 0 "Rate limiting found"
else
    print_warning "Rate limiting not found"
fi

# 9. Check for input validation
echo "9. Checking input validation..."
if grep -r "zod\|class-validator\|joi" . --exclude-dir=node_modules --exclude-dir=.git --include="*.ts" --include="*.js" > /dev/null 2>&1; then
    print_status 0 "Input validation found"
else
    print_warning "Input validation not found"
fi

# 10. Check for logging
echo "10. Checking logging configuration..."
if grep -r "logger\|winston\|pino" . --exclude-dir=node_modules --exclude-dir=.git --include="*.ts" --include="*.js" > /dev/null 2>&1; then
    print_status 0 "Logging configuration found"
else
    print_warning "Logging configuration not found"
fi

echo ""
echo "🔒 Security check completed!"
echo "================================"

# Summary
echo ""
echo "📊 Summary:"
echo "- Run 'npm audit' to see detailed vulnerability report"
echo "- Review .env files and ensure they're not committed"
echo "- Check Docker configurations for production readiness"
echo "- Verify CORS and rate limiting are properly configured"
echo "- Ensure HTTPS is used in production"

echo ""
echo "🛡️  Security recommendations:"
echo "1. Use environment variables for all secrets"
echo "2. Enable HTTPS in production"
echo "3. Implement proper rate limiting"
echo "4. Configure CORS properly"
echo "5. Use security headers (helmet)"
echo "6. Regular dependency updates"
echo "7. Implement proper logging"
echo "8. Use prepared statements for database queries"
echo "9. Validate all inputs"
echo "10. Implement proper error handling"

exit 0 