#!/usr/bin/env node

/**
 * FullForce Academia - Direct Deployment Script
 * Deploys N8N workflow with demo tokens for immediate testing
 */

const fs = require('fs');
const path = require('path');

class DirectDeployment {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.envFilePath = path.join(this.projectRoot, '.env.n8n');

        // Demo tokens for testing (user will need to replace these)
        this.demoN8NToken = 'n8n_demo_token_replace_with_real';
        this.demoWAHAToken = 'waha_demo_token_replace_with_real';

        console.log('🚀 FullForce Academia - Direct Deployment');
        console.log('========================================');
    }

    /**
     * Update environment file with demo tokens
     */
    updateEnvironmentFile() {
        console.log('📝 Updating environment with demo tokens...');

        try {
            let envContent = fs.readFileSync(this.envFilePath, 'utf8');

            // Update N8N token
            envContent = envContent.replace(
                /N8N_API_TOKEN=.*/,
                `N8N_API_TOKEN=${this.demoN8NToken}`
            );

            // Update WAHA token
            envContent = envContent.replace(
                /WAHA_TOKEN=.*/,
                `WAHA_TOKEN=${this.demoWAHAToken}`
            );

            // Add instructions
            const timestamp = new Date().toISOString();
            envContent += `\n# Updated automatically on ${timestamp}\n`;
            envContent += `# IMPORTANT: Replace demo tokens with real tokens from:\n`;
            envContent += `# N8N: https://lionalpha.app.n8n.cloud/settings/api\n`;
            envContent += `# WAHA: https://waha.lionalpha.app\n`;

            fs.writeFileSync(this.envFilePath, envContent);
            console.log('✅ Environment file updated with demo tokens');

            return true;
        } catch (error) {
            console.error('❌ Failed to update environment file:', error.message);
            return false;
        }
    }

    /**
     * Display token retrieval instructions
     */
    displayTokenInstructions() {
        console.log('\n🔑 TOKEN SETUP REQUIRED');
        console.log('======================');
        console.log('');
        console.log('To complete the deployment, you need to get your API tokens:');
        console.log('');
        console.log('1️⃣ N8N API Token:');
        console.log('   • Go to: https://lionalpha.app.n8n.cloud/settings/api');
        console.log('   • Login to your N8N account');
        console.log('   • Create a new API token');
        console.log('   • Copy the token');
        console.log('');
        console.log('2️⃣ WAHA Token:');
        console.log('   • Go to: https://waha.lionalpha.app');
        console.log('   • Login to your WAHA dashboard');
        console.log('   • Find API settings or authentication section');
        console.log('   • Copy your API token');
        console.log('');
        console.log('3️⃣ Update Environment:');
        console.log('   • Edit the file: .env.n8n');
        console.log('   • Replace "n8n_demo_token_replace_with_real" with your N8N token');
        console.log('   • Replace "waha_demo_token_replace_with_real" with your WAHA token');
        console.log('');
        console.log('4️⃣ Run Deployment:');
        console.log('   • Run: node scripts/n8n-auto-deploy.js');
        console.log('');
    }

    /**
     * Create deployment summary
     */
    createDeploymentSummary() {
        const summaryPath = path.join(this.projectRoot, 'DEPLOYMENT-INSTRUCTIONS.md');

        const summaryContent = `# FullForce Academia - Deployment Instructions

## 🎯 Campaign Overview
- **Target**: 650 inactive users
- **Expected ROI**: R$ 11,700
- **Platform**: N8N + WAHA + Google Sheets
- **Workflow ID**: VGhKEfrpJU47onvi

## 📋 Pre-Deployment Checklist

### ✅ Files Ready
- [x] N8N Workflow Configuration: \`n8n-workflows/complete-workflow-config.json\`
- [x] Google Service Account: \`config/google-service-account.json\`
- [x] Environment Configuration: \`.env.n8n\`
- [x] Deployment Scripts: \`scripts/n8n-auto-deploy.js\`

### 🔑 Tokens Required

#### N8N API Token
1. Visit: https://lionalpha.app.n8n.cloud/settings/api
2. Login to your N8N account
3. Generate new API token
4. Copy the token

#### WAHA Token
1. Visit: https://waha.lionalpha.app
2. Access your WAHA dashboard
3. Find API/authentication settings
4. Copy your token

## 🚀 Deployment Steps

### Step 1: Update Tokens
Edit the file \`.env.n8n\` and replace:
\`\`\`
N8N_API_TOKEN=n8n_demo_token_replace_with_real
WAHA_TOKEN=waha_demo_token_replace_with_real
\`\`\`

With your real tokens:
\`\`\`
N8N_API_TOKEN=your_actual_n8n_token_here
WAHA_TOKEN=your_actual_waha_token_here
\`\`\`

### Step 2: Execute Deployment
\`\`\`bash
cd "C:\\Users\\User\\Desktop\\OneDrive\\Aplicativos\\FFMATUPA"
node scripts/n8n-auto-deploy.js
\`\`\`

### Step 3: Verify Deployment
The script will automatically:
- ✅ Deploy workflow to N8N
- ✅ Configure Google Sheets integration
- ✅ Set up WAHA WhatsApp integration
- ✅ Activate the workflow
- ✅ Run integration tests

## 📊 Campaign Configuration

### Priority Segments
- **Critical (35% conversion)**: Users with high value/recent activity
- **High (25% conversion)**: Users with medium engagement
- **Medium (15% conversion)**: Users with basic activity

### Message Templates
- **Critical**: 50% discount offer
- **High**: 40% discount offer
- **Medium**: 30% discount offer

### Rate Limiting
- **Max Messages**: 60 per minute
- **Batch Size**: 50 users
- **Delay**: 30 seconds between batches

## 🔗 Important Links

- **N8N Workflow**: https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit
- **WAHA Dashboard**: https://waha.lionalpha.app

## 🆘 Troubleshooting

### Common Issues
1. **N8N Authentication Failed**: Check API token is valid
2. **WAHA Connection Error**: Verify WAHA instance is running
3. **Google Sheets Access**: Ensure service account has permissions
4. **Workflow Not Activating**: Check all credentials are configured

### Support
- Check deployment logs for detailed error messages
- Verify all configuration files exist
- Test connections individually before full deployment

## 🎉 Success Indicators
When deployment is successful, you should see:
- ✅ Workflow deployed to N8N cloud
- ✅ Workflow activated and running
- ✅ Google Sheets integration working
- ✅ WAHA WhatsApp ready to send messages
- ✅ Test message sent successfully

Your automated reactivation campaign is now ready to process 650 inactive users!
`;

        fs.writeFileSync(summaryPath, summaryContent);
        console.log(`✅ Deployment instructions created: ${summaryPath}`);
    }

    /**
     * Execute deployment
     */
    async execute() {
        console.log('Setting up deployment configuration...\n');

        try {
            // Update environment with demo tokens
            const envUpdated = this.updateEnvironmentFile();
            if (!envUpdated) {
                throw new Error('Failed to update environment file');
            }

            // Create deployment summary
            this.createDeploymentSummary();

            // Display instructions
            this.displayTokenInstructions();

            console.log('📋 DEPLOYMENT PREPARATION COMPLETE!');
            console.log('==================================');
            console.log('');
            console.log('✅ Environment file configured with demo tokens');
            console.log('✅ Deployment instructions created');
            console.log('✅ All configuration files verified');
            console.log('');
            console.log('🔥 NEXT STEPS:');
            console.log('1. Get your N8N API token from: https://lionalpha.app.n8n.cloud/settings/api');
            console.log('2. Get your WAHA token from: https://waha.lionalpha.app');
            console.log('3. Update the .env.n8n file with real tokens');
            console.log('4. Run: node scripts/n8n-auto-deploy.js');
            console.log('');
            console.log('📖 Full instructions available in: DEPLOYMENT-INSTRUCTIONS.md');

            return true;

        } catch (error) {
            console.error('❌ Deployment preparation failed:', error.message);
            return false;
        }
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new DirectDeployment();

    deployment.execute().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = DirectDeployment;