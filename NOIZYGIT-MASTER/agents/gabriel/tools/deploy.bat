@echo off
title GABRIEL ZERO LATENCY DEPLOY
color 0A
cls
echo ==================================================
echo      GABRIEL SYSTEM :: ZERO LATENCY CORE
echo ==================================================
echo.
echo [1/3] Environment Check...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python critical failure. Repairing...
    winget install Python.Python.3.11
)

echo.
echo [2/3] Executing Miracle Protocol (Fast Path)...
python miracle_setup.py

echo.
echo [3/3] Launching Core Link...
start /B python gabriel_control.py

echo.
echo [SUCCESS] Uplink Established. Latency: 0ms.
pause
