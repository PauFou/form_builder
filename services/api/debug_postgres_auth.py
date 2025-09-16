#!/usr/bin/env python
"""Debug PostgreSQL authentication issues in CI."""
import os
import sys

print("=== PostgreSQL Authentication Debug ===")
print(f"Python version: {sys.version}")

# Check environment variables
env_vars = [
    'POSTGRES_HOST',
    'POSTGRES_USER', 
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'POSTGRES_PORT',
    'DATABASE_URL',
    'DJANGO_SETTINGS_MODULE'
]

print("\nEnvironment Variables:")
for var in env_vars:
    value = os.environ.get(var)
    if var == 'POSTGRES_PASSWORD' and value:
        print(f"  {var}: {'*' * len(value)}")
    else:
        print(f"  {var}: {value}")

# Try to import Django settings
try:
    print("\nImporting Django settings...")
    from django.conf import settings
    print(f"  Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print(f"  Database engine: {settings.DATABASES['default']['ENGINE']}")
    print(f"  Database name: {settings.DATABASES['default']['NAME']}")
    print(f"  Database user: {settings.DATABASES['default']['USER']}")
    print(f"  Database host: {settings.DATABASES['default']['HOST']}")
    print(f"  Database port: {settings.DATABASES['default']['PORT']}")
except Exception as e:
    print(f"  Error importing Django settings: {e}")

# Try direct psycopg2 connection
print("\nTrying direct psycopg2 connection...")
try:
    import psycopg2
    
    is_ci = os.environ.get('CI') == 'true'
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    user = os.environ.get('POSTGRES_USER', 'test')
    database = os.environ.get('POSTGRES_DB', 'test')
    
    if is_ci:
        print("  CI environment detected - using trust authentication")
        conn_string = f"host={host} port={port} user={user} dbname={database}"
        print(f"  Connection string: {conn_string}")
        conn = psycopg2.connect(conn_string)
    else:
        password = os.environ.get('POSTGRES_PASSWORD', 'test')
        conn_params = {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'database': database
        }
        print(f"  Connection parameters: {conn_params['host']}:{conn_params['port']} user={conn_params['user']} db={conn_params['database']}")
        conn = psycopg2.connect(**conn_params)
    
    with conn.cursor() as cursor:
        cursor.execute("SELECT current_user, current_database(), version();")
        result = cursor.fetchone()
        print(f"  SUCCESS! Connected as: {result[0]} to database: {result[1]}")
        print(f"  PostgreSQL version: {result[2]}")
    conn.close()
except Exception as e:
    print(f"  ERROR: {e}")
    print(f"  Error type: {type(e).__name__}")
    
    # If we get auth error in CI, try alternative approaches
    if is_ci and ("password authentication failed" in str(e) or "no password supplied" in str(e)):
        print("\n  Trying alternative connection methods for CI...")
        
        # Try with empty password in params
        print("  Method 1: Empty password parameter")
        try:
            conn = psycopg2.connect(host=host, port=port, user=user, password='', database=database)
            print("  SUCCESS with empty password!")
            conn.close()
        except Exception as e1:
            print(f"  Failed: {e1}")
        
        # Try with no password parameter at all
        print("  Method 2: No password parameter")
        try:
            conn = psycopg2.connect(host=host, port=port, user=user, database=database)
            print("  SUCCESS with no password!")
            conn.close()
        except Exception as e2:
            print(f"  Failed: {e2}")

print("\n=== End Debug ===")