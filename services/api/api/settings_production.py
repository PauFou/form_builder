"""
Production settings for Forms API
CRITICAL: This file contains security-critical settings for production deployment
"""

from .settings import *
import os

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# SECURITY - Force HTTPS in production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Session security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# File upload restrictions
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Allowed file extensions for uploads
ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.txt', '.csv', '.zip'
]

# Maximum file size per type (in bytes)
MAX_FILE_SIZES = {
    'image': 5 * 1024 * 1024,     # 5MB for images
    'document': 10 * 1024 * 1024,  # 10MB for documents
    'archive': 50 * 1024 * 1024,   # 50MB for archives
}

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net')
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", 'https://fonts.googleapis.com')
CSP_FONT_SRC = ("'self'", 'https://fonts.gstatic.com')
CSP_IMG_SRC = ("'self'", 'data:', 'https:')
CSP_CONNECT_SRC = ("'self'", 'https://api.stripe.com')

# Ensure all required environment variables are set
REQUIRED_ENV_VARS = [
    'SECRET_KEY',
    'JWT_SECRET',
    'HMAC_SECRET',
    'POSTGRES_HOST',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'REDIS_URL',
    'ALLOWED_HOSTS',
]

for var in REQUIRED_ENV_VARS:
    if not os.environ.get(var):
        raise ValueError(f"Required environment variable {var} is not set")

# Ensure secret keys are strong enough
if len(os.environ.get('SECRET_KEY', '')) < 50:
    raise ValueError("SECRET_KEY must be at least 50 characters long")

if len(os.environ.get('JWT_SECRET', '')) < 32:
    raise ValueError("JWT_SECRET must be at least 32 characters long")

if len(os.environ.get('HMAC_SECRET', '')) < 32:
    raise ValueError("HMAC_SECRET must be at least 32 characters long")

# Rate limiting for production
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_ENABLE = True

# Additional login security
ACCOUNT_LOGIN_ATTEMPTS_LIMIT = 5
ACCOUNT_LOGIN_ATTEMPTS_TIMEOUT = 300  # 5 minutes

# Audit logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/forms-api/security.log',
            'maxBytes': 1024 * 1024 * 100,  # 100MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'api.security': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Email configuration for security alerts
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
SECURITY_EMAIL_ALERTS = os.environ.get('SECURITY_EMAIL_ALERTS', '').split(',')

# GDPR compliance settings
GDPR_ENABLED = True
PII_ENCRYPTION_ENABLED = True
DATA_RETENTION_DAYS = 365 * 2  # 2 years default

# Webhook security
WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 300  # 5 minutes
WEBHOOK_MAX_RETRIES = 7
WEBHOOK_RETRY_DELAY_SECONDS = [0, 30, 120, 600, 3600, 21600, 86400]  # Exponential backoff

print("🔒 Production security settings loaded successfully")