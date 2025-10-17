@echo off
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════╗
echo ║   Maps Scraper Pro - Início Local      ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar Node.js
echo 🔍 Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo Instale em: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js instalado: %NODE_VERSION%
echo.

REM Verificar pastas
if not exist "backend" (
    echo ❌ Pasta backend não encontrada!
    pause
    exit /b 1
)
if not exist "frontend" (
    echo ❌ Pasta frontend não encontrada!
    pause
    exit /b 1
)

REM Instalar dependências
echo 📦 Verificando dependências...
echo.

if not exist "backend\node_modules" (
    echo 📥 Instalando dependências do backend...
    cd backend
    call npm install
    cd ..
    echo ✅ Backend instalado!
    echo.
) else (
    echo ✅ Backend já instalado
    echo.
)

if not exist "frontend\node_modules" (
    echo 📥 Instalando dependências do frontend...
    cd frontend
    call npm install
    cd ..
    echo ✅ Frontend instalado!
    echo.
) else (
    echo ✅ Frontend já instalado
    echo.
)

REM Matar processos nas portas se existirem
echo 🔍 Verificando portas...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo ⚠️  Matando processo na porta 3001...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo ⚠️  Matando processo na porta 5173...
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Portas disponíveis
echo.

REM Iniciar Backend
echo ════════════════════════════════════════
echo 🚀 Iniciando Backend (porta 3001)...
echo ════════════════════════════════════════
echo.

cd backend
start "Maps Scraper - Backend" cmd /k "node server.js"
cd ..

echo ✅ Backend iniciando...
timeout /t 5 /nobreak >nul

REM Iniciar Frontend
echo.
echo ════════════════════════════════════════
echo 🚀 Iniciando Frontend (porta 5173)...
echo ════════════════════════════════════════
echo.

cd frontend
start "Maps Scraper - Frontend" cmd /k "npm run dev"
cd ..

echo ✅ Frontend iniciando...
timeout /t 3 /nobreak >nul

REM Resumo
echo.
echo ╔════════════════════════════════════════╗
echo  ║       ✅ APLICAÇÃO INICIADA!         ║
echo ╚════════════════════════════════════════╝
echo.
echo 📊 Status:
echo    ✅ Backend:  http://localhost:3001
echo    ✅ Frontend: http://localhost:5173
echo.
echo 🌐 Acesse a aplicação:
echo    http://localhost:5173
echo.
echo 🧪 Testar API:
echo    curl http://localhost:3001/health
echo.
echo 🛑 Para parar: Feche as janelas do cmd ou execute stop-local.bat
echo.
echo Happy Coding! 🚀
echo.
pause