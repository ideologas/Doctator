@echo off

:: ========================================
echo    AI-DocGen Engine Relauncher
:: ========================================
echo.

echo 🧹 Cleaning up previous runs...
if exist "docs\generated" (
    echo Removing previous generated docs...
    rmdir /s /q "docs\generated"
)
if exist "my_project_repo" (
    echo Removing previous Git repository...
    rmdir /s /q "my_project_repo"
)
if exist "chunks" (
    echo Removing previous chunks...
    rmdir /s /q "chunks"
)
echo.
echo 🔍 Checking environment...
if not exist ".env" (
    echo ⚠️  Warning: .env file not found!
    echo Please create a .env file with your GEMINI_API_KEY
    echo Example: GEMINI_API_KEY=your_api_key_here
    echo.
    pause
    exit /b 1
)
echo.
echo 🚀 [Stage 1] Generating chunks from repo...
node generate-chunks.js
if errorlevel 1 (
    echo ❌ Stage 1 (chunk generation) failed. Aborting.
    pause
    exit /b 1
)
echo.
echo 🚀 [Stage 2] Running AI-DocGen Engine...
node index.js
if errorlevel 1 (
    echo ❌ Stage 2 (AI engine) failed.
    pause
    exit /b 1
)
echo.
echo ========================================
echo Engine execution completed!
echo Check the docs\generated folder for output.
echo ========================================
echo.
pause 