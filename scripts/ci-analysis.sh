#!/bin/bash

# Script to analyze CI failures and provide a comprehensive report

set -e

echo "================================================"
echo "CI Failure Analysis Report"
echo "================================================"
echo "Date: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. ENVIRONMENT CHECK${NC}"
echo "================================================"
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Python version: $(python3 --version)"
echo "Current directory: $(pwd)"
echo "Git branch: $(git branch --show-current)"
echo ""

echo -e "${BLUE}2. DEPENDENCY CHECK${NC}"
echo "================================================"
# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules exists${NC}"
else
    echo -e "${RED}✗ node_modules missing${NC}"
fi

# Check lockfile status
echo "Checking pnpm lockfile..."
pnpm install --frozen-lockfile --dry-run 2>&1 | head -10 || echo -e "${RED}Lockfile issues detected${NC}"
echo ""

echo -e "${BLUE}3. LINT ISSUES SUMMARY${NC}"
echo "================================================"
echo "Running lint check and counting issues..."
pnpm lint 2>&1 | grep -E "error|warning" | wc -l | xargs -I {} echo "Total lint issues: {}"
echo ""

echo -e "${BLUE}4. TYPECHECK ISSUES SUMMARY${NC}"
echo "================================================"
echo "Running typecheck and counting errors..."
pnpm typecheck 2>&1 | grep -E "error TS" | wc -l | xargs -I {} echo "Total TypeScript errors: {}"
echo ""

echo -e "${BLUE}5. PRETTIER ISSUES${NC}"
echo "================================================"
pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}" 2>&1 | grep -E "^\[warn\]" | wc -l | xargs -I {} echo "Files with formatting issues: {}"
echo ""
echo "Files needing formatting:"
pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}" 2>&1 | grep -E "^\[warn\]" || echo "None found"
echo ""

echo -e "${BLUE}6. SPECIFIC JOB FAILURES${NC}"
echo "================================================"

# Check each CI job step
echo -e "${YELLOW}Code Quality Job:${NC}"
echo "1. Install dependencies: $(pnpm install --frozen-lockfile > /dev/null 2>&1 && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "2. Lint: $(pnpm lint > /dev/null 2>&1 && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "3. Typecheck: $(pnpm typecheck > /dev/null 2>&1 && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo "4. Format check: $(pnpm prettier --check '**/*.{ts,tsx,js,jsx,json,md}' > /dev/null 2>&1 && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
echo ""

echo -e "${BLUE}7. RECOMMENDED FIXES${NC}"
echo "================================================"

# Check for TypeScript errors
if pnpm typecheck 2>&1 | grep -q "error TS"; then
    echo -e "${YELLOW}TypeScript Errors Found:${NC}"
    echo "- Fix type errors in @forms/builder package"
    echo "- Run: pnpm typecheck to see full list"
    echo ""
fi

# Check for formatting issues
if ! pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}" > /dev/null 2>&1; then
    echo -e "${YELLOW}Formatting Issues Found:${NC}"
    echo "- Run: pnpm prettier --write '**/*.{ts,tsx,js,jsx,json,md}'"
    echo "- Or fix individually: pnpm prettier --write .claude/settings.local.json"
    echo ""
fi

# Check for lint warnings
if pnpm lint 2>&1 | grep -q "warning"; then
    echo -e "${YELLOW}Lint Warnings Found:${NC}"
    echo "- Most are 'any' type warnings in @forms/runtime"
    echo "- Consider adding proper types or disabling specific rules"
    echo ""
fi

echo -e "${BLUE}8. QUICK FIX COMMANDS${NC}"
echo "================================================"
echo "To fix all issues at once, run:"
echo ""
echo "# Fix formatting"
echo "pnpm prettier --write '**/*.{ts,tsx,js,jsx,json,md}'"
echo ""
echo "# Fix TypeScript errors"
echo "# (Manual fixes required - see pnpm typecheck output)"
echo ""
echo "# After fixes, verify with:"
echo "pnpm lint && pnpm typecheck && pnpm prettier --check '**/*.{ts,tsx,js,jsx,json,md}'"
echo ""

echo "================================================"
echo "End of Analysis"
echo "================================================"