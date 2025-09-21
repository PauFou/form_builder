#!/usr/bin/env python
"""Setup and verify PostgreSQL for CI environment."""
import os
import sys
import psycopg2


def setup_postgres_for_ci():
    """Setup PostgreSQL with trust authentication for CI."""
    print("=== PostgreSQL CI Setup ===")
    
    # Connection parameters
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    
    # In CI, we use trust auth - no password needed
    print(f"Connecting to PostgreSQL at {host}:{port}")
    print("Using trust authentication (no password)")
    
    # Connect as superuser (postgres) with trust auth
    try:
        # Use connection string for trust auth
        conn_string = f"host={host} port={port} user=postgres dbname=postgres"
        print(f"Connection string: {conn_string}")
        
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("✓ Connected to PostgreSQL as superuser")
        
        # Drop and recreate test user and database
        print("\nSetting up test environment...")
        
        # Drop existing objects
        cur.execute("DROP DATABASE IF EXISTS test;")
        cur.execute("DROP DATABASE IF EXISTS forms_db_test;")  # Django test database
        cur.execute("DROP USER IF EXISTS test;")
        print("✓ Cleaned up existing objects")
        
        # Create test user without password
        cur.execute("CREATE USER test WITH CREATEDB;")
        print("✓ Created test user (no password)")
        
        # Create test database
        cur.execute("CREATE DATABASE test OWNER test;")
        print("✓ Created test database")
        
        # Grant permissions
        cur.execute("GRANT ALL PRIVILEGES ON DATABASE test TO test;")
        
        # Connect to test database for schema permissions
        cur.close()
        conn.close()
        
        # Reconnect to test database
        conn_string = f"host={host} port={port} user=postgres dbname=test"
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Grant schema permissions (PostgreSQL 15+)
        cur.execute("GRANT ALL ON SCHEMA public TO test;")
        cur.execute("GRANT CREATE ON SCHEMA public TO test;")
        print("✓ Granted schema permissions")
        
        cur.close()
        conn.close()
        
        # Test connection as test user
        print("\nVerifying test user connection...")
        conn_string = f"host={host} port={port} user=test dbname=test"
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor()
        
        cur.execute("SELECT current_user, current_database();")
        user, db = cur.fetchone()
        print(f"✓ Successfully connected as '{user}' to database '{db}'")
        
        # Test create table permission
        cur.execute("CREATE TABLE test_table (id serial PRIMARY KEY);")
        cur.execute("DROP TABLE test_table;")
        print("✓ Test user can create tables")
        
        cur.close()
        conn.close()
        
        print("\n✅ PostgreSQL CI setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"Error type: {type(e).__name__}")
        return False


if __name__ == "__main__":
    # Ensure we're in CI environment
    if os.environ.get('CI') != 'true':
        print("Warning: Not in CI environment. Set CI=true to proceed.")
        sys.exit(1)
    
    success = setup_postgres_for_ci()
    sys.exit(0 if success else 1)