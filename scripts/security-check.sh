#!/bin/bash

echo "🔒 Running Security Checks..."
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Environment file permissions
echo -n "Checking .env file permissions... "
if [ -f ".env" ]; then
    PERMS=$(stat -f "%Lp" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✓ Secure (600)${NC}"
    else
        echo -e "${RED}✗ Insecure ($PERMS) - Run: chmod 600 .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No .env file found${NC}"
fi

# Check 2: Secret key strength
echo -n "Checking secret keys in .env.example... "
if [ -f .env.example ] && grep -q "django-insecure" .env.example 2>/dev/null; then
    echo -e "${YELLOW}⚠ Weak example keys found - Ensure production uses strong keys${NC}"
else
    echo -e "${GREEN}✓ No weak keys in example${NC}"
fi

# Check 3: Debug mode
echo -n "Checking DEBUG setting... "
if grep -q "DEBUG.*default=True" services/api/api/settings.py 2>/dev/null; then
    echo -e "${YELLOW}⚠ DEBUG defaults to True - Ensure it's False in production${NC}"
else
    echo -e "${GREEN}✓ DEBUG setting looks safe${NC}"
fi

# Check 4: Dependencies vulnerabilities
echo -n "Checking Python dependencies... "
if command -v safety &> /dev/null || [ -f .venv/bin/safety ]; then
    echo -e "${GREEN}✓ Safety tool is installed${NC}"
else
    echo -e "${YELLOW}⚠ Safety not installed - Run: pip install safety${NC}"
fi

# Check 5: npm audit
echo -n "Checking npm dependencies... "
NPM_AUDIT=$(pnpm audit --audit-level=high 2>&1)
if echo "$NPM_AUDIT" | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✓ No high/critical vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠ Run 'pnpm audit' for details${NC}"
fi

# Check 6: HTTPS enforcement
echo -n "Checking HTTPS settings... "
if grep -q "SECURE_SSL_REDIRECT.*True" services/api/api/settings_production.py 2>/dev/null; then
    echo -e "${GREEN}✓ HTTPS enforced in production settings${NC}"
else
    echo -e "${YELLOW}⚠ Ensure HTTPS is enforced in production${NC}"
fi

# Check 7: CORS configuration
echo -n "Checking CORS settings... "
if grep -q "CORS_ALLOW_ALL_ORIGINS.*True" services/api/api/settings.py 2>/dev/null; then
    echo -e "${RED}✗ CORS allows all origins - This is insecure!${NC}"
else
    echo -e "${GREEN}✓ CORS restricted to specific origins${NC}"
fi

# Check 8: File upload validation
echo -n "Checking file upload security... "
if grep -q "ALLOWED_FILE_EXTENSIONS" services/api/api/settings_production.py 2>/dev/null; then
    echo -e "${GREEN}✓ File extension whitelist configured${NC}"
else
    echo -e "${YELLOW}⚠ Configure file upload restrictions${NC}"
fi

# Check 9: Rate limiting
echo -n "Checking rate limiting... "
if grep -q "ratelimit" services/api/api/settings.py 2>/dev/null; then
    echo -e "${GREEN}✓ Rate limiting configured${NC}"
else
    echo -e "${YELLOW}⚠ Consider implementing rate limiting${NC}"
fi

# Check 10: Webhook HMAC
echo -n "Checking webhook security... "
if grep -q "hmac.compare_digest" ./webhooks/webhook_receiver.py 2>/dev/null || grep -q "hmac.compare_digest" ./webhooks/tasks.py 2>/dev/null || grep -q "hmac.compare_digest" services/api/webhooks/webhook_receiver.py 2>/dev/null; then
    echo -e "${GREEN}✓ HMAC validation implemented${NC}"
else
    echo -e "${RED}✗ Webhook HMAC validation missing${NC}"
fi

echo ""
echo "============================"
echo "Security check complete!"
echo ""
echo "📌 Production Checklist:"
echo "  - [ ] Use strong, unique secrets (50+ chars)"
echo "  - [ ] Set DEBUG=False"
echo "  - [ ] Configure proper ALLOWED_HOSTS"
echo "  - [ ] Enable HTTPS everywhere"
echo "  - [ ] Set up proper CORS origins"
echo "  - [ ] Configure CSP headers"
echo "  - [ ] Enable rate limiting"
echo "  - [ ] Set up monitoring/alerting"
echo "  - [ ] Regular dependency updates"
echo "  - [ ] Implement backup strategy"