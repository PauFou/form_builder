# 📋 Skemya Forms Platform

> **Professional form platform** — A fast, reliable, EU-hosted alternative to Typeform

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![Django](https://img.shields.io/badge/Django-5.0-green)]()

**🚀 Production-Ready** | **✅ 200+ Tests** | **📚 Complete Documentation** | **🔌 3+ Integrations**

Create beautiful forms with advanced logic, collect responses, and integrate with your favorite tools.

## ✨ Recent Improvements (Jan 2025)

- ✅ **Test Coverage**: Increased from 60% to **85%+**
- ✅ **New Tests**: Added **150+ unit & integration tests**
- ✅ **E2E Tests**: Complete workflow coverage with **12 Playwright tests**
- ✅ **Documentation**: Created comprehensive **550-line Developer Guide**
- ✅ **Integrations**: Implemented **Stripe, Google Sheets, and Slack**
- ✅ **Analytics**: ClickHouse integration with funnels & drop-off analysis

👉 **See [IMPROVEMENTS_SUMMARY.md](docs/IMPROVEMENTS_SUMMARY.md) for details**

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/forms-platform.git
cd forms-platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services
docker-compose up -d

# Run database migrations
cd services/api && python manage.py migrate && cd ../..

# Start development servers
pnpm dev
```

The platform will be available at:

- Marketing site: http://localhost:3000
- Builder app: http://localhost:3001
- API: http://localhost:8000
- Analytics: http://localhost:8002
- MailHog: http://localhost:8025

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Marketing     │     │    Builder      │     │    Runtime      │
│   (Next.js)     │     │   (Next.js)     │     │   (CDN Edge)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                         │
         └───────────────────────┴─────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │      API Gateway        │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴────────┐    ┌────────┴────────┐    ┌────────┴────────┐
│   Django API    │    │   Analytics     │    │    Workers      │
│     (DRF)       │    │   (FastAPI)     │    │   (Celery)     │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────┬───────────┼───────────┬───────────┐
         │           │           │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
    │Postgres │ │  Redis  │ │ClickHouse│ │   S3    │ │MailHog │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching
- **Framer Motion** - Animations

### Backend

- **Django 5** - Python web framework
- **Django REST Framework** - API development
- **Celery** - Async task processing
- **FastAPI** - Analytics service
- **PostgreSQL** - Primary database
- **ClickHouse** - Analytics database
- **Redis** - Cache & queues

### Infrastructure

- **Docker** - Containerization
- **Turborepo** - Monorepo management
- **Local Testing** - Comprehensive quality gates with Git hooks
- **Cloudflare** - CDN & edge functions

## 📦 Project Structure

```
.
├── apps/                   # Applications
│   ├── builder/           # Form builder (Next.js)
│   └── marketing/         # Marketing site (Next.js)
├── packages/              # Shared packages
│   ├── analytics/         # Analytics SDK
│   ├── contracts/         # TypeScript contracts
│   ├── runtime/           # Form runtime (<30KB)
│   └── ui/                # Shared UI components
├── services/              # Backend services
│   ├── analytics/         # Analytics API (FastAPI)
│   └── api/              # Main API (Django)
├── e2e/                   # End-to-end tests
├── scripts/               # Build & utility scripts
└── docker-compose.yml     # Local development stack
```

## 🔧 Development

### Local Testing System

This project uses a comprehensive local testing system with mandatory Git hooks to ensure code quality:

```bash
# Initial setup (one-time)
bash scripts/setup-local-testing.sh

# Quick tests during development
./test-quick.sh

# Full test suite before major changes
./test-all.sh
```

**Git Hooks** (automatic):

- **Pre-commit**: Formatting, linting, type checks
- **Pre-push**: Full test suite, builds, performance validation

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Accessibility tests
pnpm test:a11y

# Contract tests
pnpm test:contracts

# Performance tests
pnpm test:perf

# Local test suite
pnpm test:local        # Standard tests
pnpm test:local:quick  # Quick checks only
pnpm test:local:all    # Everything including E2E
```

### Code Quality

```bash
# Linting
pnpm lint
pnpm lint:fix    # Auto-fix issues

# Type checking
pnpm typecheck

# Format code
pnpm format
pnpm format:check  # Check only
```

See `docs/LOCAL_TESTING.md` for detailed documentation on the local testing system.

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @forms/runtime build

# Build for production
pnpm build:prod
```

## 🚀 Deployment

### Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `POSTGRES_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CLICKHOUSE_URL` - ClickHouse connection string
- `S3_*` - S3/MinIO configuration
- `JWT_SECRET` - JWT signing secret
- `HMAC_SECRET` - Webhook signing secret

### Production Deployment

1. **Database Migration**

   ```bash
   python manage.py migrate
   ```

2. **Build Images**

   ```bash
   docker build -t forms/api ./services/api
   docker build -t forms/analytics ./services/analytics
   ```

3. **Deploy Services**
   - Deploy API and worker services
   - Deploy analytics service
   - Deploy frontend applications to CDN
   - Configure edge functions for form runtime

## 📊 Monitoring

### Health Checks

- API: `GET /health`
- Analytics: `GET /health`
- Worker: Redis ping

### Metrics

- Application metrics via Prometheus
- Distributed tracing with OpenTelemetry
- Error tracking with Sentry

### Dashboards

- System metrics in Grafana
- Analytics in built-in dashboard
- Error rates and SLOs

## 🔒 Security

- **Data Encryption**: TLS 1.2+ in transit, AES-256 at rest
- **Authentication**: JWT with refresh tokens
- **Authorization**: RBAC (Owner, Admin, Editor, Viewer)
- **GDPR Compliant**: Data residency in EU, right to deletion
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Rate Limiting**: Per-IP and per-user limits
- **Input Validation**: Zod schemas, SQL injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ using amazing open source projects:

- [Next.js](https://nextjs.org)
- [Django](https://www.djangoproject.com)
- [PostgreSQL](https://www.postgresql.org)
- [ClickHouse](https://clickhouse.com)
- [shadcn/ui](https://ui.shadcn.com)
