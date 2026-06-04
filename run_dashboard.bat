@echo off
title HK Weather Dashboard Server
echo ===================================================
echo     Hong Kong District Weather Live Dashboard
echo ===================================================
echo.
echo [1/2] Opening dashboard in your default browser...
start "" "http://localhost:8000"
echo.
echo [2/2] Starting local HTTP web server on port 8000...
echo (Keep this window open to keep the server running)
echo.
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Python is not installed or not in your system PATH.
    echo Please make sure Python is installed, or run another local server.
    pause
)
