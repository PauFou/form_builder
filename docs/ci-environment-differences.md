# CI Environment Differences Guide

This document explains the differences between local development and GitHub Actions CI environment, and how to ensure tests pass in both.

## Key Differences

### 1. Operating System

- **Local**: macOS (Darwin)
- **GitHub Actions**: Ubuntu Linux (ubuntu-latest)

**Impact**:

- Path separators
- Available system commands
- File system case sensitivity

### 2. Node.js & Package Managers

- **GitHub Actions**: Exact versions specified in workflow
  - Node.js: 20
  - pnpm: 9.5.0
  - Python: 3.11

**Solution**: Use nvm/pyenv locally to match versions

### 3. Database Services

- **Local**: May use SQLite for convenience
- **GitHub Actions**: PostgreSQL 16 and Redis 7 in service containers

**Solution**: Use Docker locally or install PostgreSQL/Redis

### 4. Test Commands

- **Local habit**: `pnpm test`
- **CI requirement**: `pnpm test:ci` (includes coverage)

### 5. Environment Variables

GitHub Actions sets specific env vars that may not exist locally:

- `CI=true`
- `GITHUB_ACTIONS=true`
- Service connection strings

## Common Issues and Solutions

### Frontend Tests Failing

**Issue**: React act() warnings

```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Solution**:

```typescript
import { act } from "@testing-library/react";

// Wrap async updates
await act(async () => {
  fireEvent.click(button);
});
```

### Bundle Size Check Failing

**Issue**: Analytics package not built

```
❌ Analytics package dist folder not found
```

**Solution**: Ensure build runs before size check

```bash
pnpm --filter @forms/analytics build
```

### PostgreSQL Connection Failing

**Issue**:

```
FATAL: role "test" does not exist
```

**Solution**: Run setup script

```bash
bash scripts/setup-test-db.sh
```

### Type Errors Only in CI

**Issue**: Different TypeScript strictness

**Solution**: Always use strict tsconfig

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

## Validation Scripts

### Quick Local Check

```bash
bash scripts/ci-check-fixed.sh
```

- Uses SQLite for speed
- Skips some heavy checks
- Good for development iteration

### Exact CI Reproduction

```bash
bash scripts/github-actions-exact.sh
```

- MUST pass before pushing
- Uses exact same commands as CI
- Requires PostgreSQL/Redis

## Best Practices

1. **Always use `pnpm test:ci`** not `pnpm test`
2. **Fix root causes**, not symptoms
3. **Test with production-like environment**
4. **Run exact CI script before push**
5. **Keep CI scripts synchronized**

## Debugging CI Failures

When CI fails but local passes:

1. Check the exact error in GitHub Actions logs
2. Compare command used locally vs CI
3. Check environment variables
4. Verify service availability
5. Run exact CI script locally

## Docker-based Solution (Future)

For perfect parity, we could use Docker:

```yaml
services:
  ci-env:
    image: ubuntu:latest
    volumes:
      - .:/app
    command: bash /app/scripts/github-actions-exact.sh
```

This would eliminate ALL environment differences.
