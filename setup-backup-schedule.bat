@echo off
REM ============================================
REM Configuration Tâche Planifiée - GeStock
REM Sauvegarde Automatique PostgreSQL
REM ============================================

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║   Configuration Sauvegarde Automatique - GeStock             ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Vérifier les privilèges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERREUR: Ce script nécessite les privilèges administrateur
    echo.
    echo Faites un clic-droit sur ce fichier et choisissez "Exécuter en tant qu'administrateur"
    pause
    exit /b 1
)

echo ✓ Privilèges administrateur confirmés
echo.

REM Configuration
set TASK_NAME=GeStock-Backup-Auto
set SCRIPT_PATH=%~dp0scripts\auto-backup.mjs
set NODE_PATH=C:\Program Files\nodejs\node.exe
set LOG_PATH=%~dp0logs\backup-auto.log

REM Créer le dossier logs s'il n'existe pas
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo Configuration:
echo   - Tâche: %TASK_NAME%
echo   - Script: %SCRIPT_PATH%
echo   - Node.js: %NODE_PATH%
echo   - Logs: %LOG_PATH%
echo.

REM Vérifier que Node.js existe
if not exist "%NODE_PATH%" (
    echo ⚠️  AVERTISSEMENT: Node.js non trouvé à %NODE_PATH%
    echo.
    set /p NODE_PATH="Entrez le chemin complet vers node.exe: "
)

REM Vérifier que le script existe
if not exist "%SCRIPT_PATH%" (
    echo ❌ ERREUR: Script non trouvé: %SCRIPT_PATH%
    pause
    exit /b 1
)

echo.
echo Fréquence de sauvegarde disponibles:
echo   1. Toutes les 6 heures (recommandé)
echo   2. Toutes les 12 heures
echo   3. Une fois par jour (3h00 du matin)
echo   4. Toutes les 3 heures
echo   5. Personnalisé
echo.
set /p FREQ_CHOICE="Choisissez une option (1-5): "

if "%FREQ_CHOICE%"=="1" (
    set SCHEDULE_TYPE=HOURLY
    set SCHEDULE_MOD=6
    set SCHEDULE_DESC=Toutes les 6 heures
)
if "%FREQ_CHOICE%"=="2" (
    set SCHEDULE_TYPE=HOURLY
    set SCHEDULE_MOD=12
    set SCHEDULE_DESC=Toutes les 12 heures
)
if "%FREQ_CHOICE%"=="3" (
    set SCHEDULE_TYPE=DAILY
    set SCHEDULE_MOD=
    set SCHEDULE_TIME=03:00
    set SCHEDULE_DESC=Quotidienne à 3h00
)
if "%FREQ_CHOICE%"=="4" (
    set SCHEDULE_TYPE=HOURLY
    set SCHEDULE_MOD=3
    set SCHEDULE_DESC=Toutes les 3 heures
)
if "%FREQ_CHOICE%"=="5" (
    echo.
    echo Planification personnalisée:
    echo   HOURLY = Toutes les X heures
    echo   DAILY = Une fois par jour
    set /p SCHEDULE_TYPE="Type (HOURLY/DAILY): "
    
    if /i "%SCHEDULE_TYPE%"=="HOURLY" (
        set /p SCHEDULE_MOD="Intervalle en heures: "
        set SCHEDULE_DESC=Toutes les %SCHEDULE_MOD% heures
    ) else (
        set /p SCHEDULE_TIME="Heure (HH:MM): "
        set SCHEDULE_DESC=Quotidienne à %SCHEDULE_TIME%
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo Configuration choisie: %SCHEDULE_DESC%
echo ═══════════════════════════════════════════════════════════════
echo.

REM Supprimer la tâche existante si elle existe
schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo ℹ️  Suppression de la tâche existante...
    schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1
    echo ✓ Tâche existante supprimée
    echo.
)

REM Créer la nouvelle tâche
echo ℹ️  Création de la tâche planifiée...
echo.

if /i "%SCHEDULE_TYPE%"=="HOURLY" (
    schtasks /Create /TN "%TASK_NAME%" ^
        /TR "\"%NODE_PATH%\" \"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1" ^
        /SC HOURLY ^
        /MO %SCHEDULE_MOD% ^
        /RU SYSTEM ^
        /RL HIGHEST ^
        /F
) else (
    schtasks /Create /TN "%TASK_NAME%" ^
        /TR "\"%NODE_PATH%\" \"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1" ^
        /SC DAILY ^
        /ST %SCHEDULE_TIME% ^
        /RU SYSTEM ^
        /RL HIGHEST ^
        /F
)

if %errorLevel% equ 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║         ✓ CONFIGURATION TERMINÉE AVEC SUCCÈS                ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo Tâche planifiée créée: %TASK_NAME%
    echo Fréquence: %SCHEDULE_DESC%
    echo.
    echo Pour vérifier:
    echo   - Ouvrez "Planificateur de tâches" (taskschd.msc)
    echo   - Cherchez "%TASK_NAME%"
    echo.
    echo Pour tester manuellement:
    echo   schtasks /Run /TN "%TASK_NAME%"
    echo.
    echo Logs disponibles dans: %LOG_PATH%
    echo.
) else (
    echo.
    echo ╔═══════════════════════════════════════════════════════════════╗
    echo ║         ❌ ERREUR LORS DE LA CONFIGURATION                   ║
    echo ╚═══════════════════════════════════════════════════════════════╝
    echo.
    echo Vérifiez les chemins et réessayez
    echo.
)

pause
