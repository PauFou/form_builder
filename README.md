# FormSaaS - Professional Form Platform

A fast, reliable, EU-hosted alternative to Typeform with enterprise-grade features.

## Quick Start

```bash
# Install dependencies
make install

# Start Docker services (PostgreSQL, Redis, ClickHouse, MinIO)
make docker-up

# Run development servers
make dev
```

## Architecture

- **Monorepo** with Turborepo
- **Backend**: Django 5 + Django REST Framework
- **Frontend**: Next.js 14 + React 19 + Tailwind CSS
- **Runtime**: Ultra-lightweight (<30KB) form viewer
- **Queue**: Celery + Redis/SQS
- **Analytics**: ClickHouse
- **Storage**: S3-compatible (EU)

## Project Structure

```
/
├── apps/
│   ├── marketing/     # Public website
│   └── builder/      # Form builder app
├── services/
│   ├── api/         # Django API
│   ├── ingest/      # Edge ingestion
│   └── workers/     # Async workers
├── packages/
│   ├── runtime/     # Form viewer
│   ├── ui/          # Shared components
│   └── contracts/   # Shared types
```

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.

### Available Commands

```bash
make help          # Show all commands
make test         # Run tests
make lint         # Run linters
make build        # Build all packages
```

## License

Proprietary - All rights reserved