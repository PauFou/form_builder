#!/bin/bash
# Complete Test Suite - Validates everything before commit/push
# This script ensures all quality gates are met per CLAUDE.md requirements

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FAILED_TESTS=()
WARNINGS=()

# Timing
START_TIME=$(date +%s)

# Test level from argument
TEST_LEVEL=${1:-full}

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                       COMPREHENSIVE TEST SUITE                                    ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Test Level: ${YELLOW}${TEST_LEVEL}${NC}"
echo -e "Directory: ${ROOT_DIR}"
echo -e "Time: $(date)"
echo ""

# Function to run test with tracking
run_test() {
    local name=$1
    local cmd=$2
    local required=${3:-true}
    local working_dir=${4:-$ROOT_DIR}
    
    echo -e "\n${YELLOW}▶ Running: ${name}${NC}"
    
    pushd "$working_dir" > /dev/null
    
    if eval "$cmd" > /tmp/test_output_$$.log 2>&1; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
        rm -f /tmp/test_output_$$.log
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        if [ "$required" = "true" ]; then
            FAILED_TESTS+=("$name")
            echo -e "${YELLOW}Output from failed test:${NC}"
            tail -n 20 /tmp/test_output_$$.log
        else
            WARNINGS+=("$name")
        fi
        rm -f /tmp/test_output_$$.log
    fi
    
    popd > /dev/null
}

# Function to check service health
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ ${name} is ready${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo -e "${RED}✗ ${name} failed to start${NC}"
    return 1
}

# Phase 1: Code Quality & Static Analysis
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: CODE QUALITY & STATIC ANALYSIS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"

# Linting
run_test "ESLint" "pnpm lint"
run_test "Prettier Check" "pnpm format:check" true
run_test "TypeScript Compilation" "pnpm typecheck"

# Python/Django code quality
if [ -f "${ROOT_DIR}/services/api/requirements.txt" ]; then
    run_test "Python Linting (ruff)" "cd services/api && python -m ruff check ." false "${ROOT_DIR}"
    run_test "Python Type Check (mypy)" "cd services/api && source .venv/bin/activate && python -m mypy . --ignore-missing-imports" false "${ROOT_DIR}"
fi

# Phase 2: Unit Tests
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: UNIT TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"

# Frontend unit tests
run_test "Frontend Unit Tests" "pnpm test"

# Backend unit tests
if [ -f "${ROOT_DIR}/services/api/requirements.txt" ]; then
    echo -e "\n${YELLOW}▶ Setting up Python environment${NC}"
    cd "${ROOT_DIR}/services/api"
    
    # Setup virtual environment if needed
    if [ ! -f .venv/bin/activate ]; then
        python -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt
    else
        source .venv/bin/activate
    fi
    
    # Run Django tests including new security tests
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_forms"
    export DJANGO_SETTINGS_MODULE="api.settings"
    export SECRET_KEY="test-secret-key-for-ci"
    export DEBUG="False"
    
    run_test "Django Unit Tests" "DJANGO_SETTINGS_MODULE=api.settings_test_sqlite python manage.py test --verbosity=1" true "${ROOT_DIR}/services/api"
    
    # Run security tests specifically
    run_test "Auth Security Tests" "DJANGO_SETTINGS_MODULE=api.settings_test_sqlite python manage.py test core.tests.test_auth_security -v 2" true "${ROOT_DIR}/services/api"
    
    # Run webhook security tests
    if [ -f "${ROOT_DIR}/services/api/webhooks/tests/test_webhook_security.py" ]; then
        run_test "Webhook Security Tests" "DJANGO_SETTINGS_MODULE=api.settings_test_sqlite python manage.py test webhooks.tests.test_webhook_security -v 2" true "${ROOT_DIR}/services/api"
    fi
    
    cd "${ROOT_DIR}"
fi

# Phase 3: Integration Tests
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: INTEGRATION TESTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"

# Contract tests (skip if dependencies not available)
if [ -f "${ROOT_DIR}/tests/contracts/test_service_contracts.py" ]; then
    # Check dependencies using the API's virtual environment
    if cd "${ROOT_DIR}/services/api" && source .venv/bin/activate && python -c "import jsonschema, deepdiff" 2>/dev/null; then
        run_test "API Contract Tests" "cd services/api && source .venv/bin/activate && cd ../../tests/contracts && PYTHONPATH=${ROOT_DIR}/services/api python -m pytest test_service_contracts.py -v --tb=short -p no:django" true "${ROOT_DIR}"
        cd "${ROOT_DIR}"
    else
        echo -e "${YELLOW}▶ Skipping API Contract Tests (missing dependencies: jsonschema, deepdiff)${NC}"
    fi
