#!/bin/bash

echo "PostgreSQL and Redis Setup Guide"
echo "================================"
echo ""
echo "This project requires PostgreSQL and Redis to run properly."
echo ""
echo "Option 1: Using Docker (Recommended)"
echo "------------------------------------"
echo "1. Start Docker Desktop"
echo "2. Run: docker-compose up -d postgres redis"
echo ""
echo "Option 2: Using Homebrew (macOS)"
echo "---------------------------------"
echo "Install PostgreSQL:"
echo "  brew install postgresql@16"
echo "  brew services start postgresql@16"
echo ""
echo "Create database and user:"
echo "  createuser -s forms"
echo "  createdb -O forms forms"
echo "  psql -U forms -d forms -c \"ALTER USER forms WITH PASSWORD 'forms_local_dev';\""
echo ""
echo "Install Redis:"
echo "  brew install redis"
echo "  brew services start redis"
echo ""
echo "Option 3: Using PostgreSQL.app"
echo "-------------------------------"
echo "1. Download from https://postgresapp.com/"
echo "2. Install and start PostgreSQL"
echo "3. Use the psql command line to create the database and user"
echo ""
echo "Current Status:"
echo "---------------"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL is installed"
    if psql -U forms -d forms -c "SELECT 1" &> /dev/null; then
        echo "✓ Database 'forms' is accessible"
    else
        echo "✗ Database 'forms' is not accessible"
    fi
else
    echo "✗ PostgreSQL is not installed"
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    echo "✓ Redis is installed"
    if redis-cli ping &> /dev/null; then
        echo "✓ Redis is running"
    else
        echo "✗ Redis is not running"
    fi
else
    echo "✗ Redis is not installed"
fi