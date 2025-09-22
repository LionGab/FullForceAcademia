# FullForce Academia - Automated Deployment Guide

🚀 **Complete automated deployment system for the 650 inactive users reactivation campaign**

## Quick Start (One Command)

```bash
npm run deploy
```

This single command will:
- ✅ Install Playwright and required dependencies
- ✅ Automatically open browsers to retrieve N8N and WAHA tokens
- ✅ Update environment configuration
- ✅ Deploy complete N8N workflow
- ✅ Activate WhatsApp integration via WAHA
- ✅ Configure Google Sheets integration
- ✅ Run end-to-end tests
- ✅ Launch the campaign for 650 inactive users

## Deployment Options

### 1. 🤖 Fully Automated (Recommended)
**Best for:** Hands-off deployment with browser automation

```bash
npm run deploy:auto
# OR
node scripts/automated-token-retrieval.js
```

**What it does:**
- Uses Playwright to automatically navigate to N8N and WAHA dashboards
- Retrieves API tokens automatically
- Handles login flows and token creation
- Completes entire deployment without manual intervention

### 2. 👤 Interactive Guided
**Best for:** Step-by-step deployment with user control

```bash
npm run deploy:interactive
# OR
node scripts/interactive-deployment.js
```

**What it does:**
- Provides clear instructions for each step
- Guides you to retrieve tokens manually
- Waits for your input at each stage
- Validates configuration before proceeding

### 3. ⚡ One-Click Smart
**Best for:** Automatic method selection based on system capabilities

```bash
npm run deploy:one-click
# OR
node scripts/one-click-deployment.js
```

**What it does:**
- Analyzes your system capabilities
- Chooses between automated or interactive mode
- Provides comprehensive validation and reporting
- Fallback mechanisms for maximum reliability

### 4. 🛠️ Manual Advanced
**Best for:** Expert users with tokens already configured

```bash
npm run deploy:manual
# OR
node scripts/n8n-auto-deploy.js
```

**What it does:**
- Assumes you have API tokens ready
- Direct deployment to N8N cloud
- Advanced configuration options
- Minimal user interaction

## Prerequisites

### System Requirements
- ✅ Node.js 14+ installed
- ✅ NPM package manager
- ✅ Internet connection
- ✅ Modern web browser (Chrome/Firefox/Safari)

### Required Services
- ✅ N8N Cloud account: `https://lionalpha.app.n8n.cloud`
- ✅ WAHA instance running: `https://waha.lionalpha.app`
- ✅ Google Sheets API access
- ✅ Google Service Account configured

### Configuration Files
- ✅ `.env.n8n` - Environment configuration (auto-generated)
- ✅ `config/google-service-account.json` - Google API credentials
- ✅ N8N workflow configuration files

## Campaign Details

### Target Configuration
- **Users:** 650 inactive members
- **Expected ROI:** R$ 11,700
- **Workflow ID:** `VGhKEfrpJU47onvi`
- **Google Sheet:** [Campaign Dashboard](https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit)

### Conversion Targets
- **Critical Priority:** 35% conversion rate
- **High Priority:** 25% conversion rate
- **Medium Priority:** 15% conversion rate

### Message Templates
- **Critical Users:** 50% discount offer
- **High Priority:** 40% discount offer
- **Medium Priority:** 30% discount offer

## Deployment Process

### Phase 1: System Setup (30 seconds)
```
🔧 Installing dependencies...
📋 Validating configuration files...
🌐 Testing network connectivity...
```

### Phase 2: Token Retrieval (2-5 minutes)
```
🔑 Opening N8N dashboard...
📱 Accessing WAHA settings...
💾 Updating environment configuration...
```

### Phase 3: Workflow Deployment (1-2 minutes)
```
🚀 Deploying N8N workflow...
📊 Configuring Google Sheets integration...
📱 Setting up WAHA WhatsApp messaging...
⚡ Activating workflow...
```

### Phase 4: Testing & Validation (30 seconds)
```
🧪 Running end-to-end tests...
✅ Validating message delivery...
📈 Setting up monitoring...
```

### Phase 5: Campaign Launch (Immediate)
```
🎯 Processing 650 inactive users...
📊 Real-time analytics dashboard...
💰 ROI tracking activated...
```

## Troubleshooting

### Common Issues

#### 1. Playwright Installation Failed
```bash
# Manual installation
npm install playwright
npx playwright install
```

#### 2. Browser Automation Blocked
```bash
# Use interactive mode instead
npm run deploy:interactive
```

#### 3. Network Connectivity Issues
```bash
# Check service status
curl -I https://lionalpha.app.n8n.cloud
curl -I https://waha.lionalpha.app
```

#### 4. Google Sheets Access Denied
- Verify `config/google-service-account.json` exists
- Check Google API permissions
- Ensure service account has access to the target spreadsheet

#### 5. N8N Authentication Failed
- Verify N8N cloud account access
- Check API token permissions
- Try regenerating the token

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run deploy
```

View deployment logs:
```bash
# Real-time monitoring
npm run monitor:services

# Check specific logs
npm run logs:n8n
npm run logs:waha
```

## Monitoring & Analytics

### Real-time Dashboard
Monitor your campaign progress:
- **N8N Workflow:** [https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi](https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi)
- **Google Sheets:** [Campaign Analytics](https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit)
- **WAHA Dashboard:** [https://waha.lionalpha.app](https://waha.lionalpha.app)

### Performance Metrics
The system tracks:
- ✅ Message delivery rates
- ✅ User response rates
- ✅ Conversion percentages
- ✅ ROI calculations
- ✅ Error rates and retries

### Success Indicators
Look for these confirmations:
```
✅ N8N workflow deployed to ID: VGhKEfrpJU47onvi
✅ Workflow activated and ready to run
✅ Google Sheets integration configured
✅ WAHA WhatsApp integration set up
🎯 READY TO PROCESS 650 INACTIVE USERS!
```

## Support

### Getting Help
1. **Check logs:** `npm run logs:app`
2. **Validate config:** `npm run validate:config`
3. **Test integration:** `npm run test:integration`
4. **Health check:** `npm run health:all`

### Manual Fallback
If automated deployment fails:
1. Run interactive mode: `npm run deploy:interactive`
2. Manual token retrieval from dashboards
3. Direct script execution: `npm run deploy:manual`

---

## 🚀 Ready to Launch?

```bash
npm run deploy
```

Your automated WhatsApp reactivation campaign will be live in minutes!

**Expected Results:**
- 650 inactive users contacted
- R$ 11,700 revenue generation
- Automated follow-up sequences
- Real-time analytics and reporting