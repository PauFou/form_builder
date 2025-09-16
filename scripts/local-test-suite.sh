#!/bin/bash

# Local Test Suite - Replaces GitHub Actions
# This script runs all tests that were previously run in CI

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timing
START_TIME=$(date +%s)

# Test level (quick, standard, full)
TEST_LEVEL=${1:-standard}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                           LOCAL TEST SUITE                                        ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Test Level: ${YELLOW}${TEST_LEVEL}${NC}"
echo -e "Time: $(date)"
echo ""

# Track failures
FAILED_TESTS=()

# Function to run a test and track failures
run_test() {
    local name=$1
    local cmd=$2
    local required=${3:-true}
    
    echo -e "\n${YELLOW}▶ ${name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if eval "$cmd"; then
        echo -e "${GREEN}✅ ${name} passed${NC}"
    else
        echo -e "${RED}❌ ${name} failed${NC}"
        if [ "$required" = "true" ]; then
            FAILED_TESTS+=("$name")
        fi
    fi
}

# 1. Code Quality Checks
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ CODE QUALITY ═══${NC}"
    
    # Lint
    run_test "ESLint" "pnpm lint"
    
    # TypeScript
    run_test "TypeScript Check" "pnpm typecheck"
    
    # Prettier
    run_test "Code Formatting" "pnpm format:check"
fi

# 2. Unit Tests
echo -e "\n${BLUE}═══ UNIT TESTS ═══${NC}"

# Frontend tests
run_test "Frontend Tests" "pnpm test:ci"

# Backend tests (Python/Django)
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${YELLOW}▶ Backend Tests (Django)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd services/api
    
    # Activate virtual environment if it exists
    if [ -f .venv/bin/activate ]; then
        source .venv/bin/activate
    fi
    
    # Setup test database
    export CI=true
    export POSTGRES_HOST=127.0.0.1
    export POSTGRES_USER=test
    export POSTGRES_PASSWORD=test
    export POSTGRES_DB=test
    export POSTGRES_PORT=5432
    export DJANGO_SETTINGS_MODULE=api.settings_test
    
    # Ensure test database exists
    if command -v psql &> /dev/null; then
        PGPASSWORD=test psql -h 127.0.0.1 -U test -d postgres -c "" 2>/dev/null || {
            echo "Setting up test database..."
            python setup_postgres_ci.py
        }
    fi
    
    # Run Django tests
    if python -m pytest -xvs --reuse-db --cov=. --cov-report=term --cov-report=html; then
        echo -e "${GREEN}✅ Backend tests passed${NC}"
        
        # Check coverage
        COVERAGE=$(python -m coverage report | tail -n 1 | awk '{print $4}' | sed 's/%//')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo -e "${YELLOW}⚠️  Backend coverage is ${COVERAGE}% (minimum: 80%)${NC}"
            FAILED_TESTS+=("Backend Coverage")
        fi
    else
        echo -e "${RED}❌ Backend tests failed${NC}"
        FAILED_TESTS+=("Backend Tests")
    fi
    
    cd ../..
fi

# 3. Build Tests
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ BUILD TESTS ═══${NC}"
    
    # Build all packages
    run_test "Build Packages" "pnpm build"
    
    # Check bundle sizes
    echo -e "\n${YELLOW}▶ Bundle Size Check${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cd packages/runtime
    if pnpm size; then
        echo -e "${GREEN}✅ Bundle size check passed${NC}"
    else
        echo -e "${RED}❌ Bundle size exceeds limit${NC}"
        FAILED_TESTS+=("Bundle Size")
    fi
    cd ../..
fi

# 4. Integration Tests
if [ "$TEST_LEVEL" = "full" ]; then
    echo -e "\n${BLUE}═══ INTEGRATION TESTS ═══${NC}"
    
    # Playwright E2E tests (only if Playwright is installed)
    if command -v playwright &> /dev/null; then
        run_test "E2E Tests" "pnpm test:e2e" false
    else
        echo -e "${YELLOW}⚠️  Playwright not installed, skipping E2E tests${NC}"
    fi
fi

# 5. Security Checks
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ SECURITY CHECKS ═══${NC}"
    
    # Check for vulnerable dependencies
    run_test "Dependency Audit" "pnpm audit --production" false
    
    # Check for secrets
    if command -v gitleaks &> /dev/null; then
        run_test "Secret Scanning" "gitleaks detect --source . --verbose" false
    fi
fi

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                           TEST SUMMARY                                           ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "Duration: ${DURATION}s"
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "   - ${test}"
    done
    echo -e "\nDuration: ${DURATION}s"
    echo -e "\n${YELLOW}Fix the failing tests before pushing.${NC}"
    exit 1
fi