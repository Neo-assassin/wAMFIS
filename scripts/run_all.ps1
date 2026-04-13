<#
Run all parts of the AMFIS project (Windows PowerShell)

This script will:
- Run all 4 datasets (Adult, Loan, Bank, German Credit)
- Generate frontend JSON files  
- Start Django backend on port 8000
- Start Vite frontend on port 5173

Usage (from repo root):
  PowerShell -ExecutionPolicy Bypass -File .\scripts\run_all.ps1
#>

$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AMFIS - Running All Components" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Run all datasets
Write-Host "`n[1/4] Running datasets..." -ForegroundColor Yellow
& python scripts\run_full_with_german.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error running datasets!" -ForegroundColor Red
}

# Step 2: Generate frontend JSON
Write-Host "[2/4] Generating frontend JSON..." -ForegroundColor Yellow
& python scripts\generate_frontend_results.py

# Step 3: Start Django backend in new window
Write-Host "[3/4] Starting Django backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command cd $RepoRoot; python backend\manage.py runserver 8000" -WindowStyle Normal

# Step 4: Start Frontend
Write-Host "[4/4] Starting Vite frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command cd $RepoRoot\frontend; npm run dev" -WindowStyle Normal

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All components started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "- Backend API:  http://127.0.0.1:8000/" -ForegroundColor White
Write-Host "- Frontend:  http://localhost:5173/" -ForegroundColor White
Write-Host "- Dashboard: http://localhost:5173/dashboard" -ForegroundColor White

exit 0
