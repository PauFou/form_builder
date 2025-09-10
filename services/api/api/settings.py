import os
from datetime import timedelta
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="django-insecure-dev-key")

DEBUG = config("DJANGO_DEBUG", default=True, cast=bool)

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1,0.0.0.0",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    "django_celery_beat",
    # Local
    "core",
    "webhooks",
    "accounts",
    "forms",
    "submissions",
    "integrations",
    "importers",
    "gdpr",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "api.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("POSTGRES_DB", default="forms"),
        "USER": config("POSTGRES_USER", default="forms"),
        "PASSWORD": config("POSTGRES_PASSWORD", default="forms_local_dev"),
        "HOST": config("POSTGRES_HOST", default="localhost"),
        "PORT": config("POSTGRES_PORT", default=5432, cast=int),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media files
MEDIA_URL = "media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "mediafiles")

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom User model
AUTH_USER_MODEL = "core.User"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        seconds=config("JWT_ACCESS_TOKEN_LIFETIME", default=3600, cast=int)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        seconds=config("JWT_REFRESH_TOKEN_LIFETIME", default=604800, cast=int)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": config("JWT_SECRET", default=SECRET_KEY),
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]
CORS_ALLOW_CREDENTIALS = True

# Celery
CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Celery task settings
CELERY_TASK_SOFT_TIME_LIMIT = 300  # 5 minutes
CELERY_TASK_TIME_LIMIT = 600  # 10 minutes
CELERY_TASK_MAX_RETRIES = 3
CELERY_TASK_DEFAULT_RETRY_DELAY = 60  # 1 minute

# Cache (for rate limiting)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://localhost:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# DRF Spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "Forms Platform API",
    "DESCRIPTION": "Professional form platform API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Encryption key for sensitive data
ENCRYPTION_KEY = config("ENCRYPTION_KEY", default="dev_encryption_key_32_chars_long")

# Frontend URL
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3001")

# OAuth Credentials
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")
SLACK_CLIENT_ID = config("SLACK_CLIENT_ID", default="")
SLACK_CLIENT_SECRET = config("SLACK_CLIENT_SECRET", default="")
NOTION_CLIENT_ID = config("NOTION_CLIENT_ID", default="")
NOTION_CLIENT_SECRET = config("NOTION_CLIENT_SECRET", default="")

# Stripe
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")

# Analytics Service
ANALYTICS_SERVICE_URL = config("ANALYTICS_SERVICE_URL", default="http://localhost:8002")

# GDPR Settings
GDPR_DATA_REGIONS = {
    "eu-west-1": "EU West (Ireland)",
    "eu-central-1": "EU Central (Frankfurt)",
    "eu-north-1": "EU North (Stockholm)",
}
DEFAULT_DATA_REGION = config("DEFAULT_DATA_REGION", default="eu-west-1")

# Email settings for GDPR notifications
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@forms-platform.eu")
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend"
)

# AWS Settings for data export storage
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="forms-gdpr-exports")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="eu-west-1")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None

# GDPR Compliance defaults
GDPR_DEFAULT_RETENTION_DAYS = {
    "submissions": 365,
    "partials": 30,
    "attachments": 365,
    "audit_logs": 730,  # 2 years
}
GDPR_EXPORT_EXPIRY_DAYS = 7
GDPR_DELETION_REQUEST_EXPIRY_HOURS = 48