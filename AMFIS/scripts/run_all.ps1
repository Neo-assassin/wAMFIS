<#
Run all parts of the AMFIS project (Windows PowerShell)

This script will:
- start the Django backend server (AMFIS_backend_/backend)
- run monitoring pipelines to produce `results/final_results.csv`
- generate frontend JSON files
- start the Vite frontend dev server

Usage (from repo root):
  PowerShell -ExecutionPolicy Bypass -File .\scripts\run_all.ps1

Notes:
- Requires the project's Python virtualenv at `.venv` to exist and contain needed packages.
- `npm` must be installed and available on PATH.
#>

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$DjangoDir = Join-Path $RepoRoot "AMFIS_backend_\backend"
$FrontendDir = Join-Path $RepoRoot "Amfis_frontend"

Write-Host "Using Python:" $Python

if (-not (Test-Path $Python)) {
    Write-Error "Python executable not found at $Python. Activate venv or adjust path and retry."
    exit 1
}

Write-Host "Starting Django server in a new process..."
Start-Process -FilePath $Python -ArgumentList "manage.py runserver" -WorkingDirectory $DjangoDir

Write-Host "Running monitoring pipelines to generate results (blocks until done)..."
& $Python (Join-Path $RepoRoot "scripts\run_full_with_german.py")

Write-Host "Generating frontend JSON (combinedResults.json)..."
& $Python (Join-Path $RepoRoot "scripts\generate_frontend_results.py")

Write-Host "Starting frontend dev server (Vite) in a new window..."
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendDir

Write-Host "All processes started."
Write-Host "- Django: http://127.0.0.1:8000/ (open console spawned by Start-Process to view logs)"
Write-Host "- Frontend: http://localhost:5173/"

exit 0
