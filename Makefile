.PHONY: help install run build test lint clean dev

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)Hajree - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies
	@echo "$(BLUE)Installing Python dependencies with uv...$(NC)"
	uv sync
	@echo "$(BLUE)Installing Frontend dependencies with bun...$(NC)"
	cd frontend && bun install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

run: ## Run the full platform (FastAPI + React SPA)
	@echo "$(BLUE)Starting Hajree SaaS platform...$(NC)"
	python run.py

dev-backend: ## Run FastAPI server with auto-reload
	@echo "$(BLUE)Starting FastAPI backend on port 8000...$(NC)"
	uv run uvicorn app.main:app --app-dir backend --reload --port 8000

dev-frontend: ## Run Vite development server
	@echo "$(BLUE)Starting Vite dev server on port 5173...$(NC)"
	cd frontend && bun run dev

build-frontend: ## Compile production React bundle
	@echo "$(BLUE)Building frontend production assets...$(NC)"
	cd frontend && bun run build
	@echo "$(GREEN)✓ Production assets generated in frontend/dist$(NC)"

test: ## Run backend unit test suite
	@echo "$(BLUE)Running pytest test suite...$(NC)"
	.venv/bin/python -m pytest
	@echo "$(GREEN)✓ All tests passed$(NC)"

lint: ## Run ruff lint check
	@echo "$(BLUE)Running ruff lint check...$(NC)"
	.venv/bin/ruff check backend
	@echo "$(GREEN)✓ Ruff checks passed$(NC)"

clean: ## Clean build artifacts and temporary files
	@echo "$(BLUE)Cleaning build caches...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache frontend/dist
	@echo "$(GREEN)✓ Clean complete$(NC)"
