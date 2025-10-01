#!/usr/bin/env node

/**
 * FullForce Academia - N8N Environment Setup Script
 * Automatically configures environment variables and credentials
 */

const fs = require('fs');
const path = require('path');

class N8NEnvironmentSetup {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.envFilePath = path.join(this.projectRoot, '.env.n8n');
        this.googleServiceAccountPath = path.join(this.projectRoot, 'config', 'google-service-account.json');
    }

    /**
     * Load Google Service Account for validation
     */
    loadGoogleServiceAccount() {
        try {
            if (fs.existsSync(this.googleServiceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(this.googleServiceAccountPath, 'utf8'));
                console.log('✅ Google Service Account loaded successfully');
                console.log(`   Project ID: ${serviceAccount.project_id}`);
                console.log(`   Client Email: ${serviceAccount.client_email}`);
                return serviceAccount;
            } else {
                console.warn('⚠️ Google Service Account file not found');
                return null;
            }
        } catch (error) {
            console.error('❌ Error loading Google Service Account:', error.message);
            return null;
        }
    }

    /**
     * Generate comprehensive N8N environment configuration
     */
    generateN8NEnvironment() {
        const serviceAccount = this.loadGoogleServiceAccount();

        const envConfig = `# ============================================================================
# FullForce Academia - N8N Production Environment Configuration
# Generated automatically for workflow deployment
# ============================================================================

# N8N Cloud Configuration
N8N_URL=https://lionalpha.app.n8n.cloud
N8N_API_TOKEN=your-n8n-api-token-here

# IMPORTANT: Get your API token from:
# https://lionalpha.app.n8n.cloud/settings/api

# Workflow Configuration
N8N_WORKFLOW_ID=VGhKEfrpJU47onvi
N8N_WORKFLOW_NAME="Reativação Inativos FullForce"

# WAHA WhatsApp API Configuration
WAHA_URL=https://waha.lionalpha.app
WAHA_API_URL=https://waha.lionalpha.app/api/sendText
WAHA_SESSION_NAME=default
WAHA_TOKEN=your-waha-token-here

# IMPORTANT: Get your WAHA token from your WAHA instance dashboard

# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo
GOOGLE_SHEET_INATIVOS=Inativos
GOOGLE_SHEET_RESULTADOS=Resultados

# Google Service Account (loaded from config/google-service-account.json)
${serviceAccount ? `GOOGLE_PROJECT_ID=${serviceAccount.project_id}
GOOGLE_CLIENT_EMAIL=${serviceAccount.client_email}
GOOGLE_PRIVATE_KEY_ID=${serviceAccount.private_key_id}` : '# Google Service Account not found - please check config/google-service-account.json'}

# Campaign Configuration - Target: 650 Inactive Users
CAMPAIGN_TARGET_USERS=650
CAMPAIGN_ROI_TARGET=11700
CAMPAIGN_CONVERSION_RATE_CRITICOS=0.35
CAMPAIGN_CONVERSION_RATE_ALTA=0.25
CAMPAIGN_CONVERSION_RATE_MEDIA=0.15

# Message Templates
TEMPLATE_CRITICA_DISCOUNT=50
TEMPLATE_ALTA_DISCOUNT=40
TEMPLATE_MEDIA_DISCOUNT=30

# Automation Settings
AUTO_DEPLOY_ENABLED=true
AUTO_ACTIVATE_WORKFLOW=true
AUTO_RUN_TESTS=true

# Rate Limiting and Performance
MAX_MESSAGES_PER_MINUTE=60
BATCH_SIZE=50
DELAY_BETWEEN_BATCHES=30000

# Monitoring and Logging
LOG_LEVEL=info
ENABLE_DETAILED_LOGGING=true
WEBHOOK_MONITORING_ENABLED=true

# Security
WEBHOOK_SECRET=your-webhook-secret-here
API_RATE_LIMIT=1000

# Testing Configuration
TEST_MODE=false
TEST_PHONE_NUMBER=5511999999999
DRY_RUN_MODE=false

# ============================================================================
# Deployment Instructions:
#
# 1. Update N8N_API_TOKEN with your actual API token
# 2. Update WAHA_TOKEN with your WAHA instance token
# 3. Verify Google Service Account file exists at config/google-service-account.json
# 4. Run: node scripts/n8n-auto-deploy.js
#
# ============================================================================`;

        return envConfig;
    }

    /**
     * Create updated workflow configuration with real credentials
     */
    generateWorkflowWithCredentials() {
        const serviceAccount = this.loadGoogleServiceAccount();

        if (!serviceAccount) {
            console.error('❌ Cannot generate workflow - Google Service Account required');
            return null;
        }

        const workflowConfigPath = path.join(this.projectRoot, 'n8n-workflows', 'complete-workflow-config.json');

        if (!fs.existsSync(workflowConfigPath)) {
            console.error('❌ Workflow config file not found');
            return null;
        }

        const workflowConfig = JSON.parse(fs.readFileSync(workflowConfigPath, 'utf8'));

        // Update Google Service Account in nodes
        workflowConfig.nodes.forEach(node => {
            if (node.type === 'n8n-nodes-base.googleSheets' && node.parameters.authentication === 'serviceAccount') {
                node.parameters.serviceAccount = {
                    type: serviceAccount.type,
                    project_id: serviceAccount.project_id,
                    private_key_id: serviceAccount.private_key_id,
                    private_key: serviceAccount.private_key,
                    client_email: serviceAccount.client_email,
                    client_id: serviceAccount.client_id,
                    auth_uri: serviceAccount.auth_uri,
                    token_uri: serviceAccount.token_uri,
                    auth_provider_x509_cert_url: serviceAccount.auth_provider_x509_cert_url,
                    client_x509_cert_url: serviceAccount.client_x509_cert_url
                };
                console.log(`✅ Updated credentials for node: ${node.name}`);
            }
        });

        // Update WAHA endpoint
        const whatsappNode = workflowConfig.nodes.find(node => node.id === 'whatsapp_send');
        if (whatsappNode) {
            whatsappNode.parameters.url = 'https://waha.lionalpha.app/api/sendText';
            whatsappNode.parameters.httpHeaderAuth = {
                name: 'Authorization',
                value: 'Bearer ${WAHA_TOKEN}'
            };
        }

        return workflowConfig;
    }

    /**
     * Create deployment batch script for Windows
     */
    generateBatchScript() {
        const batchScript = `@echo off
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

pause`;

        return batchScript;
    }

    /**
     * Setup complete environment
     */
    setup() {
        console.log('🔧 Setting up N8N environment...');

        try {
            // Generate environment configuration
            const envConfig = this.generateN8NEnvironment();
            fs.writeFileSync(this.envFilePath, envConfig);
            console.log(`✅ Environment file created: ${this.envFilePath}`);

            // Generate updated workflow with credentials
            const workflowWithCredentials = this.generateWorkflowWithCredentials();
            if (workflowWithCredentials) {
                const outputPath = path.join(this.projectRoot, 'n8n-workflows', 'production-workflow-config.json');
                fs.writeFileSync(outputPath, JSON.stringify(workflowWithCredentials, null, 2));
                console.log(`✅ Production workflow config created: ${outputPath}`);
            }

            // Generate batch deployment script
            const batchScript = this.generateBatchScript();
            const batchPath = path.join(this.projectRoot, 'deploy-n8n-workflow.bat');
            fs.writeFileSync(batchPath, batchScript);
            console.log(`✅ Deployment batch script created: ${batchPath}`);

            console.log('\n📋 Setup completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Edit .env.n8n and add your N8N_API_TOKEN and WAHA_TOKEN');
            console.log('2. Run: deploy-n8n-workflow.bat');
            console.log('3. Or run directly: node scripts/n8n-auto-deploy.js');

            return true;

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const setup = new N8NEnvironmentSetup();
    const success = setup.setup();
    process.exit(success ? 0 : 1);
}

module.exports = N8NEnvironmentSetup;