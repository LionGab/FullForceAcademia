# ============================================================================
# FullForce Academia - N8N Workflow Auto-Deployment (PowerShell)
# Complete automation for workflow deployment and configuration
# ============================================================================

param(
    [switch]$SkipChecks,
    [switch]$Force,
    [string]$ApiToken,
    [string]$WahaToken
)

# Set console encoding for proper emoji display
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration
$N8N_URL = "https://lionalpha.app.n8n.cloud"
$WORKFLOW_ID = "VGhKEfrpJU47onvi"
$WAHA_ENDPOINT = "https://waha.lionalpha.app/api/sendText"
$GOOGLE_SHEETS_ID = "1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo"

function Write-Header {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "          FullForce Academia - N8N Workflow Deployment" -ForegroundColor White
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Target N8N Instance: $N8N_URL" -ForegroundColor Green
    Write-Host "Target Workflow ID:  $WORKFLOW_ID" -ForegroundColor Green
    Write-Host "WAHA Endpoint:       $WAHA_ENDPOINT" -ForegroundColor Green
    Write-Host "Google Sheets:       $GOOGLE_SHEETS_ID" -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "Recommended version: Node.js 18.x or higher" -ForegroundColor Yellow
        return $false
    }

    # Check required files
    $requiredFiles = @{
        "config\google-service-account.json" = "Google Service Account"
        "n8n-workflows\complete-workflow-config.json" = "Workflow Configuration"
        "scripts\n8n-auto-deploy.js" = "Deployment Script"
        "scripts\setup-n8n-environment.js" = "Environment Setup Script"
    }

    foreach ($file in $requiredFiles.Keys) {
        if (Test-Path $file) {
            Write-Host "✅ $($requiredFiles[$file]) found" -ForegroundColor Green
        } else {
            Write-Host "❌ $($requiredFiles[$file]) missing: $file" -ForegroundColor Red
            return $false
        }
    }

    return $true
}

function Setup-Environment {
    Write-Host ""
    Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow

    if (-not (Test-Path ".env.n8n") -or $Force) {
        Write-Host "📝 Creating N8N environment configuration..." -ForegroundColor Cyan
        $result = & node scripts\setup-n8n-environment.js

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Environment setup failed" -ForegroundColor Red
            return $false
        }
        Write-Host "✅ Environment configuration created" -ForegroundColor Green
    } else {
        Write-Host "✅ Environment configuration exists" -ForegroundColor Green
    }

    return $true
}

function Test-EnvironmentConfiguration {
    Write-Host ""
    Write-Host "🔑 Checking environment configuration..." -ForegroundColor Yellow

    if (-not (Test-Path ".env.n8n")) {
        Write-Host "❌ Environment file .env.n8n not found" -ForegroundColor Red
        return $false
    }

    $envContent = Get-Content ".env.n8n" -Raw

    # Check N8N API Token
    if ($envContent -match "N8N_API_TOKEN=your-n8n-api-token-here" -and -not $ApiToken) {
        Write-Host "⚠️ N8N API Token not configured in .env.n8n" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMPORTANT: You need to configure your N8N API Token" -ForegroundColor Red
        Write-Host "1. Visit: $N8N_URL/settings/api" -ForegroundColor Cyan
        Write-Host "2. Generate an API token" -ForegroundColor Cyan
        Write-Host "3. Edit .env.n8n and replace 'your-n8n-api-token-here' with your token" -ForegroundColor Cyan
        Write-Host ""

        if (-not $Force) {
            $continue = Read-Host "Would you like to continue anyway? (Y/N)"
            if ($continue -ne "Y" -and $continue -ne "y") {
                Write-Host "Deployment cancelled." -ForegroundColor Yellow
                return $false
            }
        }
    }

    # Check WAHA Token
    if ($envContent -match "WAHA_TOKEN=your-waha-token-here" -and -not $WahaToken) {
        Write-Host "⚠️ WAHA Token not configured in .env.n8n" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMPORTANT: You need to configure your WAHA token for WhatsApp integration" -ForegroundColor Red
        Write-Host "1. Check your WAHA instance dashboard" -ForegroundColor Cyan
        Write-Host "2. Edit .env.n8n and replace 'your-waha-token-here' with your token" -ForegroundColor Cyan
        Write-Host ""
    }

    return $true
}

