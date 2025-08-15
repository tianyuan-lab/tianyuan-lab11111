# 3D Desulfurization Tower Project - Quick Deploy Tool (PowerShell)
# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3D Desulfurization Tower - Quick Deploy" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python environment
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "Python environment OK: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python: https://www.python.org/downloads/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if built
if (-not (Test-Path "dist")) {
    Write-Host "Build not found, building now..." -ForegroundColor Yellow
    try {
        python deploy.py
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Host "Build completed" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Build failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Show deployment options
Write-Host "Please select deployment method:" -ForegroundColor White
Write-Host "  1. Local Preview (Recommended - Ready to use)" -ForegroundColor Cyan
Write-Host "  2. Docker Deploy (Production)" -ForegroundColor Cyan
Write-Host "  3. Auto Deploy (Multi-platform)" -ForegroundColor Cyan
Write-Host "  0. Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (0-3)"

switch ($choice) {
    "0" {
        Write-Host "Exiting deploy program" -ForegroundColor Yellow
        exit 0
    }
    
    "1" {
        Write-Host ""
        Write-Host "Starting local preview server..." -ForegroundColor Green
        Write-Host "Access URL: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop server" -ForegroundColor Yellow
        Write-Host ""
        python server.py
    }
    
    "2" {
        Write-Host ""
        Write-Host "Checking Docker environment..." -ForegroundColor Yellow
        
        try {
            $dockerVersion = docker --version 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw "Docker not found"
            }
            Write-Host "Docker environment OK: $dockerVersion" -ForegroundColor Green
        } catch {
            Write-Host "Docker not installed" -ForegroundColor Red
            Write-Host "Please install Docker: https://www.docker.com/get-started" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
        
        Write-Host "Building Docker image..." -ForegroundColor Yellow
        Set-Location "dist"
        
        try {
            docker build -t 3d-desulfurization-tower .
            if ($LASTEXITCODE -ne 0) {
                throw "Docker build failed"
            }
            
            Write-Host "Stopping old container..." -ForegroundColor Yellow
            docker stop 3d-tower 2>$null
            docker rm 3d-tower 2>$null
            
            Write-Host "Starting new container..." -ForegroundColor Yellow
            docker run -d --name 3d-tower -p 80:80 3d-desulfurization-tower
            if ($LASTEXITCODE -ne 0) {
                throw "Docker run failed"
            }
            
            Write-Host "Docker deployment successful!" -ForegroundColor Green
            Write-Host "Access URL: http://localhost" -ForegroundColor Cyan
            Write-Host "Management commands:" -ForegroundColor Yellow
            Write-Host "    docker stop 3d-tower    # Stop container" -ForegroundColor Gray
            Write-Host "    docker start 3d-tower   # Start container" -ForegroundColor Gray
            Write-Host "    docker logs 3d-tower    # View logs" -ForegroundColor Gray
            
        } catch {
            Write-Host "Docker deployment failed: $_" -ForegroundColor Red
        } finally {
            Set-Location ".."
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Starting auto deploy program..." -ForegroundColor Green
        python auto-deploy.py
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to exit"