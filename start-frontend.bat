@echo off
REM Navigate to the frontend folder and start the Vite development server.
cd /d "%~dp0frontend"
call npm install
call npm run dev
