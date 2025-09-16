#!/usr/bin/env python
"""Fix PostgreSQL authentication by trying different approaches."""
import os
import subprocess
import time

def run_psql(command, user='postgres', password='postgres'):
    """Run a psql command."""
    env = os.environ.copy()
    env['PGPASSWORD'] = password
    cmd = f"psql -h 127.0.0.1 -U {user} -c \"{command}\""
    
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True,
        env=env
    )
    return result.returncode == 0, result.stdout, result.stderr

def fix_postgres_auth():
    """Try to fix PostgreSQL authentication issues."""
    print("=== PostgreSQL Authentication Fix ===")
    
    # Step 1: Check current authentication method
    print("\n1. Checking current authentication settings...")
    success, out, err = run_psql("SHOW password_encryption;")
    if success:
        print(f"   Password encryption: {out.strip()}")
    
    # Step 2: Try different user creation methods
    print("\n2. Recreating test user with different methods...")
    
    # Drop existing user and database
    print("   Dropping existing test user and database...")
    run_psql("DROP DATABASE IF EXISTS test;")
    run_psql("DROP USER IF EXISTS test;")
    
    # Method 1: Create user with ENCRYPTED PASSWORD
    print("   Method 1: CREATE USER with ENCRYPTED PASSWORD...")
    success, out, err = run_psql("CREATE USER test WITH ENCRYPTED PASSWORD 'test';")
    if not success:
        print(f"   Failed: {err}")
    else:
        print("   Success")
    
    # Grant necessary permissions
    run_psql("ALTER USER test CREATEDB;")
    run_psql("CREATE DATABASE test OWNER test;")
    
    # Method 2: Try setting password separately
    print("\n   Method 2: Setting password with ALTER USER...")
    success, out, err = run_psql("ALTER USER test WITH PASSWORD 'test';")
    if not success:
        print(f"   Failed: {err}")
    else:
        print("   Success")
    
    # Method 3: Try with MD5 hash
    print("\n   Method 3: Setting password with MD5 hash...")
    # MD5 hash of 'testtest' (password + username)
    md5_password = "md505a671c66aefea124cc08b76ea6d30bb"
    success, out, err = run_psql(f"ALTER USER test WITH PASSWORD '{md5_password}';")
    if not success:
        print(f"   Failed: {err}")
    else:
        print("   Success")
    
    # Step 3: Test connection with test user
    print("\n3. Testing connection with test user...")
    env = os.environ.copy()
    env['PGPASSWORD'] = 'test'
    
    test_commands = [
        "psql -h 127.0.0.1 -U test -d test -c 'SELECT version();'",
        "PGHOST=127.0.0.1 PGUSER=test PGDATABASE=test psql -c 'SELECT version();'",
    ]
    
    for i, cmd in enumerate(test_commands, 1):
        print(f"\n   Test {i}: {cmd}")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)
        if result.returncode == 0:
            print(f"   SUCCESS!")
        else:
            print(f"   FAILED: {result.stderr.strip()}")
    
    # Step 4: Check user details
    print("\n4. User verification...")
    success, out, err = run_psql("SELECT usename, usecreatedb, passwd FROM pg_user WHERE usename = 'test';")
    if success:
        print(f"   User details: {out}")
    
    # Step 5: Alternative approach - trust authentication temporarily
    print("\n5. Alternative approach - modify pg_hba.conf (if possible)...")
    print("   Note: This requires superuser access to PostgreSQL config files")
    print("   In CI, we may need to use environment variables or Docker options")
    
    print("\n=== End Fix Attempt ===")

if __name__ == "__main__":
    fix_postgres_auth()