"""Centralized database configuration for different environments."""
import os
from decouple import config


def get_database_config():
    """Get database configuration based on environment."""
    is_ci = os.environ.get('CI') == 'true'
    
    # Base configuration
    # For tests, use 'test' as default database name
    default_db_name = 'test' if os.environ.get('DJANGO_SETTINGS_MODULE') == 'api.settings_test' else 'forms_db'
    default_user = 'test' if os.environ.get('DJANGO_SETTINGS_MODULE') == 'api.settings_test' else 'forms_user'
    default_host = '127.0.0.1' if is_ci else 'localhost'
    
    db_config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default=default_db_name),
        'USER': config('POSTGRES_USER', default=default_user),
        'HOST': config('POSTGRES_HOST', default=default_host),
        'PORT': config('POSTGRES_PORT', default=5432, cast=int),
    }
    
    # In CI with trust auth, we must NOT include the PASSWORD key at all
    # PostgreSQL with trust auth expects no password parameter
    if not is_ci:
        db_config['PASSWORD'] = config('POSTGRES_PASSWORD', default='secure_password')
    
    # Add test database name for test settings
    if os.environ.get('DJANGO_SETTINGS_MODULE') == 'api.settings_test':
        db_config['TEST'] = {
            'NAME': 'forms_db_test',
        }
    
    return {'default': db_config}