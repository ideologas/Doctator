@echo off
:: ========================================
echo    AI-DocGen AI Processing
:: ========================================
echo.

echo 🧹 Cleaning up previous generated docs...
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
echo 🚀 [Stage 2] Running AI-DocGen Engine...
node index.js
if errorlevel 1 (
    echo ❌ AI processing failed.
    pause
    exit /b 1
)
echo.
echo ========================================
echo AI processing completed!
echo Check the docs\generated folder for output.
echo ========================================
echo.
pause 