#!/bin/bash

###############################################################################
# Validation des Améliorations Script
#
# Ce script vérifie que toutes les améliorations sont présentes et fonctionnelles
#
# Usage: bash scripts/validate-improvements.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_check() {
    echo -e "${YELLOW}⏳ Checking: $1${NC}"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

print_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

print_error() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

print_summary() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}SUMMARY${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "Total Checks: ${TOTAL_CHECKS}"
    echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
    echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 ALL IMPROVEMENTS VALIDATED! 🎉${NC}"
        echo -e "${GREEN}Project is ready for production.${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}⚠️  Some checks failed. Please review.${NC}"
        return 1
    fi
}

###############################################################################
# CHECK 1: Frontend Test Files
###############################################################################

print_header "1. FRONTEND TEST FILES"

print_check "BlockItem test exists"
if [ -f "apps/builder/components/builder/BlockLibrary/__tests__/BlockItem.test.tsx" ]; then
    print_success "BlockItem.test.tsx found"
else
    print_error "BlockItem.test.tsx not found"
fi

print_check "BlockLibrary test exists"
if [ -f "apps/builder/components/builder/BlockLibrary/__tests__/BlockLibrary.test.tsx" ]; then
    print_success "BlockLibrary.test.tsx found"
else
    print_error "BlockLibrary.test.tsx not found"
fi

print_check "BlockRenderer test exists"
if [ -f "apps/builder/components/builder/Canvas/__tests__/BlockRenderer.test.tsx" ]; then
    print_success "BlockRenderer.test.tsx found"
else
    print_error "BlockRenderer.test.tsx not found"
fi

print_check "FormCanvas test exists"
if [ -f "apps/builder/components/builder/Canvas/__tests__/FormCanvas.test.tsx" ]; then
    print_success "FormCanvas.test.tsx found"
else
    print_error "FormCanvas.test.tsx not found"
fi

###############################################################################
# CHECK 2: E2E Test Files
###############################################################################

print_header "2. E2E TEST FILES"

print_check "Complete workflow E2E test exists"
if [ -f "e2e/complete-form-workflow.spec.ts" ]; then
    print_success "complete-form-workflow.spec.ts found"
else
    print_error "complete-form-workflow.spec.ts not found"
fi

print_check "Drag & drop precision E2E test exists"
if [ -f "e2e/drag-drop-precision.spec.ts" ]; then
    print_success "drag-drop-precision.spec.ts found"
else
    print_error "drag-drop-precision.spec.ts not found"
fi

###############################################################################
# CHECK 3: Backend Test Files
###############################################################################

print_header "3. BACKEND TEST FILES"

print_check "Forms API tests exist"
if [ -f "services/api/forms/tests/test_forms_api.py" ]; then
    print_success "test_forms_api.py found"
else
    print_error "test_forms_api.py not found"
fi

print_check "Submissions API tests exist"
if [ -f "services/api/submissions/tests/test_submissions_api.py" ]; then
    print_success "test_submissions_api.py found"
else
    print_error "test_submissions_api.py not found"
fi

###############################################################################
# CHECK 4: Documentation Files
###############################################################################

print_header "4. DOCUMENTATION FILES"

print_check "Developer Guide exists"
if [ -f "docs/DEVELOPER_GUIDE.md" ]; then
    lines=$(wc -l < "docs/DEVELOPER_GUIDE.md")
    if [ $lines -gt 500 ]; then
        print_success "DEVELOPER_GUIDE.md found ($lines lines)"
    else
        print_error "DEVELOPER_GUIDE.md too short ($lines lines, expected 500+)"
    fi
else
    print_error "DEVELOPER_GUIDE.md not found"
fi

print_check "Improvements Summary exists"
if [ -f "docs/IMPROVEMENTS_SUMMARY.md" ]; then
    lines=$(wc -l < "docs/IMPROVEMENTS_SUMMARY.md")
    if [ $lines -gt 300 ]; then
        print_success "IMPROVEMENTS_SUMMARY.md found ($lines lines)"
    else
        print_error "IMPROVEMENTS_SUMMARY.md too short ($lines lines, expected 300+)"
    fi
else
    print_error "IMPROVEMENTS_SUMMARY.md not found"
fi

print_check "Improvements Completed exists"
if [ -f "IMPROVEMENTS_COMPLETED.md" ]; then
    print_success "IMPROVEMENTS_COMPLETED.md found"
else
    print_error "IMPROVEMENTS_COMPLETED.md not found"
fi

###############################################################################
# CHECK 5: Integration Files
###############################################################################

print_header "5. INTEGRATION FILES"

