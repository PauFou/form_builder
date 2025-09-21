#!/bin/bash

# Suite de Tests Locaux - Remplace GitHub Actions
# Ce script exécute tous les tests localement

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
    
    # Runtime bundle
    cd packages/runtime
    if pnpm size; then
        echo -e "${GREEN}✅ Runtime bundle size check passed${NC}"
    else
        echo -e "${RED}❌ Runtime bundle size exceeds limit${NC}"
        FAILED_TESTS+=("Runtime Bundle Size")
    fi
    cd ../..
    
    # Analytics bundle
    if [ -f scripts/check-bundle-size.js ]; then
        echo -e "\n${YELLOW}▶ Analytics Bundle Size Check${NC}"
        if node scripts/check-bundle-size.js; then
            echo -e "${GREEN}✅ Analytics bundle size check passed${NC}"
        else
            echo -e "${RED}❌ Analytics bundle size exceeds limit${NC}"
            FAILED_TESTS+=("Analytics Bundle Size")
        fi
    fi
fi

# 4. Docker Build Validation
if [ "$TEST_LEVEL" = "full" ] && command -v docker &> /dev/null; then
    echo -e "\n${BLUE}═══ DOCKER BUILD VALIDATION ═══${NC}"
    
    # API Docker build
    run_test "API Docker Build" "docker build -f services/api/Dockerfile services/api" false
    
    # Analytics Docker build
    if [ -f services/analytics/Dockerfile ]; then
        run_test "Analytics Docker Build" "docker build -f services/analytics/Dockerfile services/analytics" false
    fi
fi

# 5. Integration Tests
if [ "$TEST_LEVEL" = "full" ]; then
    echo -e "\n${BLUE}═══ INTEGRATION TESTS ═══${NC}"
    
    # Start services for E2E tests
    echo -e "${YELLOW}Starting services for E2E tests...${NC}"
    
    # Start webhook receiver
    (cd services/webhook-receiver && pnpm dev > /dev/null 2>&1) &
    WEBHOOK_PID=$!
    
    # Start marketing app
    (cd apps/marketing && pnpm dev > /dev/null 2>&1) &
    MARKETING_E2E_PID=$!
    
    # Start builder app  
    (cd apps/builder && pnpm dev > /dev/null 2>&1) &
    BUILDER_E2E_PID=$!
    
    # Start API
    (cd services/api && source .venv/bin/activate && python manage.py runserver > /dev/null 2>&1) &
    API_PID=$!
    
    # Wait for services
    echo "Waiting for services to start..."
    sleep 15
    
    # Playwright E2E tests
    if command -v playwright &> /dev/null; then
        run_test "E2E Tests" "pnpm test:e2e"
    else
        echo -e "${YELLOW}⚠️  Playwright not installed, skipping E2E tests${NC}"
        echo "Run: pnpm playwright install --with-deps chromium"
    fi
    
    # Cleanup
    echo -e "\n${YELLOW}Stopping services...${NC}"
    [ ! -z "$WEBHOOK_PID" ] && kill $WEBHOOK_PID 2>/dev/null
    [ ! -z "$MARKETING_E2E_PID" ] && kill $MARKETING_E2E_PID 2>/dev/null
    [ ! -z "$BUILDER_E2E_PID" ] && kill $BUILDER_E2E_PID 2>/dev/null
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null
fi

# 6. Contract Tests
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ CONTRACT TESTS ═══${NC}"
    
    # Run contract tests to ensure API/frontend synchronization
    run_test "Contract Tests" "pnpm test:contracts"
fi

# 7. Accessibility Tests
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ ACCESSIBILITY (WCAG AA) ═══${NC}"
    
    echo -e "${YELLOW}Starting services for accessibility testing...${NC}"
    
    # Start services in background
    MARKETING_PID=""
    BUILDER_PID=""
    
    if [ "$TEST_LEVEL" = "full" ]; then
        # Start marketing app
        (cd apps/marketing && pnpm dev > /dev/null 2>&1) &
        MARKETING_PID=$!
        
        # Start builder app
        (cd apps/builder && pnpm dev > /dev/null 2>&1) &
        BUILDER_PID=$!
        
        # Wait for services to be ready
        sleep 10
        
        # Run accessibility tests
        if node scripts/test-a11y.js; then
            echo -e "${GREEN}✅ Accessibility tests passed${NC}"
        else
            echo -e "${RED}❌ Accessibility tests failed${NC}"
            FAILED_TESTS+=("Accessibility (WCAG AA)")
        fi
        
        # Cleanup services
        [ ! -z "$MARKETING_PID" ] && kill $MARKETING_PID 2>/dev/null
        [ ! -z "$BUILDER_PID" ] && kill $BUILDER_PID 2>/dev/null
    else
        echo -e "${YELLOW}⚠️  Skipping accessibility tests (requires full test mode)${NC}"
    fi
fi

# 8. Security Checks
if [ "$TEST_LEVEL" != "quick" ]; then
    echo -e "\n${BLUE}═══ SECURITY CHECKS ═══${NC}"
    
    # Check for vulnerable dependencies (Frontend)
    run_test "NPM Dependency Audit" "pnpm audit --audit-level=high" false
    
    # Check for Python vulnerabilities
    if [ -f services/api/.venv/bin/activate ]; then
        echo -e "\n${YELLOW}▶ Python Security Scan${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        cd services/api
        source .venv/bin/activate
        
        # Install safety if not present
        pip install -q safety 2>/dev/null || true
        
        if safety check --json; then
            echo -e "${GREEN}✅ Python dependencies are secure${NC}"
        else
            echo -e "${YELLOW}⚠️  Python security vulnerabilities found${NC}"
            if [ "$TEST_LEVEL" = "full" ]; then
                FAILED_TESTS+=("Python Security")
            fi
        fi
        
        cd ../..
    fi
    
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
    echo -e "\n${YELLOW}Corrigez les tests échoués avant de commiter.${NC}"
    exit 1
fi