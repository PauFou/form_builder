#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Starting E2E test environment..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $name on port $port..."
    
    while ! check_port $port; do
        if [ $attempt -gt $max_attempts ]; then
            echo -e "${RED}❌ $name failed to start on port $port${NC}"
            return 1
        fi
        sleep 1
        ((attempt++))
    done
    
    echo -e "${GREEN}✅ $name is ready on port $port${NC}"
    return 0
}

# Check if services are already running
NEED_FRONTEND=true
NEED_API=false  # Skip API for now since it doesn't exist
NEED_WEBHOOK=true

if check_port 3001; then
    echo "ℹ️  Frontend already running on port 3001"
    NEED_FRONTEND=false
fi

# Check if API directory exists
if [ -d "services/api" ]; then
    NEED_API=true
    if check_port 8000; then
        echo "ℹ️  API already running on port 8000"
        NEED_API=false
    fi
else
    echo "⚠️  API directory not found, skipping API startup"
fi

if check_port 9000; then
    echo "ℹ️  Webhook receiver already running on port 9000"
    NEED_WEBHOOK=false
fi

# Start services if needed
PIDS=()

if [ "$NEED_FRONTEND" = true ]; then
    echo "🔧 Starting frontend..."
    pnpm dev > /tmp/frontend.log 2>&1 &
    PIDS+=($!)
fi

if [ "$NEED_API" = true ]; then
    echo "🔧 Starting API..."
    (cd services/api && python3 manage.py runserver > /tmp/api.log 2>&1) &
    PIDS+=($!)
fi

if [ "$NEED_WEBHOOK" = true ]; then
    echo "🔧 Starting webhook receiver..."
    node scripts/webhook-receiver.js > /tmp/webhook.log 2>&1 &
    PIDS+=($!)
fi

# Wait for all services to be ready
wait_for_service 3001 "Frontend" || exit 1

# Only wait for API if it exists
if [ -d "services/api" ] && [ "$NEED_API" = true ]; then
    wait_for_service 8000 "API" || exit 1
fi

wait_for_service 9000 "Webhook receiver" || exit 1

echo -e "${GREEN}✅ All services are ready!${NC}"
echo ""

# Run the E2E tests
echo "🧪 Running E2E tests..."
echo ""

# Run tests with HTML reporter
pnpm playwright test e2e/full-workflow.spec.ts --reporter=html,line

TEST_EXIT_CODE=$?

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    
    # Kill started processes
    for pid in ${PIDS[@]}; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid 2>/dev/null
            echo "Stopped process $pid"
        fi
    done
    
    # Show logs if tests failed
    if [ $TEST_EXIT_CODE -ne 0 ]; then
        echo ""
        echo -e "${YELLOW}📋 Service logs:${NC}"
        echo "Frontend: /tmp/frontend.log"
        echo "API: /tmp/api.log"
        echo "Webhook: /tmp/webhook.log"
    fi
}

# Set up trap to cleanup on exit
trap cleanup EXIT

# Show test results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "📊 View detailed report: pnpm test:e2e:report"
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "📊 View detailed report: pnpm test:e2e:report"
    echo "🐛 Debug with: pnpm test:e2e:ui"
fi

exit $TEST_EXIT_CODE