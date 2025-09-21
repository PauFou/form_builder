#!/usr/bin/env python
"""Test PostgreSQL connection with various methods."""
import os
import sys
import psycopg2
from psycopg2 import OperationalError

def test_direct_connection():
    """Test direct psycopg2 connection."""
    print("=== Testing Direct psycopg2 Connection ===")
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    user = os.environ.get('POSTGRES_USER', 'test')
    password = os.environ.get('POSTGRES_PASSWORD', 'test')
    database = os.environ.get('POSTGRES_DB', 'test')
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Password: {'*' * len(password)}")
    print(f"Database: {database}")
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        cursor.execute("SELECT current_user, current_database(), version();")
        result = cursor.fetchone()
        print(f"Connected! User: {result[0]}, DB: {result[1]}")
        print(f"PostgreSQL Version: {result[2]}")
        cursor.close()
        conn.close()
        return True
    except OperationalError as e:
        print(f"Connection failed: {e}")
        return False

def test_django_connection():
    """Test Django database connection."""
    print("\n=== Testing Django Connection ===")
    try:
        import django
        from django.db import connection
        
        print(f"Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
        django.setup()
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_user, current_database();")
            result = cursor.fetchone()
            print(f"Django connected! User: {result[0]}, DB: {result[1]}")
        return True
    except Exception as e:
        print(f"Django connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_decouple_config():
    """Test python-decouple configuration."""
    print("\n=== Testing python-decouple Config ===")
    try:
        from decouple import config
        
        print(f"POSTGRES_HOST from decouple: {config('POSTGRES_HOST', default='127.0.0.1')}")
        print(f"POSTGRES_USER from decouple: {config('POSTGRES_USER', default='test')}")
        print(f"POSTGRES_DB from decouple: {config('POSTGRES_DB', default='test')}")
        return True
    except Exception as e:
        print(f"Decouple config failed: {e}")
        return False

if __name__ == "__main__":
    print("PostgreSQL Connection Test")
    print("=" * 50)
    
    results = []
    results.append(("Direct psycopg2", test_direct_connection()))
    results.append(("python-decouple", test_decouple_config()))
    results.append(("Django", test_django_connection()))
    
    print("\n" + "=" * 50)
    print("Summary:")
    for name, success in results:
        status = "✓" if success else "✗"
        print(f"{status} {name}")
    
    sys.exit(0 if all(r[1] for r in results) else 1)