fi

# Database integration tests
if [ "$TEST_LEVEL" = "full" ] && [ -f "${ROOT_DIR}/services/api/core/tests/test_integration_full_flow.py" ]; then
    run_test "Database Integration" "cd services/api && source .venv/bin/activate && DJANGO_SETTINGS_MODULE=api.settings_test_sqlite python manage.py test core.tests.test_integration_full_flow -v 2" true "${ROOT_DIR}"
fi

# Edge service tests (using mock tests that don't require running service)
if [ "$TEST_LEVEL" = "full" ] && [ -f "${ROOT_DIR}/services/ingest/tests/test_performance_mock.py" ]; then
    # Check if required dependencies are available using API's virtual environment
    if cd "${ROOT_DIR}/services/api" && source .venv/bin/activate && python -c "import httpx, psutil" 2>/dev/null; then
        run_test "Edge Service Tests (Mock)" "cd services/api && source .venv/bin/activate && cd ../../services/ingest && python -m pytest tests/test_performance_mock.py -v --tb=short -p no:django" true "${ROOT_DIR}"
        cd "${ROOT_DIR}"
    else
        echo -e "${YELLOW}▶ Skipping Edge Service Tests (missing dependencies: httpx, psutil)${NC}"
    fi
fi

# Phase 4: Performance Tests
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}PHASE 4: PERFORMANCE TESTS${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    
    # Bundle size checks
    run_test "Runtime Bundle Size (<30KB)" "cd packages/runtime && pnpm build && node ../../scripts/check-bundle-size.js" true "${ROOT_DIR}"
    
    # Analytics bundle check
    if [ -f "${ROOT_DIR}/scripts/check-bundle-size.js" ]; then
        run_test "Analytics Bundle Size" "node scripts/check-bundle-size.js" true "${ROOT_DIR}"
    fi
fi

# Phase 5: E2E Tests
if [ "$TEST_LEVEL" = "full" ]; then
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}PHASE 5: END-TO-END TESTS${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    
    # Use mock E2E tests instead of full service startup
    if [ -f "${ROOT_DIR}/scripts/test-e2e-mock.sh" ]; then
        run_test "E2E Tests (Mock)" "bash scripts/test-e2e-mock.sh" true "${ROOT_DIR}"
    else
        echo -e "${YELLOW}⚠️  Mock E2E tests not found${NC}"
    fi
fi

# Phase 6: Security & Accessibility
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}PHASE 6: SECURITY & ACCESSIBILITY${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    
    # NPM audit
    run_test "NPM Security Audit" "pnpm audit --audit-level=high" false
    
    # Python security
    if [ -f "${ROOT_DIR}/services/api/requirements.txt" ]; then
        cd "${ROOT_DIR}/services/api"
        source .venv/bin/activate
        run_test "Python Security Scan" "pip install safety && safety check" false "${ROOT_DIR}/services/api"
        cd "${ROOT_DIR}"
    fi
    
    # Accessibility check (WCAG AA)
    if [ -f "${ROOT_DIR}/scripts/test-a11y.js" ]; then
        run_test "Accessibility WCAG AA" "node scripts/test-a11y.js" true
    fi
fi

# Phase 7: Build Validation
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 7: BUILD VALIDATION${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"

run_test "Production Build" "pnpm build"

# Summary Report
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                              TEST SUMMARY                                         ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Warnings (non-blocking):${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "   - ${warning}"
        done
    fi
    
    echo -e "\n${BLUE}Test Statistics:${NC}"
    echo -e "   Duration: ${MINUTES}m ${SECONDS}s"
    echo -e "   Test Level: ${TEST_LEVEL}"
    echo ""
    echo -e "${GREEN}✅ Your code is ready to commit! 🚀${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED:${NC}"
    echo ""
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "   ${RED}✗${NC} ${test}"
    done
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  Additional warnings:${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "   - ${warning}"
        done
    fi
    
    echo -e "\n${BLUE}Test Statistics:${NC}"
    echo -e "   Duration: ${MINUTES}m ${SECONDS}s"
    echo -e "   Failed: ${#FAILED_TESTS[@]}"
    echo -e "   Warnings: ${#WARNINGS[@]}"
    echo ""
    echo -e "${YELLOW}Please fix the failing tests before committing.${NC}"
    echo -e "${YELLOW}Run individual tests for more details.${NC}"
    exit 1
fi