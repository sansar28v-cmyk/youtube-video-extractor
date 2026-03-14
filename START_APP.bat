@echo off
title YouTube Slide Extractor
echo.
echo Starting Backend Server (port 3001)...
start "Backend Server" cmd /k "cd /d "%~dp0server" && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (will open in browser)...
start "Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
echo.
echo ============================================
echo  Wait ~10 seconds, then open in your browser:
echo  http://localhost:5173
echo  (or http://localhost:5174 if 5173 is in use)
echo ============================================
echo.
echo Keep BOTH terminal windows open.
pause
