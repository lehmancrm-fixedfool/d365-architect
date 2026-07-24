@echo off
setlocal

echo.
echo  D365 Architect OS -- Starting
echo  ==============================
echo.

set "DIR=%~dp0"

REM Check for .env
if not exist "%DIR%.env" (
    echo [!] .env file not found. Copying from .env.example...
    copy "%DIR%.env.example" "%DIR%.env"
    echo.
    echo [!] Please edit %DIR%.env and add your ANTHROPIC_API_KEY
    echo     Then run start.bat again.
    echo.
    pause
    exit /b 1
)

REM Find Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.11+
    pause
    exit /b 1
)

REM Find npm/node
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] npm not found. Frontend will not start.
    echo           Install Node.js from https://nodejs.org/
    echo.
    echo Starting backend only...
    start "D365 Architect Backend" cmd /k "cd /d "%DIR%backend" && pip install -q -r requirements.txt && python main.py"
    echo.
    echo Backend: http://localhost:8000
    echo API Docs: http://localhost:8000/docs
    pause
    exit /b 0
)

REM Install backend deps
echo [1/4] Installing backend dependencies...
pip install -q -r "%DIR%backend\requirements.txt"

REM Start backend
echo [2/4] Starting backend API (port 8000)...
start "D365-Backend" cmd /k "cd /d "%DIR%backend" && python main.py"

REM Wait for backend
timeout /t 3 /nobreak > nul

REM Install frontend deps if needed
echo [3/4] Installing frontend dependencies...
cd /d "%DIR%frontend"
if not exist node_modules (
    npm install
)

REM Start frontend
echo [4/4] Starting frontend (port 5173)...
start "D365-Frontend" cmd /k "cd /d "%DIR%frontend" && npm run dev"

echo.
echo  D365 Architect OS is starting...
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo  Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start "" http://localhost:5173

echo.
echo  Press any key to exit (servers will continue running).
pause > nul
