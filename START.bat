@echo off
title Smart Expense Tracker
cls

echo =========================================
echo   Smart Expense Tracker — AI Powered
echo =========================================
echo.
echo Starting servers...
echo.

:: Start Backend (with venv support)
if exist "%~dp0backend\venv\Scripts\activate.bat" (
    start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
) else (
    start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
)

:: Wait for backend to boot
timeout /t 3 /nobreak >nul

:: Start Frontend
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo.
echo  Demo Login: demo@expense.com / demo1234
echo.

:: Wait then open browser
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"
