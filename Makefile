.PHONY: install dev build test lint clean docker-up docker-down api workers builder marketing

# Default target
.DEFAULT_GOAL := help

# Help
help:
	@echo "FormSaaS - Development Commands"
	@echo "==============================="
	@echo ""
	@echo "Setup:"
	@echo "  make install      - Install all dependencies"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Run all services in dev mode"
	@echo "  make api         - Run Django API only"
	@echo "  make workers     - Run Celery workers only"
	@echo "  make builder     - Run Builder app only"
	@echo "  make marketing   - Run Marketing site only"
	@echo ""
	@echo "Quality:"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linters"
	@echo "  make typecheck   - Run type checking"
	@echo "  make e2e         - Run E2E tests"
	@echo ""
	@echo "Build:"
	@echo "  make build       - Build all packages"
	@echo "  make clean       - Clean all build artifacts"

# Install dependencies
install:
	@echo "Installing dependencies..."
	@pnpm install --frozen-lockfile
	@echo "Setting up Python environment for API..."
	@cd services/api && python -m venv .venv && \
		. .venv/bin/activate && \
		pip install -r requirements.txt || echo "API requirements.txt not found yet"
	@echo "Creating .env files from examples..."
	@test -f .env || cp .env.example .env 2>/dev/null || echo "No .env.example found yet"

# Docker commands
docker-up:
	@echo "Starting Docker services..."
	@docker-compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "Services running at:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - ClickHouse: localhost:8123"
	@echo "  - MinIO: localhost:9001"
	@echo "  - MailHog: localhost:8025"

docker-down:
	@echo "Stopping Docker services..."
	@docker-compose down

# Development servers
dev: docker-up
	@echo "Starting all services..."
	@pnpm dev

api: docker-up
	@echo "Starting Django API..."
	@cd services/api && \
		. .venv/bin/activate && \
		python manage.py migrate && \
		python manage.py runserver 8000

workers: docker-up
	@echo "Starting Celery workers..."
	@cd services/api && \
		. .venv/bin/activate && \
		celery -A api worker -l info

builder:
	@echo "Starting Builder app..."
	@pnpm --filter @forms/builder dev

marketing:
	@echo "Starting Marketing site..."
	@pnpm --filter @forms/marketing dev

# Testing
test:
	@echo "Running all tests..."
	@pnpm test
	@cd services/api && . .venv/bin/activate && pytest

test-api:
	@echo "Running API tests..."
	@cd services/api && . .venv/bin/activate && pytest -v

e2e:
	@echo "Running E2E tests..."
	@pnpm test:e2e

# Code quality
lint:
	@echo "Running linters..."
	@pnpm lint

typecheck:
	@echo "Running type checks..."
	@pnpm typecheck

format:
	@echo "Formatting code..."
	@pnpm format

# Build
build:
	@echo "Building all packages..."
	@pnpm build

clean:
	@echo "Cleaning build artifacts..."
	@pnpm clean
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true