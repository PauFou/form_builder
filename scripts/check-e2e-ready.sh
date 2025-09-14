#!/bin/bash

# Script to verify E2E tests are ready before CI
# This helps catch common E2E failures locally

set -e

echo "🎭 Checking E2E Test Readiness"
echo "=============================="

cd "$(dirname "$0")/.." || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if main landmarks exist in key pages
echo ""
echo "→ Checking accessibility landmarks..."

# Check marketing app
if [ -f "apps/marketing/app/page.tsx" ]; then
    if grep -q "<main" apps/marketing/app/page.tsx; then
        echo -e "${GREEN}✓ Marketing page has <main> landmark${NC}"
    else
        echo -e "${RED}✗ Marketing page missing <main> landmark${NC}"
        echo "  Add <main> wrapper to apps/marketing/app/page.tsx"
        exit 1
    fi
fi

# Check builder app
if [ -f "apps/builder/app/page.tsx" ]; then
    if grep -q "<main" apps/builder/app/page.tsx; then
        echo -e "${GREEN}✓ Builder page has <main> landmark${NC}"
    else
        echo -e "${RED}✗ Builder page missing <main> landmark${NC}"
        echo "  Add <main> wrapper to apps/builder/app/page.tsx"
        exit 1
    fi
fi

# Check if apps have proper HTML attributes
echo ""
echo "→ Checking HTML attributes..."

for layout in apps/*/app/layout.tsx; do
    if [ -f "$layout" ]; then
        app_name=$(basename $(dirname $(dirname "$layout")))
        if grep -q 'lang=' "$layout"; then
            echo -e "${GREEN}✓ $app_name has lang attribute${NC}"
        else
            echo -e "${YELLOW}⚠ $app_name might be missing lang attribute${NC}"
        fi
    fi
done

# Check viewport meta tag setup
echo ""
echo "→ Checking viewport configuration..."

for metadata in apps/*/app/layout.tsx apps/*/app/metadata.ts; do
    if [ -f "$metadata" ]; then
        app_name=$(basename $(dirname $(dirname "$metadata")))
        if grep -q "viewport" "$metadata"; then
            echo -e "${GREEN}✓ $app_name has viewport configuration${NC}"
        fi
    fi
done

# Quick E2E test run
echo ""
echo "→ Running quick E2E accessibility test..."

# Build if needed
if [ ! -d "apps/marketing/.next" ] || [ ! -d "apps/builder/.next" ]; then
    echo "Building apps first..."
    pnpm build
fi

# Run just the accessibility test
pnpm test:e2e --project=chromium --grep="accessibility" || {
    echo -e "\n${RED}❌ E2E accessibility test failed!${NC}"
    echo "Common fixes:"
    echo "1. Ensure all pages have <main> landmarks"
    echo "2. Check that HTML has lang attribute"
    echo "3. Verify viewport meta tag is set"
    echo ""
    echo "Run the full test to see details:"
    echo "  pnpm test:e2e --project=chromium --grep='accessibility'"
    exit 1
}

echo ""
echo -e "${GREEN}✅ E2E tests are ready!${NC}"