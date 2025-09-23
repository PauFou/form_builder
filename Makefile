.PHONY: help install dev build test clean docker-up docker-down deploy

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '${BLUE}Forms Platform${NC}'
	@echo ''
	@echo 'Usage:'
	@echo '  ${GREEN}make${NC} ${YELLOW}<target>${NC}'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "${BLUE}Installing dependencies...${NC}"
	pnpm install
	cd services/api && pip install -r requirements.txt && pip install -r requirements-dev.txt
	cd services/analytics && pip install -r requirements.txt
	@echo "${GREEN}✓ Dependencies installed${NC}"

dev: ## Show instructions for starting dev servers
	@echo "${BLUE}Pour démarrer Forms Platform:${NC}"
	@echo ""
	@echo "${YELLOW}Terminal 1 - Backend API:${NC}"
	@echo "  make dev-backend"
	@echo ""
	@echo "${YELLOW}Terminal 2 - Frontend:${NC}"
	@echo "  make dev-frontend"
	@echo ""
	@echo "${GREEN}Compte de test:${NC} test@example.com / Test1234!"
	@echo "${GREEN}API Docs:${NC} http://localhost:8000/v1/docs/swagger"

dev-backend: ## Start backend API only
	@echo "${BLUE}Starting Django API...${NC}"
	@cd services/api && \
	([ -d .venv ] || python3 -m venv .venv) && \
	. .venv/bin/activate && \
	pip install -q -r requirements.txt 2>/dev/null || true && \
	python manage.py migrate --no-input && \
	python manage.py create_test_user 2>/dev/null || true && \
	echo "${GREEN}✓ API ready on http://localhost:8000${NC}" && \
	python manage.py runserver

dev-frontend: ## Start frontend only
	@echo "${BLUE}Starting frontend apps...${NC}"
	@pnpm install --silent 2>/dev/null || true && \
	echo "${GREEN}✓ Frontend ready:${NC}" && \
	echo "  Marketing: http://localhost:3000" && \
	echo "  Builder: http://localhost:3001" && \
	pnpm dev

dev-old: ## Start all development servers (old method with concurrently)
	@echo "${BLUE}Starting development servers...${NC}"
	@trap 'echo "${RED}Stopping servers...${NC}"' INT; \
	make docker-up && \
	concurrently --names "FRONTEND,API,WORKER,ANALYTICS" \
		--prefix "[{name}]" \
		--prefix-colors "blue,green,yellow,magenta" \
		"pnpm dev" \
		"cd services/api && python manage.py runserver" \
		"cd services/api && celery -A api worker -l info" \
		"cd services/analytics && uvicorn app:app --reload --port 8002"

build: ## Build all packages for production
	@echo "${BLUE}Building packages...${NC}"
	pnpm build
	@echo "${BLUE}Building Docker images...${NC}"
	docker build -f services/api/Dockerfile -t forms/api:latest services/api
	docker build -f services/analytics/Dockerfile -t forms/analytics:latest services/analytics
	@echo "${GREEN}✓ Build complete${NC}"

test: ## Run all tests
	@echo "${BLUE}Running tests...${NC}"
	pnpm test
	cd services/api && pytest
	@echo "${GREEN}✓ All tests passed${NC}"

test-e2e: ## Run E2E tests
	@echo "${BLUE}Running E2E tests...${NC}"
	pnpm test:e2e

test-a11y: ## Run accessibility tests
	@echo "${BLUE}Running accessibility tests...${NC}"
	pnpm test:a11y

test-perf: ## Run performance tests
	@echo "${BLUE}Running performance tests...${NC}"
	pnpm test:perf

lint: ## Run linters
	@echo "${BLUE}Running linters...${NC}"
	pnpm lint
	cd services/api && ruff check .
	@echo "${GREEN}✓ Lint passed${NC}"

format: ## Format code
	@echo "${BLUE}Formatting code...${NC}"
	pnpm format
	cd services/api && black .
	@echo "${GREEN}✓ Code formatted${NC}"

