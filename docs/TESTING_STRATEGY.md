# Testing Strategy

This document outlines the comprehensive testing strategy for the Form Builder platform, ensuring code quality, performance, and reliability.

## 🎯 Testing Philosophy

- **Test Early, Test Often**: All tests run locally before commit/push
- **Fast Feedback**: Quick tests for development iteration
- **Comprehensive Coverage**: Full test suite before deployment
- **Production-First**: Tests simulate real production scenarios

## 📊 Test Levels

### 1. Quick Tests (Development Iteration)

**Command**: `pnpm test:quick` or `bash scripts/test-quick.sh`
**Duration**: < 30 seconds
**Coverage**:

- ESLint & TypeScript checks
- Critical unit tests only
- Security scan for staged files
- Bundle size check (if runtime modified)

### 2. Complete Tests (Pre-Commit)

**Command**: `pnpm test:complete` or `bash scripts/test-complete.sh`
**Duration**: 2-5 minutes
**Coverage**:

- All syntax and code quality checks
- Full unit test suite (frontend + backend)
- Integration tests
- Contract tests
- Performance validations
- Security audits

### 3. Full Tests (Pre-Push)

**Command**: `pnpm test:complete:full`
**Duration**: 5-10 minutes
**Coverage**:

- Everything from Complete Tests
- E2E tests with Playwright
- Load testing
- Accessibility tests (WCAG AA)
- Docker build validation

## 🧪 Test Types

### Unit Tests

- **Frontend**: Jest + React Testing Library
  - Components, hooks, stores, utilities
  - Coverage requirement: ≥80%
- **Backend**: Pytest + Django TestCase
  - Models, serializers, views, utilities
  - Coverage requirement: ≥80%

### Integration Tests

- API endpoint testing
- Database transaction tests
- Service-to-service communication
- HMAC validation
- Webhook delivery

### E2E Tests

- Form creation flow
- Form submission flow
- Analytics tracking
- Webhook integration
- Multi-user scenarios

### Contract Tests

- API schema validation
- Service interface compatibility
- Frontend-backend synchronization
- Breaking change detection

### Performance Tests

- Bundle size validation (<30KB for runtime)
- API response time (<200ms P95)
- Load testing (1000 concurrent submissions)
- Memory leak detection

### Security Tests

- Dependency vulnerability scanning
- Secret detection
- OWASP compliance
- Input validation

## 🚀 CI/CD Integration

### Git Hooks (Husky)

#### Pre-Commit Hook

```bash
# Runs automatically on git commit
- Lint staged files
- Quick quality checks
- Security scan
- Commit size check
```

#### Pre-Push Hook

```bash
# Runs automatically on git push
- Full test suite
- Build validation
- Performance checks
- Contract tests
```

### GitHub Actions Pipeline

1. **Code Quality** - Linting, formatting, type checking
2. **Frontend Tests** - Unit tests with coverage
3. **Backend Tests** - Django tests with coverage
4. **Integration Tests** - Cross-service testing
5. **E2E Tests** - Full user flow validation
6. **Performance Tests** - Bundle size, response times
7. **Security Scan** - Dependencies, secrets
8. **Deploy** - Production deployment (main branch only)

## 📁 Test File Organization

```
/tests
  /contracts         # Service contract tests
  /e2e              # End-to-end tests
  /integration      # Integration tests
  /performance      # Load and performance tests

/apps/builder
  /__tests__        # Component tests
  /lib/__tests__    # Utility tests
  /stores/__tests__ # Store tests

/services/api
  /core/tests       # Core functionality tests
  /forms/tests      # Form-specific tests
  /webhooks/tests   # Webhook tests
```

## 🛠️ Test Commands Reference

```bash
# Quick iteration
pnpm test:quick                  # Fastest validation

# Standard validation
pnpm test:complete               # Full test suite
pnpm test:complete:quick         # Medium coverage
pnpm test:complete:full          # Everything including E2E

# Specific test types
pnpm test:ci                     # Unit tests with coverage
pnpm test:e2e                    # E2E tests
pnpm test:contracts              # Contract tests
pnpm test:integration            # Integration tests
pnpm test:perf                   # Performance tests

# Utilities
pnpm test:e2e:ui                # Playwright UI mode
pnpm lint                        # ESLint check
pnpm typecheck                   # TypeScript check
pnpm format:check                # Prettier check
```

## 🔧 Test Environment Setup

### Prerequisites

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm playwright install --with-deps chromium

# Setup Python environment
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Setup test database
createdb test_forms
```

### Environment Variables

```bash
# Test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_forms
DJANGO_SETTINGS_MODULE=api.settings
SECRET_KEY=test-secret-key

# Test services
REDIS_URL=redis://localhost:6379
HMAC_SECRET=test-hmac-secret
```

## 📈 Coverage Requirements

- **Overall**: ≥80% line coverage
- **Critical paths**: ≥90% coverage
- **New code**: 100% coverage expected

## 🚨 Test Failures

When tests fail:

1. **Read the error message** - Often indicates the exact issue
2. **Run the specific test** - Isolate the problem
3. **Check recent changes** - Use git diff to see modifications
4. **Verify environment** - Ensure all services are running
5. **Update tests if needed** - Keep tests in sync with code

## 📊 Performance Budgets

| Metric           | Limit           | Test Command      |
| ---------------- | --------------- | ----------------- |
| Runtime bundle   | <30KB           | `pnpm test:perf`  |
| API response P95 | <200ms          | Integration tests |
| Form submit P95  | <500ms          | E2E tests         |
| Memory growth    | <100MB/1000 req | Performance tests |

## 🔄 Continuous Improvement

- Review test failures weekly
- Update flaky tests immediately
- Add tests for bug fixes
- Refactor slow tests
- Monitor coverage trends

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Pytest Documentation](https://pytest.org/)
- [Django Testing](https://docs.djangoproject.com/en/5.0/topics/testing/)
