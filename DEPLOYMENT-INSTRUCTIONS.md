# FullForce Academia - Deployment Instructions

## 🎯 Campaign Overview
- **Target**: 650 inactive users
- **Expected ROI**: R$ 11,700
- **Platform**: N8N + WAHA + Google Sheets
- **Workflow ID**: VGhKEfrpJU47onvi

## 📋 Pre-Deployment Checklist

### ✅ Files Ready
- [x] N8N Workflow Configuration: `n8n-workflows/complete-workflow-config.json`
- [x] Google Service Account: `config/google-service-account.json`
- [x] Environment Configuration: `.env.n8n`
- [x] Deployment Scripts: `scripts/n8n-auto-deploy.js`

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
Edit the file `.env.n8n` and replace:
```
N8N_API_TOKEN=n8n_demo_token_replace_with_real
WAHA_TOKEN=waha_demo_token_replace_with_real
```

With your real tokens:
```
N8N_API_TOKEN=your_actual_n8n_token_here
WAHA_TOKEN=your_actual_waha_token_here
```

### Step 2: Execute Deployment
```bash
cd "C:\Users\User\Desktop\OneDrive\Aplicativos\FFMATUPA"
node scripts/n8n-auto-deploy.js
```

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
