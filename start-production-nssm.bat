@echo off
REM =========================================================
REM Script démarrage rapide GeStock avec NSSM
REM =========================================================

echo ========================================
echo   GeStock Production - NSSM
echo ========================================
echo.

set SERVICE_NAME=GeStock

REM Vérification service installé
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] Service %SERVICE_NAME% non installe
    echo Executez d'abord : install-nssm-gestock.bat
    pause
    exit /b 1
)

REM Obtention status
echo [INFO] Verification du status...
nssm status %SERVICE_NAME%

REM Démarrage si arrêté
sc query %SERVICE_NAME% | find "RUNNING" >nul
if %errorLevel% neq 0 (
    echo.
    echo [INFO] Demarrage du service...
    nssm start %SERVICE_NAME%
    
    if %errorLevel% equ 0 (
        echo [OK] Service demarre
    ) else (
        echo [ERREUR] Echec demarrage
        echo Consultez les logs : .\logs\gestock-stderr.log
        pause
        exit /b 1
    )
) else (
    echo [OK] Service deja en cours d'execution
)

echo.
echo ========================================
echo   SERVICE ACTIF
echo ========================================
echo.
echo Application disponible : http://localhost:3000
echo.
echo Commandes utiles :
echo   - Arreter      : nssm stop %SERVICE_NAME%
echo   - Redemarrer   : nssm restart %SERVICE_NAME%
echo   - Logs stdout  : type logs\gestock-stdout.log
echo   - Logs stderr  : type logs\gestock-stderr.log
echo   - Editer config: nssm edit %SERVICE_NAME%
echo.

pause
