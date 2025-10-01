#!/usr/bin/env node

/**
 * FullForce Academia - Deployment Status Checker
 * Verifies the current state of N8N workflow deployment
 */

const fs = require('fs');
const path = require('path');

class DeploymentStatusChecker {
    constructor() {
        this.projectRoot = path.dirname(__dirname);
        this.results = {
            files: {},
            configuration: {},
            credentials: {},
            recommendations: []
        };
    }

    /**
     * Check if required files exist
     */
    checkRequiredFiles() {
        console.log('📁 Checking required files...');

        const requiredFiles = {
            'config/google-service-account.json': 'Google Service Account',
            'n8n-workflows/complete-workflow-config.json': 'Original Workflow Config',
            'n8n-workflows/production-workflow-config.json': 'Production Workflow Config',
            '.env.n8n': 'N8N Environment Configuration',
            'scripts/n8n-auto-deploy.js': 'Main Deployment Script',
            'scripts/setup-n8n-environment.js': 'Environment Setup Script',
            'deploy-n8n-workflow.bat': 'Windows Deployment Script',
            'Deploy-N8N-Workflow.ps1': 'PowerShell Deployment Script'
        };

        Object.entries(requiredFiles).forEach(([file, description]) => {
            const fullPath = path.join(this.projectRoot, file);
            const exists = fs.existsSync(fullPath);
            this.results.files[file] = {
                exists,
                description,
                status: exists ? '✅' : '❌'
            };

            console.log(`${exists ? '✅' : '❌'} ${description}: ${file}`);
        });
    }

    /**
     * Check environment configuration
     */
    checkEnvironmentConfiguration() {
        console.log('\n🔧 Checking environment configuration...');

        const envFile = path.join(this.projectRoot, '.env.n8n');

        if (!fs.existsSync(envFile)) {
            console.log('❌ Environment file not found');
            this.results.configuration.env_file = false;
            return;
        }

        const envContent = fs.readFileSync(envFile, 'utf8');

        // Check key configurations
        const checks = {
            'N8N_URL': envContent.includes('N8N_URL=https://lionalpha.app.n8n.cloud'),
            'N8N_WORKFLOW_ID': envContent.includes('N8N_WORKFLOW_ID=VGhKEfrpJU47onvi'),
            'WAHA_API_URL': envContent.includes('WAHA_API_URL=https://waha.lionalpha.app/api/sendText'),
            'GOOGLE_SPREADSHEET_ID': envContent.includes('GOOGLE_SPREADSHEET_ID=1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo'),
            'N8N_API_TOKEN_SET': !envContent.includes('N8N_API_TOKEN=your-n8n-api-token-here'),
            'WAHA_TOKEN_SET': !envContent.includes('WAHA_TOKEN=your-waha-token-here')
        };

        Object.entries(checks).forEach(([key, status]) => {
            this.results.configuration[key] = status;
            console.log(`${status ? '✅' : '❌'} ${key}`);
        });

        this.results.configuration.env_file = true;
    }

    /**
     * Check Google Service Account
     */
    checkGoogleServiceAccount() {
        console.log('\n📊 Checking Google Service Account...');

        const serviceAccountFile = path.join(this.projectRoot, 'config', 'google-service-account.json');

        if (!fs.existsSync(serviceAccountFile)) {
            console.log('❌ Google Service Account file not found');
            this.results.credentials.google_service_account = false;
            return;
        }

        try {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFile, 'utf8'));

            const checks = {
                'Type': serviceAccount.type === 'service_account',
                'Project ID': !!serviceAccount.project_id,
                'Client Email': !!serviceAccount.client_email,
                'Private Key': !!serviceAccount.private_key,
                'Token URI': !!serviceAccount.token_uri
            };

            Object.entries(checks).forEach(([key, status]) => {
                console.log(`${status ? '✅' : '❌'} ${key}`);
            });

            console.log(`📧 Service Account Email: ${serviceAccount.client_email}`);
            console.log(`🏗️ Project ID: ${serviceAccount.project_id}`);