function Deploy-Workflow {
    Write-Host ""
    Write-Host "🚀 Starting workflow deployment..." -ForegroundColor Green
    Write-Host ""

    # Set environment variables if provided
    if ($ApiToken) {
        $env:N8N_API_TOKEN = $ApiToken
    }
    if ($WahaToken) {
        $env:WAHA_TOKEN = $WahaToken
    }

    # Run deployment
    $result = & node scripts\n8n-auto-deploy.js

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host "                    DEPLOYMENT FAILED" -ForegroundColor Red
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues and solutions:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. N8N API TOKEN ISSUES:" -ForegroundColor Cyan
        Write-Host "   - Visit: $N8N_URL/settings/api" -ForegroundColor White
        Write-Host "   - Generate a new API token" -ForegroundColor White
        Write-Host "   - Update .env.n8n with the token" -ForegroundColor White
        Write-Host ""
        Write-Host "2. WAHA TOKEN ISSUES:" -ForegroundColor Cyan
        Write-Host "   - Check your WAHA instance is running" -ForegroundColor White
        Write-Host "   - Verify your WAHA token is correct" -ForegroundColor White
        Write-Host "   - Update .env.n8n with the correct token" -ForegroundColor White
        Write-Host ""
        Write-Host "3. GOOGLE SERVICE ACCOUNT ISSUES:" -ForegroundColor Cyan
        Write-Host "   - Verify config\google-service-account.json exists" -ForegroundColor White
        Write-Host "   - Check the service account has access to the spreadsheet" -ForegroundColor White
        Write-Host "   - Ensure proper permissions are set" -ForegroundColor White
        Write-Host ""
        Write-Host "4. NETWORK CONNECTIVITY:" -ForegroundColor Cyan
        Write-Host "   - Check internet connection" -ForegroundColor White
        Write-Host "   - Verify N8N cloud instance is accessible" -ForegroundColor White
        Write-Host "   - Check firewall settings" -ForegroundColor White
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative options:" -ForegroundColor Yellow
        Write-Host "1. Browser automation: scripts\n8n-browser-automation.js" -ForegroundColor Cyan
        Write-Host "2. Manual deployment using N8N web interface" -ForegroundColor Cyan
        Write-Host ""
        return $false
    } else {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "                  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Workflow deployed and configured" -ForegroundColor Green
        Write-Host "✅ Google Sheets integration active" -ForegroundColor Green
        Write-Host "✅ WAHA WhatsApp integration configured" -ForegroundColor Green
        Write-Host "✅ Workflow activated and ready" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Visit N8N dashboard: $N8N_URL" -ForegroundColor Cyan
        Write-Host "2. Navigate to workflow: $WORKFLOW_ID" -ForegroundColor Cyan
        Write-Host "3. Monitor execution logs" -ForegroundColor Cyan
        Write-Host "4. Test with real data when ready" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Campaign targeting: ~650 inactive users" -ForegroundColor Magenta
        Write-Host "Expected ROI: 11,700%" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        return $true
    }
}

function Open-Dashboard {
    Write-Host ""
    if (-not $Force) {
        $openBrowser = Read-Host "Would you like to open N8N dashboard in browser? (Y/N)"
        if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
            Write-Host "🌐 Opening N8N dashboard..." -ForegroundColor Cyan
            Start-Process "$N8N_URL/workflow/$WORKFLOW_ID"
        }
    }
}

# Main execution
try {
    Write-Header

    if (-not $SkipChecks) {
        if (-not (Test-Prerequisites)) {
            exit 1
        }

        if (-not (Setup-Environment)) {
            exit 1
        }

        if (-not (Test-EnvironmentConfiguration)) {
            exit 1
        }
    }

    if (Deploy-Workflow) {
        Open-Dashboard
        Write-Host ""
        Write-Host "Deployment script completed successfully." -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "Deployment script completed with errors." -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host ""
    Write-Host "💥 Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}