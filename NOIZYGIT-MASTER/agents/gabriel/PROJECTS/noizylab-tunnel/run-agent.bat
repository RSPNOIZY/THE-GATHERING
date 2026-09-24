@echo off
echo ═══════════════════════════════════════════════════
echo   GABRIEL Agent
echo ═══════════════════════════════════════════════════
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.x first.
    pause
    exit /b 1
)

REM Install dependencies
pip install psutil >nul 2>&1

REM Run agent
python gabriel-agent.py

pause
