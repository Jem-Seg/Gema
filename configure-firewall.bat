@echo off
REM ============================================
REM Configuration Firewall Windows pour GeStock
REM Exécuter en tant qu'Administrateur
REM ============================================

echo ========================================
echo Configuration Firewall Windows
echo ========================================
echo.

REM Vérifier les privilèges admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERREUR: Ce script doit etre execute en tant qu'Administrateur
    pause
    exit /b 1
)

REM Variables
set APP_NAME=GeStock
set HTTP_PORT=3000
set HTTPS_PORT=443

echo Configuration des regles de pare-feu pour %APP_NAME%...
echo.

REM Supprimer les règles existantes si elles existent
netsh advfirewall firewall delete rule name="%APP_NAME% - HTTP Inbound" >nul 2>&1
netsh advfirewall firewall delete rule name="%APP_NAME% - HTTP Outbound" >nul 2>&1
netsh advfirewall firewall delete rule name="%APP_NAME% - HTTPS Inbound" >nul 2>&1

echo [1/5] Creation regle HTTP entrante (port %HTTP_PORT%)...
netsh advfirewall firewall add rule ^
    name="%APP_NAME% - HTTP Inbound" ^
    dir=in ^
    action=allow ^
    protocol=TCP ^
    localport=%HTTP_PORT% ^
    profile=any ^
    description="Autorise les connexions HTTP entrantes vers GeStock"

if %errorLevel% neq 0 (
    echo ERREUR: Echec creation regle HTTP entrante
    pause
    exit /b 1
)

echo [2/5] Creation regle HTTP sortante (port %HTTP_PORT%)...
netsh advfirewall firewall add rule ^
    name="%APP_NAME% - HTTP Outbound" ^
    dir=out ^
    action=allow ^
    protocol=TCP ^
    localport=%HTTP_PORT% ^
    profile=any ^
    description="Autorise les connexions HTTP sortantes depuis GeStock"

echo [3/5] Creation regle HTTPS entrante (port %HTTPS_PORT%)...
netsh advfirewall firewall add rule ^
    name="%APP_NAME% - HTTPS Inbound" ^
    dir=in ^
    action=allow ^
    protocol=TCP ^
    localport=%HTTPS_PORT% ^
    profile=any ^
    description="Autorise les connexions HTTPS entrantes vers GeStock (via reverse proxy)"

echo [4/5] Autorisation Node.js dans le pare-feu...
netsh advfirewall firewall add rule ^
    name="Node.js - GeStock" ^
    dir=in ^
    action=allow ^
    program="C:\Program Files\nodejs\node.exe" ^
    enable=yes ^
    profile=any ^
    description="Autorise Node.js pour l'application GeStock"

echo [5/5] Verification des regles creees...
echo.
netsh advfirewall firewall show rule name="%APP_NAME% - HTTP Inbound"

echo.
echo ========================================
echo Configuration terminee avec succes!
echo ========================================
echo.
echo Regles creees:
echo   - HTTP  (port %HTTP_PORT%) : Entrant et Sortant
echo   - HTTPS (port %HTTPS_PORT%): Entrant
echo   - Node.js autorise
echo.
echo L'application est maintenant accessible:
echo   - En local:  http://localhost:%HTTP_PORT%
echo   - A distance: http://[IP-SERVEUR]:%HTTP_PORT%
echo.
echo Pour obtenir votre IP locale:
echo   ipconfig ^| findstr IPv4
echo.
echo IMPORTANT:
echo - Configurez votre routeur pour le port forwarding
echo - Utilisez un reverse proxy (IIS/Nginx) pour HTTPS
echo.
pause
