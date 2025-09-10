# VPS Deployment Guide (OVH)

This guide covers deploying the Forms Platform on an OVH VPS without cloud dependencies.

## System Requirements

- OVH VPS with Ubuntu 22.04 LTS
- Minimum 4 vCPUs, 8GB RAM, 80GB SSD
- Public IP address
- Domain name pointed to VPS

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Nginx         │
                    │  (Reverse Proxy)│
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                          │
   ┌────▼──────┐  ┌────────────┐  ┌──────────────▼─────┐
   │ Next.js   │  │  Django    │  │   Static Files     │
   │ Apps      │  │  API       │  │  (Local Storage)   │
   └───────────┘  └─────┬──────┘  └────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                 │
   ┌────▼──────┐  ┌─────────┐  ┌────────▼──────┐
   │PostgreSQL │  │  Redis  │  │  ClickHouse   │
   └───────────┘  └─────────┘  └───────────────┘
```

## Initial Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  build-essential \
  git \
  curl \
  wget \
  nginx \
  certbot \
  python3-certbot-nginx \
  postgresql-14 \
  redis-server \
  supervisor \
  ufw
```

### 2. Create Application User

```bash
sudo adduser --system --group forms
sudo mkdir -p /var/www/forms
sudo chown forms:forms /var/www/forms
```

### 3. Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## Database Setup

### PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE forms;
CREATE USER forms_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE forms TO forms_user;
\q
```

### ClickHouse

```bash
# Install ClickHouse
curl https://clickhouse.com/ | sh
sudo ./clickhouse install

# Configure for forms analytics
sudo -u clickhouse clickhouse-client

CREATE DATABASE IF NOT EXISTS forms_analytics;
\q

# Apply schema
sudo -u clickhouse clickhouse-client --database=forms_analytics < /path/to/services/analytics/schema.sql
```

## Application Deployment

### 1. Clone Repository

```bash
sudo -u forms git clone https://github.com/your-org/forms-platform.git /var/www/forms/app
cd /var/www/forms/app
```

### 2. Python Environment (Django API)

```bash
cd services/api
sudo -u forms python3 -m venv venv
sudo -u forms ./venv/bin/pip install --upgrade pip
sudo -u forms ./venv/bin/pip install -r requirements.txt
```

### 3. Node.js Environment

```bash
# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Build applications
sudo -u forms pnpm install
sudo -u forms pnpm build
```

### 4. Environment Configuration

Create `/var/www/forms/app/.env`:

```bash
# Database
POSTGRES_URL=postgresql://forms_user:secure_password_here@localhost:5432/forms
REDIS_URL=redis://localhost:6379

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_DB=forms_analytics

# Django
DJANGO_SECRET_KEY=generate-a-secure-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=forms.example.com,www.forms.example.com

# Storage (Local)
SECURE_STORAGE_ROOT=/var/www/forms/secure_storage
MEDIA_ROOT=/var/www/forms/media
SITE_URL=https://forms.example.com

# JWT
JWT_SECRET=generate-another-secure-key

# Email (configure with your SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@example.com
EMAIL_HOST_PASSWORD=smtp-password
```

### 5. Create Storage Directories

```bash
sudo -u forms mkdir -p /var/www/forms/secure_storage
sudo -u forms mkdir -p /var/www/forms/media/uploads
sudo chmod 700 /var/www/forms/secure_storage
```

### 6. Django Setup

```bash
cd /var/www/forms/app/services/api
sudo -u forms ./venv/bin/python manage.py collectstatic --noinput
sudo -u forms ./venv/bin/python manage.py migrate
sudo -u forms ./venv/bin/python manage.py createsuperuser
```

## Process Management (Supervisor)

### Django API

Create `/etc/supervisor/conf.d/forms-api.conf`:

```ini
[program:forms-api]
command=/var/www/forms/app/services/api/venv/bin/gunicorn api.wsgi:application --bind 127.0.0.1:8000 --workers 4
directory=/var/www/forms/app/services/api
user=forms
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/forms/api.log
environment="PATH=/var/www/forms/app/services/api/venv/bin"
```

### Celery Worker

Create `/etc/supervisor/conf.d/forms-celery.conf`:

```ini
[program:forms-celery]
command=/var/www/forms/app/services/api/venv/bin/celery -A api worker -l info
directory=/var/www/forms/app/services/api
user=forms
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/forms/celery.log
environment="PATH=/var/www/forms/app/services/api/venv/bin"
```

### Analytics Service

Create `/etc/supervisor/conf.d/forms-analytics.conf`:

```ini
[program:forms-analytics]
command=/var/www/forms/app/services/analytics/venv/bin/python app.py
directory=/var/www/forms/app/services/analytics
user=forms
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/forms/analytics.log
```

### Next.js Apps

Create `/etc/supervisor/conf.d/forms-builder.conf`:

```ini
[program:forms-builder]
command=/usr/bin/node /var/www/forms/app/apps/builder/.next/standalone/apps/builder/server.js
directory=/var/www/forms/app/apps/builder
user=forms
autostart=true
autorestart=true
environment="NODE_ENV=production,PORT=3001"
stdout_logfile=/var/log/forms/builder.log
```

## Nginx Configuration

Create `/etc/nginx/sites-available/forms`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name forms.example.com www.forms.example.com;
    return 301 https://forms.example.com$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name forms.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/forms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/forms.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # API endpoints
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Analytics API
    location /api/analytics/ {
        proxy_pass http://127.0.0.1:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/forms/app/services/api/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files (uploads)
    location /media/ {
        alias /var/www/forms/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Builder app
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # File size limits
    client_max_body_size 50M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/forms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate

```bash
sudo certbot --nginx -d forms.example.com -d www.forms.example.com
```

## Backup Strategy

### 1. Database Backups

Create `/var/www/forms/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/www/forms/backups/db"
mkdir -p $BACKUP_DIR

