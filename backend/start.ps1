# LinguaMeet AI — Backend Startup Script
# Run this from the backend folder: .\start.ps1

Write-Host ""
Write-Host "  LinguaMeet AI Backend" -ForegroundColor Cyan
Write-Host "  =====================" -ForegroundColor Cyan
Write-Host ""

# Check if database exists; seed if not
if (-not (Test-Path "linguameet.db")) {
    Write-Host "[*] First run — creating database and seeding demo data..." -ForegroundColor Yellow
    python -m app.database.init_db
    Write-Host ""
}

Write-Host "[START] Starting server on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "[INFO]  API docs: http://127.0.0.1:8000/docs" -ForegroundColor DarkGray
Write-Host "[INFO]  Demo login: arun@linguameet.demo / Demo@1234" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
