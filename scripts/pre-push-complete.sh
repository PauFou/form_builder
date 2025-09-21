#!/bin/bash

# Script de validation complète pré-commit
# S'assure que TOUS les tests locaux passent

echo "🚀 Validation Complète Pré-Commit"
echo "================================="
echo ""
echo "Ce script exécute TOUTES les validations pour s'assurer que le commit est prêt."
echo "Cela peut prendre plusieurs minutes."
echo ""

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.." || exit 1

# Track time
START_TIME=$(date +%s)

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 1. DEPENDENCY VALIDATION
print_section "1. DEPENDENCY VALIDATION"

echo "→ Checking backend dependencies..."
bash scripts/check-backend-deps.sh
echo -e "${GREEN}✓ Backend dependencies OK${NC}"

echo ""
echo "→ Checking frontend dependencies..."
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Frontend dependencies OK${NC}"

# 2. CODE QUALITY
print_section "2. CODE QUALITY"

echo "→ Running ESLint..."
pnpm lint
echo -e "${GREEN}✓ ESLint passed${NC}"

echo ""
echo "→ Running TypeScript checks..."
pnpm typecheck
echo -e "${GREEN}✓ TypeScript passed${NC}"

echo ""
echo "→ Checking code formatting..."
pnpm prettier --check '**/*.{ts,tsx,js,jsx,json,md}' '!.claude/**' '!**/coverage/**' '!**/.next/**' '!**/dist/**'
echo -e "${GREEN}✓ Code formatting OK${NC}"

# 3. UNIT TESTS
print_section "3. UNIT TESTS"

echo "→ Running frontend tests..."
pnpm test:ci
echo -e "${GREEN}✓ Frontend tests passed${NC}"

# 4. BACKEND TESTS
print_section "4. BACKEND TESTS"

cd services/api

# Create venv if needed
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate

echo "→ Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
pip install --quiet pytest pytest-cov pytest-django

# Set test environment
export DATABASE_URL="sqlite:///test_db.sqlite3"
export DJANGO_SECRET_KEY="test-secret-key"
export SECRET_KEY="test-secret-key"
export JWT_SECRET="test-jwt-secret"
export HMAC_SECRET="test-hmac-secret"
export REDIS_URL="redis://localhost:6379"
export CELERY_BROKER_URL="redis://localhost:6379/0"
export CELERY_RESULT_BACKEND="redis://localhost:6379/0"
export ALLOWED_HOSTS="localhost,127.0.0.1"
export DEBUG="False"

echo "→ Running migrations..."
rm -f test_db.sqlite3
python manage.py migrate --run-syncdb

echo "→ Running backend tests..."
pytest -v

deactivate
cd ../..
echo -e "${GREEN}✓ Backend tests passed${NC}"

# 5. CONTRACT TESTS
print_section "5. CONTRACT TESTS"

pnpm test:contracts
echo -e "${GREEN}✓ Contract tests passed${NC}"

# 6. BUILD VERIFICATION
print_section "6. BUILD VERIFICATION"

echo "→ Building all packages..."
pnpm build
echo -e "${GREEN}✓ Build successful${NC}"

# 7. BUNDLE SIZE CHECK
print_section "7. BUNDLE SIZE CHECK"

pnpm --filter @forms/runtime size
echo -e "${GREEN}✓ Bundle sizes within limits${NC}"

# 8. E2E READINESS
print_section "8. E2E READINESS CHECK"

bash scripts/check-e2e-ready.sh
echo -e "${GREEN}✓ E2E tests ready${NC}"

# 9. SECURITY AUDIT
print_section "9. SECURITY AUDIT"

echo "→ Running npm audit..."
pnpm audit --audit-level=high || echo -e "${YELLOW}⚠ Some vulnerabilities found (non-blocking)${NC}"

# FINAL SUMMARY
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_section "✅ ALL CHECKS PASSED!"

echo ""
echo "Summary:"
echo "  • Dependencies: ✓"
echo "  • Code quality: ✓"
echo "  • Frontend tests: ✓"
echo "  • Backend tests: ✓"
echo "  • Contract tests: ✓"
echo "  • Build: ✓"
echo "  • Bundle size: ✓"
echo "  • E2E ready: ✓"
echo ""
echo -e "${GREEN}🎉 Prêt pour le commit! Tous les tests sont passés.${NC}"
echo ""
echo "Temps écoulé: ${DURATION} secondes"