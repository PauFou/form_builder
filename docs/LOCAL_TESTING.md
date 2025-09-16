# Local Testing System Documentation

This document describes the comprehensive local testing system that ensures code quality before any commits or pushes to the repository.

## Overview

The local testing system replaces GitHub Actions with mandatory local checks that run automatically via Git hooks. This ensures that only high-quality, tested code makes it to the repository.

## Quick Start

1. **Initial Setup**

   ```bash
   # Run the setup script to configure everything
   bash scripts/setup-local-testing.sh
   ```

2. **Daily Development**

   ```bash
   # Quick tests during development
   ./test-quick.sh

   # Full test suite before major changes
   ./test-all.sh
   ```

3. **Git Workflow**

   ```bash
   # Pre-commit hook runs automatically
   git commit -m "feat: add new feature"

   # Pre-push hook runs full validation
   git push origin main
   ```

## Testing Levels

### 1. Pre-Commit (Quick)

Runs on every commit to catch basic issues:

- **ESLint** - Code quality and style
- **Prettier** - Code formatting
- **TypeScript** - Type checking on staged files
- **Security** - Basic secret scanning
- **File size** - Prevents large files

Time: ~5-10 seconds

### 2. Pre-Push (Comprehensive)

Runs before push to ensure code is production-ready:

- All pre-commit checks
- **Unit tests** - Frontend and backend with coverage
- **Build validation** - Ensures code builds successfully
- **Performance** - Bundle size checks (<30KB)
- **Contract tests** - API compatibility
- **Security audit** - Dependency vulnerabilities

Time: ~2-5 minutes

### 3. Full Suite (Manual)

Complete validation including:

- All pre-push checks
- **E2E tests** - Browser automation tests
- **Accessibility** - WCAG AA compliance
- **Docker builds** - Container validation

Time: ~10-15 minutes

## Configuration

### Test Configuration File

Edit `.testconfig` to customize behavior:

```bash
# Adjust test levels
DEFAULT_TEST_LEVEL=standard  # quick, standard, or full

# Coverage thresholds
FRONTEND_COVERAGE_THRESHOLD=80
BACKEND_COVERAGE_THRESHOLD=80

# Performance budgets
MAX_RUNTIME_BUNDLE_SIZE=30720  # 30KB
```

### Environment Variables

Skip checks (use sparingly):

```bash
# Skip all tests
SKIP_TESTS=true git push

# Skip hooks entirely
SKIP_HOOKS=true git commit

# Force push without checks (DANGER!)
FORCE_PUSH=true git push
```

## Test Commands

### Basic Commands

```bash
# Lint code
pnpm lint
pnpm lint:fix  # Auto-fix issues

# Type checking
pnpm typecheck

# Formatting
pnpm format       # Fix formatting
pnpm format:check # Check only

# Unit tests
pnpm test        # Run once
pnpm test:watch  # Watch mode
pnpm test:ci     # With coverage
```

### Advanced Commands

```bash
# Run specific test suite
bash scripts/local-test-suite.sh quick    # Lint + typecheck only
bash scripts/local-test-suite.sh standard # Default tests
bash scripts/local-test-suite.sh all      # Everything including E2E

# Backend tests
bash scripts/run-backend-tests-smart.sh

# E2E tests
pnpm test:e2e
pnpm test:e2e:ui  # Interactive mode

# Performance checks
node scripts/check-bundle-size.js

# Security audit
pnpm audit
```

## Git Hooks

### Pre-Commit Hook

Location: `.husky/pre-commit`

Runs automatically on `git commit`:

1. Formats staged files (lint-staged)
2. Checks ESLint rules
3. Validates TypeScript
4. Scans for secrets
5. Checks commit size

### Pre-Push Hook

Location: `.husky/pre-push`

Runs automatically on `git push`:

1. Verifies clean working directory
2. Runs all syntax checks
3. Validates builds
4. Executes unit tests
5. Checks performance budgets
6. Runs contract tests
7. Security audit
8. Final comprehensive validation

### Commit Message Hook

Location: `.husky/commit-msg`

Enforces conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructuring
- `test:` - Test additions
- `chore:` - Maintenance

## Troubleshooting

### Common Issues

1. **"ESLint failed"**

   ```bash
   # See all errors
   pnpm lint

   # Auto-fix what's possible
   pnpm lint:fix
   ```

2. **"TypeScript errors"**

   ```bash
   # See all type errors
   pnpm typecheck

   # Often helps to restart TS server in your editor
   ```

3. **"Bundle size exceeds limit"**

   ```bash
   # Check current sizes
   node scripts/check-bundle-size.js

   # Analyze bundle
   pnpm build --analyze
   ```

4. **"Tests failed"**

   ```bash
   # Run tests with verbose output
   pnpm test --verbose

   # Run specific test file
   pnpm test path/to/test.spec.ts
   ```

5. **"Hook taking too long"**

   ```bash
   # Run hooks with verbose output
   VERBOSE=true git commit

   # Skip tests temporarily
   SKIP_TESTS=true git push
   ```

### Bypassing Hooks (Emergency Only!)

In rare cases where you need to bypass:

```bash
# Skip pre-commit hook
git commit --no-verify

# Skip all hooks
SKIP_HOOKS=true git commit
FORCE_PUSH=true git push

# Skip specific checks
SKIP_TESTS=true git push
SKIP_LINT=true git commit
```

**⚠️ WARNING**: Only use these in emergencies. The hooks exist to protect code quality.

## Performance Tips

1. **Use Quick Tests During Development**

   ```bash
   ./test-quick.sh  # Fast feedback loop
   ```

2. **Run Tests in Watch Mode**

   ```bash
   pnpm test:watch
   ```

3. **Test Only Changed Files**

   ```bash
   # The pre-commit hook does this automatically
   ```

4. **Parallel Execution**
   Tests run in parallel by default (configured in `.testconfig`)

## Best Practices

1. **Fix Issues Immediately**
   - Don't accumulate lint errors
   - Address type errors as they appear
   - Keep tests passing

2. **Write Tests First**
   - TDD approach prevents test failures
   - Tests document expected behavior

3. **Small, Focused Commits**
   - Easier to review
   - Faster hook execution
   - Clear history

4. **Regular Full Test Runs**

   ```bash
   # Run before starting major work
   ./test-all.sh
   ```

5. **Keep Dependencies Updated**

   ```bash
   # Check for updates
   pnpm update --interactive

   # Run audit after updates
   pnpm audit
   ```

## Metrics and Reporting

### Coverage Reports

After running tests:

- Frontend: `coverage/lcov-report/index.html`
- Backend: `services/api/htmlcov/index.html`

### Bundle Analysis

```bash
# Generate bundle report
pnpm build:analyze
# Opens visualization in browser
```

### Test Timing

Tests show execution time to identify slow tests:

```
✓ UserForm component renders (45ms)
✓ validates email format (12ms)
✓ submits form data (203ms)
```

## Maintenance

### Updating Test Suite

```bash
# Update hooks
pnpm prepare

# Reinstall dependencies
pnpm install

# Re-run setup
bash scripts/setup-local-testing.sh
```

### Adding New Checks

1. Edit `scripts/local-test-suite.sh`
2. Add check to appropriate section
3. Update hook if needed
4. Document in this file

## Summary

The local testing system ensures:

- ✅ No broken code reaches the repository
- ✅ Consistent code quality
- ✅ Fast feedback during development
- ✅ Comprehensive validation before push
- ✅ No dependency on CI/CD for quality gates

Remember: **If it doesn't pass locally, it shouldn't be pushed!**
