@echo off
title Construyendo con Icono Forzado...
color 0a

echo ===================================================
echo    CONSTRUCCION FORZADA DE ICONO
echo ===================================================
echo.
echo Usando ruta absoluta para el icono:
echo "%~dp0assets\icon.ico"
echo.

if not exist "%~dp0assets\icon.ico" (
    color 0c
    echo [ERROR] No encuentro el archivo icon.ico en la carpeta assets!
    echo Asegurate de que esta ahi.
    pause
    exit
)

echo Ejecutando Electron Packager directamente...
call "node_modules\.bin\electron-packager" . "Jueguito" --platform=win32 --arch=x64 --overwrite --icon="%~dp0assets\icon.ico" --win32metadata.requested-execution-level=asInvoker

if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] Fallo la construccion.
    pause
    exit
)

echo.
echo ===================================================
echo    !HECHO!
echo ===================================================
echo.
echo Prueba a abrir la carpeta Jueguito-win32-x64 ahora.
echo IMPORTANTE: Si sigues sin ver el icono, MUEVE la carpeta
echo "Jueguito-win32-x64" al Escritorio o a otro sitio.
echo (Windows a veces se "bugea" y no actualiza la vista).
echo.
pause
