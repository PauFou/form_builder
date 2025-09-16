#!/usr/bin/env python
"""Test PostgreSQL connection with trust authentication."""
import os
import sys
import psycopg2
from psycopg2 import sql

def test_connection():
    """Test PostgreSQL connection with trust authentication."""
    print("=== PostgreSQL Trust Authentication Test ===")
    
    # Get connection parameters
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    user = os.environ.get('POSTGRES_USER', 'test')
    database = os.environ.get('POSTGRES_DB', 'test')
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Database: {database}")
    print(f"CI Mode: {os.environ.get('CI', 'false')}")
    
    # Build connection string without password for trust auth
    conn_string = f"host={host} port={port} user={user} dbname={database}"
    
    print(f"\nConnection string: {conn_string}")
    
    try:
        # Connect without password (trust authentication)
        print("\nConnecting with trust authentication...")
        conn = psycopg2.connect(conn_string)
        
        with conn.cursor() as cursor:
            # Test basic query
            cursor.execute("SELECT current_user, current_database(), version();")
            user, db, version = cursor.fetchone()
            print(f"\n✓ SUCCESS: Connected as '{user}' to database '{db}'")
            print(f"✓ PostgreSQL version: {version.split(',')[0]}")
            
            # Test permissions
            cursor.execute("SELECT has_database_privilege(current_user, current_database(), 'CREATE');")
            can_create = cursor.fetchone()[0]
            print(f"✓ Can create objects: {can_create}")
            
            # Test schema permissions
            cursor.execute("SELECT has_schema_privilege(current_user, 'public', 'CREATE');")
            can_create_in_public = cursor.fetchone()[0]
            print(f"✓ Can create in public schema: {can_create_in_public}")
            
        conn.close()
        print("\n✓ Connection test passed!")
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        print(f"✗ Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)