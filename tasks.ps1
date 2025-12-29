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
    Write-Host "  .\tasks.ps1 build-msix       - Build MSIX package (x64 + arm64)"
    Write-Host ""
    Write-Host "Signing & Store:" -ForegroundColor Yellow
    Write-Host "  .\tasks.ps1 create-cert      - Create a dev code-signing certificate (interactive)"
    Write-Host "  .\tasks.ps1 export-pfx      - Export a certificate to a .pfx file for signing"
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
    "create-cert" {
        # Create a development self-signed code-signing certificate
        $pub = Read-Host "Enter publisher name (e.g. CN=YourPublisherName)"
        if (-not $pub) { Write-Host "Publisher name is required" -ForegroundColor Red; exit 1 }
        Write-Host "Creating self-signed code signing cert with publisher: $pub" -ForegroundColor Green
        $cert = New-SelfSignedCertificate -Type CodeSigning -Subject $pub -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable
        Write-Host "✓ Certificate created. Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green
        Write-Host "Run 'export-pfx' to export this cert to a .pfx file for signing or set CSC_LINK to a secure location." -ForegroundColor Yellow
    }
    "export-pfx" {
        # Export a certificate to PFX (interactive)
        $thumb = Read-Host "Enter certificate thumbprint (or press Enter to list latest)"
        if (-not $thumb) {
            $cert = Get-ChildItem Cert:\CurrentUser\My | Sort-Object NotAfter -Descending | Select-Object -First 1
        } else {
            $cert = Get-ChildItem Cert:\CurrentUser\My\$thumb
        }
        if (-not $cert) { Write-Host "Certificate not found" -ForegroundColor Red; exit 1 }
        $out = Read-Host "Output file path (e.g. C:\temp\dev-cert.pfx)"
        $pwd = Read-Host "PFX password (will be used as CSC_KEY_PASSWORD)" -AsSecureString
        Export-PfxCertificate -Cert $cert -FilePath $out -Password $pwd
        Write-Host "✓ Exported to $out" -ForegroundColor Green
        Write-Host "Tip: set environment vars: `CSC_LINK` to the PFX (or a url) and `CSC_KEY_PASSWORD` to the password" -ForegroundColor Yellow
    }
    "build-msix" {
        Run-Command "npm run build"
        # Build MSIX (requires msix target in electron-builder.json and a certificate or Partner Center signing)
        Run-Command "npx electron-builder --win --x64 --arm64"
        Write-Host "✓ MSIX build finished (outputs in release/ by default)" -ForegroundColor Green
        Write-Host "If unsigned, either use Partner Center to sign, or set CSC_LINK and CSC_KEY_PASSWORD to sign locally." -ForegroundColor Yellow
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
