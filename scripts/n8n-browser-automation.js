#!/usr/bin/env node

/**
 * FullForce Academia - N8N Browser Automation Script
 * Automates N8N workflow deployment using browser automation
 * This is a fallback option when API approach doesn't work
 */

const fs = require('fs');
const path = require('path');

class N8NBrowserAutomation {
    constructor() {
        this.n8nUrl = 'https://lionalpha.app.n8n.cloud';
        this.workflowId = 'VGhKEfrpJU47onvi';
        this.workflowConfigPath = path.join(__dirname, '..', 'n8n-workflows', 'complete-workflow-config.json');
        this.googleServiceAccountPath = path.join(__dirname, '..', 'config', 'google-service-account.json');
    }

    /**
     * Generate Playwright automation script
     */
    generatePlaywrightScript() {
        const playwrightScript = `
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class N8NPlaywrightAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.workflowConfig = null;
        this.googleServiceAccount = null;
    }

    async init() {
        console.log('🌐 Launching browser...');
        this.browser = await chromium.launch({
            headless: false, // Set to true for headless mode
            slowMo: 1000 // Slow down actions for better visibility
        });

        this.page = await this.browser.newPage();

        // Load configurations
        this.workflowConfig = JSON.parse(fs.readFileSync('${this.workflowConfigPath}', 'utf8'));
        this.googleServiceAccount = JSON.parse(fs.readFileSync('${this.googleServiceAccountPath}', 'utf8'));

        console.log('✅ Browser initialized');
    }

    async loginToN8N() {
        console.log('🔐 Logging into N8N...');

        await this.page.goto('${this.n8nUrl}/signin');

        // Wait for login form
        await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });

        console.log('📧 Please complete the login process manually...');
        console.log('   1. Enter your email and password');
        console.log('   2. Complete any 2FA if required');
        console.log('   3. Wait until you reach the main dashboard');

        // Wait for successful login (dashboard appears)
        await this.page.waitForSelector('[data-test-id="main-content"]', { timeout: 120000 });
        console.log('✅ Login successful');
    }

    async navigateToWorkflow() {
        console.log('📂 Navigating to workflow...');

        const workflowUrl = \`${this.n8nUrl}/workflow/${this.workflowId}\`;
        await this.page.goto(workflowUrl);

        // Wait for workflow editor to load
        await this.page.waitForSelector('.node-view', { timeout: 15000 });
        console.log('✅ Workflow editor loaded');
    }

    async updateGoogleSheetsCredentials() {
        console.log('📊 Updating Google Sheets credentials...');

        try {
            // Find and click on Google Sheets node
            const googleSheetsNodes = await this.page.$$('[data-test-id*="google"][data-test-id*="sheets"]');

            for (const node of googleSheetsNodes) {
                await node.click();

                // Wait for node settings panel
                await this.page.waitForSelector('.node-settings', { timeout: 5000 });

                // Look for authentication dropdown
                const authDropdown = await this.page.$('select[data-test-id="parameter-input-authentication"]');
                if (authDropdown) {
                    await authDropdown.selectOption('serviceAccount');
                }

                // Fill in service account details
                const serviceAccountFields = {
                    'serviceAccount.client_email': this.googleServiceAccount.client_email,
                    'serviceAccount.private_key': this.googleServiceAccount.private_key,
                    'serviceAccount.project_id': this.googleServiceAccount.project_id
                };

                for (const [field, value] of Object.entries(serviceAccountFields)) {
                    const input = await this.page.$(\`input[data-test-id="parameter-input-\${field}"]\`);
                    if (input) {
                        await input.fill(value);
                    }
                }

                console.log('✅ Google Sheets credentials updated for node');
            }
        } catch (error) {
            console.warn('⚠️ Could not update Google Sheets credentials automatically:', error.message);
        }
    }

    async updateWAHAConfiguration() {
        console.log('📱 Updating WAHA WhatsApp configuration...');

        try {
            // Find WhatsApp HTTP Request node
            const httpNodes = await this.page.$$('[data-test-id*="http"]');

            for (const node of httpNodes) {
                await node.click();

                // Wait for node settings
                await this.page.waitForSelector('.node-settings', { timeout: 5000 });

                // Update URL field
                const urlInput = await this.page.$('input[data-test-id="parameter-input-url"]');
                if (urlInput) {
                    await urlInput.fill('https://waha.lionalpha.app/api/sendText');
                }

                // Update authentication
                const authTypeSelect = await this.page.$('select[data-test-id="parameter-input-authentication"]');
                if (authTypeSelect) {
                    await authTypeSelect.selectOption('genericCredentialType');
                }

                console.log('✅ WAHA configuration updated');
            }
        } catch (error) {
            console.warn('⚠️ Could not update WAHA configuration automatically:', error.message);
        }
    }

    async saveWorkflow() {
        console.log('💾 Saving workflow...');

        try {
            // Use Ctrl+S to save
            await this.page.keyboard.press('Control+s');

            // Wait for save confirmation
            await this.page.waitForSelector('.message-success', { timeout: 10000 });
            console.log('✅ Workflow saved successfully');
        } catch (error) {
            console.warn('⚠️ Could not save workflow automatically:', error.message);
        }
    }

    async activateWorkflow() {
        console.log('⚡ Activating workflow...');

        try {
            // Find and click activate button
            const activateButton = await this.page.$('[data-test-id="workflow-activate-button"]');
            if (activateButton) {
                await activateButton.click();

                // Wait for activation confirmation
                await this.page.waitForSelector('.workflow-activator.active', { timeout: 10000 });
                console.log('✅ Workflow activated successfully');
            }
        } catch (error) {
            console.warn('⚠️ Could not activate workflow automatically:', error.message);
        }
    }

    async testWorkflow() {
        console.log('🧪 Testing workflow...');

        try {
            // Find and click test workflow button
            const testButton = await this.page.$('[data-test-id="workflow-execute-button"]');
            if (testButton) {
                await testButton.click();

                // Wait for execution to complete
                await this.page.waitForSelector('.execution-list .execution', { timeout: 30000 });
                console.log('✅ Test execution completed');
            }
        } catch (error) {
            console.warn('⚠️ Could not test workflow automatically:', error.message);
        }
    }

    async run() {
        try {
            await this.init();
            await this.loginToN8N();
            await this.navigateToWorkflow();
            await this.updateGoogleSheetsCredentials();
            await this.updateWAHAConfiguration();
            await this.saveWorkflow();
            await this.activateWorkflow();
            await this.testWorkflow();

            console.log('🎉 Browser automation completed successfully!');

        } catch (error) {
            console.error('❌ Browser automation failed:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the automation
const automation = new N8NPlaywrightAutomation();
automation.run();
`;

        return playwrightScript;
    }

