@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SC Supermercado Central V5.1 - Preparar Projeto

cls
echo ================================================================
echo   SC SUPERMERCADO CENTRAL V5.1 - PREPARACAO LOCAL
echo ================================================================
echo.

where node.exe >nul 2>&1 || goto :node_error
where npm.cmd >nul 2>&1 || goto :node_error

for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 22 (
  echo [ERRO] Node.js 22 ou superior e necessario.
  node --version
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install --no-audit --no-fund
if errorlevel 1 goto :error

echo.
echo [2/3] Verificando TypeScript...
call npm run typecheck
if errorlevel 1 goto :error

echo.
echo [3/3] Gerando build de producao...
call npm run build
if errorlevel 1 goto :error

echo.
echo ================================================================
echo   PROJETO V5.1 VALIDADO COM SUCESSO
echo ================================================================
echo.
pause
exit /b 0

:node_error
echo [ERRO] Node.js/npm nao encontrados. Instale o Node.js 22 ou superior.
pause
exit /b 1

:error
echo.
echo [ERRO] A preparacao foi interrompida na etapa acima.
pause
exit /b 1
