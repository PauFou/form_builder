#!/bin/bash

# Script to reproduce CI workflow locally
# This script runs the exact same steps as the GitHub Actions CI workflow

set -e  # Exit on error

echo "================================================"
echo "Reproducing CI Workflow Locally"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a step and report results
run_step() {
    local step_name=$1
    local command=$2
    
    echo -e "\n${YELLOW}Running: $step_name${NC}"
    echo "Command: $command"
    echo "----------------------------------------"
    
    if eval "$command"; then
        echo -e "${GREEN}✓ $step_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $step_name failed${NC}"
        return 1
    fi
}

# Check prerequisites
echo "Checking prerequisites..."
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Python version: $(python3 --version)"

# Code Quality Job (focusing on this first as requested)
echo -e "\n${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}CODE QUALITY JOB${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# Step 1: Install dependencies with frozen lockfile
run_step "Install dependencies" "pnpm install --frozen-lockfile" || {
    echo -e "${RED}Failed at dependency installation. Trying with regular install...${NC}"
    run_step "Install dependencies (fallback)" "pnpm install"
}

# Step 2: Lint
run_step "Lint" "pnpm lint" || true

# Step 3: Typecheck
run_step "Typecheck" "pnpm typecheck" || true

# Step 4: Format check
run_step "Format check" 'pnpm prettier --check "**/*.{ts,tsx,js,jsx,json,md}"' || true

echo -e "\n${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}SUMMARY${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"

# The script continues even if steps fail to show all errors
echo "Script completed. Check the output above for any failures."