    /**
     * Generate Puppeteer automation as alternative
     */
    generatePuppeteerScript() {
        const puppeteerScript = `
const puppeteer = require('puppeteer');
const fs = require('fs');

class N8NPuppeteerAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🌐 Launching Chrome...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        this.page = await this.browser.newPage();
        console.log('✅ Browser initialized');
    }

    async automate() {
        try {
            await this.init();

            console.log('🔗 Opening N8N dashboard...');
            await this.page.goto('${this.n8nUrl}');

            console.log('📋 Manual steps required:');
            console.log('1. Complete login if not already logged in');
            console.log('2. Navigate to workflow: ${this.workflowId}');
            console.log('3. Update Google Sheets credentials');
            console.log('4. Update WAHA WhatsApp configuration');
            console.log('5. Save and activate the workflow');

            // Keep browser open for manual interaction
            console.log('⏳ Browser will remain open for manual configuration...');
            console.log('Press Ctrl+C to close when done.');

            // Keep the script running
            await new Promise(() => {});

        } catch (error) {
            console.error('❌ Automation failed:', error.message);
        }
    }
}

const automation = new N8NPuppeteerAutomation();
automation.automate();
`;

        return puppeteerScript;
    }

    /**
     * Create browser automation files
     */
    create() {
        console.log('🌐 Creating browser automation scripts...');

        try {
            // Create Playwright automation
            const playwrightScript = this.generatePlaywrightScript();
            const playwrightPath = path.join(__dirname, 'n8n-playwright-automation.js');
            fs.writeFileSync(playwrightPath, playwrightScript);
            console.log(`✅ Playwright automation created: ${playwrightPath}`);

            // Create Puppeteer automation
            const puppeteerScript = this.generatePuppeteerScript();
            const puppeteerPath = path.join(__dirname, 'n8n-puppeteer-automation.js');
            fs.writeFileSync(puppeteerPath, puppeteerScript);
            console.log(`✅ Puppeteer automation created: ${puppeteerPath}`);

            // Create package.json for browser automation dependencies
            const packageJson = {
                "name": "n8n-browser-automation",
                "version": "1.0.0",
                "description": "Browser automation for N8N workflow deployment",
                "main": "n8n-playwright-automation.js",
                "dependencies": {
                    "playwright": "^1.40.0",
                    "puppeteer": "^21.5.0"
                },
                "scripts": {
                    "install-browsers": "npx playwright install",
                    "playwright": "node n8n-playwright-automation.js",
                    "puppeteer": "node n8n-puppeteer-automation.js"
                }
            };

            const packagePath = path.join(__dirname, 'package.json');
            fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
            console.log(`✅ Package.json created: ${packagePath}`);

            // Create installation and usage instructions
            const readme = \`# N8N Browser Automation

Automates N8N workflow deployment using browser automation.

## Installation

\\\`\\\`\\\`bash
cd scripts
npm install
npm run install-browsers
\\\`\\\`\\\`

## Usage

### Option 1: Playwright (Recommended)
\\\`\\\`\\\`bash
npm run playwright
\\\`\\\`\\\`

### Option 2: Puppeteer
\\\`\\\`\\\`bash
npm run puppeteer
\\\`\\\`\\\`

## Manual Steps

1. Ensure you're logged into N8N: https://lionalpha.app.n8n.cloud
2. Have your Google Service Account credentials ready
3. Have your WAHA token ready
4. Run the automation script
5. Follow the prompts for manual configuration

## Workflow ID
Target workflow: VGhKEfrpJU47onvi

## Configuration Files
- Google Service Account: ../config/google-service-account.json
- Workflow Config: ../n8n-workflows/complete-workflow-config.json
\`;

            const readmePath = path.join(__dirname, 'README-browser-automation.md');
            fs.writeFileSync(readmePath, readme);
            console.log(`✅ README created: ${readmePath}`);

            console.log('\n📋 Browser automation setup completed!');
            console.log('\nTo use browser automation:');
            console.log('1. cd scripts');
            console.log('2. npm install');
            console.log('3. npm run install-browsers');
            console.log('4. npm run playwright');

            return true;

        } catch (error) {
            console.error('❌ Failed to create browser automation:', error.message);
            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const automation = new N8NBrowserAutomation();
    const success = automation.create();
    process.exit(success ? 0 : 1);
}

module.exports = N8NBrowserAutomation;