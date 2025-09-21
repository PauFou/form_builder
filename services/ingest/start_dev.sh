#!/bin/bash

# Start development services for ingest

echo "Starting Forms Ingest Service (Development Mode)"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Start Redis if not running (optional)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Redis not running. Please start Redis server first:"
    echo "  brew services start redis  # macOS"
    echo "  sudo systemctl start redis # Linux"
    exit 1
fi

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A worker worker --loglevel=info --queue=submissions,webhooks,analytics &
CELERY_PID=$!

# Start FastAPI server
echo "Starting FastAPI server..."
python main.py &
API_PID=$!

# Function to cleanup background processes
cleanup() {
    echo "Shutting down services..."
    kill $CELERY_PID 2>/dev/null
    kill $API_PID 2>/dev/null
    exit 0
}

# Register cleanup function
trap cleanup SIGINT SIGTERM

echo "Services started!"
echo "- API Server: http://localhost:8001"
echo "- Health Check: http://localhost:8001/health"
echo "- Metrics: http://localhost:8001/metrics"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait