#!/usr/bin/env python
"""Enhanced PostgreSQL debugging for CI environment."""
import os
import sys
import subprocess
import time

def run_command(cmd, env=None):
    """Run a command and return its output."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            env={**os.environ, **(env or {})}
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def debug_postgres_auth():
    """Debug PostgreSQL authentication issues."""
    print("=== Enhanced PostgreSQL CI Debug ===")
    print(f"Python: {sys.version}")
    print(f"Current working directory: {os.getcwd()}")
    
    # Check environment variables
    print("\n1. Environment Variables:")
    env_vars = {
        'POSTGRES_HOST': os.environ.get('POSTGRES_HOST', 'NOT SET'),
        'POSTGRES_USER': os.environ.get('POSTGRES_USER', 'NOT SET'),
        'POSTGRES_PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'NOT SET'),
        'POSTGRES_DB': os.environ.get('POSTGRES_DB', 'NOT SET'),
        'POSTGRES_PORT': os.environ.get('POSTGRES_PORT', 'NOT SET'),
        'PGPASSWORD': os.environ.get('PGPASSWORD', 'NOT SET'),
    }
    for var, value in env_vars.items():
        if 'PASSWORD' in var and value != 'NOT SET':
            print(f"  {var}: {'*' * len(value)}")
        else:
            print(f"  {var}: {value}")
    
    # Check PostgreSQL client
    print("\n2. PostgreSQL Client:")
    rc, out, err = run_command("which psql")
    print(f"  psql location: {out.strip() if rc == 0 else 'NOT FOUND'}")
    
    rc, out, err = run_command("psql --version")
    print(f"  psql version: {out.strip() if rc == 0 else 'NOT AVAILABLE'}")
    
    # Test connections with different methods
    print("\n3. Connection Tests:")
    
    # Test 1: Direct psql with environment variables
    print("\n  a) psql with environment variables:")
    env = {
        'PGPASSWORD': os.environ.get('POSTGRES_PASSWORD', 'test'),
        'PGHOST': os.environ.get('POSTGRES_HOST', '127.0.0.1'),
        'PGPORT': os.environ.get('POSTGRES_PORT', '5432'),
        'PGUSER': os.environ.get('POSTGRES_USER', 'test'),
        'PGDATABASE': os.environ.get('POSTGRES_DB', 'test')
    }
    rc, out, err = run_command('psql -c "SELECT current_user, current_database();"', env=env)
    if rc == 0:
        print(f"    SUCCESS: {out.strip()}")
    else:
        print(f"    FAILED: {err.strip()}")
    
    # Test 2: psql with explicit parameters
    print("\n  b) psql with explicit parameters:")
    host = os.environ.get('POSTGRES_HOST', '127.0.0.1')
    port = os.environ.get('POSTGRES_PORT', '5432')
    user = os.environ.get('POSTGRES_USER', 'test')
    password = os.environ.get('POSTGRES_PASSWORD', 'test')
    database = os.environ.get('POSTGRES_DB', 'test')
    
    env = {'PGPASSWORD': password}
    cmd = f'psql -h {host} -p {port} -U {user} -d {database} -c "SELECT version();"'
    rc, out, err = run_command(cmd, env=env)
    if rc == 0:
        print(f"    SUCCESS: Connected to PostgreSQL")
    else:
        print(f"    FAILED: {err.strip()}")
    
    # Test 3: Check pg_hba.conf settings (if accessible)
    print("\n  c) PostgreSQL authentication method:")
    env = {'PGPASSWORD': 'postgres'}
    rc, out, err = run_command(
        'psql -h 127.0.0.1 -U postgres -d postgres -c "SHOW hba_file;"',
        env=env
    )
    if rc == 0:
        print(f"    hba_file location: {out.strip()}")
        # Try to show authentication methods
        rc2, out2, err2 = run_command(
            'psql -h 127.0.0.1 -U postgres -d postgres -c "SELECT * FROM pg_hba_file_rules;"',
            env=env
        )
        if rc2 == 0:
            print(f"    Authentication rules:\n{out2}")
    
    # Test 4: Python psycopg2 connection
    print("\n  d) Python psycopg2 connection:")
    try:
        import psycopg2
        conn_string = (
            f"host={host} port={port} user={user} "
            f"password={password} dbname={database}"
        )
        print(f"    Connection string: host={host} port={port} user={user} dbname={database}")
        
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        cursor.execute("SELECT current_user, current_database();")
        result = cursor.fetchone()
        print(f"    SUCCESS: Connected as {result[0]} to {result[1]}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"    FAILED: {e}")
        # Try to parse the error for more details
        if "password authentication failed" in str(e):
            print("    HINT: Password authentication is failing. Check:")
            print("    - Is the user created with the correct password?")
            print("    - Is pg_hba.conf configured for md5/scram-sha-256 auth?")
            print("    - Are environment variables being passed correctly?")
    
    # Test 5: Check user existence
    print("\n4. User Verification:")
    env = {'PGPASSWORD': 'postgres'}
    rc, out, err = run_command(
        'psql -h 127.0.0.1 -U postgres -d postgres -c "\\du test"',
        env=env
    )
    if rc == 0:
        print(f"  User 'test' details:\n{out}")
    else:
        print(f"  Could not check user: {err.strip()}")
    
    # Test 6: Check database existence
    print("\n5. Database Verification:")
    rc, out, err = run_command(
        'psql -h 127.0.0.1 -U postgres -d postgres -c "\\l test"',
        env=env
    )
    if rc == 0:
        print(f"  Database 'test' details:\n{out}")
    else:
        print(f"  Could not check database: {err.strip()}")
    
    print("\n=== End Enhanced Debug ===")

if __name__ == "__main__":
    debug_postgres_auth()