@echo off
echo ========================================
echo    Git Setup for AI-DocGen Project
echo ========================================
echo.

echo 🔧 Setting up Git repository...
echo.

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding remote origin...
git remote add origin https://github.com/ideologas/Doctator.git

echo.
echo Step 3: Adding all files to staging...
git add .

echo.
echo Step 4: Creating initial commit...
git commit -m "Initial commit: AI-DocGen engine with core functionality"

echo.
echo Step 5: Setting up main branch...
git branch -M main

echo.
echo Step 6: Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Git setup completed!
echo Your project is now connected to:
echo https://github.com/ideologas/Doctator
echo ========================================
echo.
pause 