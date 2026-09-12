@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title SC Central V6 - GitHub + Supabase + Vercel

set "REPO_URL=https://github.com/joaopaulo2157/sc-central-supermercado.git"
set "PROJECT_NAME=sc-central-supermercado"
set "VERCEL_SCOPE=joaopaulo2157s-projects"
set "WORK=%TEMP%\sc-central-vercel-v6-%RANDOM%-%RANDOM%"
set "REPO=%WORK%\repo"

cls
echo ================================================================
echo   SC SUPERMERCADO CENTRAL V6 - PUBLICAR NA VERCEL
echo   GitHub + Supabase PostgreSQL + Vercel
echo ================================================================
echo.
echo Este processo usa o codigo oficial do GitHub, configura a conexao
echo PostgreSQL do Supabase e publica o projeto na Vercel.
echo.
echo Nao existe codigo 2FA nesta versao.
echo O primeiro administrador sera criado depois em /admin/setup.
echo.
echo Antes de continuar, tenha em maos a DATABASE_URL do
echo Transaction Pooler do projeto Supabase sc-central-supermercado.
echo.
echo ================================================================
echo.

where git.exe >nul 2>&1 || goto :NO_GIT
where node.exe >nul 2>&1 || goto :NO_NODE
where npm.cmd >nul 2>&1 || goto :NO_NPM
where powershell.exe >nul 2>&1 || goto :NO_PS

mkdir "%WORK%" >nul 2>&1
if not exist "%WORK%" goto :FAIL

echo [1/8] Baixando a versao oficial do GitHub...
git clone --depth 1 "%REPO_URL%" "%REPO%"
if errorlevel 1 goto :FAIL

pushd "%REPO%" >nul

echo.
echo [2/8] Verificando Vercel CLI...
call npx --yes vercel@latest --version
if errorlevel 1 (popd >nul & goto :FAIL)

echo.
echo [3/8] Verificando login na Vercel...
call npx --yes vercel@latest whoami >nul 2>&1
if errorlevel 1 (
  call npx --yes vercel@latest login
  if errorlevel 1 (popd >nul & goto :FAIL)
)

echo.
echo [4/8] Criando/vinculando o projeto Vercel...
call npx --yes vercel@latest link --yes --project "%PROJECT_NAME%" --scope "%VERCEL_SCOPE%"
if errorlevel 1 (
  echo Projeto ainda nao existe. Tentando criar...
  call npx --yes vercel@latest project add "%PROJECT_NAME%" --scope "%VERCEL_SCOPE%"
  if errorlevel 1 (popd >nul & goto :FAIL)
  call npx --yes vercel@latest link --yes --project "%PROJECT_NAME%" --scope "%VERCEL_SCOPE%"
  if errorlevel 1 (popd >nul & goto :FAIL)
)

echo.
echo [5/8] Conectando o projeto Vercel ao GitHub...
call npx --yes vercel@latest git connect
if errorlevel 1 (
  echo.
  echo [AVISO] A conexao Git automatica nao foi concluida.
  echo O deploy por CLI continuara normalmente. Depois voce pode conectar
echo o repositorio pelo painel Vercel em Settings / Git.
  echo.
)

echo.
echo [6/8] Configurando DATABASE_URL do Supabase...
set "PSFILE=%TEMP%\sc-central-vercel-db-%RANDOM%-%RANDOM%.ps1"
> "%PSFILE%" echo $ErrorActionPreference='Stop'
>>"%PSFILE%" echo $secure=Read-Host 'Cole a DATABASE_URL do Transaction Pooler do Supabase' -AsSecureString
>>"%PSFILE%" echo $ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
>>"%PSFILE%" echo try{$url=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
>>"%PSFILE%" echo if([string]::IsNullOrWhiteSpace($url) -or $url -notmatch '^postgres(ql)?://'){throw 'DATABASE_URL invalida.'}
>>"%PSFILE%" echo cmd /c "npx --yes vercel@latest env rm DATABASE_URL production --yes 2^>nul" ^| Out-Null
>>"%PSFILE%" echo $url ^| ^& npx --yes vercel@latest env add DATABASE_URL production --sensitive
>>"%PSFILE%" echo if($LASTEXITCODE -ne 0){throw 'Falha ao configurar DATABASE_URL em production.'}
>>"%PSFILE%" echo cmd /c "npx --yes vercel@latest env rm DATABASE_URL preview --yes 2^>nul" ^| Out-Null
>>"%PSFILE%" echo $url ^| ^& npx --yes vercel@latest env add DATABASE_URL preview --sensitive
>>"%PSFILE%" echo if($LASTEXITCODE -ne 0){throw 'Falha ao configurar DATABASE_URL em preview.'}
>>"%PSFILE%" echo $url=$null
powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%"
set "PSRESULT=%ERRORLEVEL%"
if exist "%PSFILE%" del /f /q "%PSFILE%" >nul 2>&1
if not "%PSRESULT%"=="0" (popd >nul & goto :FAIL)

echo.
echo [7/8] Configurando limite de conexoes...
call npx --yes vercel@latest env rm DB_CONNECTION_LIMIT production --yes >nul 2>&1
echo 5| call npx --yes vercel@latest env add DB_CONNECTION_LIMIT production
if errorlevel 1 (popd >nul & goto :FAIL)
call npx --yes vercel@latest env rm DB_CONNECTION_LIMIT preview --yes >nul 2>&1
echo 5| call npx --yes vercel@latest env add DB_CONNECTION_LIMIT preview
if errorlevel 1 (popd >nul & goto :FAIL)

echo.
echo [8/8] Publicando em producao...
call npx --yes vercel@latest deploy --prod --yes
if errorlevel 1 (popd >nul & goto :FAIL)

popd >nul

echo.
echo ================================================================
echo   VERCEL PUBLICADA COM SUCESSO
echo ================================================================
echo.
echo Abra o endereco de producao mostrado acima e acesse:
echo.
echo   /admin/setup
echo.
echo Crie o PRIMEIRO administrador com nome, e-mail e senha.
echo Depois, o login normal sera somente e-mail + senha em /admin/login.
echo.
echo Nao existe campo 2FA.
echo.
echo Quando confirmar que a Vercel esta funcionando, o Railway pode ser
echo aposentado definitivamente.
echo.
if exist "%WORK%" rmdir /s /q "%WORK%" >nul 2>&1
pause
exit /b 0

:NO_GIT
echo [ERRO] Git nao encontrado.
goto :END
:NO_NODE
echo [ERRO] Node.js nao encontrado.
goto :END
:NO_NPM
echo [ERRO] npm nao encontrado.
goto :END
:NO_PS
echo [ERRO] PowerShell nao encontrado.
goto :END
:FAIL
echo.
echo [ERRO] A publicacao foi interrompida na etapa acima.
echo Pasta de diagnostico:
echo   %WORK%
:END
echo.
pause
exit /b 1
