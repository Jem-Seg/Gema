@echo off
REM GeStock - Script de demarrage rapide Windows

echo Demarrage de GeStock...

REM Verifier si PM2 est installe
where pm2 >nul 2>nul
if %errorlevel% == 0 (
    echo Demarrage avec PM2...
    pm2 start ecosystem.config.js
    pm2 logs gestock
) else (
    echo PM2 non installe. Demarrage mode simple...
    echo Pour installer PM2: npm install -g pm2
    echo.
    npm run start
)
