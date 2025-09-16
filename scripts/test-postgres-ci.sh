#!/bin/bash
# Test PostgreSQL CI configuration locally

set -e

echo "=== Testing PostgreSQL CI Configuration ==="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing container
docker stop test-postgres 2>/dev/null || true
docker rm test-postgres 2>/dev/null || true

# Start PostgreSQL container with CI configuration
echo "Starting PostgreSQL container..."
docker run -d \
    --name test-postgres \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=postgres \
    -e POSTGRES_HOST_AUTH_METHOD=md5 \
    -p 5432:5432 \
    postgres:16-alpine

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
for i in {1..30}; do
    if docker exec test-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✓ PostgreSQL is ready!"
        break
    fi
    echo -n "."
    sleep 1
done

# Set up test database and user
echo
echo "Setting up test database and user..."
export PGPASSWORD=postgres

# Create test user and database
docker exec test-postgres psql -U postgres -c "CREATE USER test WITH PASSWORD 'test' CREATEDB;"
docker exec test-postgres psql -U postgres -c "CREATE DATABASE test OWNER test;"
docker exec test-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test TO test;"
docker exec test-postgres psql -U postgres -d test -c "GRANT ALL ON SCHEMA public TO test;"
docker exec test-postgres psql -U postgres -d test -c "GRANT CREATE ON SCHEMA public TO test;"
docker exec test-postgres psql -U postgres -d test -c "ALTER SCHEMA public OWNER TO test;"

# Test connection with test user
echo
echo "Testing connection with test user..."
export PGPASSWORD=test
if docker exec test-postgres psql -U test -d test -c "SELECT current_user, current_database();"; then
    echo "✓ Test user can connect successfully!"
else
    echo "❌ Test user connection failed!"
    exit 1
fi

# Test from host machine if psql is available
if command -v psql > /dev/null 2>&1; then
    echo
    echo "Testing connection from host machine..."
    if PGPASSWORD=test psql -h 127.0.0.1 -U test -d test -c "SELECT version();" > /dev/null 2>&1; then
        echo "✓ Host machine can connect successfully!"
    else
        echo "❌ Host machine connection failed!"
    fi
fi

# Test with Python if in the API directory
if [ -f "services/api/wait-for-postgres.py" ]; then
    echo
    echo "Testing with Python wait-for-postgres.py..."
    cd services/api
    export POSTGRES_HOST=127.0.0.1
    export POSTGRES_USER=test
    export POSTGRES_PASSWORD=test
    export POSTGRES_DB=test
    export POSTGRES_PORT=5432
    
    if python wait-for-postgres.py; then
        echo "✓ Python script can connect successfully!"
    else
        echo "❌ Python script connection failed!"
    fi
    cd ../..
fi

echo
echo "=== PostgreSQL CI Test Complete ==="
echo
echo "To clean up, run: docker stop test-postgres && docker rm test-postgres"
echo
echo "Environment variables for testing:"
echo "  POSTGRES_HOST=127.0.0.1"
echo "  POSTGRES_USER=test"
echo "  POSTGRES_PASSWORD=test"
echo "  POSTGRES_DB=test"
echo "  POSTGRES_PORT=5432"