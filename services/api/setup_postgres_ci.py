#!/usr/bin/env python
"""Setup PostgreSQL for CI environment with proper error handling."""
import os
import sys
import time
import subprocess
import psycopg2
from psycopg2 import sql, OperationalError

def run_psql_command(command, user='postgres', password='postgres', database='postgres', host='127.0.0.1', port='5432'):
    """Run a psql command and return success status."""
    env = os.environ.copy()
    env['PGPASSWORD'] = password
    
    cmd = [
        'psql',
        '-h', host,
        '-p', port,
        '-U', user,
        '-d', database,
        '-c', command,
        '--no-password',
        '-t'  # Tuples only
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return False, '', str(e)

def wait_for_postgres(host='127.0.0.1', port='5432', user='postgres', password='postgres', max_retries=30):
    """Wait for PostgreSQL to be ready."""
    print("Waiting for PostgreSQL to be ready...")
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database='postgres'
            )
            conn.close()
            print(f"PostgreSQL is ready! (attempt {i + 1})")
            return True
        except OperationalError as e:
            if i < max_retries - 1:
                print(f"Waiting for PostgreSQL... (attempt {i + 1}/{max_retries})")
                time.sleep(1)
            else:
                print(f"Failed to connect to PostgreSQL: {e}")
                return False
    return False

def setup_test_database():
    """Setup test database and user for CI."""
    print("\n=== PostgreSQL CI Setup ===")
    
    # Wait for PostgreSQL
    if not wait_for_postgres():
        print("ERROR: PostgreSQL is not available")
        return False
    
    # Connect as superuser
    try:
        conn = psycopg2.connect(
            host='127.0.0.1',
            port='5432',
            user='postgres',
            password='postgres',
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("\nConnected as postgres superuser")
        
        # Drop existing test database and user
        print("\nCleaning up existing test setup...")
        try:
            # First drop all dependent objects
            cursor.execute("REVOKE ALL PRIVILEGES ON ALL DATABASES FROM test;")
            cursor.execute("DROP OWNED BY test CASCADE;")
            cursor.execute("DROP DATABASE IF EXISTS test;")
            print("  ✓ Dropped test database and privileges")
        except Exception as e:
            print(f"  ⚠ Could not drop database/privileges: {e}")
        
        try:
            cursor.execute("DROP USER IF EXISTS test;")
            print("  ✓ Dropped test user (if existed)")
        except Exception as e:
            print(f"  ⚠ Could not drop user: {e}")
        
        # Create or update test user with password
        print("\nCreating/updating test user...")
        try:
            cursor.execute("CREATE USER test WITH PASSWORD 'test' CREATEDB;")
            print("  ✓ Created test user with password")
        except Exception as e:
            if "already exists" in str(e):
                cursor.execute("ALTER USER test WITH PASSWORD 'test' CREATEDB;")
                print("  ✓ Updated existing test user with password")
            else:
                raise
        
        # Create test database
        print("\nCreating test database...")
        try:
            cursor.execute("CREATE DATABASE test OWNER test;")
            print("  ✓ Created test database")
        except Exception as e:
            if "already exists" in str(e):
                print("  ✓ Test database already exists")
            else:
                raise
        
        # Connect to test database to set permissions
        cursor.close()
        conn.close()
        
        conn = psycopg2.connect(
            host='127.0.0.1',
            port='5432',
            user='postgres',
            password='postgres',
            database='test'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Grant permissions
        print("\nSetting up permissions...")
        cursor.execute("GRANT ALL ON SCHEMA public TO test;")
        cursor.execute("GRANT CREATE ON SCHEMA public TO test;")
        cursor.execute("ALTER SCHEMA public OWNER TO test;")
        print("  ✓ Granted permissions to test user")
        
        # Verify setup
        print("\nVerifying setup...")
        cursor.execute("SELECT current_user, current_database();")
        user, db = cursor.fetchone()
        print(f"  Current connection: {user}@{db}")
        
        cursor.close()
        conn.close()
        
        # Test connection as test user
        print("\nTesting connection as test user...")
        test_conn = psycopg2.connect(
            host='127.0.0.1',
            port='5432',
            user='test',
            password='test',
            database='test'
        )
        test_cursor = test_conn.cursor()
        test_cursor.execute("SELECT current_user, current_database(), version();")
        user, db, version = test_cursor.fetchone()
        print(f"  ✓ Connected as: {user}@{db}")
        print(f"  ✓ PostgreSQL version: {version.split(',')[0]}")
        
        # Test create table permission
        test_cursor.execute("CREATE TABLE test_table (id serial primary key);")
        test_cursor.execute("DROP TABLE test_table;")
        print("  ✓ Can create and drop tables")
        
        test_cursor.close()
        test_conn.close()
        
        print("\n✓ PostgreSQL setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = setup_test_database()
    sys.exit(0 if success else 1)