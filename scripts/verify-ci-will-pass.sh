#!/bin/bash

# Script to verify CI will pass before pushing
# This runs the exact same checks as GitHub Actions

echo "🔍 Verifying CI will pass..."
echo "=========================="
echo ""

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/.." || exit 1

# 1. Check Prettier formatting
echo "1. Checking code formatting..."
if pnpm format:check; then
    echo -e "${GREEN}✓ Code formatting OK${NC}"
else
    echo -e "${RED}✗ Code formatting failed${NC}"
    echo "Run: pnpm format"
    exit 1
fi

# 2. Install Python dependencies
echo ""
echo "2. Installing Python dependencies..."
cd services/api
source .venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# 3. Check Django setup
echo ""
echo "3. Checking Django setup..."
export DJANGO_SETTINGS_MODULE=api.settings_test
export DATABASE_URL="sqlite:///test_db.sqlite3"
export DJANGO_SECRET_KEY="test-key"
export POSTGRES_HOST=localhost
export POSTGRES_USER=forms_user
export POSTGRES_PASSWORD=forms_password
export POSTGRES_DB=forms_db_test

python -c "import django; django.setup(); print('✓ Django setup successful')"

cd ../..
deactivate

# 4. Run frontend checks
echo ""
echo "4. Running frontend checks..."
pnpm lint
echo -e "${GREEN}✓ ESLint passed${NC}"

echo ""
pnpm typecheck
echo -e "${GREEN}✓ TypeScript passed${NC}"

echo ""
echo "5. Building applications..."
pnpm build
echo -e "${GREEN}✓ Build successful${NC}"

echo ""
echo "============================="
echo -e "${GREEN}✅ CI checks passed!${NC}"
echo ""
echo "Your code is ready to push."
echo "GitHub Actions should pass without issues."