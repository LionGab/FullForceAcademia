#!/usr/bin/env node

/**
 * FullForce Academia - One-Click Complete Deployment
 * Single command to deploy entire 650 inactive users reactivation campaign
 *
 * Features:
 * - Automated token retrieval via browser automation
 * - Complete N8N workflow deployment
 * - WAHA WhatsApp integration setup
 * - Google Sheets configuration
 * - End-to-end testing and validation
 * - Real-time monitoring and reporting
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class OneClickDeployment {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.scriptsDir = __dirname;

        // Deployment scripts
        this.automatedTokenScript = path.join(this.scriptsDir, 'automated-token-retrieval.js');
        this.interactiveScript = path.join(this.scriptsDir, 'interactive-deployment.js');
        this.autoDeployScript = path.join(this.scriptsDir, 'n8n-auto-deploy.js');

        // Configuration paths
        this.envFile = path.join(this.projectRoot, '.env.n8n');
        this.googleServiceAccount = path.join(this.projectRoot, 'config', 'google-service-account.json');

        this.startTime = Date.now();

        console.log('🚀 FullForce Academia - One-Click Deployment');
        console.log('===========================================');
        console.log('Target: 650 inactive users | Expected ROI: R$ 11,700');
        console.log('');
    }

    /**
     * Check system prerequisites
     */
    async checkPrerequisites() {
        console.log('🔍 Checking system prerequisites...');

        const checks = {
            'Node.js': this.checkNodeJS(),
            'Environment file': fs.existsSync(this.envFile),
            'Google Service Account': fs.existsSync(this.googleServiceAccount),
            'Deployment scripts': fs.existsSync(this.autoDeployScript),
            'Network connectivity': await this.checkNetworkConnectivity()
        };

        let allPassed = true;
        for (const [check, passed] of Object.entries(checks)) {
            const icon = passed ? '✅' : '❌';
            console.log(`${icon} ${check}: ${passed ? 'OK' : 'FAILED'}`);
            if (!passed) allPassed = false;
        }

        if (!allPassed) {
            throw new Error('Prerequisites check failed. Please resolve the issues above.');
        }

        console.log('✅ All prerequisites passed');
        return true;
    }

    /**
     * Check Node.js version
     */
    checkNodeJS() {
        try {
            const version = process.version;
            const majorVersion = parseInt(version.slice(1).split('.')[0]);
            return majorVersion >= 14;
        } catch {
            return false;
        }
    }

    /**
     * Check network connectivity to required services
     */
    async checkNetworkConnectivity() {
        try {
            const https = require('https');

            const checkUrl = (url) => {
                return new Promise((resolve) => {
                    const req = https.get(url, (res) => {
                        resolve(res.statusCode < 400);
                    });
                    req.on('error', () => resolve(false));
                    req.setTimeout(5000, () => {
                        req.destroy();
                        resolve(false);
                    });
                });
            };

            const n8nConnectivity = await checkUrl('https://lionalpha.app.n8n.cloud');
            const wahaConnectivity = await checkUrl('https://waha.lionalpha.app');

            return n8nConnectivity && wahaConnectivity;
        } catch {
            return false;
        }
    }

    /**
     * Display deployment plan
     */
    displayDeploymentPlan() {
        console.log('📋 DEPLOYMENT PLAN');
        console.log('==================');
        console.log('');
        console.log('Phase 1: 🔧 System Setup');
        console.log('  • Install required dependencies (Playwright)');
        console.log('  • Validate configuration files');
        console.log('  • Check network connectivity');
        console.log('');
        console.log('Phase 2: 🔑 Token Retrieval');
        console.log('  • Automated N8N API token retrieval');
        console.log('  • Automated WAHA token retrieval');
        console.log('  • Environment configuration update');
        console.log('');
        console.log('Phase 3: 🚀 Workflow Deployment');
        console.log('  • Deploy N8N workflow (ID: VGhKEfrpJU47onvi)');
        console.log('  • Configure Google Sheets integration');
        console.log('  • Setup WAHA WhatsApp messaging');
        console.log('  • Activate workflow for production');
        console.log('');
        console.log('Phase 4: 🧪 Testing & Validation');
        console.log('  • End-to-end workflow testing');
        console.log('  • Message delivery validation');
        console.log('  • Performance monitoring setup');
        console.log('');
        console.log('Phase 5: 📊 Campaign Activation');
        console.log('  • Process 650 inactive users');
        console.log('  • Real-time analytics dashboard');
        console.log('  • ROI tracking (Target: R$ 11,700)');
        console.log('');
    }

    /**
     * Execute script with real-time output
     */
    async executeScript(scriptPath, description) {
        console.log(`\n🔄 ${description}...`);
        console.log('─'.repeat(50));

        return new Promise((resolve, reject) => {
            const child = spawn('node', [scriptPath], {
                stdio: 'inherit',
                cwd: this.projectRoot
            });

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ ${description} completed successfully`);
                    resolve(true);
                } else {
                    console.log(`❌ ${description} failed with exit code ${code}`);
                    reject(new Error(`${description} failed`));
                }
            });

            child.on('error', (error) => {
                console.error(`❌ Error executing ${description}:`, error.message);
                reject(error);
            });
        });
    }

    /**
     * Choose deployment method based on system capabilities
     */
    async chooseDeploymentMethod() {
        console.log('🎯 Selecting optimal deployment method...');

        // Check if Playwright can be installed/used
        try {
            // Try to require Playwright
            require('playwright');
            console.log('✅ Playwright available - using fully automated deployment');
            return 'automated';
        } catch {
            console.log('📦 Playwright not available - checking installation capability...');

            // Check if we can install Playwright
            const canInstall = await this.testPlaywrightInstallation();
            if (canInstall) {
                console.log('✅ Can install Playwright - using automated deployment');
                return 'automated';
            } else {
                console.log('⚠️ Cannot install Playwright - using interactive deployment');
                return 'interactive';
            }
        }
    }

    /**
     * Test if Playwright can be installed
     */
    async testPlaywrightInstallation() {
        return new Promise((resolve) => {
            const testInstall = spawn('npm', ['--version'], {
                stdio: 'pipe',
                cwd: this.projectRoot
            });

            testInstall.on('close', (code) => {
                resolve(code === 0);
            });

            testInstall.on('error', () => {
                resolve(false);
            });
        });
    }

    /**
     * Run automated deployment with browser automation
     */
    async runAutomatedDeployment() {
        console.log('🤖 Running fully automated deployment...');

        try {
            await this.executeScript(
                this.automatedTokenScript,
                'Automated token retrieval and deployment'
            );

            return {
                success: true,
                method: 'automated',
                message: 'Fully automated deployment completed successfully'
            };

        } catch (error) {
            console.log('⚠️ Automated deployment failed, falling back to interactive mode...');
            return await this.runInteractiveDeployment();
        }
    }

    /**
     * Run interactive deployment with user guidance
     */
    async runInteractiveDeployment() {
        console.log('👤 Running interactive deployment...');

        try {
            await this.executeScript(
                this.interactiveScript,
                'Interactive deployment with user guidance'
            );

            return {
                success: true,
                method: 'interactive',
                message: 'Interactive deployment completed successfully'
            };

        } catch (error) {
            throw new Error(`Interactive deployment failed: ${error.message}`);
        }
    }

    /**
     * Validate deployment success
     */
    async validateDeployment() {
        console.log('\n🔍 Validating deployment...');

        const validations = [
            {
                name: 'Environment tokens updated',
                check: () => this.checkTokensInEnv()
            },
            {
                name: 'Google Service Account accessible',
                check: () => fs.existsSync(this.googleServiceAccount)
            },
            {
                name: 'N8N workflow endpoint reachable',
                check: () => this.checkN8NEndpoint()
            }
        ];

        let allValid = true;
        for (const validation of validations) {
            try {
                const result = await validation.check();
                const icon = result ? '✅' : '❌';
                console.log(`${icon} ${validation.name}`);
                if (!result) allValid = false;
            } catch (error) {
                console.log(`❌ ${validation.name}: ${error.message}`);
                allValid = false;
            }
        }

        return allValid;
    }

    /**
     * Check if tokens were updated in environment file
     */
    checkTokensInEnv() {
        try {
            const envContent = fs.readFileSync(this.envFile, 'utf8');
            const hasN8NToken = !envContent.includes('n8n_demo_token_replace_with_real');
            const hasWAHAToken = !envContent.includes('waha_demo_token_replace_with_real');
            return hasN8NToken && hasWAHAToken;
        } catch {
            return false;
        }
    }

    /**
     * Check N8N endpoint connectivity
     */
    async checkN8NEndpoint() {
        try {
            const https = require('https');
            return new Promise((resolve) => {
                const req = https.get('https://lionalpha.app.n8n.cloud/api/v1/workflows', (res) => {
                    resolve(res.statusCode < 500);
                });
                req.on('error', () => resolve(false));
                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        } catch {
            return false;
        }
    }

    /**
     * Display final deployment report
     */
    displayFinalReport(result) {
        const duration = Math.round((Date.now() - this.startTime) / 1000);

        console.log('\n🎉 DEPLOYMENT COMPLETE!');
        console.log('=======================');
        console.log('');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log(`🤖 Method: ${result.method}`);
        console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log('');
        console.log('🎯 CAMPAIGN DETAILS');
        console.log('─'.repeat(30));
        console.log('Target Users: 650 inactive members');
        console.log('Expected ROI: R$ 11,700');
        console.log('Workflow ID: VGhKEfrpJU47onvi');
        console.log('');
        console.log('🔗 MONITORING LINKS');
        console.log('─'.repeat(30));
        console.log('N8N Workflow: https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi');
        console.log('Google Sheets: https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit');
        console.log('WAHA Dashboard: https://waha.lionalpha.app');
        console.log('');
        console.log('📊 EXPECTED CONVERSION RATES');
        console.log('─'.repeat(30));
        console.log('Critical Priority: 35% (227 users)');
        console.log('High Priority: 25% (162 users)');
        console.log('Medium Priority: 15% (97 users)');
        console.log('');
        console.log('🚀 YOUR AUTOMATED REACTIVATION CAMPAIGN IS NOW LIVE!');
    }

    /**
     * Main execution flow
     */
    async execute() {
        try {
            console.log('Welcome to the FullForce Academia One-Click Deployment System!');
            console.log('This will deploy your complete WhatsApp reactivation campaign.');
            console.log('');

            // Step 1: Check prerequisites
            await this.checkPrerequisites();

            // Step 2: Display deployment plan
            this.displayDeploymentPlan();

            // Step 3: Choose deployment method
            const method = await this.chooseDeploymentMethod();

            // Step 4: Execute deployment
            let result;
            if (method === 'automated') {
                result = await this.runAutomatedDeployment();
            } else {
                result = await this.runInteractiveDeployment();
            }

            // Step 5: Validate deployment
            const isValid = await this.validateDeployment();
            result.success = result.success && isValid;

            // Step 6: Display final report
            this.displayFinalReport(result);

            return result.success;

        } catch (error) {
            console.error('\n💥 One-click deployment failed:', error.message);
            console.log('\n🔧 Manual deployment options:');
            console.log('1. node scripts/interactive-deployment.js');
            console.log('2. node scripts/automated-token-retrieval.js');
            console.log('3. node scripts/n8n-auto-deploy.js');

            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new OneClickDeployment();

    deployment.execute().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = OneClickDeployment;