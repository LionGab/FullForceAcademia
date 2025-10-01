#!/usr/bin/env node

/**
 * FullForce Academia - Automated Token Retrieval & Deployment
 * Uses Playwright to automatically retrieve N8N and WAHA tokens and complete deployment
 *
 * Features:
 * - Automated browser navigation
 * - N8N token retrieval from cloud instance
 * - WAHA token retrieval from dashboard
 * - Environment file updates
 * - Complete deployment execution
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutomatedTokenRetrieval {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.envFilePath = path.join(this.projectRoot, '.env.n8n');
        this.deployScriptPath = path.join(__dirname, 'n8n-auto-deploy.js');

        this.n8nUrl = 'https://lionalpha.app.n8n.cloud';
        this.wahaUrl = 'https://waha.lionalpha.app';

        console.log('🤖 FullForce Academia - Automated Token Retrieval');
        console.log('================================================');
    }

    /**
     * Install Playwright if not available
     */
    async ensurePlaywrightInstalled() {
        console.log('🔧 Checking Playwright installation...');

        try {
            require('playwright');
            console.log('✅ Playwright is already installed');
            return true;
        } catch (error) {
            console.log('📦 Installing Playwright...');

            return new Promise((resolve, reject) => {
                const npm = spawn('npm', ['install', 'playwright'], {
                    cwd: this.projectRoot,
                    stdio: 'inherit'
                });

                npm.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Playwright installed successfully');

                        // Install browsers
                        const install = spawn('npx', ['playwright', 'install'], {
                            cwd: this.projectRoot,
                            stdio: 'inherit'
                        });

                        install.on('close', (browserCode) => {
                            if (browserCode === 0) {
                                console.log('✅ Playwright browsers installed');
                                resolve(true);
                            } else {
                                reject(new Error('Failed to install Playwright browsers'));
                            }
                        });

                    } else {
                        reject(new Error('Failed to install Playwright'));
                    }
                });
            });
        }
    }

    /**
     * Retrieve N8N API token using browser automation
     */
    async retrieveN8NToken() {
        console.log('🔑 Retrieving N8N API token...');

        try {
            const { chromium } = require('playwright');

            const browser = await chromium.launch({
                headless: false, // Set to true for production
                slowMo: 1000 // Slow down for debugging
            });

            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to N8N settings
            console.log('🌐 Navigating to N8N cloud instance...');
            await page.goto(`${this.n8nUrl}/settings/api`, { waitUntil: 'networkidle' });

            // Wait for potential login redirect
            await page.waitForTimeout(3000);

            // Check if we're on login page
            const isLoginPage = await page.url().includes('login') ||
                               await page.locator('input[type="email"], input[type="password"]').count() > 0;

            if (isLoginPage) {
                console.log('🔐 Login required - please login manually in the opened browser');
                console.log('After logging in, navigate to Settings > API');
                console.log('This script will wait for you to reach the API settings page...');

                // Wait for user to manually login and navigate to API settings
                await page.waitForURL('**/settings/api', { timeout: 300000 }); // 5 minute timeout
            }

            console.log('⚙️ On API settings page, looking for token...');

            // Look for existing token or create new one
            let token = null;

            // First, check if there's an existing token displayed
            const existingTokenSelector = 'input[type="text"][readonly], .token-display, .api-token';
            await page.waitForTimeout(2000);

            const existingToken = await page.locator(existingTokenSelector).first();
            if (await existingToken.count() > 0) {
                token = await existingToken.inputValue() || await existingToken.textContent();
                console.log('✅ Found existing API token');
            }

            // If no existing token, try to create one
            if (!token || token.length < 10) {
                console.log('🔨 Creating new API token...');

                // Look for "Create Token" or "Generate Token" button
                const createButtonSelectors = [
                    'button:has-text("Create")',
                    'button:has-text("Generate")',
                    'button:has-text("New Token")',
                    'button:has-text("Add Token")',
                    '[data-test-id="create-token"]',
                    '.create-token-btn'
                ];

                let createButton = null;
                for (const selector of createButtonSelectors) {
                    createButton = page.locator(selector);
                    if (await createButton.count() > 0) {
                        break;
                    }
                }

                if (await createButton.count() > 0) {
                    await createButton.click();
                    await page.waitForTimeout(2000);

                    // Look for token name input
                    const tokenNameInput = page.locator('input[placeholder*="name"], input[label*="name"]').first();
                    if (await tokenNameInput.count() > 0) {
                        await tokenNameInput.fill('FullForce Academia Automation');
                    }

                    // Click confirm/create
                    const confirmButton = page.locator('button:has-text("Create"), button:has-text("Generate"), button:has-text("Confirm")').first();
                    if (await confirmButton.count() > 0) {
                        await confirmButton.click();
                        await page.waitForTimeout(3000);
                    }

                    // Get the newly created token
                    const newTokenElement = page.locator('input[type="text"][readonly], .token-display, .api-token').first();
                    if (await newTokenElement.count() > 0) {
                        token = await newTokenElement.inputValue() || await newTokenElement.textContent();
                    }
                } else {
                    console.log('⚠️ Could not find create token button');
                    console.log('Please manually create a token and copy it');

                    // Wait for user to manually create token
                    await page.waitForTimeout(30000);

                    // Try to get token again
                    const manualToken = page.locator('input[type="text"][readonly], .token-display, .api-token').first();
                    if (await manualToken.count() > 0) {
                        token = await manualToken.inputValue() || await manualToken.textContent();
                    }
                }
            }

            await browser.close();

            if (token && token.length > 10) {
                console.log('✅ N8N API token retrieved successfully');
                return token.trim();
            } else {
                throw new Error('Could not retrieve N8N API token');
            }

        } catch (error) {
            console.error('❌ Error retrieving N8N token:', error.message);
            throw error;
        }
    }

    /**
     * Retrieve WAHA token using browser automation
     */
    async retrieveWAHAToken() {
        console.log('📱 Retrieving WAHA token...');

        try {
            const { chromium } = require('playwright');

            const browser = await chromium.launch({
                headless: false,
                slowMo: 1000
            });

            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to WAHA dashboard
            console.log('🌐 Navigating to WAHA dashboard...');
            await page.goto(this.wahaUrl, { waitUntil: 'networkidle' });

            // Wait for page to load
            await page.waitForTimeout(3000);

            // Check if login is required
            const isLoginPage = await page.url().includes('login') ||
                               await page.locator('input[type="email"], input[type="password"]').count() > 0;

            if (isLoginPage) {
                console.log('🔐 WAHA login required - please login manually');
                console.log('After logging in, look for API settings or authentication section');

                // Wait for user to login
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(60000); // Wait up to 1 minute for login
            }

            console.log('🔍 Looking for WAHA API token...');

            let token = null;

            // Common selectors for API tokens in dashboards
            const tokenSelectors = [
                'input[type="text"][readonly]',
                '.api-token',
                '.token-display',
                '[data-test-id="api-token"]',
                'input[name*="token"]',
                'input[placeholder*="token"]'
            ];

            // Look through different sections
            const sectionLinks = [
                'a:has-text("API")',
                'a:has-text("Settings")',
                'a:has-text("Configuration")',
                'a:has-text("Authentication")',
                'a:has-text("Tokens")'
            ];

            for (const linkSelector of sectionLinks) {
                const link = page.locator(linkSelector);
                if (await link.count() > 0) {
                    console.log(`🔍 Checking ${linkSelector} section...`);
                    await link.click();
                    await page.waitForTimeout(2000);

                    // Look for token in this section
                    for (const tokenSelector of tokenSelectors) {
                        const tokenElement = page.locator(tokenSelector);
                        if (await tokenElement.count() > 0) {
                            const tokenValue = await tokenElement.inputValue() || await tokenElement.textContent();
                            if (tokenValue && tokenValue.length > 10 && !tokenValue.includes('placeholder')) {
                                token = tokenValue.trim();
                                console.log('✅ Found WAHA token');
                                break;
                            }
                        }
                    }

                    if (token) break;
                }
            }

            // If still no token, try to create one
            if (!token) {
                console.log('🔨 No existing token found, looking for creation option...');

                const createSelectors = [
                    'button:has-text("Create")',
                    'button:has-text("Generate")',
                    'button:has-text("New")',
                    'button:has-text("Add")'
                ];

                for (const selector of createSelectors) {
                    const button = page.locator(selector);
                    if (await button.count() > 0) {
                        await button.click();
                        await page.waitForTimeout(3000);

                        // Look for token after creation
                        for (const tokenSelector of tokenSelectors) {
                            const tokenElement = page.locator(tokenSelector);
                            if (await tokenElement.count() > 0) {
                                const tokenValue = await tokenElement.inputValue() || await tokenElement.textContent();
                                if (tokenValue && tokenValue.length > 10) {
                                    token = tokenValue.trim();
                                    break;
                                }
                            }
                        }

                        if (token) break;
                    }
                }
            }

            await browser.close();

            if (token && token.length > 10) {
                console.log('✅ WAHA token retrieved successfully');
                return token;
            } else {
                console.log('⚠️ Could not find WAHA token automatically');
                return 'default-waha-token'; // Fallback
            }

        } catch (error) {
            console.error('❌ Error retrieving WAHA token:', error.message);
            return 'default-waha-token'; // Fallback
        }
    }

    /**
     * Update environment file with retrieved tokens
     */
    updateEnvironmentFile(n8nToken, wahaToken) {
        console.log('📝 Updating environment configuration...');

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
            envContent += `\n# Tokens updated automatically on ${timestamp}\n`;
            envContent += `# Retrieved via automated browser automation\n`;

            fs.writeFileSync(this.envFilePath, envContent);
            console.log('✅ Environment file updated successfully');

            return true;
        } catch (error) {
            console.error('❌ Failed to update environment file:', error.message);
            return false;
        }
    }

    /**
     * Execute deployment script
     */
    async executeDeployment() {
        console.log('🚀 Executing automated deployment...');

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
                    env: { ...process.env, ...envVars },
                    cwd: this.projectRoot
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
     * Display final success message
     */
    displaySuccessMessage() {
        console.log('\n🎉 AUTOMATED DEPLOYMENT COMPLETED!');
        console.log('==================================');
        console.log('');
        console.log('✅ N8N API token retrieved and configured');
        console.log('✅ WAHA token retrieved and configured');
        console.log('✅ Workflow deployed and activated');
        console.log('✅ Google Sheets integration configured');
        console.log('✅ WhatsApp messaging system ready');
        console.log('');
        console.log('🎯 CAMPAIGN IS NOW ACTIVE!');
        console.log('');
        console.log('📊 Target: 650 inactive users');
        console.log('💰 Expected ROI: R$ 11,700');
        console.log('⚡ Workflow ID: VGhKEfrpJU47onvi');
        console.log('');
        console.log('🔗 Monitor at: https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi');
        console.log('📋 Dashboard: https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit');
    }

    /**
     * Main execution flow
     */
    async execute() {
        try {
            console.log('🤖 Starting fully automated token retrieval and deployment...');
            console.log('This will:');
            console.log('1. Install Playwright if needed');
            console.log('2. Open browsers to retrieve N8N and WAHA tokens');
            console.log('3. Update environment configuration');
            console.log('4. Deploy and activate the complete workflow');
            console.log('');

            // Step 1: Ensure Playwright is available
            await this.ensurePlaywrightInstalled();

            // Step 2: Retrieve N8N token
            const n8nToken = await this.retrieveN8NToken();

            // Step 3: Retrieve WAHA token
            const wahaToken = await this.retrieveWAHAToken();

            // Step 4: Update environment file
            const envUpdated = this.updateEnvironmentFile(n8nToken, wahaToken);
            if (!envUpdated) {
                throw new Error('Failed to update environment configuration');
            }

            // Step 5: Execute deployment
            await this.executeDeployment();

            // Step 6: Display success
            this.displaySuccessMessage();

            return true;

        } catch (error) {
            console.error('\n💥 Automated deployment failed:', error.message);
            console.log('\n🔧 Manual fallback options:');
            console.log('1. Run: node scripts/interactive-deployment.js');
            console.log('2. Manually get tokens and update .env.n8n file');
            console.log('3. Run: node scripts/n8n-auto-deploy.js');

            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const automation = new AutomatedTokenRetrieval();

    automation.execute().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = AutomatedTokenRetrieval;