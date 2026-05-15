@echo off
echo.
echo ==========================================
echo   Hotel Offer Orchestrator - Windows
echo ==========================================
echo.

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js is not installed!
  echo.
  echo   1. Go to https://nodejs.org
  echo   2. Download the LTS version
  echo   3. Install it, then run this file again
  echo.
  pause
  exit /b 1
)

echo [OK] Node.js:
node -v

:: Install dependencies
if not exist "node_modules" (
  echo.
  echo [SETUP] Running npm install - please wait...
  npm install --no-audit --force
  if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm install failed. Check your internet connection.
    pause
    @REM exit /b 1
  )
  echo [OK] Dependencies installed
)

:: Build TypeScript
echo.
echo [BUILD] Compiling TypeScript...
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Build failed! Trying ts-node fallback...
  echo.
  goto :run_tsnode
)
echo [OK] Server Build successful.

@REM :: Check Redis (just info, never blocks)
@REM echo.
@REM memurai-cli ping >nul 2>&1
@REM if %errorlevel% equ 0 (
@REM   echo [OK] Redis is running - caching enabled
@REM ) else (
@REM   echo [INFO] Redis not running - app works fine without it
@REM )

:: Check Memurai (just info, never blocks)
echo.
echo Checking Memurai...

sc query Memurai | find "RUNNING" >nul

if %errorlevel% equ 0 (
    echo [OK] Memurai service is running
    
    memurai-cli ping >nul 2>&1
    
    if %errorlevel% equ 0 (
        echo [OK] Cache responding correctly
    ) else (
        echo [WARN] Service running but ping failed
    )
) else (
    echo [INFO] Memurai service is not running
)

echo.
echo ==========================================
echo   Server starting at http://localhost:3000
echo ==========================================
echo.
echo   Try these URLs in your browser or Postman:
echo   http://localhost:3000/supplierA/hotels
echo   http://localhost:3000/supplierB/hotels
echo   http://localhost:3000/api/hotels?city=delhi
echo   http://localhost:3000/health
echo.
echo   Press Ctrl+C to stop the server
echo.

node dist/index.js
goto :end

:run_tsnode
echo [INFO] Running via ts-node (slower start, but works)...
echo.
npx ts-node src/index.ts
goto :end

:end
echo.
echo Server stopped.
pause
