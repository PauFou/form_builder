"""Centralized database configuration for different environments."""
import os
from decouple import config


def get_database_config():
    """Get database configuration based on environment."""
    # Base configuration
    # For tests, use 'test' as default database name
    is_test = os.environ.get('DJANGO_SETTINGS_MODULE') == 'api.settings_test'
    default_db_name = 'test' if is_test else 'forms_db'
    default_user = 'test' if is_test else 'forms_user'
    default_password = 'test' if is_test else 'secure_password'
    default_host = '127.0.0.1' if os.environ.get('CI') == 'true' else 'localhost'
    
    db_config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default=default_db_name),
        'USER': config('POSTGRES_USER', default=default_user),
        'PASSWORD': config('POSTGRES_PASSWORD', default=default_password),
        'HOST': config('POSTGRES_HOST', default=default_host),
        'PORT': config('POSTGRES_PORT', default=5432, cast=int),
    }
    
    # Add test database name for test settings
    # In CI, use 'test' database directly without creating a new one
    if is_test:
        if os.environ.get('CI') == 'true':
            # In CI, use the existing 'test' database
            db_config['TEST'] = {
                'NAME': 'test',
                'SERIALIZE': False,  # Don't serialize test database for parallel tests
            }
        else:
            # In local dev, create a test database
            db_config['TEST'] = {
                'NAME': 'forms_db_test',
            }
    
    return {'default': db_config}