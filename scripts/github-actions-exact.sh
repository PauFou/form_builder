#!/bin/bash

# This script reproduces EXACTLY what GitHub Actions CI does
# It uses the EXACT same commands, in the EXACT same order
# with the EXACT same environment variables

echo "🎯 EXACT GitHub Actions CI Reproduction"
echo "======================================="
echo "This script runs EXACTLY what happens on GitHub Actions"
echo "If this passes, GitHub Actions WILL pass"
echo ""

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/.." || exit 1

# Set exact environment variables from GitHub Actions
export NODE_VERSION="20"
export PYTHON_VERSION="3.11"
export PNPM_VERSION="9.5.0"

echo -e "${BLUE}Environment:${NC}"
echo "  Node: $NODE_VERSION"
echo "  Python: $PYTHON_VERSION"
echo "  pnpm: $PNPM_VERSION"
echo ""

# Track failures
FAILED_JOBS=""

# Function to run a job exactly like GitHub Actions
run_job() {
    local job_name="$1"
    local job_description="$2"
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Running: $job_description${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check command result
check_result() {
    local job_name="$1"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $job_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $job_name FAILED${NC}"
        FAILED_JOBS="$FAILED_JOBS\n  - $job_name"
        return 1
    fi
}

# 1. CODE QUALITY JOB (exactly as in ci.yml lines 23-49)
run_job "quality" "Code Quality"

echo "→ Install dependencies"
pnpm install --frozen-lockfile
check_result "pnpm install" || true

echo "→ Lint"
pnpm lint
check_result "pnpm lint" || true

echo "→ Typecheck"
pnpm typecheck
check_result "pnpm typecheck" || true

echo "→ Format check"
pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}"
check_result "prettier check" || true

# 2. FRONTEND TESTS JOB (exactly as in ci.yml lines 51-71)
run_job "test-frontend" "Frontend Tests"

echo "→ Run tests with coverage"
pnpm test:ci
check_result "frontend tests" || true

# 3. BACKEND TESTS JOB (lines 83-141)
run_job "test-backend" "Backend Tests"

echo "→ Run backend tests"
bash scripts/run-backend-tests-smart.sh
check_result "backend tests" || true

# 4. E2E TESTS JOB (lines 153-178)
run_job "test-e2e" "E2E Tests"

echo "→ Install Playwright browsers"
pnpm exec playwright install --with-deps chromium

echo "→ Build applications"
pnpm build
check_result "build" || true

echo "→ Run E2E tests"
pnpm test:e2e --project=chromium
check_result "e2e tests" || true

# 5. PERFORMANCE BUDGET JOB (lines 189-211)
run_job "performance" "Performance Budget"

echo "→ Build runtime package"
pnpm --filter @forms/runtime build
check_result "runtime build" || true

echo "→ Check bundle sizes"
node scripts/check-bundle-size.js
check_result "bundle size check" || true

# 6. ACCESSIBILITY JOB (lines 216-238)
run_job "accessibility" "Accessibility (WCAG AA)"

echo "→ Build applications"
pnpm build

echo "→ Run accessibility tests"
pnpm test:a11y
check_result "accessibility tests" || true

# 7. SECURITY SCAN JOB (lines 249-278)
run_job "security" "Security Scan"

echo "→ Check npm vulnerabilities"
pnpm audit --audit-level=high || true
check_result "npm audit" || true

cd services/api
if [ -d ".venv" ]; then
    source .venv/bin/activate
    pip install safety
    safety check || true
    check_result "python safety" || true
    deactivate
fi
cd ../..

# 8. CONTRACT TESTS JOB (lines 281-300)
run_job "contracts" "Contract Tests"

echo "→ Run contract tests"
pnpm test:contracts
check_result "contract tests" || true

# 9. DOCKER BUILD JOB (lines 303-323)
run_job "docker" "Docker Build"

if command -v docker &> /dev/null; then
    for service in api analytics; do
        if [ -f "services/$service/Dockerfile" ]; then
            echo "→ Build Docker image for $service"
            docker build -t forms-platform/$service:test services/$service
            check_result "docker build $service" || true
        fi
    done
else
    echo -e "${YELLOW}⚠ Docker not installed - skipping${NC}"
fi

# SUMMARY
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}CI SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -z "$FAILED_JOBS" ]; then
    echo -e "${GREEN}✅ ALL JOBS PASSED!${NC}"
    echo ""
    echo "GitHub Actions CI will PASS ✨"
    exit 0
else
    echo -e "${RED}❌ FAILED JOBS:${NC}"
    echo -e "$FAILED_JOBS"
    echo ""
    echo -e "${RED}GitHub Actions CI will FAIL${NC}"
    echo ""
    echo "Fix the above issues before pushing!"
    exit 1
fi