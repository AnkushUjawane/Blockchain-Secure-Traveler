@echo off
echo Starting Aegis Demo...
echo.

echo Starting Backend Server...
start cmd /k "cd aegis-backend && npm start"

timeout /t 3

echo Starting Frontend...
start cmd /k "cd aegis-frontend && npm run dev"

echo.
echo Demo is starting up!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo Admin Dashboard: http://localhost:5173/admin
echo.
pause