#!/bin/bash

# Quick pre-push validation that matches CI

echo "🚀 Pre-push validation..."
echo "========================"

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")/.." || exit 1

# 1. Code quality
echo "→ Checking code quality..."
pnpm lint > /dev/null 2>&1 && echo -e "${GREEN}✓ Lint passed${NC}" || { echo -e "${RED}✗ Lint failed${NC}"; exit 1; }
pnpm typecheck > /dev/null 2>&1 && echo -e "${GREEN}✓ TypeScript passed${NC}" || { echo -e "${RED}✗ TypeScript failed${NC}"; exit 1; }
pnpm format:check > /dev/null 2>&1 && echo -e "${GREEN}✓ Formatting passed${NC}" || { echo -e "${RED}✗ Formatting failed${NC}"; exit 1; }

# 2. Frontend tests
echo "→ Running frontend tests..."
pnpm test:ci > /dev/null 2>&1 && echo -e "${GREEN}✓ Frontend tests passed${NC}" || { echo -e "${RED}✗ Frontend tests failed${NC}"; exit 1; }

# 3. Backend tests
echo "→ Running backend tests..."
bash scripts/run-backend-tests-smart.sh > /dev/null 2>&1 && echo -e "${GREEN}✓ Backend tests passed${NC}" || { echo -e "${RED}✗ Backend tests failed${NC}"; exit 1; }

# 4. E2E tests (basic)
echo "→ Running E2E tests..."
pnpm test:e2e --project=chromium --grep="Simple Form" > /dev/null 2>&1 && echo -e "${GREEN}✓ E2E tests passed${NC}" || { echo -e "${RED}✗ E2E tests failed${NC}"; exit 1; }

echo ""
echo -e "${GREEN}✅ All checks passed! Safe to push.${NC}"