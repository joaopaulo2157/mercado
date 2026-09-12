@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title SC Central V6 - Publicar no GitHub

set "REPO_URL=https://github.com/joaopaulo2157/sc-central-supermercado.git"
set "BRANCH=main"
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ZIP=SC_SUPERMERCADO_CENTRAL_V6_SUPABASE_VERCEL.zip"

cls
echo ================================================================
echo   SC SUPERMERCADO CENTRAL V6 - PUBLICAR NO GITHUB
echo   Supabase + Vercel
echo ================================================================
echo.
echo Repositorio:
echo   %REPO_URL%
echo.
echo Este processo preserva o historico, cria backup e NAO envia .env.
echo.

if not exist "%SCRIPT_DIR%%PROJECT_ZIP%" (
  echo [ERRO] Coloque este BAT na mesma pasta de:
  echo   %PROJECT_ZIP%
  echo.
  pause
  exit /b 1
)

where git.exe >nul 2>&1 || goto :NO_GIT
where powershell.exe >nul 2>&1 || goto :NO_PS
where robocopy.exe >nul 2>&1 || goto :NO_ROBO

set /p "CONF=Digite PUBLICAR para continuar: "
if /I not "%CONF%"=="PUBLICAR" (
  echo Operacao cancelada.
  pause
  exit /b 0
)

for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"
set "WORK=%TEMP%\sc-v6-github-%STAMP%-%RANDOM%"
set "REPO=%WORK%\repo"
set "SRC=%WORK%\src"
set "ROOTFILE=%WORK%\root.txt"
set "BACKUPS=%SCRIPT_DIR%BACKUPS_GITHUB"
set "BACKUP=%BACKUPS%\SC_CENTRAL_ANTES_V6_%STAMP%.zip"

mkdir "%WORK%" >nul 2>&1
if not exist "%WORK%" goto :FAIL
if not exist "%BACKUPS%" mkdir "%BACKUPS%" >nul 2>&1

set "GIT_PAGER=cat"
set "PAGER=cat"

echo.
echo [1/6] Clonando versao atual...
git clone --branch "%BRANCH%" --single-branch "%REPO_URL%" "%REPO%"
if errorlevel 1 goto :FAIL

echo.
echo [2/6] Criando backup...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Compress-Archive -Path '%REPO%\*' -DestinationPath '%BACKUP%' -Force"
if errorlevel 1 goto :FAIL

echo.
echo [3/6] Extraindo V6...
mkdir "%SRC%" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath '%SCRIPT_DIR%%PROJECT_ZIP%' -DestinationPath '%SRC%' -Force"
if errorlevel 1 goto :FAIL

powershell -NoProfile -ExecutionPolicy Bypass -Command "$p=Get-ChildItem -LiteralPath '%SRC%' -Filter package.json -File -Recurse | Where-Object {$_.FullName -notmatch '\\node_modules\\'} | Sort-Object {$_.FullName.Length} | Select-Object -First 1; if(!$p){exit 2}; [IO.File]::WriteAllText('%ROOTFILE%', $p.Directory.FullName)"
if errorlevel 1 goto :FAIL
set /p "PROJECT_ROOT="<"%ROOTFILE%"
if not exist "%PROJECT_ROOT%\package.json" goto :FAIL

echo.
echo [4/6] Sincronizando arquivos...
robocopy "%PROJECT_ROOT%" "%REPO%" /MIR /XD ".git" ".github" "node_modules" ".next" ".vercel" "BACKUPS_GITHUB" /XF ".env" ".env.local" ".env.production" ".env.development" ".env.production.local" ".env.development.local" "tsconfig.tsbuildinfo" /R:2 /W:1 >nul
if errorlevel 8 goto :FAIL

if exist "%REPO%\.env" del /q "%REPO%\.env" >nul 2>&1
if exist "%REPO%\.env.local" del /q "%REPO%\.env.local" >nul 2>&1
if exist "%REPO%\.vercel" rmdir /s /q "%REPO%\.vercel" >nul 2>&1
if exist "%REPO%\.next" rmdir /s /q "%REPO%\.next" >nul 2>&1
if exist "%REPO%\node_modules" rmdir /s /q "%REPO%\node_modules" >nul 2>&1

pushd "%REPO%" >nul
echo.
echo [5/6] Criando commit...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo Nenhuma alteracao nova para enviar.
  popd >nul
  goto :SUCCESS
)
git --no-pager diff --cached --stat
git commit -m "feat: migra SC Central V6 para Supabase e Vercel"
if errorlevel 1 (
  popd >nul
  goto :FAIL
)

echo.
echo [6/6] Enviando para GitHub...
git push origin "%BRANCH%"
if errorlevel 1 (
  popd >nul
  goto :FAIL
)
popd >nul

:SUCCESS
echo.
echo ================================================================
echo   GITHUB ATUALIZADO COM A V6
echo ================================================================
echo.
echo Repositorio:
echo   https://github.com/joaopaulo2157/sc-central-supermercado
echo.
echo Backup anterior:
echo   %BACKUP%
echo.
echo Proximo passo: importar/conectar esse repositorio na Vercel.
echo.
if exist "%WORK%" rmdir /s /q "%WORK%" >nul 2>&1
pause
exit /b 0

:NO_GIT
echo [ERRO] Git nao encontrado.
goto :ENDFAIL
:NO_PS
echo [ERRO] PowerShell nao encontrado.
goto :ENDFAIL
:NO_ROBO
echo [ERRO] Robocopy nao encontrado.
goto :ENDFAIL
:FAIL
echo.
echo [ERRO] Publicacao interrompida. Nenhum force push foi usado.
echo Pasta temporaria:
echo   %WORK%
:ENDFAIL
echo.
pause
exit /b 1
