#!/bin/bash

# Migration script from GitHub Actions to local testing
# This removes GitHub Actions and ensures local testing is set up

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                  MIGRATE FROM GITHUB ACTIONS                                      ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}This will remove GitHub Actions and ensure local testing is properly configured.${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# 1. Remove GitHub Actions
echo -e "\n${YELLOW}Removing GitHub Actions...${NC}"
if [ -d ".github/workflows" ]; then
    rm -rf .github/workflows
    echo -e "${GREEN}✅ Removed .github/workflows${NC}"
else
    echo -e "${BLUE}ℹ️  No .github/workflows found${NC}"
fi

# 2. Clean up GitHub Actions specific scripts
echo -e "\n${YELLOW}Cleaning up CI-specific scripts...${NC}"
CI_SCRIPTS=(
    "scripts/github-actions-exact.sh"
    "scripts/ci-check.sh"
    "scripts/ci-check-fixed.sh"
    "scripts/pre-push-validation.sh"
    "scripts/run-backend-tests-ci.sh"
)

for script in "${CI_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        rm -f "$script"
        echo -e "${GREEN}✅ Removed $script${NC}"
    fi
done

# 3. Update package.json scripts
echo -e "\n${YELLOW}Updating package.json scripts...${NC}"
cat > update-package-json.js << 'EOF'
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add local test scripts
packageJson.scripts = {
    ...packageJson.scripts,
    // Test commands
    "test:quick": "bash scripts/local-test-suite.sh quick",
    "test:standard": "bash scripts/local-test-suite.sh standard", 
    "test:all": "bash scripts/local-test-suite.sh full",
    "test:watch": "turbo test -- --watch",
    
    // Quality commands
    "quality:check": "pnpm lint && pnpm typecheck && pnpm format:check",
    "quality:fix": "pnpm lint:fix && pnpm format",
    
    // Pre-push simulation
    "prepush": "bash .husky/pre-push",
    "precommit": "bash .husky/pre-commit",
};

// Remove CI-specific scripts
delete packageJson.scripts["test:ci:exact"];
delete packageJson.scripts["ci:check"];
delete packageJson.scripts["ci:fix"];

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ Updated package.json scripts');
EOF

node update-package-json.js
rm -f update-package-json.js

# 4. Update documentation
echo -e "\n${YELLOW}Creating local testing documentation...${NC}"
cat > docs/LOCAL_TESTING.md << 'EOF'
# Local Testing Guide

This project uses comprehensive local testing to ensure code quality. All tests must pass before code can be pushed.

## Overview

We use a three-tier testing approach:
- **Quick Tests** (5-10 seconds) - Run on every commit
- **Standard Tests** (2-5 minutes) - Run before every push
- **Full Tests** (10-15 minutes) - Run manually when needed

## Setup

Run the setup script once:
```bash
bash scripts/setup-local-testing.sh
```

## Usage

### Automatic Testing

Git hooks automatically run tests:
- **Pre-commit**: Formatting, linting, and quick tests on staged files
- **Pre-push**: Comprehensive test suite including all unit tests, builds, and checks

### Manual Testing

```bash
# Quick tests (during development)
./test-quick.sh

# Standard tests (before pushing)
./test-standard.sh

# All tests (including E2E)
./test-all.sh

# Watch mode
./test-watch.sh
```

### Test Levels

#### Quick (5-10s)
- ESLint on changed files
- TypeScript check
- Unit tests for changed files
- Security scan

#### Standard (2-5m)
- All quick tests
- Full ESLint
- Full TypeScript check  
- All unit tests (frontend + backend)
- Build validation
- Bundle size checks
- Coverage checks

#### Full (10-15m)
- All standard tests
- E2E tests
- Performance tests
- Accessibility tests
- Full security audit

## Configuration

Edit `.testconfig` to customize:
- Coverage thresholds
- Performance budgets
- Test database settings
- Feature flags

## Troubleshooting

### Tests failing locally but not in editor?
- Ensure you're using the same Node version: `nvm use`
- Clear caches: `pnpm clean && pnpm install`

### PostgreSQL connection issues?
- Check test database: `psql -h 127.0.0.1 -U test -d test`
- Recreate: `cd services/api && python setup_postgres_ci.py`

### Slow tests?
- Use quick mode during development: `./test-quick.sh`
- Enable parallel tests in `.testconfig`

## Emergency Override

⚠️ **Use only in emergencies:**

```bash
# Skip pre-commit hooks
git commit --no-verify

# Skip pre-push validation  
git push --no-verify

# Skip all tests
SKIP_TESTS=true git push
```

## Best Practices

1. Run `./test-quick.sh` frequently during development
2. Fix issues immediately - don't let them accumulate
3. Keep tests fast - mock external dependencies
4. Write tests for new features before implementing
5. Maintain > 80% code coverage

## Performance Budgets

- Runtime bundle: < 30KB gzipped
- Build time: < 60 seconds
- Test suite: < 5 minutes (standard)
EOF

echo -e "${GREEN}✅ Created docs/LOCAL_TESTING.md${NC}"

# 5. Update README
echo -e "\n${YELLOW}Updating README...${NC}"
if grep -q "GitHub Actions" README.md 2>/dev/null; then
    sed -i.bak 's/GitHub Actions/local testing/g' README.md
    sed -i.bak 's/\.github\/workflows/scripts\/local-test-suite.sh/g' README.md
    rm -f README.md.bak
    echo -e "${GREEN}✅ Updated README.md${NC}"
fi

# 6. Update CLAUDE.md
echo -e "\n${YELLOW}Updating CLAUDE.md...${NC}"
cat >> CLAUDE.md << 'EOF'

## 🚨 LOCAL TESTING (Updated)

This project now uses mandatory local testing instead of GitHub Actions.

### Test Execution

All tests run locally through Git hooks:
- **Pre-commit**: Quick validation (5-10s)
- **Pre-push**: Full test suite (2-5m)

### Key Commands

```bash
# Setup (one-time)
bash scripts/setup-local-testing.sh

# Manual testing
./test-quick.sh    # Fast feedback
./test-all.sh      # Comprehensive
```

### Requirements

- All tests MUST pass before pushing
- Coverage must be > 80% (frontend and backend)
- Bundle size must be < 30KB for runtime
- No high-severity vulnerabilities

Claude must ensure all changes pass local tests before suggesting commits.
EOF

echo -e "${GREEN}✅ Updated CLAUDE.md${NC}"

# 7. Final setup
echo -e "\n${YELLOW}Running final setup...${NC}"
bash scripts/setup-local-testing.sh

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MIGRATION COMPLETE!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "GitHub Actions has been removed and replaced with local testing."
echo ""
echo "Next steps:"
echo "1. Test the setup: ./test-quick.sh"
echo "2. Commit these changes: git add -A && git commit -m 'chore: migrate to local testing'"
echo "3. Push (will run full tests): git push"
echo ""