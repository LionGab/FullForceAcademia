# N8N Workflow Auto-Deployment Guide
## FullForce Academia - Complete Automation Setup

This guide provides complete automation for deploying and configuring your N8N workflow for the FullForce Academia reactivation campaign.

## 🎯 Deployment Overview

**Target Configuration:**
- **N8N Instance**: https://lionalpha.app.n8n.cloud
- **Workflow ID**: VGhKEfrpJU47onvi
- **WAHA Endpoint**: https://waha.lionalpha.app/api/sendText
- **Google Sheets**: 1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo
- **Target Users**: ~650 inactive members
- **Expected ROI**: 11,700%

## 🚀 Quick Start (Automated)

### Option 1: Windows Batch Script (Easiest)
```batch
# Double-click or run:
deploy-n8n-workflow.bat
```

### Option 2: PowerShell (Advanced)
```powershell
# Run with full automation:
.\Deploy-N8N-Workflow.ps1

# Run with custom tokens:
.\Deploy-N8N-Workflow.ps1 -ApiToken "your-n8n-token" -WahaToken "your-waha-token"

# Skip checks and force deployment:
.\Deploy-N8N-Workflow.ps1 -Force -SkipChecks
```

### Option 3: Node.js Direct
```bash
# Setup environment:
node scripts/setup-n8n-environment.js

# Deploy workflow:
node scripts/n8n-auto-deploy.js
```

## 📋 Prerequisites

### Required Files
- ✅ `config/google-service-account.json` - Google Service Account credentials
- ✅ `n8n-workflows/complete-workflow-config.json` - Workflow configuration
- ✅ Node.js 18.x or higher installed

### Required Credentials
1. **N8N API Token**
   - Visit: https://lionalpha.app.n8n.cloud/settings/api
   - Generate new API token
   - Copy token for configuration

2. **WAHA Token**
   - Access your WAHA instance dashboard
   - Get authentication token
   - Copy token for configuration

## 🔧 Manual Configuration

If you need to configure manually before deployment:

### 1. Edit Environment File
```bash
# Edit .env.n8n file:
N8N_API_TOKEN=your-actual-n8n-api-token-here
WAHA_TOKEN=your-actual-waha-token-here
```

### 2. Verify Google Service Account
```bash
# Check file exists and has proper permissions:
config/google-service-account.json
```

### 3. Run Deployment
```bash
node scripts/n8n-auto-deploy.js
```

## 🔍 Deployment Process

The automation script performs these steps:

1. **🔑 Authentication**
   - Loads N8N API token
   - Validates access to N8N cloud instance

2. **📊 Google Sheets Setup**
   - Configures service account credentials
   - Validates spreadsheet access
   - Sets up read/write permissions

3. **📱 WhatsApp Integration**
   - Configures WAHA endpoint
   - Sets up authentication headers
   - Tests API connectivity

4. **🚀 Workflow Deployment**
   - Updates existing workflow (ID: VGhKEfrpJU47onvi)
   - Injects real credentials
   - Configures all node parameters

5. **⚡ Activation**
   - Activates the workflow
   - Enables automatic execution
   - Sets up monitoring

6. **🧪 Validation**
   - Runs test execution
   - Validates all integrations
   - Confirms end-to-end functionality

## 📱 WhatsApp Campaign Details

### Message Templates
- **Critical Priority (50% OFF)**: Users inactive >90 days
- **High Priority (40% OFF)**: Users inactive 60-90 days
- **Medium Priority (30% OFF)**: Users inactive 30-60 days

### Phone Number Processing
- Automatic Brazilian phone formatting
- Adds country code (+55) if missing
- Validates format before sending

### Campaign Flow
```
Google Sheets → Segmentation → Message Processing → WhatsApp Send → Analytics → Results Save
```

## 🎛️ Monitoring & Analytics

### Real-time Tracking
- Message delivery status
- Conversion tracking
- ROI calculations
- Error monitoring

### Dashboard Access
- N8N Dashboard: https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi
- Execution logs and performance metrics
- Real-time campaign monitoring

## 🔧 Troubleshooting

### Common Issues

#### 1. N8N API Authentication Failed
```bash
# Solution:
1. Visit: https://lionalpha.app.n8n.cloud/settings/api
2. Generate new API token
3. Update .env.n8n: N8N_API_TOKEN=your-new-token
4. Restart deployment
```

#### 2. Google Sheets Access Denied
```bash
# Solution:
1. Verify service account file exists: config/google-service-account.json
2. Check spreadsheet sharing with service account email
3. Ensure proper permissions (Editor access)
```

#### 3. WAHA WhatsApp Not Working
```bash
# Solution:
1. Check WAHA instance status
2. Verify WAHA token is correct
3. Test endpoint: https://waha.lionalpha.app/api/sendText
4. Update .env.n8n with correct token
```

#### 4. Workflow Not Activating
```bash
# Solution:
1. Check all node credentials are configured
2. Verify workflow has no validation errors
3. Manual activation via N8N dashboard
```

### Debug Mode
```bash
# Enable debug logging:
DEBUG_MODE=true node scripts/n8n-auto-deploy.js
```

## 🌐 Alternative Deployment Methods

### Browser Automation (Fallback)
If API deployment fails:
```bash
# Install browser automation dependencies:
cd scripts
npm install
npm run install-browsers

# Run browser automation:
npm run playwright
```

### Manual Web Interface
1. Visit: https://lionalpha.app.n8n.cloud
2. Navigate to workflow: VGhKEfrpJU47onvi
3. Import `n8n-workflows/production-workflow-config.json`
4. Configure credentials manually
5. Activate workflow

## 📊 Success Metrics

### Expected Results
- **Target Audience**: ~650 inactive users
- **Expected Response Rate**: 25-35%
- **Projected Conversions**: 162-227 reactivations
- **ROI Target**: 11,700%
- **Revenue Projection**: R$ 175,500

### Performance Monitoring
- Message delivery rate: >95%
- Response time: <30 seconds per message
- Error rate: <5%
- Campaign completion: <2 hours

## 🔐 Security Considerations

### Credential Management
- API tokens stored in environment files (not in code)
- Google Service Account with minimal required permissions
- WAHA token with session-specific access
- Webhook secrets for secure communication

### Data Protection
- LGPD compliance for Brazilian data protection
- Audit logging for all operations
- Secure credential storage
- Rate limiting to prevent abuse

## 📞 Support & Maintenance

### Regular Tasks
- Monitor campaign performance
- Update message templates
- Refresh user segmentation
- Verify credential validity

### Emergency Procedures
- Manual workflow deactivation
- Campaign pause/resume
- Error notification handling
- Backup deployment options

---

## 🎉 Deployment Complete!

After successful deployment:

1. **✅ Verify Dashboard**: Check https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi
2. **✅ Test Execution**: Run a small test batch
3. **✅ Monitor Performance**: Watch execution logs
4. **✅ Launch Campaign**: Deploy to full 650-user audience

**Campaign Status**: Ready for 650 inactive user reactivation
**Expected ROI**: 11,700%
**Automation**: Fully configured and active

---

*Generated by FullForce Academia N8N Auto-Deployment System*