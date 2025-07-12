@echo off
setlocal

:: ========================================
echo    AI-DocGen Chunk Generation
:: ========================================
echo.

echo 🚀 Changing to script directory...
cd /d "%~dp0"

echo 🧹 Cleaning up previous repo and chunks...
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
    echo ❌ Chunk generation failed.
    pause
    exit /b 1
)
echo.

echo ========================================
echo Chunk generation completed!
echo Check the chunks folder for output.
echo ========================================
echo.
pause
endlocal 