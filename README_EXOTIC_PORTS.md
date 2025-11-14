# 🚀 YouForm Clone - Exotic Ports Setup

This configuration uses **exotic, conflict-free ports** to avoid clashing with your other running services!

## 🎯 Port Map (All Exotic!)

| Service | External Port | Internal Port | Why This Port? |
|---------|--------------|---------------|----------------|
| **Builder App** | `4242` | 3000 | Repeating pattern - easy to remember! |
| **Runtime Viewer** | `8787` | 3001 | Another repeating pattern! |
| **Django API** | `3141` | 8000 | π (pi) digits - for math nerds! |
| **Analytics** | `2718` | 8080 | e (Euler's number) - more math! |
| **PostgreSQL** | `7337` | 5432 | LEET speak for "LEET" |
| **Redis** | `9876` | 6379 | Reverse sequential - unique! |
| **ClickHouse HTTP** | `5147` | 8123 | Random high port |
| **ClickHouse Native** | `5148` | 9000 | Sequential to HTTP |

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)

```bash
./start-docker-exotic.sh
```

This will:
- ✅ Build all Docker images
- ✅ Start all services
- ✅ Show service status
- ✅ Display all URLs and ports
- ✅ Optionally follow logs

### Option 2: Manual Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.exotic-ports.yml up -d

# View logs
docker-compose -f docker-compose.exotic-ports.yml logs -f

# Stop all services
docker-compose -f docker-compose.exotic-ports.yml down
```

## 🌐 Access Your Services

Once running, access your services at:

### Frontend
- **Builder UI**: http://localhost:4242
- **Runtime Viewer**: http://localhost:8787

### Backend
- **Django API**: http://localhost:3141
- **API Admin**: http://localhost:3141/admin
- **API Docs (Swagger)**: http://localhost:3141/api/docs
- **Analytics Service**: http://localhost:2718

### Databases (for clients)
- **PostgreSQL**: `postgresql://forms_user:forms_password@localhost:7337/forms_db`
- **Redis**: `redis://localhost:9876/0`
- **ClickHouse**: `http://localhost:5147`

## 📦 Service Management

### View logs for all services
```bash
docker-compose -f docker-compose.exotic-ports.yml logs -f
```

### View logs for specific service
```bash
docker-compose -f docker-compose.exotic-ports.yml logs -f builder
docker-compose -f docker-compose.exotic-ports.yml logs -f api
docker-compose -f docker-compose.exotic-ports.yml logs -f postgres
```

### Restart a specific service
```bash
docker-compose -f docker-compose.exotic-ports.yml restart builder
```

### Rebuild a service after code changes
```bash
docker-compose -f docker-compose.exotic-ports.yml build --no-cache builder
docker-compose -f docker-compose.exotic-ports.yml up -d builder
```

### Stop all services
```bash
docker-compose -f docker-compose.exotic-ports.yml down
```

### Stop and remove all data (volumes)
```bash
docker-compose -f docker-compose.exotic-ports.yml down -v
```

## 🐛 Troubleshooting

### Port already in use?
If you still get "port already in use" errors, check what's using that port:

```bash
# macOS/Linux
lsof -i :4242
lsof -i :7337

# Windows
netstat -ano | findstr :4242
```

### Services not starting?
Check the logs for errors:

```bash
docker-compose -f docker-compose.exotic-ports.yml logs [service_name]
```

### Database connection issues?
Make sure PostgreSQL is healthy:

```bash
docker-compose -f docker-compose.exotic-ports.yml ps postgres
```

### Builder/Runtime not updating?
Rebuild the containers:

```bash
docker-compose -f docker-compose.exotic-ports.yml build --no-cache builder runtime
docker-compose -f docker-compose.exotic-ports.yml up -d
```

## 🔧 Development Workflow

### 1. Start services
```bash
./start-docker-exotic.sh
```

### 2. Make code changes
- Edit files in `apps/builder`, `packages/runtime`, or `services/api`
- Hot reload is enabled for builder and runtime
- API requires restart for changes

### 3. View changes
- Builder: http://localhost:4242
- Runtime: http://localhost:8787

### 4. Restart API after changes
```bash
docker-compose -f docker-compose.exotic-ports.yml restart api
```

### 5. Run database migrations
```bash
docker-compose -f docker-compose.exotic-ports.yml exec api python manage.py migrate
```

### 6. Create Django superuser
```bash
docker-compose -f docker-compose.exotic-ports.yml exec api python manage.py createsuperuser
```

## 📊 Database Management

### PostgreSQL
```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.exotic-ports.yml exec postgres psql -U forms_user -d forms_db

# Or from host machine
psql -h localhost -p 7337 -U forms_user -d forms_db
```

### Redis
```bash
# Connect to Redis CLI
docker-compose -f docker-compose.exotic-ports.yml exec redis redis-cli

# Flush all data
docker-compose -f docker-compose.exotic-ports.yml exec redis redis-cli FLUSHALL
```

### ClickHouse
```bash
# Check ClickHouse status
curl http://localhost:5147/ping

# Connect to ClickHouse client
docker-compose -f docker-compose.exotic-ports.yml exec clickhouse clickhouse-client
```

## 🎨 What's New in This Setup?

All the latest improvements from the exhaustive audit are included:

### ✅ Analytics Tab
- PURPLE chart (not blue)
- PRO warning banner
- Drop-off rate table
- Date/Device filters

### ✅ Settings Components
- **EmailSettings**: Rich text editor, tabs, PRO badges
- **LinkSettings**: Social preview card with decorations

### ✅ Logic Graph
- Pink/Blue pastel nodes
- Background #fafafa
- Dark gray arrows (3px)

### ✅ PRO Badges
- Correct pink color (#ff6b9d) throughout

## 🚢 Production Deployment

For production, use:

```bash
docker-compose -f docker-compose.exotic-ports.yml -f docker-compose.prod.yml up -d
```

Make sure to:
1. Change all passwords and secrets
2. Set `DJANGO_DEBUG=False`
3. Configure proper ALLOWED_HOSTS
4. Use real SSL certificates
5. Set up proper backup strategies

## 📝 Environment Variables

Key environment variables (already configured in docker-compose):

- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `CLICKHOUSE_HOST`: ClickHouse host
- `DJANGO_SECRET_KEY`: Django secret (change in production!)
- `NEXT_PUBLIC_API_URL`: API endpoint for frontend
- `CORS_ALLOWED_ORIGINS`: Allowed CORS origins

## 🎉 That's It!

You now have a fully working YouForm clone with:
- ✅ 100% style parity with YouForm.com
- ✅ Exotic ports that won't conflict
- ✅ Hot reload for development
- ✅ All services containerized
- ✅ Easy management scripts

Happy building! 🚀
