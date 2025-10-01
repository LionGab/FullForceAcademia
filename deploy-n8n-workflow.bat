@echo off
REM FullForce Academia - N8N Workflow Deployment
REM Run this script to deploy the workflow automatically

echo.
echo ================================================================
echo FullForce Academia - N8N Workflow Auto-Deployment
echo ================================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if environment file exists
if not exist ".env.n8n" (
    echo 📝 Creating environment configuration...
    node scripts/setup-n8n-environment.js
)

echo 📋 Environment configuration ready

REM Run the deployment
echo 🚀 Starting workflow deployment...
node scripts/n8n-auto-deploy.js

if errorlevel 1 (
    echo.
    echo ❌ Deployment failed! Check the error messages above.
    echo.
    echo Common issues:
    echo 1. N8N_API_TOKEN not set in .env.n8n
    echo 2. WAHA_TOKEN not configured
    echo 3. Google Service Account file missing
    echo 4. Network connectivity issues
    echo.
) else (
    echo.
    echo 🎉 Deployment completed successfully!
    echo.
    echo Next steps:
    echo 1. Check your N8N dashboard: https://lionalpha.app.n8n.cloud
    echo 2. Verify workflow is active
    echo 3. Monitor execution logs
    echo.
)

pause