migrate: ## Run database migrations
	@echo "${BLUE}Running migrations...${NC}"
	cd services/api && python manage.py migrate
	@echo "${GREEN}✓ Migrations complete${NC}"

seed: ## Seed database with sample data
	@echo "${BLUE}Seeding database...${NC}"
	cd services/api && python manage.py seed_data
	@echo "${GREEN}✓ Database seeded${NC}"

docker-up: ## Start Docker services
	@echo "${BLUE}Starting Docker services...${NC}"
	docker-compose up -d
	@echo "${GREEN}✓ Docker services started${NC}"

docker-down: ## Stop Docker services
	@echo "${BLUE}Stopping Docker services...${NC}"
	docker-compose down
	@echo "${GREEN}✓ Docker services stopped${NC}"

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-clean: ## Clean Docker volumes
	@echo "${YELLOW}Warning: This will delete all data!${NC}"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "${GREEN}✓ Docker volumes cleaned${NC}"; \
	fi

db-backup: ## Backup database
	@echo "${BLUE}Backing up database...${NC}"
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U forms forms > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}✓ Database backed up${NC}"

db-restore: ## Restore database from latest backup
	@echo "${BLUE}Restoring database...${NC}"
	@LATEST_BACKUP=$$(ls -t backups/*.sql | head -1); \
	if [ -z "$$LATEST_BACKUP" ]; then \
		echo "${RED}No backup found${NC}"; \
		exit 1; \
	fi; \
	echo "Restoring from $$LATEST_BACKUP"; \
	docker-compose exec -T postgres psql -U forms forms < $$LATEST_BACKUP
	@echo "${GREEN}✓ Database restored${NC}"

analyze-bundle: ## Analyze bundle sizes
	@echo "${BLUE}Analyzing bundle sizes...${NC}"
	pnpm --filter @forms/runtime build
	pnpm --filter @forms/analytics build
	node scripts/check-bundle-size.js

deploy-staging: ## Deploy to staging
	@echo "${BLUE}Deploying to staging...${NC}"
	./scripts/deploy.sh staging

deploy-prod: ## Deploy to production
	@echo "${YELLOW}Deploying to production!${NC}"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		./scripts/deploy.sh production; \
		echo "${GREEN}✓ Deployed to production${NC}"; \
	fi

clean: ## Clean build artifacts
	@echo "${BLUE}Cleaning build artifacts...${NC}"
	pnpm clean
	find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name "coverage" -exec rm -r {} + 2>/dev/null || true
	@echo "${GREEN}✓ Clean complete${NC}"

status: ## Check service status
	@echo "${BLUE}Service Status:${NC}"
	@echo ""
	@curl -s -o /dev/null -w "API:        %{http_code}\n" http://localhost:8000/health || echo "API:        ${RED}DOWN${NC}"
	@curl -s -o /dev/null -w "Analytics:  %{http_code}\n" http://localhost:8002/health || echo "Analytics:  ${RED}DOWN${NC}"
	@curl -s -o /dev/null -w "Frontend:   %{http_code}\n" http://localhost:3000 || echo "Frontend:   ${RED}DOWN${NC}"
	@docker-compose ps

setup: install docker-up migrate seed ## Complete setup for new developers
	@echo ""
	@echo "${GREEN}✅ Setup complete!${NC}"
	@echo ""
	@echo "You can now run:"
	@echo "  ${GREEN}make dev${NC} - Start development servers"
	@echo "  ${GREEN}make test${NC} - Run tests"
	@echo "  ${GREEN}make help${NC} - Show all commands"
	@echo ""
	@echo "Services will be available at:"
	@echo "  Marketing: ${BLUE}http://localhost:3000${NC}"
	@echo "  Builder:   ${BLUE}http://localhost:3001${NC}"
	@echo "  API:       ${BLUE}http://localhost:8000${NC}"
	@echo "  Analytics: ${BLUE}http://localhost:8002${NC}"