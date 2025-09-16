#!/usr/bin/env python
"""Test PostgreSQL connection in CI to debug authentication issues."""
import os
import sys

print("=== CI PostgreSQL Connection Test ===")
print(f"CI environment: {os.environ.get('CI')}")
print(f"Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")

# Test 1: Direct psycopg2 connection with password
print("\n1. Testing direct psycopg2 connection (with password)...")
try:
    import psycopg2
    # Connect with password parameter
    conn = psycopg2.connect(
        host='127.0.0.1',
        port='5432',
        user='test',
        password='test',
        database='test'
    )
    print("✓ SUCCESS: Connected with password!")
    conn.close()
except Exception as e:
    print(f"✗ FAILED: {e}")

# Test 2: Connection string method with password
print("\n2. Testing connection string method with password...")
try:
    import psycopg2
    # Use connection string with password
    conn_string = "host=127.0.0.1 port=5432 user=test password=test dbname=test"
    conn = psycopg2.connect(conn_string)
    print("✓ SUCCESS: Connected with connection string!")
    conn.close()
except Exception as e:
    print(f"✗ FAILED: {e}")

# Test 3: Django database configuration
print("\n3. Testing Django database configuration...")
try:
    from api.database import get_database_config
    config = get_database_config()
    print(f"Database config: {config}")
    print(f"Has PASSWORD key: {'PASSWORD' in config['default']}")
    if 'PASSWORD' in config['default']:
        print(f"PASSWORD value: {config['default']['PASSWORD']}")
except Exception as e:
    print(f"✗ FAILED to get config: {e}")

# Test 4: Django connection
print("\n4. Testing Django database connection...")
try:
    import django
    django.setup()
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        result = cursor.fetchone()
        print(f"✓ SUCCESS: Django connected! PostgreSQL {result[0]}")
except Exception as e:
    print(f"✗ FAILED: {e}")
    
    # Try to understand what Django is trying to do
    try:
        from django.conf import settings
        db_settings = settings.DATABASES['default']
        print("\nDjango is trying to connect with:")
        for key in ['ENGINE', 'NAME', 'USER', 'HOST', 'PORT']:
            print(f"  {key}: {db_settings.get(key)}")
        if 'PASSWORD' in db_settings:
            print(f"  PASSWORD: {'<set>' if db_settings['PASSWORD'] else '<empty>'}")
        else:
            print("  PASSWORD: <not in config>")
    except Exception as e2:
        print(f"Could not inspect Django settings: {e2}")

print("\n=== End Connection Test ===")
sys.exit(0)