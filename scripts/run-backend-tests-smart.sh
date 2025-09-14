#!/bin/bash

# Smart backend test runner that uses PostgreSQL if available, otherwise SQLite

echo "🧪 Running backend tests..."
echo "========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")/../services/api" || exit 1

# Activate virtual environment
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt
pip install -q pytest pytest-cov pytest-django

# Try to connect to PostgreSQL
export PGPASSWORD=test
if psql -h localhost -U test -d test -c '\q' 2>/dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is available${NC}"
    echo "Using PostgreSQL for tests"
    
    export POSTGRES_HOST=localhost
    export POSTGRES_USER=test
    export POSTGRES_PASSWORD=test
    export POSTGRES_DB=test
    export POSTGRES_PORT=5432
    export DJANGO_SETTINGS_MODULE=api.settings_test
    export DJANGO_SECRET_KEY=test-secret-key
    export ALLOWED_HOSTS=localhost,127.0.0.1
    export DEBUG=False
    export REDIS_URL=redis://localhost:6379
    export CELERY_BROKER_URL=redis://localhost:6379/0
    export CELERY_RESULT_BACKEND=redis://localhost:6379/0
else
    echo -e "${YELLOW}⚠ PostgreSQL not available, using SQLite${NC}"
    echo "For production-ready testing, set up PostgreSQL with:"
    echo "  bash scripts/setup-test-db.sh"
    echo ""
    
    export DJANGO_SETTINGS_MODULE=api.settings_test_sqlite
fi

# Run tests
echo ""
echo "Running tests..."
echo "Using DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"

# Debug environment
python debug_env.py

# Ensure all environment variables are exported for pytest
export POSTGRES_HOST POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB POSTGRES_PORT
export DJANGO_SETTINGS_MODULE DJANGO_SECRET_KEY ALLOWED_HOSTS DEBUG
export REDIS_URL CELERY_BROKER_URL CELERY_RESULT_BACKEND

# Run pytest with explicit env
env POSTGRES_HOST=$POSTGRES_HOST \
    POSTGRES_USER=$POSTGRES_USER \
    POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    POSTGRES_DB=$POSTGRES_DB \
    POSTGRES_PORT=$POSTGRES_PORT \
    DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE \
    python -m pytest -xvs --cov=. --cov-report=xml --cov-report=term

TEST_RESULT=$?

deactivate
cd ../..

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "\n${RED}❌ Backend tests failed!${NC}"
fi

exit $TEST_RESULT