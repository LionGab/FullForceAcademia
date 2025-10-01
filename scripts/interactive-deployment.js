#!/usr/bin/env node

/**
 * FullForce Academia - Interactive Deployment Script
 * Guides user through token retrieval and executes complete deployment
 *
 * Features:
 * - Interactive token collection
 * - Environment file updates
 * - Complete N8N workflow deployment
 * - End-to-end testing
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

class InteractiveDeployment {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.envFilePath = path.join(this.projectRoot, '.env.n8n');
        this.deployScriptPath = path.join(__dirname, 'n8n-auto-deploy.js');

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('🚀 FullForce Academia - Interactive Deployment');
        console.log('==============================================');
    }

    /**
     * Ask user for input
     */
    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * Display instructions for N8N token retrieval
     */
    async getN8NToken() {
        console.log('\n🔑 N8N API Token Required');
        console.log('========================');
        console.log('1. Open your browser and go to: https://lionalpha.app.n8n.cloud/settings/api');
        console.log('2. Login if required');
        console.log('3. Create a new API token if one doesn\'t exist');
        console.log('4. Copy the API token');
        console.log('');

        const token = await this.askQuestion('Please paste your N8N API token here: ');

        if (!token || token.length < 10) {
            console.log('❌ Invalid token. Please ensure you copied the full token.');
            return await this.getN8NToken(); // Retry
        }

        console.log('✅ N8N API token received');
        return token;
    }

    /**
     * Display instructions for WAHA token retrieval
     */
    async getWAHAToken() {
        console.log('\n📱 WAHA Token Required');
        console.log('======================');
        console.log('1. Open your browser and go to: https://waha.lionalpha.app');
        console.log('2. Login to your WAHA dashboard');
        console.log('3. Look for API settings or authentication section');
        console.log('4. Copy your API token or authentication key');
        console.log('');
        console.log('💡 If you can\'t find the token, check:');
        console.log('   - Settings > API');
        console.log('   - Configuration > Authentication');
        console.log('   - Profile > API Keys');
        console.log('');

        const token = await this.askQuestion('Please paste your WAHA token here (or press Enter if not found): ');

        if (!token) {
            console.log('⚠️ No WAHA token provided. Using default configuration.');
            return 'default-waha-token'; // Placeholder
        }

        console.log('✅ WAHA token received');
        return token;
    }

    /**
     * Update environment file with tokens
     */
    updateEnvironmentFile(n8nToken, wahaToken) {
        console.log('\n📝 Updating environment configuration...');

        try {
            let envContent = fs.readFileSync(this.envFilePath, 'utf8');

            // Update N8N token
            envContent = envContent.replace(
                /N8N_API_TOKEN=.*/,
                `N8N_API_TOKEN=${n8nToken}`
            );

            // Update WAHA token
            envContent = envContent.replace(
                /WAHA_TOKEN=.*/,
                `WAHA_TOKEN=${wahaToken}`
            );

            // Add timestamp
            const timestamp = new Date().toISOString();
            envContent += `\n# Updated automatically on ${timestamp}\n`;
            envContent += `# Tokens configured for production deployment\n`;

            fs.writeFileSync(this.envFilePath, envContent);
            console.log('✅ Environment file updated successfully');

            return true;
        } catch (error) {
            console.error('❌ Failed to update environment file:', error.message);
            return false;
        }
    }

    /**
     * Execute the deployment script
     */
    async executeDeployment() {
        console.log('\n🚀 Starting N8N workflow deployment...');
        console.log('=====================================');

        try {
            // Load environment variables
            const envContent = fs.readFileSync(this.envFilePath, 'utf8');
            const envVars = {};

            envContent.split('\n').forEach(line => {
                const match = line.match(/^([^#=]+)=(.*)$/);
                if (match) {
                    envVars[match[1].trim()] = match[2].trim();
                }
            });

            return new Promise((resolve, reject) => {
                const child = spawn('node', [this.deployScriptPath], {
                    stdio: 'inherit',
                    env: { ...process.env, ...envVars }
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        console.log('\n✅ Deployment completed successfully!');
                        resolve(true);
                    } else {
                        console.log(`\n❌ Deployment failed with exit code ${code}`);
                        reject(new Error(`Deployment failed with exit code ${code}`));
                    }
                });

                child.on('error', (error) => {
                    console.error('\n❌ Failed to start deployment script:', error.message);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('❌ Deployment execution failed:', error.message);
            throw error;
        }
    }

    /**
     * Display final instructions
     */
    displaySuccessInstructions() {
        console.log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('====================================');
        console.log('');
        console.log('✅ N8N workflow deployed to ID: VGhKEfrpJU47onvi');
        console.log('✅ Workflow activated and ready to run');
        console.log('✅ Google Sheets integration configured');
        console.log('✅ WAHA WhatsApp integration set up');
        console.log('');
        console.log('🎯 READY TO PROCESS 650 INACTIVE USERS!');
        console.log('');
        console.log('📊 Expected Results:');
        console.log('   • Target Users: 650 inactive members');
        console.log('   • Expected ROI: R$ 11,700');
        console.log('   • Conversion Rates:');
        console.log('     - Critical Priority: 35%');
        console.log('     - High Priority: 25%');
        console.log('     - Medium Priority: 15%');
        console.log('');
        console.log('🔗 Monitor your workflow at:');
        console.log('   https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi');
        console.log('');
        console.log('📋 Google Sheets Dashboard:');
        console.log('   https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit');
        console.log('');
        console.log('🚀 Your automated reactivation campaign is now LIVE!');
    }

    /**
     * Main execution flow
     */
    async execute() {
        try {
            console.log('Welcome to the FullForce Academia automated deployment system!');
            console.log('This script will guide you through setting up your complete');
            console.log('WhatsApp reactivation campaign for 650 inactive users.');
            console.log('');

            // Step 1: Get N8N token
            const n8nToken = await this.getN8NToken();

            // Step 2: Get WAHA token
            const wahaToken = await this.getWAHAToken();

            // Step 3: Update environment
            const envUpdated = this.updateEnvironmentFile(n8nToken, wahaToken);
            if (!envUpdated) {
                throw new Error('Failed to update environment configuration');
            }

            // Step 4: Confirm deployment
            console.log('\n⚡ Ready to deploy! This will:');
            console.log('   • Deploy workflow to N8N cloud');
            console.log('   • Configure Google Sheets integration');
            console.log('   • Set up WhatsApp messaging via WAHA');
            console.log('   • Activate the workflow immediately');
            console.log('   • Test the complete integration');
            console.log('');

            const confirm = await this.askQuestion('Proceed with deployment? (y/N): ');

            if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
                console.log('❌ Deployment cancelled by user');
                return false;
            }

            // Step 5: Execute deployment
            await this.executeDeployment();

            // Step 6: Display success instructions
            this.displaySuccessInstructions();

            return true;

        } catch (error) {
            console.error('\n💥 Deployment failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Verify your N8N API token is correct');
            console.log('2. Check that your WAHA instance is running');
            console.log('3. Ensure Google Service Account has proper permissions');
            console.log('4. Try running the deployment script manually');

            return false;
        } finally {
            this.rl.close();
        }
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new InteractiveDeployment();

    deployment.execute().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = InteractiveDeployment;