#!/bin/bash

# Script to set up test database for CI validation

echo "🗄️  Setting up test database..."
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL or use Docker:"
    echo "  docker-compose up -d postgres"
    exit 1
fi

# Create test database and user
echo "Creating test database..."
sudo -u postgres psql << EOF
-- Create test user
CREATE USER test WITH PASSWORD 'test';

-- Create test database
CREATE DATABASE test OWNER test;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE test TO test;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test database created successfully${NC}"
    echo ""
    echo "Database details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: test"
    echo "  User: test"
    echo "  Password: test"
else
    echo -e "${RED}✗ Failed to create test database${NC}"
    exit 1
fi