#!/bin/bash

# Setup PostgreSQL for local development and testing
# This script ensures we have the same database setup as GitHub Actions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐘 Setting up PostgreSQL for local development...${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running!${NC}"
    echo -e "${YELLOW}Please start PostgreSQL first:${NC}"
    echo "  brew services start postgresql@14"
    echo "  # or"
    echo "  brew services start postgresql@15"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Database names
MAIN_DB="forms_dev"
TEST_DB="test"
TEST_USER="test"
TEST_PASSWORD="test"

# Function to create database if it doesn't exist
create_db_if_not_exists() {
    local db_name=$1
    if ! psql -d postgres -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        echo -e "${BLUE}Creating database: $db_name${NC}"
        createdb "$db_name"
        echo -e "${GREEN}✅ Database $db_name created${NC}"
    else
        echo -e "${YELLOW}Database $db_name already exists${NC}"
    fi
}

# Function to create user if it doesn't exist
create_user_if_not_exists() {
    local username=$1
    local password=$2
    if ! psql -d postgres -t -c "SELECT 1 FROM pg_user WHERE usename = '$username'" | grep -q 1; then
        echo -e "${BLUE}Creating user: $username${NC}"
        psql -d postgres -c "CREATE USER $username WITH PASSWORD '$password';"
        echo -e "${GREEN}✅ User $username created${NC}"
    else
        echo -e "${YELLOW}User $username already exists${NC}"
    fi
}

# Create databases
create_db_if_not_exists "$MAIN_DB"
create_db_if_not_exists "$TEST_DB"

# Create test user
create_user_if_not_exists "$TEST_USER" "$TEST_PASSWORD"

# Grant privileges
echo -e "${BLUE}Setting up permissions...${NC}"

# Grant privileges on main database
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $MAIN_DB TO $TEST_USER;" 2>/dev/null || true

# Grant privileges on test database
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $TEST_DB TO $TEST_USER;" 2>/dev/null || true

# Allow user to create databases (needed for Django tests)
psql -d postgres -c "ALTER USER $TEST_USER CREATEDB;" 2>/dev/null || true

# Make user a superuser for tests (Django needs this for some operations)
psql -d postgres -c "ALTER USER $TEST_USER WITH SUPERUSER;" 2>/dev/null || true

echo -e "${GREEN}✅ PostgreSQL setup complete!${NC}"
echo
echo -e "${BLUE}Connection details:${NC}"
echo "  Main database:  postgresql://test:test@localhost:5432/$MAIN_DB"
echo "  Test database:  postgresql://test:test@localhost:5432/$TEST_DB"
echo
echo -e "${BLUE}You can now run:${NC}"
echo "  bash scripts/github-actions-exact.sh  # Full CI validation"
echo "  bash scripts/ci-check-fixed.sh        # Quick validation"
echo "  pnpm dev                               # Start development servers"