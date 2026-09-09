@echo off
echo.
echo   LinguaMeet AI Backend
echo   =====================
echo.

if not exist linguameet.db (
    echo [*] First run - creating database and seeding demo data...
    python -m app.database.init_db
    echo.
)

echo [START] Starting server on http://127.0.0.1:8000
echo [INFO]  API docs: http://127.0.0.1:8000/docs
echo [INFO]  Demo login: arun@linguameet.demo / Demo@1234
echo.
echo Press Ctrl+C to stop.
echo.

python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
