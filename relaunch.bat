@echo off
echo ========================================
echo    AI-DocGen Engine Relauncher
echo ========================================
echo.

echo 🧹 Cleaning up previous runs...
if exist "docs\generated" (
    echo Removing previous generated docs...
    rmdir /s /q "docs\generated"
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
echo 🚀 Starting AI-DocGen Engine...
echo ========================================
echo.

node index.js

echo.
echo ========================================
echo Engine execution completed!
echo Check the docs\generated folder for output.
echo ========================================
echo.
pause 