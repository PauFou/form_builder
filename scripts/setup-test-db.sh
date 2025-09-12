#!/bin/bash

# Script to set up test database for CI compatibility
# This creates a PostgreSQL user and database matching GitHub Actions setup

echo "Setting up test database for CI compatibility..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first"
    exit 1
fi

# Create test user if it doesn't exist
echo "Creating test user..."
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';" 2>/dev/null || echo "User 'test' already exists"

# Create test database if it doesn't exist
echo "Creating test database..."
psql -U postgres -c "CREATE DATABASE test OWNER test;" 2>/dev/null || echo "Database 'test' already exists"

# Grant all privileges
echo "Granting privileges..."
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"

echo "Test database setup complete!"
echo ""
echo "Connection details:"
echo "  User: test"
echo "  Password: test"
echo "  Database: test"
echo "  Host: localhost"
echo "  Port: 5432"