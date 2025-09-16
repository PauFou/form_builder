"""Database configuration utilities."""
import os
from decouple import config


def get_database_config():
    """Get database configuration based on environment."""
    is_ci = os.environ.get('CI') == 'true'
    
    if is_ci:
        # CI environment with trust authentication
        # Do not include password in the configuration at all
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('POSTGRES_DB', default='test'),
            'USER': config('POSTGRES_USER', default='test'),
            # No PASSWORD key for trust authentication
            'HOST': config('POSTGRES_HOST', default='127.0.0.1'),
            'PORT': config('POSTGRES_PORT', default=5432, cast=int),
            'TEST': {
                'NAME': 'forms_db_test',
            }
        }
    else:
        # Local/production environment with password authentication
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('POSTGRES_DB', default='forms'),
            'USER': config('POSTGRES_USER', default='forms'),
            'PASSWORD': config('POSTGRES_PASSWORD', default='forms_local_dev'),
            'HOST': config('POSTGRES_HOST', default='localhost'),
            'PORT': config('POSTGRES_PORT', default=5432, cast=int),
        }