#!/usr/bin/env python
"""Test Django database connection in CI environment."""
import os
import sys

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings_test')

import django
django.setup()

from django.db import connection  # noqa: E402
from django.core.management import execute_from_command_line  # noqa: E402

print("=== Testing Django Database Connection ===")
print(f"CI Environment: {os.environ.get('CI', 'false')}")
print(f"Settings Module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")

try:
    # Test connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_user, current_database(), version();")
        user, db, version = cursor.fetchone()
        print("\n✅ SUCCESS: Connected to Django database")
        print(f"   User: {user}")
        print(f"   Database: {db}")
        print(f"   PostgreSQL: {version.split(',')[0]}")
        
    # Test migrations
    print("\nTesting Django migrations...")
    execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    print("✅ Migrations completed successfully")
    
    print("\n🎉 All tests passed! Django can connect to PostgreSQL in CI.")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"   Type: {type(e).__name__}")
    sys.exit(1)