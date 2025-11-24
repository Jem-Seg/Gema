@echo off
REM =========================================================
REM Installation Service Windows NSSM pour GeStock
REM Remplace PM2 pour stabilité production Windows
REM =========================================================

echo ========================================
echo   Installation Service GeStock (NSSM)
echo ========================================
echo.

REM Vérification privilèges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] Ce script necessite les privileges administrateur
    echo Faites un clic droit et selectionnez "Executer en tant qu'administrateur"
    pause
    exit /b 1
)

echo [OK] Privileges administrateur detectes
echo.

REM Configuration
set SERVICE_NAME=GeStock
set APP_DIR=%CD%
set NODE_PATH=C:\Program Files\nodejs\node.exe
set START_SCRIPT=%APP_DIR%\.next\standalone\server.js
set NSSM_PATH=%APP_DIR%\nssm.exe
set LOG_DIR=%APP_DIR%\logs

REM Vérification Node.js
if not exist "%NODE_PATH%" (
    echo [ERREUR] Node.js non trouve : %NODE_PATH%
    echo Installez Node.js ou modifiez NODE_PATH dans ce script
    pause
    exit /b 1
)

echo [OK] Node.js trouve : %NODE_PATH%
echo.

REM Vérification build standalone
if not exist "%START_SCRIPT%" (
    echo [ERREUR] Build standalone non trouve : %START_SCRIPT%
    echo Executez d'abord : npm run build
    pause
    exit /b 1
)

echo [OK] Build standalone trouve
echo.

REM Téléchargement NSSM si absent
if not exist "%NSSM_PATH%" (
    echo [INFO] Telechargement NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%APP_DIR%\nssm.zip'"
    
    if not exist "%APP_DIR%\nssm.zip" (
        echo [ERREUR] Echec telechargement NSSM
        echo Telechargez manuellement depuis https://nssm.cc/download
        pause
        exit /b 1
    )
    
    echo [INFO] Extraction NSSM...
    powershell -Command "Expand-Archive -Path '%APP_DIR%\nssm.zip' -DestinationPath '%APP_DIR%' -Force"
    
    REM Copie nssm.exe depuis dossier extrait
    copy "%APP_DIR%\nssm-2.24\win64\nssm.exe" "%NSSM_PATH%" >nul
    
    if exist "%APP_DIR%\nssm.zip" del "%APP_DIR%\nssm.zip"
    if exist "%APP_DIR%\nssm-2.24" rmdir /s /q "%APP_DIR%\nssm-2.24"
    
    echo [OK] NSSM installe
) else (
    echo [OK] NSSM deja present
)
echo.

REM Création dossier logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Arrêt service existant
echo [INFO] Verification service existant...
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] Arret du service existant...
    "%NSSM_PATH%" stop %SERVICE_NAME%
    timeout /t 3 /nobreak >nul
    
    echo [INFO] Suppression du service existant...
    "%NSSM_PATH%" remove %SERVICE_NAME% confirm
    timeout /t 2 /nobreak >nul
)

REM Installation nouveau service
echo.
echo [INFO] Installation du service %SERVICE_NAME%...

"%NSSM_PATH%" install %SERVICE_NAME% "%NODE_PATH%" "%START_SCRIPT%"

if %errorLevel% neq 0 (
    echo [ERREUR] Echec installation service
    pause
    exit /b 1
)

echo [OK] Service installe
echo.

REM Configuration service
echo [INFO] Configuration du service...

REM Répertoire de travail
"%NSSM_PATH%" set %SERVICE_NAME% AppDirectory "%APP_DIR%\.next\standalone"

REM Variables d'environnement (À CONFIGURER)
"%NSSM_PATH%" set %SERVICE_NAME% AppEnvironmentExtra ^
NODE_ENV=production ^
PORT=3000 ^
HOSTNAME=0.0.0.0 ^
DATABASE_URL=postgresql://gestock_user:YOUR_PASSWORD@localhost:5432/gestock_prod ^
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000 ^
NEXTAUTH_SECRET=YOUR_SECRET_KEY_HERE

REM Logs
"%NSSM_PATH%" set %SERVICE_NAME% AppStdout "%LOG_DIR%\gestock-stdout.log"
"%NSSM_PATH%" set %SERVICE_NAME% AppStderr "%LOG_DIR%\gestock-stderr.log"

REM Rotation logs (10 MB max)
"%NSSM_PATH%" set %SERVICE_NAME% AppStdoutCreationDisposition 4
"%NSSM_PATH%" set %SERVICE_NAME% AppStderrCreationDisposition 4
"%NSSM_PATH%" set %SERVICE_NAME% AppRotateFiles 1
"%NSSM_PATH%" set %SERVICE_NAME% AppRotateOnline 1
"%NSSM_PATH%" set %SERVICE_NAME% AppRotateBytes 10485760

REM Démarrage automatique
"%NSSM_PATH%" set %SERVICE_NAME% Start SERVICE_AUTO_START

REM Gestion crashes - Redémarrage automatique
"%NSSM_PATH%" set %SERVICE_NAME% AppExit Default Restart
"%NSSM_PATH%" set %SERVICE_NAME% AppRestartDelay 5000

REM Priorité
"%NSSM_PATH%" set %SERVICE_NAME% AppPriority NORMAL_PRIORITY_CLASS

REM Description
"%NSSM_PATH%" set %SERVICE_NAME% Description "Service GeStock - Application de gestion de stock Next.js"
"%NSSM_PATH%" set %SERVICE_NAME% DisplayName "GeStock Production"

echo [OK] Service configure
echo.

REM Affichage informations
echo ========================================
echo   INSTALLATION TERMINEE
echo ========================================
echo.
echo Service Name     : %SERVICE_NAME%
echo Application      : %START_SCRIPT%
echo Logs Directory   : %LOG_DIR%
echo Port             : 3000
echo.
echo IMPORTANT - CONFIGURATION REQUISE :
echo.
echo 1. Editez les variables d'environnement :
echo    nssm set %SERVICE_NAME% AppEnvironmentExtra
echo.
echo 2. Configurez DATABASE_URL avec votre mot de passe PostgreSQL
echo 3. Configurez NEXTAUTH_URL avec l'IP de votre serveur
echo 4. Configurez NEXTAUTH_SECRET (generer avec : openssl rand -base64 32)
echo.
echo COMMANDES UTILES :
echo.
echo   Demarrer    : nssm start %SERVICE_NAME%
echo   Arreter     : nssm stop %SERVICE_NAME%
echo   Redemarrer  : nssm restart %SERVICE_NAME%
echo   Status      : nssm status %SERVICE_NAME%
echo   Logs        : type %LOG_DIR%\gestock-stdout.log
echo   Editer      : nssm edit %SERVICE_NAME%
echo   Supprimer   : nssm remove %SERVICE_NAME% confirm
echo.
echo ========================================

REM Demande démarrage service
echo.
set /p START_NOW="Voulez-vous demarrer le service maintenant ? (O/N) : "
if /i "%START_NOW%"=="O" (
    echo.
    echo [INFO] Demarrage du service...
    "%NSSM_PATH%" start %SERVICE_NAME%
    
    if %errorLevel% equ 0 (
        echo [OK] Service demarre avec succes
        echo.
        echo Verifiez l'application sur : http://localhost:3000
        echo Logs en temps reel : tail -f %LOG_DIR%\gestock-stdout.log
    ) else (
        echo [ERREUR] Echec demarrage service
        echo Consultez les logs : %LOG_DIR%\gestock-stderr.log
    )
)

echo.
pause
