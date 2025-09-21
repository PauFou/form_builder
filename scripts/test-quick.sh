#!/bin/bash
# Quick Test Suite - Fast validation for development iteration
# Runs only critical tests for rapid feedback

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                          QUICK TEST SUITE                                         ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

START_TIME=$(date +%s)
FAILURES=0

# Function to run test with simple error handling
run_quick_test() {
    local name=$1
    local cmd=$2
    
    echo -e "${YELLOW}▶ ${name}${NC}"
    if eval "$cmd"; then
        echo -e "${GREEN}✓ ${name} passed${NC}\n"
    else
        echo -e "${RED}✗ ${name} failed${NC}\n"
        FAILURES=$((FAILURES + 1))
    fi
}

# 1. Syntax Checks (fastest)
echo -e "${BLUE}[1/5] SYNTAX CHECKS${NC}"
echo -e "${BLUE}──────────────────${NC}"

run_quick_test "ESLint" "pnpm lint"
run_quick_test "TypeScript" "pnpm typecheck"

# 2. Critical Unit Tests Only
echo -e "${BLUE}[2/5] CRITICAL UNIT TESTS${NC}"
echo -e "${BLUE}─────────────────────────${NC}"

# Run only tests matching critical patterns
run_quick_test "Core Frontend Tests" "NODE_ENV=test pnpm test"

# 3. Quick Python checks (if backend changed)
if git diff --name-only --cached | grep -q "services/api"; then
    echo -e "${BLUE}[3/5] BACKEND SYNTAX${NC}"
    echo -e "${BLUE}───────────────────${NC}"
    
    if [ -f services/api/.venv/bin/activate ]; then
        cd services/api
        source .venv/bin/activate
        run_quick_test "Python Syntax" "python -m py_compile core/*.py forms/*.py"
        cd ..
    fi
else
    echo -e "${BLUE}[3/5] BACKEND - ${YELLOW}SKIPPED${NC} (no changes)"
fi

# 4. Bundle Size Quick Check
echo -e "${BLUE}[4/5] PERFORMANCE CHECKS${NC}"
echo -e "${BLUE}────────────────────────${NC}"

# Only check if runtime was modified
if git diff --name-only --cached | grep -q "packages/runtime"; then
    run_quick_test "Runtime Bundle (<30KB)" "cd packages/runtime && pnpm build && pnpm size"
else
    echo -e "${YELLOW}Bundle size check skipped (no runtime changes)${NC}"
fi

# 5. Security Quick Scan
echo -e "${BLUE}[5/5] SECURITY SCAN${NC}"
echo -e "${BLUE}──────────────────${NC}"

# Check for obvious security issues in staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|py)$' || true)

if [ -n "$STAGED_FILES" ]; then
    echo "Checking for security patterns..."
    SECURITY_ISSUES=0
    
    # Check for hardcoded secrets
    if echo "$STAGED_FILES" | xargs grep -E "(api[_-]key|password|secret|token)\s*[:=]\s*['\"][^'\"]+['\"]" 2>/dev/null | grep -v -E "(test|spec|mock|example|\.env\.example)" > /dev/null 2>&1; then
        echo -e "${RED}✗ Potential hardcoded secrets found${NC}"
        SECURITY_ISSUES=1
    fi
    
    # Check for console.log in production code
    if echo "$STAGED_FILES" | xargs grep -l "console\.log" 2>/dev/null | grep -v -E "(test|spec|dev|scripts)" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  console.log found in staged files${NC}"
    fi
    
    if [ $SECURITY_ISSUES -eq 0 ]; then
        echo -e "${GREEN}✓ No obvious security issues${NC}"
    else
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}No staged files to check${NC}"
fi

# Summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ QUICK TESTS PASSED!${NC} (${DURATION}s)"
    echo ""
    echo -e "${YELLOW}Note: This is a minimal check. Run full test suite before push:${NC}"
    echo -e "${BLUE}  bash scripts/test-complete.sh${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ QUICK TESTS FAILED!${NC} (${FAILURES} failures in ${DURATION}s)"
    echo ""
    echo -e "${YELLOW}Fix the issues above before committing.${NC}"
    exit 1
fi