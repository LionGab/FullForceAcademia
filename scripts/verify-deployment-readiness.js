#!/usr/bin/env node

/**
 * FullForce Academia - Deployment Readiness Verification
 * Verifies all components are ready for deployment
 */

const fs = require('fs');
const path = require('path');

class DeploymentVerification {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.checks = [];

        console.log('🔍 FullForce Academia - Deployment Readiness Check');
        console.log('=================================================');
    }

    /**
     * Check if file exists
     */
    checkFile(filePath, description) {
        const exists = fs.existsSync(filePath);
        this.checks.push({
            name: description,
            status: exists,
            details: exists ? `✅ Found: ${filePath}` : `❌ Missing: ${filePath}`
        });
        return exists;
    }

    /**
     * Check environment configuration
     */
    checkEnvironment() {
        const envPath = path.join(this.projectRoot, '.env.n8n');
        const exists = this.checkFile(envPath, 'Environment Configuration');

        if (exists) {
            try {
                const envContent = fs.readFileSync(envPath, 'utf8');

                const hasN8NToken = envContent.includes('N8N_API_TOKEN=');
                const hasWAHAToken = envContent.includes('WAHA_TOKEN=');
                const hasWorkflowId = envContent.includes('VGhKEfrpJU47onvi');

                this.checks.push({
                    name: 'N8N Token Configuration',
                    status: hasN8NToken,
                    details: hasN8NToken ? '✅ N8N token variable found' : '❌ N8N token missing'
                });

                this.checks.push({
                    name: 'WAHA Token Configuration',
                    status: hasWAHAToken,
                    details: hasWAHAToken ? '✅ WAHA token variable found' : '❌ WAHA token missing'
                });

                this.checks.push({
                    name: 'Workflow ID Configuration',
                    status: hasWorkflowId,
                    details: hasWorkflowId ? '✅ Target workflow ID configured' : '❌ Workflow ID missing'
                });

                // Check if tokens are still demo tokens
                const hasRealN8NToken = !envContent.includes('n8n_demo_token_replace_with_real');
                const hasRealWAHAToken = !envContent.includes('waha_demo_token_replace_with_real');

                this.checks.push({
                    name: 'Real N8N Token',
                    status: hasRealN8NToken,
                    details: hasRealN8NToken ? '✅ Real N8N token configured' : '⚠️ Demo token - needs replacement'
                });

                this.checks.push({
                    name: 'Real WAHA Token',
                    status: hasRealWAHAToken,
                    details: hasRealWAHAToken ? '✅ Real WAHA token configured' : '⚠️ Demo token - needs replacement'
                });

            } catch (error) {
                this.checks.push({
                    name: 'Environment File Reading',
                    status: false,
                    details: `❌ Error reading file: ${error.message}`
                });
            }
        }
    }

    /**
     * Check workflow configuration
     */
    checkWorkflowConfig() {
        const workflowPaths = [
            path.join(this.projectRoot, 'n8n-workflows', 'complete-workflow-config.json'),
            path.join(this.projectRoot, 'n8n-workflows', 'production-workflow-config.json'),
            path.join(this.projectRoot, 'workflows', 'n8n-workflow-650-FIXED.json')
        ];

        let foundWorkflow = false;
        workflowPaths.forEach(workflowPath => {
            if (fs.existsSync(workflowPath)) {
                foundWorkflow = true;
                this.checks.push({
                    name: 'Workflow Configuration',
                    status: true,
                    details: `✅ Found workflow: ${path.basename(workflowPath)}`
                });

                // Validate workflow content
                try {
                    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
                    const hasNodes = workflow.nodes && workflow.nodes.length > 0;
                    const hasGoogleSheets = workflow.nodes.some(node => node.type?.includes('googleSheets'));
                    const hasWebhook = workflow.nodes.some(node => node.type?.includes('webhook'));

                    this.checks.push({
                        name: 'Workflow Nodes',
                        status: hasNodes,
                        details: hasNodes ? `✅ ${workflow.nodes.length} nodes configured` : '❌ No nodes found'
                    });

                    this.checks.push({
                        name: 'Google Sheets Integration',
                        status: hasGoogleSheets,
                        details: hasGoogleSheets ? '✅ Google Sheets nodes found' : '❌ No Google Sheets integration'
                    });

                    this.checks.push({
                        name: 'Webhook Trigger',
                        status: hasWebhook,
                        details: hasWebhook ? '✅ Webhook trigger configured' : '❌ No webhook trigger'
                    });

                } catch (error) {
                    this.checks.push({
                        name: 'Workflow Validation',
                        status: false,
                        details: `❌ Invalid workflow JSON: ${error.message}`
                    });
                }
            }
        });

        if (!foundWorkflow) {
            this.checks.push({
                name: 'Workflow Configuration',
                status: false,
                details: '❌ No workflow configuration found'
            });
        }
    }

    /**
     * Check Google Service Account
     */
    checkGoogleServiceAccount() {
        const serviceAccountPath = path.join(this.projectRoot, 'config', 'google-service-account.json');
        const exists = this.checkFile(serviceAccountPath, 'Google Service Account');

        if (exists) {
            try {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

                const hasEmail = serviceAccount.client_email;
                const hasPrivateKey = serviceAccount.private_key;
                const hasProjectId = serviceAccount.project_id;

                this.checks.push({
                    name: 'Service Account Email',
                    status: !!hasEmail,
                    details: hasEmail ? `✅ ${hasEmail}` : '❌ Missing client_email'
                });

                this.checks.push({
                    name: 'Service Account Private Key',
                    status: !!hasPrivateKey,
                    details: hasPrivateKey ? '✅ Private key configured' : '❌ Missing private_key'
                });

                this.checks.push({
                    name: 'Google Project ID',
                    status: !!hasProjectId,
                    details: hasProjectId ? `✅ ${hasProjectId}` : '❌ Missing project_id'
                });

            } catch (error) {
                this.checks.push({
                    name: 'Service Account Validation',
                    status: false,
                    details: `❌ Invalid JSON: ${error.message}`
                });
            }
        }
    }

    /**
     * Check deployment scripts
     */
    checkDeploymentScripts() {
        const scripts = [
            'n8n-auto-deploy.js',
            'interactive-deployment.js',
            'direct-deployment.js',
            'auto-token-retrieval.js'
        ];

        scripts.forEach(script => {
            const scriptPath = path.join(this.projectRoot, 'scripts', script);
            this.checkFile(scriptPath, `Deployment Script: ${script}`);
        });
    }

    /**
     * Generate deployment readiness report
     */
    generateReport() {
        console.log('\n📊 DEPLOYMENT READINESS REPORT');
        console.log('===============================');

        const categories = {
            'Configuration Files': [],
            'Authentication': [],
            'Workflow Setup': [],
            'Deployment Scripts': []
        };

        // Categorize checks
        this.checks.forEach(check => {
            if (check.name.includes('Environment') || check.name.includes('Service Account')) {
                categories['Configuration Files'].push(check);
            } else if (check.name.includes('Token') || check.name.includes('Authentication')) {
                categories['Authentication'].push(check);
            } else if (check.name.includes('Workflow') || check.name.includes('Nodes') || check.name.includes('Google Sheets')) {
                categories['Workflow Setup'].push(check);
            } else {
                categories['Deployment Scripts'].push(check);
            }
        });

        // Display categorized results
        Object.entries(categories).forEach(([category, checks]) => {
            if (checks.length > 0) {
                console.log(`\n🔧 ${category}:`);
                checks.forEach(check => {
                    const icon = check.status ? '✅' : '❌';
                    console.log(`   ${icon} ${check.name}: ${check.details.replace(/[✅❌⚠️] /, '')}`);
                });
            }
        });

        // Overall status
        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(check => check.status).length;
        const warningChecks = this.checks.filter(check => check.details.includes('⚠️')).length;

        console.log('\n📈 OVERALL STATUS');
        console.log('=================');
        console.log(`Total Checks: ${totalChecks}`);
        console.log(`Passed: ${passedChecks} ✅`);
        console.log(`Failed: ${totalChecks - passedChecks} ❌`);
        if (warningChecks > 0) {
            console.log(`Warnings: ${warningChecks} ⚠️`);
        }

        const readinessScore = (passedChecks / totalChecks) * 100;
        console.log(`Readiness Score: ${readinessScore.toFixed(1)}%`);

        // Deployment readiness
        console.log('\n🚀 DEPLOYMENT STATUS');
        console.log('===================');

        if (readinessScore >= 90) {
            console.log('🟢 READY FOR DEPLOYMENT');
            console.log('All critical components are configured correctly.');
        } else if (readinessScore >= 70) {
            console.log('🟡 MOSTLY READY - Minor Issues');
            console.log('Some components need attention before deployment.');
        } else {
            console.log('🔴 NOT READY - Critical Issues');
            console.log('Several critical components need to be fixed.');
        }

        // Next steps
        console.log('\n📋 NEXT STEPS');
        console.log('=============');

        const failedChecks = this.checks.filter(check => !check.status);
        const warningItems = this.checks.filter(check => check.details.includes('⚠️'));

        if (failedChecks.length > 0) {
            console.log('🔧 Fix the following issues:');
            failedChecks.forEach((check, index) => {
                console.log(`   ${index + 1}. ${check.name}: ${check.details.replace(/❌ /, '')}`);
            });
        }

        if (warningItems.length > 0) {
            console.log('\n⚠️ Address these warnings:');
            warningItems.forEach((check, index) => {
                console.log(`   ${index + 1}. ${check.name}: Replace demo tokens with real ones`);
            });
        }

        if (readinessScore >= 80) {
            console.log('\n🎯 Ready to deploy! Run:');
            console.log('   node scripts/n8n-auto-deploy.js');
        }

        return readinessScore;
    }

    /**
     * Execute all checks
     */
    async execute() {
        console.log('Running comprehensive deployment readiness checks...\n');

        // Run all checks
        this.checkEnvironment();
        this.checkWorkflowConfig();
        this.checkGoogleServiceAccount();
        this.checkDeploymentScripts();

        // Generate report
        const score = this.generateReport();

        return score >= 70; // Consider 70% as minimum readiness
    }
}

// CLI execution
if (require.main === module) {
    const verification = new DeploymentVerification();

    verification.execute().then((ready) => {
        process.exit(ready ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Verification failed:', error);
        process.exit(1);
    });
}

module.exports = DeploymentVerification;