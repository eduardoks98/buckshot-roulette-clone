@echo off
title Buckshot Roulette - Client
cd /d "%~dp0src\client"

REM Instalar dependencias se nao existir node_modules
if not exist "node_modules" (
    echo Instalando dependencias do cliente...
    call npm install
    echo.
)

echo Starting Buckshot Roulette Client...
echo.
npm run dev -- --host
pause
