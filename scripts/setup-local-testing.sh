#!/bin/bash

# Setup script for local testing environment
# This replaces GitHub Actions with a comprehensive local testing setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    LOCAL TESTING ENVIRONMENT SETUP                                ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Install with: npm install -g pnpm"
    exit 1
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

# Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 is not installed (required for backend tests)${NC}"
else
    echo -e "${GREEN}✅ Python $(python3 --version)${NC}"
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not installed (required for backend tests)${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL $(psql --version | head -n1)${NC}"
fi

# Make scripts executable
echo -e "\n${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/*.sh
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
chmod +x .husky/commit-msg

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
pnpm install

# Setup Python virtual environment for backend
if [ -d "services/api" ]; then
    echo -e "\n${YELLOW}Setting up Python environment...${NC}"
    cd services/api
    
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
        echo -e "${GREEN}✅ Created Python virtual environment${NC}"
    fi
    
    source .venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Installed Python dependencies${NC}"
    
    # Setup test database
    if command -v psql &> /dev/null; then
        echo -e "\n${YELLOW}Setting up test database...${NC}"
        python setup_postgres_ci.py
    fi
    
    cd ../..
fi

# Create test configuration file
echo -e "\n${YELLOW}Creating test configuration...${NC}"
cat > .testconfig << 'EOF'
# Local Test Configuration
# This file configures the local testing environment

# Test levels
# - quick: Fast tests for pre-commit (5-10 seconds)
# - standard: Comprehensive tests for pre-push (2-5 minutes)  
# - full: All tests including E2E (10-15 minutes)
DEFAULT_TEST_LEVEL=standard

# Coverage thresholds
FRONTEND_COVERAGE_THRESHOLD=80
BACKEND_COVERAGE_THRESHOLD=80

# Performance budgets
RUNTIME_BUNDLE_SIZE_LIMIT=30  # KB gzipped
BUILD_TIME_LIMIT=60          # seconds

# Test database
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=5432
TEST_DB_USER=test
TEST_DB_PASSWORD=test
TEST_DB_NAME=test

# Features
ENABLE_E2E_TESTS=false
ENABLE_SECURITY_SCAN=true
ENABLE_DEPENDENCY_AUDIT=true

# Parallel execution
PARALLEL_TESTS=true
MAX_WORKERS=4
EOF

echo -e "${GREEN}✅ Created .testconfig${NC}"

# Create convenience scripts
echo -e "\n${YELLOW}Creating convenience scripts...${NC}"

# Quick test script
cat > test-quick.sh << 'EOF'
#!/bin/bash
# Quick test run (for development)
bash scripts/local-test-suite.sh quick
EOF
chmod +x test-quick.sh

# Full test script
cat > test-all.sh << 'EOF'
#!/bin/bash
# Full test run (comprehensive)
bash scripts/local-test-suite.sh full
EOF
chmod +x test-all.sh

# Test watch script
cat > test-watch.sh << 'EOF'
#!/bin/bash
# Watch mode for tests
pnpm test -- --watch
EOF
chmod +x test-watch.sh

echo -e "${GREEN}✅ Created convenience scripts${NC}"

# Setup git hooks
echo -e "\n${YELLOW}Setting up Git hooks...${NC}"
pnpm husky install
echo -e "${GREEN}✅ Git hooks installed${NC}"

# Create .gitignore entries
echo -e "\n${YELLOW}Updating .gitignore...${NC}"
if ! grep -q ".testconfig" .gitignore 2>/dev/null; then
    echo -e "\n# Local test configuration\n.testconfig\n.push-test-results.log" >> .gitignore
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ LOCAL TESTING SETUP COMPLETE!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Available commands:"
echo "  ./test-quick.sh    - Run quick tests (5-10 seconds)"
echo "  ./test-all.sh      - Run all tests (10-15 minutes)"
echo "  ./test-watch.sh    - Run tests in watch mode"
echo ""
echo "Git hooks are active:"
echo "  pre-commit - Formats code and runs quick checks"
echo "  pre-push   - Runs comprehensive test suite"
echo ""
echo "To skip tests (emergency only):"
echo "  SKIP_TESTS=true git commit"
echo "  git push --no-verify"
echo ""