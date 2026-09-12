@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title SC Central V6 - Supabase + Vercel

echo ================================================================
echo   SC SUPERMERCADO CENTRAL V6 - PREPARACAO
echo   GitHub + Supabase + Vercel
echo ================================================================
echo.

echo [1/4] Verificando Node.js...
where node >nul 2>&1 || goto :NO_NODE
node -v

echo.
echo [2/4] Instalando dependencias...
call npm install --no-audit --no-fund
if errorlevel 1 goto :FAIL

echo.
echo [3/4] Verificando TypeScript...
call npm run typecheck
if errorlevel 1 goto :FAIL

echo.
echo [4/4] Gerando build de producao...
call npm run build
if errorlevel 1 goto :FAIL

echo.
echo ================================================================
echo   PROJETO V6 VALIDADO COM SUCESSO
echo ================================================================
echo.
echo Proximo passo: configurar DATABASE_URL do Supabase na Vercel.
echo.
pause
exit /b 0

:NO_NODE
echo [ERRO] Node.js nao encontrado.
pause
exit /b 1

:FAIL
echo.
echo [ERRO] A preparacao foi interrompida na etapa acima.
pause
exit /b 1