# PostgreSQL
pg_dump -U forms_user -h localhost forms | gzip > $BACKUP_DIR/postgres-$(date +%Y%m%d-%H%M%S).sql.gz

# ClickHouse
clickhouse-client --query "SELECT * FROM forms_analytics.events FORMAT TabSeparated" | gzip > $BACKUP_DIR/clickhouse-$(date +%Y%m%d-%H%M%S).tsv.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### 2. File Storage Backups

```bash
#!/bin/bash
BACKUP_DIR="/var/www/forms/backups/files"
mkdir -p $BACKUP_DIR

# Backup secure storage and media
tar -czf $BACKUP_DIR/storage-$(date +%Y%m%d-%H%M%S).tar.gz \
  /var/www/forms/secure_storage \
  /var/www/forms/media

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 3. Automated Backups (Cron)

```bash
# Add to forms user crontab
0 3 * * * /var/www/forms/backup-db.sh
0 4 * * * /var/www/forms/backup-files.sh

# Optional: sync to OVH backup storage
0 5 * * * rsync -avz /var/www/forms/backups/ backup-storage:/backups/
```

## Monitoring

### 1. System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor disk usage
df -h
du -sh /var/www/forms/*
```

### 2. Application Monitoring

Create simple health check endpoint monitoring:

```bash
#!/bin/bash
# /var/www/forms/health-check.sh

# Check services
curl -f http://localhost:8000/health/ || echo "API is down"
curl -f http://localhost:3001/ || echo "Builder is down"
curl -f http://localhost:8002/health || echo "Analytics is down"
```

### 3. Log Rotation

Create `/etc/logrotate.d/forms`:

```
/var/log/forms/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 forms forms
    sharedscripts
    postrotate
        supervisorctl restart all
    endscript
}
```

## Security Hardening

### 1. Fail2ban

```bash
sudo apt install fail2ban

# Create /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
```

### 2. Automatic Updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 3. File Permissions

```bash
# Secure storage directories
sudo chmod 700 /var/www/forms/secure_storage
sudo chmod 755 /var/www/forms/media

# Application files
sudo find /var/www/forms/app -type f -exec chmod 644 {} \;
sudo find /var/www/forms/app -type d -exec chmod 755 {} \;
```

## Maintenance

### Restart Services

```bash
sudo supervisorctl restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis
```

### Update Application

```bash
cd /var/www/forms/app
sudo -u forms git pull
sudo -u forms pnpm install
sudo -u forms pnpm build
sudo -u forms ./services/api/venv/bin/python manage.py migrate
sudo supervisorctl restart all
```

## Troubleshooting

### Check Logs

```bash
# Application logs
tail -f /var/log/forms/*.log

# System logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

### Common Issues

1. **Permission denied errors**
   - Check file ownership: `chown -R forms:forms /var/www/forms`

2. **502 Bad Gateway**
   - Check if services are running: `sudo supervisorctl status`
   - Check port bindings: `netstat -tlnp`

3. **Database connection errors**
   - Check PostgreSQL: `sudo -u postgres psql -c "SELECT 1"`
   - Check connection string in `.env`

4. **Storage errors**
   - Check disk space: `df -h`
   - Check directory permissions

## Performance Tuning

### PostgreSQL

Edit `/etc/postgresql/14/main/postgresql.conf`:

```
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 10MB
maintenance_work_mem = 512MB
```

### Nginx

Add to server block:

```nginx
# Gzip compression
gzip on;
gzip_types text/plain application/json application/javascript text/css;
gzip_min_length 1000;

# Connection limits
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

## Conclusion

This setup provides a robust, production-ready deployment on OVH VPS without cloud dependencies. All data is stored locally with proper backup strategies, and the system is optimized for EU data residency requirements.
