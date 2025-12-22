.PHONY: help install dev build build:main build:renderer start test test:watch test:coverage clean package lint

# Default target
help:
	@echo "Quick API Client Desktop - Available Commands"
	@echo "=============================================="
	@echo ""
	@echo "Development:"
	@echo "  make install          - Install all dependencies"
	@echo "  make dev              - Start development environment with hot reload"
	@echo "  make build            - Build production bundles (renderer + main)"
	@echo "  make build:main       - Build main process only"
	@echo "  make build:renderer   - Build renderer (React UI) only"
	@echo ""
	@echo "Running:"
	@echo "  make start            - Run the packaged Electron app"
	@echo "  make package          - Build and create installer package"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test             - Run tests once"
	@echo "  make test:watch       - Run tests in watch mode"
	@echo "  make test:coverage    - Run tests with coverage report"
	@echo "  make lint             - Lint the codebase"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            - Remove dist, build artifacts"
	@echo "  make clean:all        - Remove dist, node_modules, lock files"
	@echo ""

# Install dependencies
install:
	npm install

# Development server with hot reload
dev:
	npm run dev

# Build production bundles
build: build:renderer build:main
	@echo "✓ Build complete (renderer + main)"

# Build main process only
build:main:
	npm run build:main

# Build renderer (React UI) only
build:renderer:
	npm run build:renderer

# Start the packaged Electron app
start:
	npm start

# Run tests
test:
	npm test

# Run tests in watch mode
test:watch:
	npm run test:watch

# Run tests with coverage
test:coverage:
	npm run test:coverage

# Lint the codebase
lint:
	npm run lint

# Create installer package
package:
	npm run package

# Clean build artifacts
clean:
	@echo "Cleaning dist/ directory..."
	@if exist dist rmdir /s /q dist 2>nul || true
	@echo "✓ Cleaned"

# Clean everything
clean:all: clean
	@echo "Removing node_modules..."
	@if exist node_modules rmdir /s /q node_modules 2>nul || true
	@echo "Removing lock files..."
	@del /q package-lock.json 2>nul || true
	@echo "✓ Full cleanup complete"

# Quick development workflow
dev:quick: build dev

# Build and run in production mode
prod: build start

# Watch main process and rebuild
dev:main:
	npm run dev:main

# Watch renderer and rebuild
dev:renderer:
	npm run dev:renderer

.PHONY: dev:quick prod dev:main dev:renderer