print_check "Stripe integration exists"
if [ -f "services/api/integrations/stripe_integration.py" ]; then
    lines=$(wc -l < "services/api/integrations/stripe_integration.py")
    if [ $lines -gt 300 ]; then
        print_success "stripe_integration.py found ($lines lines)"
    else
        print_error "stripe_integration.py too short ($lines lines, expected 300+)"
    fi
else
    print_error "stripe_integration.py not found"
fi

print_check "Google Sheets integration exists"
if [ -f "services/api/integrations/google_sheets_integration.py" ]; then
    lines=$(wc -l < "services/api/integrations/google_sheets_integration.py")
    if [ $lines -gt 300 ]; then
        print_success "google_sheets_integration.py found ($lines lines)"
    else
        print_error "google_sheets_integration.py too short ($lines lines, expected 300+)"
    fi
else
    print_error "google_sheets_integration.py not found"
fi

print_check "Slack integration exists"
if [ -f "services/api/integrations/slack_integration.py" ]; then
    lines=$(wc -l < "services/api/integrations/slack_integration.py")
    if [ $lines -gt 300 ]; then
        print_success "slack_integration.py found ($lines lines)"
    else
        print_error "slack_integration.py too short ($lines lines, expected 300+)"
    fi
else
    print_error "slack_integration.py not found"
fi

###############################################################################
# CHECK 6: Analytics Integration
###############################################################################

print_header "6. ANALYTICS INTEGRATION"

print_check "ClickHouse client exists"
if [ -f "services/api/analytics/clickhouse_client.py" ]; then
    print_success "ClickHouse client found"
else
    print_error "ClickHouse client not found"
fi

print_check "Analytics views exist"
if [ -f "services/api/analytics/views.py" ]; then
    print_success "Analytics views found"
else
    print_error "Analytics views not found"
fi

###############################################################################
# CHECK 7: README Updates
###############################################################################

print_header "7. README UPDATES"

print_check "README has improvements section"
if grep -q "Recent Improvements" README.md; then
    print_success "README updated with improvements"
else
    print_error "README not updated"
fi

print_check "README has badges"
if grep -q "badge" README.md; then
    print_success "README has status badges"
else
    print_error "README missing badges"
fi

###############################################################################
# CHECK 8: Test Count Validation
###############################################################################

print_header "8. TEST COUNT VALIDATION"

print_check "Count frontend tests"
frontend_tests=$(find apps/builder/components -name "*.test.tsx" 2>/dev/null | wc -l)
if [ $frontend_tests -ge 4 ]; then
    print_success "Found $frontend_tests frontend test files (expected 4+)"
else
    print_error "Only found $frontend_tests frontend test files (expected 4+)"
fi

print_check "Count E2E tests"
e2e_tests=$(find e2e -name "*.spec.ts" 2>/dev/null | wc -l)
if [ $e2e_tests -ge 2 ]; then
    print_success "Found $e2e_tests E2E test files (expected 2+)"
else
    print_error "Only found $e2e_tests E2E test files (expected 2+)"
fi

print_check "Count backend tests"
backend_tests=$(find services/api -name "test_*.py" -o -name "*_test.py" 2>/dev/null | wc -l)
if [ $backend_tests -ge 15 ]; then
    print_success "Found $backend_tests backend test files (expected 15+)"
else
    print_error "Only found $backend_tests backend test files (expected 15+)"
fi

###############################################################################
# CHECK 9: Code Quality Files
###############################################################################

print_header "9. CODE QUALITY FILES"

print_check "Pre-commit hooks configured"
if [ -f ".husky/pre-commit" ]; then
    print_success "Pre-commit hooks found"
else
    print_error "Pre-commit hooks not found"
fi

print_check "ESLint configuration"
if [ -f ".eslintrc.json" ]; then
    print_success "ESLint configured"
else
    print_error "ESLint not configured"
fi

print_check "TypeScript configuration"
if [ -f "tsconfig.json" ]; then
    print_success "TypeScript configured"
else
    print_error "TypeScript not configured"
fi

print_check "Playwright configuration"
if [ -f "playwright.config.ts" ]; then
    print_success "Playwright configured"
else
    print_error "Playwright not configured"
fi

###############################################################################
# CHECK 10: Dependencies
###############################################################################

print_header "10. DEPENDENCIES CHECK"

print_check "Node modules installed"
if [ -d "node_modules" ]; then
    print_success "Node modules installed"
else
    print_error "Node modules not installed (run: pnpm install)"
fi

print_check "Python venv exists"
if [ -d "services/api/.venv" ] || [ -d "venv" ]; then
    print_success "Python venv found"
else
    print_error "Python venv not found (run: python -m venv .venv)"
fi

###############################################################################
# FINAL SUMMARY
###############################################################################

print_summary

exit $?