            this.results.credentials.google_service_account = true;
            this.results.credentials.service_account_email = serviceAccount.client_email;

        } catch (error) {
            console.log('❌ Invalid Google Service Account JSON');
            this.results.credentials.google_service_account = false;
        }
    }

    /**
     * Check workflow configuration
     */
    checkWorkflowConfiguration() {
        console.log('\n🔄 Checking workflow configuration...');

        const workflowFiles = [
            'n8n-workflows/complete-workflow-config.json',
            'n8n-workflows/production-workflow-config.json'
        ];

        workflowFiles.forEach(file => {
            const fullPath = path.join(this.projectRoot, file);

            if (!fs.existsSync(fullPath)) {
                console.log(`❌ ${file} not found`);
                return;
            }

            try {
                const workflow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

                console.log(`✅ ${file}:`);
                console.log(`   - Name: ${workflow.name}`);
                console.log(`   - Nodes: ${workflow.nodes?.length || 0}`);
                console.log(`   - Connections: ${Object.keys(workflow.connections || {}).length}`);

                // Check for key nodes
                const keyNodes = ['google_sheets_read', 'whatsapp_send', 'data_processing'];
                keyNodes.forEach(nodeId => {
                    const hasNode = workflow.nodes?.some(node => node.id === nodeId);
                    console.log(`   - ${nodeId}: ${hasNode ? '✅' : '❌'}`);
                });

            } catch (error) {
                console.log(`❌ ${file} - Invalid JSON`);
            }
        });
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        console.log('\n💡 Recommendations...');

        // Check if deployment is ready
        if (!this.results.files['.env.n8n']?.exists) {
            this.results.recommendations.push('Run: node scripts/setup-n8n-environment.js');
        }

        if (!this.results.configuration.N8N_API_TOKEN_SET) {
            this.results.recommendations.push('Configure N8N API token in .env.n8n');
        }

        if (!this.results.configuration.WAHA_TOKEN_SET) {
            this.results.recommendations.push('Configure WAHA token in .env.n8n');
        }

        if (!this.results.credentials.google_service_account) {
            this.results.recommendations.push('Add Google Service Account JSON to config/');
        }

        if (this.results.recommendations.length === 0) {
            this.results.recommendations.push('Ready for deployment! Run: deploy-n8n-workflow.bat');
        }

        this.results.recommendations.forEach(rec => {
            console.log(`🎯 ${rec}`);
        });
    }

    /**
     * Generate status report
     */
    generateReport() {
        console.log('\n📋 DEPLOYMENT STATUS REPORT');
        console.log('====================================');

        const allFilesExist = Object.values(this.results.files).every(f => f.exists);
        const configComplete = this.results.configuration.N8N_API_TOKEN_SET &&
                              this.results.configuration.WAHA_TOKEN_SET;
        const credentialsReady = this.results.credentials.google_service_account;

        console.log(`Files Status: ${allFilesExist ? '✅ Complete' : '❌ Missing files'}`);
        console.log(`Configuration: ${configComplete ? '✅ Complete' : '⚠️ Tokens needed'}`);
        console.log(`Credentials: ${credentialsReady ? '✅ Ready' : '❌ Missing'}`);

        const deploymentReady = allFilesExist && configComplete && credentialsReady;
        console.log(`Deployment Ready: ${deploymentReady ? '✅ YES' : '❌ NO'}`);

        if (deploymentReady) {
            console.log('\n🚀 READY FOR DEPLOYMENT!');
            console.log('Run: deploy-n8n-workflow.bat');
        } else {
            console.log('\n⚠️ SETUP REQUIRED');
            console.log('Follow recommendations above');
        }

        console.log('\n📊 Target Campaign:');
        console.log('- Workflow ID: VGhKEfrpJU47onvi');
        console.log('- Target Users: ~650 inactive members');
        console.log('- Expected ROI: 11,700%');
        console.log('- N8N Instance: https://lionalpha.app.n8n.cloud');

        console.log('====================================');
    }

    /**
     * Run complete status check
     */
    run() {
        console.log('🔍 FullForce Academia - N8N Deployment Status Check');
        console.log('==================================================');

        this.checkRequiredFiles();
        this.checkEnvironmentConfiguration();
        this.checkGoogleServiceAccount();
        this.checkWorkflowConfiguration();
        this.generateRecommendations();
        this.generateReport();

        return this.results;
    }
}

// CLI execution
if (require.main === module) {
    const checker = new DeploymentStatusChecker();
    checker.run();
}

module.exports = DeploymentStatusChecker;