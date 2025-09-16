#!/bin/bash
# Initialize PostgreSQL for CI

set -e  # Exit on error

echo "=== PostgreSQL CI Initialization ==="
echo "Setting up PostgreSQL for CI..."

# Use postgres password for admin tasks
export PGPASSWORD="postgres"

# Test connection to postgres
echo "Testing connection to PostgreSQL..."
psql -h 127.0.0.1 -U postgres -c "SELECT version();"

# Drop existing test database and user if they exist
echo "Cleaning up existing test database and user..."
psql -h 127.0.0.1 -U postgres -c "DROP DATABASE IF EXISTS test;" || true
psql -h 127.0.0.1 -U postgres -c "DROP USER IF EXISTS test;" || true

# Create test user with password 'test'
echo "Creating test user with password..."
psql -h 127.0.0.1 -U postgres -c "CREATE USER test WITH PASSWORD 'test' CREATEDB;"

# Create test database owned by test user
echo "Creating test database..."
psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE test OWNER test;"

# Connect to test database and setup permissions
echo "Setting up database permissions..."
psql -h 127.0.0.1 -U postgres -d test -c "GRANT ALL ON SCHEMA public TO test;"
psql -h 127.0.0.1 -U postgres -d test -c "GRANT CREATE ON SCHEMA public TO test;"
psql -h 127.0.0.1 -U postgres -d test -c "ALTER SCHEMA public OWNER TO test;"

# Additional permissions
psql -h 127.0.0.1 -U postgres -c "GRANT CREATE ON DATABASE test TO test;"

# List users and databases to verify
echo "Verifying setup..."
echo "PostgreSQL users:"
psql -h 127.0.0.1 -U postgres -c "\du"

echo "Databases:"
psql -h 127.0.0.1 -U postgres -c "\l"

# Test connection as test user with password
echo "Testing connection as test user..."
PGPASSWORD="test" psql -h 127.0.0.1 -U test -d test -c "SELECT current_user, current_database();"

echo "=== PostgreSQL CI setup completed successfully! ==="