# Deployment Guide - Forms Platform

## Prerequisites

- VPS with Ubuntu 22.04 or newer
- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/form_builder.git
cd form_builder
```

### 2. Setup environment variables

```bash
cp .env.example .env
# Edit .env with your production values
nano .env
```

**Important variables to update:**

- `DJANGO_SECRET_KEY` - Generate a new secret key
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_HOSTS` - Your domain name
- `CORS_ALLOWED_ORIGINS` - Your frontend URLs
- Email settings for production

### 3. Start services with Docker Compose

```bash
docker-compose up -d
```

This will start:

- PostgreSQL (port 5432)
- Redis (port 6379)
- ClickHouse for analytics (ports 8123, 9000)

### 4. Setup the API

```bash
# Enter the API directory
cd services/api

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 5. Start the API server

For development:

```bash
python manage.py runserver 0.0.0.0:8000
```

For production with Gunicorn:

```bash
pip install gunicorn
gunicorn api.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### 6. Start Celery workers

```bash
# In a new terminal/screen
celery -A api worker -l info

# In another terminal for beat scheduler
celery -A api beat -l info
```

### 7. Build and deploy frontend

```bash
# Return to project root
cd ../..

# Install dependencies
npm install -g pnpm
pnpm install

# Build all apps
pnpm build

# The built files will be in:
# - apps/marketing/.next
# - apps/builder/.next
```

### 8. Configure Nginx

Create `/etc/nginx/sites-available/forms-platform`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Builder app
    location /builder {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Marketing site (default)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/forms-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 10. Create systemd services

Create `/etc/systemd/system/forms-api.service`:

```ini
[Unit]
Description=Forms Platform API
After=network.target

[Service]
Type=exec
User=www-data
WorkingDirectory=/path/to/form_builder/services/api
Environment="PATH=/path/to/form_builder/services/api/.venv/bin"
ExecStart=/path/to/form_builder/services/api/.venv/bin/gunicorn api.wsgi:application --bind 0.0.0.0:8000 --workers 4
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable forms-api
sudo systemctl start forms-api
```

## Production Checklist

- [ ] Update all secrets in `.env`
- [ ] Configure proper database backups
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Configure log rotation
- [ ] Setup firewall rules (ufw)
- [ ] Enable automatic security updates
- [ ] Configure email service (SMTP)
- [ ] Setup S3-compatible storage for file uploads
- [ ] Configure CDN for static assets
- [ ] Setup error tracking (Sentry)

## Monitoring

Check service status:

```bash
# Docker services
docker-compose ps

# API
sudo systemctl status forms-api

# Database
docker-compose exec postgres pg_isready

# Logs
docker-compose logs -f
journalctl -u forms-api -f
```

## Troubleshooting

### Database connection issues

- Check PostgreSQL is running: `docker-compose ps postgres`
- Verify credentials in `.env`
- Check firewall rules

### API not responding

- Check service status: `sudo systemctl status forms-api`
- Check logs: `journalctl -u forms-api -n 100`
- Verify port 8000 is not blocked

### Frontend build issues

- Ensure Node.js 20+ is installed
- Clear cache: `pnpm store prune`
- Rebuild: `pnpm install && pnpm build`

## Security Notes

1. Always use HTTPS in production
2. Keep all dependencies updated
3. Use strong passwords and secrets
4. Enable firewall (ufw) and only allow necessary ports
5. Regular backups of PostgreSQL data
6. Monitor logs for suspicious activity
