@echo off
REM ============================================
REM Installation Service Windows NSSM pour GeStock
REM Exécuter en tant qu'Administrateur
REM ============================================

echo ========================================
echo Installation Service Windows GeStock
echo ========================================
echo.

REM Vérifier les privilèges admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERREUR: Ce script doit etre execute en tant qu'Administrateur
    echo Clic droit sur le fichier ^> Executer en tant qu'administrateur
    pause
    exit /b 1
)

REM Variables de configuration
set SERVICE_NAME=GeStock
set APP_DIR=%~dp0
set PM2_PATH=%APPDATA%\npm\pm2.cmd
set NODE_PATH=C:\Program Files\nodejs\node.exe
set NSSM_PATH=%APP_DIR%nssm.exe

echo Repertoire application: %APP_DIR%
echo.

REM Vérifier si Node.js est installé
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    echo Telechargez Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

REM Vérifier si PM2 est installé
where pm2 >nul 2>&1
if %errorLevel% neq 0 (
    echo Installation de PM2...
    npm install -g pm2
    npm install -g pm2-windows-startup
    
    echo Configuration PM2 au demarrage...
    pm2-startup install
)

REM Vérifier si NSSM existe
if not exist "%NSSM_PATH%" (
    echo ERREUR: NSSM n'est pas trouve dans le repertoire
    echo Telechargez NSSM depuis https://nssm.cc/download
    echo Extrayez nssm.exe dans: %APP_DIR%
    pause
    exit /b 1
)

REM Arrêter le service s'il existe déjà
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo Arret du service existant...
    "%NSSM_PATH%" stop "%SERVICE_NAME%"
    timeout /t 3 >nul
    
    echo Suppression du service existant...
    "%NSSM_PATH%" remove "%SERVICE_NAME%" confirm
    timeout /t 2 >nul
)

echo.
echo Installation du service Windows...
echo.

REM Installer le service avec NSSM
"%NSSM_PATH%" install "%SERVICE_NAME%" "%PM2_PATH%" "start" "ecosystem.config.cjs"

REM Configuration du service
"%NSSM_PATH%" set "%SERVICE_NAME%" AppDirectory "%APP_DIR%"
"%NSSM_PATH%" set "%SERVICE_NAME%" DisplayName "GeStock - Gestion de Stock"
"%NSSM_PATH%" set "%SERVICE_NAME%" Description "Application de gestion de stock pour ministeres - Next.js + PostgreSQL"
"%NSSM_PATH%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

REM Configuration des logs
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStdout "%APP_DIR%logs\service-output.log"
"%NSSM_PATH%" set "%SERVICE_NAME%" AppStderr "%APP_DIR%logs\service-error.log"

REM Rotation des logs (10MB max)
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRotateBytes 10485760

REM Variables d'environnement
"%NSSM_PATH%" set "%SERVICE_NAME%" AppEnvironmentExtra "NODE_ENV=production" "PORT=3000"

REM Gestion des pannes
"%NSSM_PATH%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM_PATH%" set "%SERVICE_NAME%" AppRestartDelay 5000

echo.
echo ========================================
echo Service installe avec succes!
echo ========================================
echo.
echo Nom du service: %SERVICE_NAME%
echo Repertoire: %APP_DIR%
echo.
echo Commandes utiles:
echo   Demarrer:  net start %SERVICE_NAME%
echo   Arreter:   net stop %SERVICE_NAME%
echo   Statut:    sc query %SERVICE_NAME%
echo   Logs PM2:  pm2 logs
echo   Interface: pm2 monit
echo.
echo Voulez-vous demarrer le service maintenant? (O/N)
set /p START_NOW=

if /i "%START_NOW%"=="O" (
    echo Demarrage du service...
    net start "%SERVICE_NAME%"
    timeout /t 3 >nul
    
    echo.
    echo Verification du statut...
    sc query "%SERVICE_NAME%"
    
    echo.
    echo Service demarre! Accessible sur http://localhost:3000
) else (
    echo.
    echo Service installe mais non demarre.
    echo Pour demarrer: net start %SERVICE_NAME%
)

echo.
pause
