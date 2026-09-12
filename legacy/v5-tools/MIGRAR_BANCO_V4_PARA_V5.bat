@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title SC Supermercado Central V5 - Migrar Banco

cls
echo ================================================================
echo   SC SUPERMERCADO CENTRAL - MIGRACAO V4 PARA V5
echo ================================================================
echo.
echo Esta migracao adiciona somente a camada de seguranca V5:
echo   - bloqueio de tentativas administrativas
echo   - senha individual da equipe
echo   - campos de 2FA TOTP
echo.
echo Produtos, pedidos, clientes e configuracoes NAO serao apagados.
echo.

where mysql.exe >nul 2>&1
if errorlevel 1 (
  echo [ERRO] mysql.exe nao foi encontrado no PATH.
  echo Use o phpMyAdmin para importar:
  echo   database\migrations\V5_SECURITY.sql
  echo.
  pause
  exit /b 1
)

set /p "DB_HOST=Host MySQL [127.0.0.1]: "
if not defined DB_HOST set "DB_HOST=127.0.0.1"
set /p "DB_PORT=Porta [3306]: "
if not defined DB_PORT set "DB_PORT=3306"
set /p "DB_USER=Usuario MySQL: "
set /p "DB_NAME=Nome do banco: "

if not defined DB_USER goto :missing
if not defined DB_NAME goto :missing

set "SQL_FILE=%~dp0database\migrations\V5_SECURITY.sql"
if not exist "%SQL_FILE%" (
  echo [ERRO] Arquivo de migracao nao encontrado:
  echo   %SQL_FILE%
  pause
  exit /b 1
)

echo.
echo O cliente MySQL solicitara a senha do banco sem grava-la neste arquivo.
echo.
mysql.exe -h "%DB_HOST%" -P "%DB_PORT%" -u "%DB_USER%" -p "%DB_NAME%" < "%SQL_FILE%"
if errorlevel 1 (
  echo.
  echo [ERRO] A migracao nao foi concluida.
  echo Confira host, usuario, senha, banco e permissoes ALTER/CREATE.
  pause
  exit /b 1
)

echo.
echo ================================================================
echo   MIGRACAO V5 CONCLUIDA COM SUCESSO
echo ================================================================
echo.
pause
exit /b 0

:missing
echo.
echo [ERRO] Usuario e nome do banco sao obrigatorios.
pause
exit /b 1
