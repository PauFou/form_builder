"""Test settings for Django API."""
from .settings import *  # noqa: F403, F401
from .database import get_database_config

# Override settings for testing
DEBUG = False
TESTING = True

# Use database configuration based on environment (CI uses trust auth)
DATABASES = get_database_config()

# Use locmem cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Keep migrations enabled for CI to ensure proper database setup
# Only disable in local development if needed
# class DisableMigrations:
#     def __contains__(self, item):
#         return True
#
#     def __getitem__(self, item):
#         return None
#
# MIGRATION_MODULES = DisableMigrations()

# Simplify password hasher for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Test-specific settings
SECRET_KEY = 'test-secret-key-for-testing-only'
ALLOWED_HOSTS = ['*']
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable rate limiting for tests
RATELIMIT_ENABLE = False

# Disable CSRF for API tests
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
}