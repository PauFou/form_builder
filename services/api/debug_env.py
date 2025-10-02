#!/usr/bin/env python
"""Debug environment variables for test setup."""
import os
import sys

def main():
    """Display key environment variables for debugging test configuration."""
    print("=== Test Environment Debug ===")
    print()
    
    # Database configuration
    db_vars = [
        'POSTGRES_HOST',
        'POSTGRES_USER', 
        'POSTGRES_PASSWORD',
        'POSTGRES_DB',
        'POSTGRES_PORT',
    ]
    
    print("Database Configuration:")
    for var in db_vars:
        value = os.environ.get(var, 'Not set')
        # Mask password
        if 'PASSWORD' in var and value != 'Not set':
            value = '*' * len(value)
        print(f"  {var}: {value}")
    
    print()
    
    # Django configuration
    django_vars = [
        'DJANGO_SETTINGS_MODULE',
        'DJANGO_SECRET_KEY',
        'DJANGO_DEBUG',
        'ALLOWED_HOSTS',
    ]
    
    print("Django Configuration:")
    for var in django_vars:
        value = os.environ.get(var, 'Not set')
        # Mask secret key
        if 'SECRET' in var and value != 'Not set':
            value = value[:10] + '...' if len(value) > 10 else '*' * len(value)
        print(f"  {var}: {value}")
    
    print()
    
    # Test configuration
    test_vars = [
        'CI',
        'TESTING',
        'PYTEST_CURRENT_TEST',
    ]
    
    print("Test Configuration:")
    for var in test_vars:
        value = os.environ.get(var, 'Not set')
        print(f"  {var}: {value}")
    
    print()
    print("=== End Debug ===")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())