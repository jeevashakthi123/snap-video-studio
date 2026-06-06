@echo off
REM ─── Snap Video Studio – Windows launcher ────────────────────────────────────
setlocal

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║      🎬  Snap Video Studio  🎬        ║
echo  ╚═══════════════════════════════════════╝
echo.

set ROOT=%~dp0

REM ── Backend ──────────────────────────────────────────────────────────────────
echo [1/2] Starting Backend (FastAPI on port 5000)...
cd "%ROOT%backend"

if not exist ".venv" (
  echo   Creating Python virtual environment...
  python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -q -r requirements.txt

start "Snap Backend" cmd /k "uvicorn main:app --host 0.0.0.0 --port 5000 --reload"

REM ── Frontend ──────────────────────────────────────────────────────────────────
echo [2/2] Starting Frontend (React on port 3000)...
cd "%ROOT%frontend"

if not exist "node_modules" (
  echo   Installing npm packages...
  call npm install --legacy-peer-deps
)

start "Snap Frontend" cmd /k "npm start"

echo.
echo ✅  Both servers launched in separate windows!
echo    Frontend  →  http://localhost:3000
echo    Backend   →  http://localhost:5000
echo    API docs  →  http://localhost:5000/docs
echo.
pause
