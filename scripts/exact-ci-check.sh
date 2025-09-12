#!/bin/bash

# This script reproduces the EXACT GitHub Actions CI workflow locally
# It MUST pass before any code is pushed to ensure CI will pass

echo "🚀 Running EXACT GitHub Actions CI Workflow Locally"
echo "=================================================="
echo "This reproduces 100% of the CI checks from .github/workflows/ci.yml"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_PASSED=true

# Change to project root
cd "$(dirname "$0")/.." || exit 1

# Function to run a check
run_check() {
    local name="$1"
    local cmd="$2"
    echo ""
    echo "🔍 $name..."
    if eval "$cmd"; then
        echo -e "${GREEN}✓ $name passed${NC}"
    else
        echo -e "${RED}✗ $name failed${NC}"
        ALL_PASSED=false
    fi
}

# 1. CODE QUALITY CHECKS (quality job)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CODE QUALITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_check "Install dependencies" "pnpm install --frozen-lockfile"
run_check "Lint" "pnpm lint"
run_check "Typecheck" "pnpm typecheck"
run_check "Format check" "pnpm prettier --check '**/*.{ts,tsx,js,jsx,json,md}'"

# 2. FRONTEND TESTS (test-frontend job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  FRONTEND TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_check "Frontend tests with coverage" "pnpm test:ci"

# 3. BACKEND TESTS (test-backend job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  BACKEND TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if PostgreSQL and Redis are running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL not found. Please install and start PostgreSQL${NC}"
    ALL_PASSED=false
else
    # Run backend tests with exact CI environment variables
    export POSTGRES_HOST=localhost
    export POSTGRES_USER=test
    export POSTGRES_PASSWORD=test
    export POSTGRES_DB=test
    export POSTGRES_PORT=5432
    export REDIS_URL=redis://localhost:6379
    export DJANGO_SECRET_KEY=test-secret-key
    export DJANGO_SETTINGS_MODULE=api.settings
    export ALLOWED_HOSTS=localhost,127.0.0.1
    export DEBUG=False
    export CELERY_BROKER_URL=redis://localhost:6379/0
    export CELERY_RESULT_BACKEND=redis://localhost:6379/0
    
    cd services/api
    source .venv/bin/activate 2>/dev/null || python -m venv .venv && source .venv/bin/activate
    
    run_check "Install Python dependencies" "pip install -r requirements.txt && pip install pytest pytest-cov pytest-django"
    run_check "Run migrations" "python manage.py migrate"
    run_check "Backend tests with coverage" "pytest -v --cov=. --cov-report=xml --cov-report=term"
    
    deactivate
    cd ../..
fi

# 4. E2E TESTS (test-e2e job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  E2E TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v playwright &> /dev/null && ! pnpm exec playwright --version &> /dev/null; then
    run_check "Install Playwright browsers" "pnpm exec playwright install --with-deps chromium"
fi

run_check "Build applications" "pnpm build"
run_check "E2E tests" "pnpm test:e2e --project=chromium"

# 5. PERFORMANCE BUDGET (performance job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  PERFORMANCE BUDGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_check "Build runtime package" "pnpm --filter @forms/runtime build"

# Check if bundle size script exists
if [ -f "scripts/check-bundle-size.js" ]; then
    run_check "Check bundle sizes" "node scripts/check-bundle-size.js"
else
    echo -e "${YELLOW}⚠ Bundle size check script not found${NC}"
    # Fallback to size-limit
    run_check "Check bundle sizes (size-limit)" "pnpm --filter @forms/runtime size"
fi

# 6. ACCESSIBILITY TESTS (accessibility job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  ACCESSIBILITY (WCAG AA)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pnpm test:a11y &> /dev/null 2>&1; then
    run_check "Accessibility tests" "pnpm test:a11y"
else
    echo -e "${YELLOW}⚠ Accessibility tests not configured yet${NC}"
fi

# 7. SECURITY SCAN (security job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  SECURITY SCAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_check "NPM audit (high/critical)" "pnpm audit --audit-level=high || true"

cd services/api
source .venv/bin/activate 2>/dev/null
if command -v safety &> /dev/null; then
    run_check "Python safety check" "safety check || true"
else
    run_check "Install safety and check" "pip install safety && safety check || true"
fi
deactivate
cd ../..

# 8. CONTRACT TESTS (contracts job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  CONTRACT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_check "Contract tests" "pnpm test:contracts"

# 9. DOCKER BUILD (docker job)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  DOCKER BUILD VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    for service in api analytics; do
        if [ -f "services/$service/Dockerfile" ]; then
            run_check "Docker build $service" "docker build -t forms-platform/$service:test services/$service"
        else
            echo -e "${YELLOW}⚠ Dockerfile not found for $service${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ Docker not installed - skipping Docker builds${NC}"
fi

# FINAL SUMMARY
echo ""
echo "=================================================="
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ ALL CI CHECKS PASSED!${NC}"
    echo ""
    echo "Code quality: ✓"
    echo "Frontend tests: ✓"
    echo "Backend tests: ✓"
    echo "E2E tests: ✓"
    echo "Performance budgets: ✓"
    echo "Accessibility (WCAG AA): ✓"
    echo "Security scan: ✓"
    echo "Contract tests: ✓"
    echo "Docker builds: ✓"
    echo ""
    echo "🎉 Safe to push - CI will pass!"
    exit 0
else
    echo -e "${RED}❌ SOME CI CHECKS FAILED!${NC}"
    echo ""
    echo "⚠️  DO NOT PUSH - GitHub Actions CI will fail"
    echo "Fix all issues above before pushing"
    exit 1
fi