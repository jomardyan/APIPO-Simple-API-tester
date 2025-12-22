# Quick API Client Desktop - Task Runner for Windows PowerShell
# Usage: .\tasks.ps1 [command]
# Example: .\tasks.ps1 dev

param(
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Quick API Client Desktop - Available Commands" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Development: " -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 install          - Install all dependencies"
    Write-Host "  .\tasks.ps1 dev              - Start development environment with hot reload"
    Write-Host "  .\tasks.ps1 build            - Build production bundles (renderer + main)"
    Write-Host "  .\tasks.ps1 build-main       - Build main process only"
    Write-Host "  .\tasks.ps1 build-renderer   - Build renderer (React UI) only"
    Write-Host ""
    Write-Host "Running:" -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 start            - Run the packaged Electron app"
    Write-Host "  .\tasks.ps1 package          - Build and create installer package"
    Write-Host ""
    Write-Host "Testing & Quality:" -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 test             - Run tests once"
    Write-Host "  .\tasks.ps1 test-watch       - Run tests in watch mode"
    Write-Host "  .\tasks.ps1 test-coverage    - Run tests with coverage report"
    Write-Host "  .\tasks.ps1 lint             - Lint the codebase"
    Write-Host ""
    Write-Host "Cleanup:" -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 clean            - Remove dist, build artifacts"
    Write-Host "  .\tasks.ps1 clean-all        - Remove dist, node_modules, lock files"
    Write-Host ""
    Write-Host "Workflow:" -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 prod             - Build and run in production mode"
    Write-Host ""
}

function Run-Command {
    param([string]$Command)
    Write-Host "▶ Running: $Command" -ForegroundColor Green
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Command failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}

switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }
    "install" {
        Run-Command "npm install"
        Write-Host "✓ Dependencies installed" -ForegroundColor Green
    }
    "dev" {
        Run-Command "npm run dev"
    }
    "build" {
        Run-Command "npm run build:renderer"
        Run-Command "npm run build:main"
        Write-Host "✓ Build complete (renderer + main)" -ForegroundColor Green
    }
    "build-main" {
        Run-Command "npm run build:main"
    }
    "build-renderer" {
        Run-Command "npm run build:renderer"
    }
    "start" {
        Run-Command "npm start"
    }
    "test" {
        Run-Command "npm test"
    }
    "test-watch" {
        Run-Command "npm run test:watch"
    }
    "test-coverage" {
        Run-Command "npm run test:coverage"
    }
    "lint" {
        Run-Command "npm run lint"
    }
    "package" {
        Run-Command "npm run package"
    }
    "clean" {
        Write-Host "Cleaning dist/ directory..." -ForegroundColor Yellow
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Write-Host "✓ Cleaned" -ForegroundColor Green
        } else {
            Write-Host "dist/ not found" -ForegroundColor Gray
        }
    }
    "clean-all" {
        Write-Host "Removing node_modules..." -ForegroundColor Yellow
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force "node_modules"
            Write-Host "✓ Removed node_modules" -ForegroundColor Green
        }

        Write-Host "Removing lock files..." -ForegroundColor Yellow
        if (Test-Path "package-lock.json") {
            Remove-Item -Force "package-lock.json"
            Write-Host "✓ Removed package-lock.json" -ForegroundColor Green
        }

        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Write-Host "✓ Removed dist/" -ForegroundColor Green
        }

        Write-Host "✓ Full cleanup complete" -ForegroundColor Green
    }
    "prod" {
        Run-Command "npm run build:renderer"
        Run-Command "npm run build:main"
        Run-Command "npm start"
    }
    "dev-main" {
        Run-Command "npm run dev:main"
    }
    "dev-renderer" {
        Run-Command "npm run dev:renderer"
    }
    default {
        Write-Host "✗ Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
