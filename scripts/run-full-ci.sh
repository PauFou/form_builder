#!/bin/bash

echo "🚀 Running Full CI Workflow Locally"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_PASSED=true

# Change to project root
cd "$(dirname "$0")/.." || exit 1

echo ""
echo "📦 1/8: Installing dependencies..."
if pnpm install --frozen-lockfile; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    ALL_PASSED=false
fi

echo ""
echo "🔍 2/8: Running linter..."
if pnpm lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}✗ Linting failed${NC}"
    ALL_PASSED=false
fi

echo ""
echo "📝 3/8: Running TypeScript checks..."
if pnpm typecheck; then
    echo -e "${GREEN}✓ TypeScript checks passed${NC}"
else
    echo -e "${RED}✗ TypeScript checks failed${NC}"
    ALL_PASSED=false
fi

echo ""
echo "🎨 4/8: Running Prettier checks..."
if pnpm prettier --check .; then
    echo -e "${GREEN}✓ Prettier formatting passed${NC}"
else
    echo -e "${RED}✗ Prettier formatting failed${NC}"
    ALL_PASSED=false
fi

echo ""
echo "🧪 5/8: Running frontend tests..."
if pnpm test:ci; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    ALL_PASSED=false
fi

echo ""
echo "🐍 6/8: Running backend tests..."
if cd services/api && source .venv/bin/activate && DJANGO_SETTINGS_MODULE=api.settings_test SECRET_KEY="test-secret-key-for-ci" JWT_SECRET="test-jwt-secret" HMAC_SECRET="test-hmac-secret" pytest; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
    cd ../..
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    cd ../..
    ALL_PASSED=false
fi

echo ""
echo "📊 7/8: Running performance checks..."
if pnpm --filter @forms/runtime build && pnpm --filter @forms/runtime size; then
    echo -e "${GREEN}✓ Performance budgets passed${NC}"
else
    echo -e "${RED}✗ Performance budgets failed${NC}"
    ALL_PASSED=false
fi

echo ""
echo "♿ 8/8: Running accessibility checks..."
# Note: This is a placeholder. Real a11y tests would use tools like axe-core
echo -e "${YELLOW}⚠ Accessibility checks not yet implemented${NC}"

echo ""
echo "=================================="
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ All CI checks passed!${NC}"
    echo "Safe to commit and push."
    exit 0
else
    echo -e "${RED}❌ Some CI checks failed!${NC}"
    echo "Please fix the issues before committing."
    exit 1
fi