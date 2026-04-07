@echo off
title Creando Ejecutable de Jueguito...
color 0b

echo ===================================================
echo    CONVIRTIENDO TU JUEGO EN .EXE (ELECTRON)
echo ===================================================
echo.
echo 1. Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] No se detecto Node.js.
    echo Por favor instala Node.js desde https://nodejs.org/
    echo y vuelve a ejecutar este archivo.
    pause
    exit
)
echo [OK] Node.js detectado.
echo.

echo 2. Instalando herramientas necesarias (Electron)...
echo    Esto puede tardar unos minutos si es la primera vez.
call npm install
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Hubo un problema instalando las dependencias.
    pause
    exit
)
echo [OK] Herramientas instaladas.
echo.

echo 3. Empaquetando el juego en un archivo .EXE...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Hubo un fallo al crear el ejecutable.
    pause
    exit
)

echo.
echo ===================================================
echo    !EXITO! JUEGO CREADO CORRECTAMENTE
echo ===================================================
echo.
echo Busca la carpeta llamada "Jueguito-win32-x64"
echo Dentro encontraras "Jueguito.exe".
echo.
pause
