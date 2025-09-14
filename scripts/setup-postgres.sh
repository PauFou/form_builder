#!/bin/bash

# Script to setup PostgreSQL for the forms platform
# Works with both Docker and local PostgreSQL

echo "🐘 Setting up PostgreSQL for Forms Platform"
echo "=========================================="

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    echo "✓ Docker is running"
    echo ""
    echo "Starting PostgreSQL and Redis with Docker Compose..."
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo ""
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U forms_user -d forms_db >/dev/null 2>&1; then
            echo "✓ PostgreSQL is ready!"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    
else
    echo "⚠️  Docker is not running"
    echo ""
    echo "Checking for local PostgreSQL installation..."
    
    if command -v psql >/dev/null 2>&1; then
        echo "✓ PostgreSQL is installed locally"
        
        # Check if PostgreSQL service is running
        if pg_isready >/dev/null 2>&1; then
            echo "✓ PostgreSQL service is running"
        else
            echo "Starting PostgreSQL service..."
            # Try different methods based on OS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
            fi
        fi
        
        # Create database and user
        echo ""
        echo "Creating database and user..."
        
        # Create user (ignore error if already exists)
        createuser -U postgres forms_user 2>/dev/null || true
        
        # Create database (ignore error if already exists)
        createdb -U postgres -O forms_user forms_db 2>/dev/null || true
        createdb -U postgres -O forms_user forms_db_test 2>/dev/null || true
        
        # Set password
        psql -U postgres -c "ALTER USER forms_user WITH PASSWORD 'forms_password';" 2>/dev/null || true
        
        echo "✓ Database setup complete"
        
    else
        echo "❌ PostgreSQL is not installed"
        echo ""
        echo "Please install PostgreSQL first:"
        echo "  macOS:  brew install postgresql@16"
        echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
        echo "  CentOS: sudo yum install postgresql-server postgresql-contrib"
        exit 1
    fi
fi

# Test connection
echo ""
echo "Testing database connection..."

# Create a temporary Python script to test the connection
cat > /tmp/test_db_connection.py << 'EOF'
import os
import sys
import psycopg2

try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'localhost'),
        port=os.environ.get('POSTGRES_PORT', 5432),
        user=os.environ.get('POSTGRES_USER', 'forms_user'),
        password=os.environ.get('POSTGRES_PASSWORD', 'forms_password'),
        database=os.environ.get('POSTGRES_DB', 'forms_db')
    )
    conn.close()
    print("✓ Successfully connected to PostgreSQL!")
    sys.exit(0)
except Exception as e:
    print(f"❌ Failed to connect to PostgreSQL: {e}")
    sys.exit(1)
EOF

# Load environment variables
export $(grep -v '^#' .env | xargs) 2>/dev/null || true

# Test connection
cd services/api
if [ -d ".venv" ]; then
    source .venv/bin/activate
    pip install -q psycopg2-binary
    python /tmp/test_db_connection.py
    deactivate
else
    echo "⚠️  Virtual environment not found. Run 'python -m venv .venv' first"
fi
cd ../..

# Cleanup
rm -f /tmp/test_db_connection.py

echo ""
echo "PostgreSQL setup complete! 🎉"
echo ""
echo "Connection details:"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  User:     forms_user"
echo "  Password: forms_password"
echo "  Database: forms_db"
echo ""
echo "To run migrations:"
echo "  cd services/api"
echo "  source .venv/bin/activate"
echo "  python manage.py migrate"