@echo off
echo ========================================
echo   GeStock - Deployment pour Windows
echo ========================================
echo.

echo [1/7] Verification Node.js...
node --version || (
    echo ERREUR: Node.js n'est pas installe!
    echo Telecharger depuis https://nodejs.org
    exit /b 1
)

echo [2/7] Installation des dependances...
call npm install
if errorlevel 1 (
    echo ERREUR: Installation des dependances echouee!
    exit /b 1
)

echo [3/7] Generation Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERREUR: Generation Prisma echouee!
    exit /b 1
)

echo [4/7] Verification fichier .env...
if not exist .env (
    echo ATTENTION: Fichier .env manquant!
    echo Copie de .env.example vers .env...
    copy .env.example .env
    echo IMPORTANT: Editer .env avec vos vraies valeurs!
    pause
)

echo [5/7] Migration base de donnees...
call npx prisma migrate deploy
if errorlevel 1 (
    echo ERREUR: Migration base de donnees echouee!
    exit /b 1
)

echo [6/7] Build production...
call npm run build
if errorlevel 1 (
    echo ERREUR: Build production echoue!
    exit /b 1
)

echo [7/7] Creation dossiers necessaires...
if not exist logs mkdir logs
if not exist C:\gestock\uploads mkdir C:\gestock\uploads
echo Dossier uploads cree: C:\gestock\uploads

echo.
echo ========================================
echo   Deployment termine avec succes!
echo ========================================
echo.
echo Pour demarrer l'application:
echo   - Mode simple: npm run start
echo   - Avec PM2:    pm2 start ecosystem.config.js
echo.
echo L'application sera accessible sur http://localhost:3000
echo.
pause
