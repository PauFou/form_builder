#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting Simple E2E test (Frontend + Webhook only)..."
echo ""
echo "ℹ️  This test runs without the Django backend"
echo ""

# Run the simple test
echo "🧪 Running simple E2E tests..."
pnpm playwright test e2e/simple-form.spec.ts --reporter=html,line

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "📊 View detailed report: pnpm test:e2e:report"
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "📊 View detailed report: pnpm test:e2e:report"
    echo "🐛 Debug with: pnpm test:e2e:ui"
fi

exit $TEST_EXIT_CODE