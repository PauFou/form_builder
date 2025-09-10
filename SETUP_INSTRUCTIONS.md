# Form Builder - Setup Instructions

## Current Status

✅ **Frontend**: Running on port 3001
✅ **Webhook Receiver**: Running on port 9000  
✅ **Django Backend**: Code is ready and fixed
⚠️ **PostgreSQL**: Installed but not running
⚠️ **Redis**: Installed but not running

## Quick Setup

To run the full stack, you need PostgreSQL and Redis running. Choose one option:

### Option 1: Docker (Easiest)

```bash
# Start Docker Desktop first, then:
docker-compose up -d postgres redis

# Run Django migrations
cd services/api
source .venv/bin/activate
python manage.py migrate
python manage.py runserver
```

### Option 2: Local Services (macOS)

```bash
# Start PostgreSQL (if installed via Homebrew)
brew services start postgresql@16

# Or if using PostgreSQL.app, just open the app

# Create database and user
createuser -s forms
createdb -O forms forms
psql -d forms -c "ALTER USER forms WITH PASSWORD 'forms_local_dev';"

# Start Redis
brew services start redis

# Run Django migrations
cd services/api
source .venv/bin/activate
python manage.py migrate
python manage.py runserver
```

## Testing Status

### Frontend Tests (Working ✅)

```bash
# Simple E2E test (frontend only)
pnpm test:e2e:simple

# Basic webhook test
pnpm test:e2e -- e2e/basic-webhook.spec.ts
```

### Backend API (Requires PostgreSQL + Redis)

Once PostgreSQL and Redis are running:

```bash
cd services/api
source .venv/bin/activate
python manage.py runserver

# Test credentials:
# Email: test@example.com
# Password: password123
```

## What Was Fixed

1. **Django Models**: Fixed circular imports and model structure
2. **PostgreSQL ArrayField**: Made compatible with SQLite for development flexibility
3. **App Organization**: Properly separated core, forms, webhooks, and integrations apps
4. **Migrations**: Generated initial migrations for all apps
5. **Test Data**: Created test user and organization

## Next Steps

1. Start PostgreSQL and Redis (using Docker or local installation)
2. Run Django migrations
3. Start the Django API server
4. Run the full E2E tests with backend integration

The codebase is now properly structured and ready for development!
