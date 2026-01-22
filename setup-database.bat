@echo off
title Buckshot Roulette - Setup Database
echo ==========================================
echo  BUCKSHOT ROULETTE - DATABASE SETUP
echo ==========================================
echo.

REM Tentar encontrar MySQL no PATH ou em locais comuns
set MYSQL_CMD=mysql
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set MYSQL_CMD="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    ) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" (
        set MYSQL_CMD="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    ) else if exist "C:\xampp\mysql\bin\mysql.exe" (
        set MYSQL_CMD="C:\xampp\mysql\bin\mysql.exe"
    ) else if exist "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" (
        set MYSQL_CMD="C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
    ) else (
        echo ERRO: MySQL nao encontrado!
        echo.
        echo Por favor, crie o banco manualmente:
        echo   1. Abra o MySQL Workbench ou phpMyAdmin
        echo   2. Execute: CREATE DATABASE buckshot_roulette;
        echo   3. Depois rode: cd src\server ^&^& npx prisma db push
        echo.
        pause
        exit /b 1
    )
)

set /p MYSQL_PASSWORD="Digite sua senha do MySQL (root): "

echo.
echo [1/2] Criando banco de dados...
%MYSQL_CMD% -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS buckshot_roulette;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Falha ao criar banco de dados!
    echo Verifique se o MySQL esta rodando e a senha esta correta.
    pause
    exit /b 1
)

echo Banco 'buckshot_roulette' criado com sucesso!
echo.

echo [2/3] Instalando dependencias do servidor...
cd /d "%~dp0src\server"
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [3/3] Criando tabelas com Prisma...
call npm run db:push

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Falha ao criar tabelas!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  SETUP CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
echo Agora voce pode rodar:
echo   - start-server.bat
echo   - start-client.bat
echo.
pause
