# EventCAD+ Makefile
.PHONY: help build up down logs shell clean test lint format dev prod install

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_COMPOSE = docker-compose
BACKEND_CONTAINER = eventcad-backend
FRONTEND_CONTAINER = eventcad-frontend
DB_CONTAINER = eventcad-postgres

# Colors
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "EventCAD+ Docker Commands"
	@echo "========================"
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies for both frontend and backend
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd eventcad-backend && npm install
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd eventcad-frontend && npm install

build: ## Build all Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build

build-prod: ## Build production Docker images
	@echo "$(GREEN)Building production Docker images...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml build

up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:3000"
	@echo "API Docs: http://localhost:3000/api"

up-dev: ## Start services in development mode
	@echo "$(GREEN)Starting services in development mode...$(NC)"
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	$(DOCKER_COMPOSE) down

down-v: ## Stop all services and remove volumes
	@echo "$(RED)Stopping all services and removing volumes...$(NC)"
	$(DOCKER_COMPOSE) down -v

logs: ## View logs from all services
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## View backend logs
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## View frontend logs
	$(DOCKER_COMPOSE) logs -f frontend

shell-backend: ## Access backend container shell
	$(DOCKER_COMPOSE) exec $(BACKEND_CONTAINER) sh

shell-frontend: ## Access frontend container shell
	$(DOCKER_COMPOSE) exec $(FRONTEND_CONTAINER) sh

shell-db: ## Access database shell
	$(DOCKER_COMPOSE) exec $(DB_CONTAINER) psql -U eventcad -d eventcad

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	$(DOCKER_COMPOSE) exec $(BACKEND_CONTAINER) npm run migration:run

migrate-create: ## Create a new migration
	@echo "$(GREEN)Creating new migration...$(NC)"
	@read -p "Enter migration name: " name; \
	$(DOCKER_COMPOSE) exec $(BACKEND_CONTAINER) npm run migration:create -- $$name

seed: ## Seed the database
	@echo "$(GREEN)Seeding database...$(NC)"
	$(DOCKER_COMPOSE) exec $(BACKEND_CONTAINER) npm run seed

test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	cd eventcad-backend && npm test
	cd eventcad-frontend && npm test

test-e2e: ## Run E2E tests
	@echo "$(GREEN)Running E2E tests...$(NC)"
	cd eventcad-backend && npm run test:e2e

lint: ## Run linters
	@echo "$(GREEN)Running linters...$(NC)"
	cd eventcad-backend && npm run lint
	cd eventcad-frontend && npm run lint

format: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	cd eventcad-backend && npm run format
	cd eventcad-frontend && npm run format

clean: ## Clean up containers, images, and volumes
	@echo "$(RED)Cleaning up Docker resources...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all

restart: down up ## Restart all services

restart-backend: ## Restart backend service
	@echo "$(YELLOW)Restarting backend...$(NC)"
	$(DOCKER_COMPOSE) restart $(BACKEND_CONTAINER)

restart-frontend: ## Restart frontend service
	@echo "$(YELLOW)Restarting frontend...$(NC)"
	$(DOCKER_COMPOSE) restart $(FRONTEND_CONTAINER)

status: ## Show status of all services
	$(DOCKER_COMPOSE) ps

backup-db: ## Backup database
	@echo "$(GREEN)Backing up database...$(NC)"
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec $(DB_CONTAINER) pg_dump -U eventcad eventcad > backups/eventcad_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backed up to backups/ directory$(NC)"

restore-db: ## Restore database from backup
	@echo "$(YELLOW)Available backups:$(NC)"
	@ls -la backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " file; \
	$(DOCKER_COMPOSE) exec -T $(DB_CONTAINER) psql -U eventcad eventcad < backups/$$file

prod: ## Deploy in production mode
	@echo "$(GREEN)Deploying in production mode...$(NC)"
	$(DOCKER_COMPOSE) --profile production up -d

dev: ## Start development environment
	@echo "$(GREEN)Starting development environment...$(NC)"
	cd eventcad-backend && npm run start:dev &
	cd eventcad-frontend && npm run dev