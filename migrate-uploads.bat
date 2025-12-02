@echo off
echo ========================================
echo   Migration des Uploads Existants
echo ========================================
echo.
echo Ce script migre les fichiers de public/uploads vers C:\gestock\uploads
echo.
pause

echo [1/3] Verification dossier source...
if not exist public\uploads (
    echo ATTENTION: Dossier public\uploads introuvable
    echo Aucune migration necessaire
    pause
    exit /b 0
)

echo [2/3] Creation dossier destination...
if not exist C:\gestock\uploads mkdir C:\gestock\uploads

echo [3/3] Copie des fichiers...
xcopy /E /I /Y public\uploads\* C:\gestock\uploads\
if errorlevel 1 (
    echo ERREUR: Copie echouee
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Migration terminee avec succes!
echo ========================================
echo.
echo Fichiers copies vers: C:\gestock\uploads
echo.
echo IMPORTANT: Les anciens fichiers dans public\uploads
echo peuvent maintenant etre supprimes si necessaire.
echo.
pause
