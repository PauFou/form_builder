#!/bin/bash
# PostgreSQL initialization script for CI environment
set -e

echo "=== PostgreSQL CI Initialization ==="
echo "Host: ${POSTGRES_HOST:-127.0.0.1}"
echo "Port: ${POSTGRES_PORT:-5432}"

# Use empty PGPASSWORD to force trust authentication
export PGPASSWORD=""

# Test superuser connection
echo -e "\n1. Testing superuser connection..."
psql -h "${POSTGRES_HOST:-127.0.0.1}" -p "${POSTGRES_PORT:-5432}" -U postgres -c "SELECT version();" || {
    echo "ERROR: Cannot connect as postgres user"
    echo "Make sure PostgreSQL is configured with POSTGRES_HOST_AUTH_METHOD=trust"
    exit 1
}

# Drop and create test database/user
echo -e "\n2. Setting up test database and user..."
psql -h "${POSTGRES_HOST:-127.0.0.1}" -p "${POSTGRES_PORT:-5432}" -U postgres <<EOF
-- Drop existing objects
DROP DATABASE IF EXISTS test;
DROP DATABASE IF EXISTS forms_db_test;
DROP USER IF EXISTS test;

-- Create test user (no password)
CREATE USER test WITH CREATEDB;

-- Create test database
CREATE DATABASE test OWNER test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE test TO test;
EOF

# Set up schema permissions
echo -e "\n3. Setting up schema permissions..."
psql -h "${POSTGRES_HOST:-127.0.0.1}" -p "${POSTGRES_PORT:-5432}" -U postgres -d test <<EOF
-- Grant schema permissions (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO test;
GRANT CREATE ON SCHEMA public TO test;
EOF

# Test connection as test user
echo -e "\n4. Testing test user connection..."
psql -h "${POSTGRES_HOST:-127.0.0.1}" -p "${POSTGRES_PORT:-5432}" -U test -d test -c "SELECT current_user, current_database();" || {
    echo "ERROR: Cannot connect as test user"
    exit 1
}

echo -e "\n✅ PostgreSQL CI setup completed successfully!"