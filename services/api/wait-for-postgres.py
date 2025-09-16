#!/usr/bin/env python
"""Wait for PostgreSQL to be ready before running tests."""
import time
import psycopg2
from psycopg2 import OperationalError
import os
import sys

def wait_for_postgres(max_retries=30, delay=1):
    """Wait for PostgreSQL to accept connections."""
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    user = os.environ.get('POSTGRES_USER', 'test')
    password = os.environ.get('POSTGRES_PASSWORD', 'test')
    database = os.environ.get('POSTGRES_DB', 'test')
    is_ci = os.environ.get('CI') == 'true'
    
    print(f"Attempting to connect to PostgreSQL:")
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  User: {user}")
    print(f"  Database: {database}")
    print(f"  CI Environment: {is_ci}")
    
    # In CI with trust auth, we don't need password
    if is_ci:
        print(f"  Using trust authentication (no password required)")
        password = ''
    else:
        print(f"  Password: {'*' * len(password) if password else 'None'}")
    
    for i in range(max_retries):
        try:
            conn_params = {
                'host': host,
                'port': port,
                'user': user,
                'database': database
            }
            # Only add password if not in CI
            if password and not is_ci:
                conn_params['password'] = password
                
            conn = psycopg2.connect(**conn_params)
            conn.close()
            print(f"PostgreSQL is ready! (attempt {i + 1})")
            return True
        except OperationalError as e:
            print(f"Waiting for PostgreSQL... (attempt {i + 1}/{max_retries})")
            print(f"Error: {e}")
            if "password authentication failed" in str(e) and is_ci:
                print("CRITICAL: Password authentication failed in CI!")
                print("This should not happen with trust authentication.")
                print("Trying without password...")
                # Try once more without password
                try:
                    conn = psycopg2.connect(
                        host=host,
                        port=port,
                        user=user,
                        database=database
                    )
                    conn.close()
                    print("SUCCESS: Connected without password!")
                    return True
                except Exception as e2:
                    print(f"Still failed without password: {e2}")
            time.sleep(delay)
    
    print("Failed to connect to PostgreSQL")
    return False

if __name__ == "__main__":
    if wait_for_postgres():
        sys.exit(0)
    else:
        sys.exit(1)