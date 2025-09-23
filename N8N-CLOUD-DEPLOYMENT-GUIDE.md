# FFMATUPA Fitness Academy - N8N Cloud Deployment Guide

## Overview

This guide will help you deploy and configure the FFMATUPA Fitness Academy WhatsApp automation workflow to work with n8n cloud at `https://lionalpha.app.n8n.cloud`.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WAHA API      │    │  WAHA-N8N Bridge │    │   N8N Cloud     │
│  (localhost:3000)│◄──►│ (localhost:3001) │◄──►│ lionalpha.app   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ WhatsApp Users  │    │   Lead Capture   │    │ Google Sheets   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prerequisites

1. **N8N Cloud Account**: Access to `https://lionalpha.app.n8n.cloud`
2. **WAHA API**: Running locally on port 3000 with API key `ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2`
3. **Google Sheets API**: Service account credentials configured
4. **WhatsApp Business API**: Access token and phone number ID

## Files Created/Modified

### New Files for N8N Cloud Integration:
- `n8n-cloud-config.json` - Configuration settings
- `.env.n8n-cloud` - Environment variables for n8n cloud
- `n8n-cloud-integration.js` - Integration utilities
- `waha-n8n-bridge.js` - Bridge server between WAHA and n8n cloud
- `executar-campanha-n8n-cloud.js` - Campaign executor for n8n cloud
- `N8N-CLOUD-DEPLOYMENT-GUIDE.md` - This deployment guide

### Original Files:
- `fitness-academy-disruptive-whatsapp-workflow.json` - Main workflow (ready for import)
- `executar-campanha-producao.js` - Original local campaign executor
- `start-fullforce-system.js` - System orchestrator
- `campanha-verao-executor.js` - Summer campaign executor

## Step-by-Step Deployment

### Step 1: Prepare N8N Cloud Environment

1. **Login to N8N Cloud**:
   ```
   https://lionalpha.app.n8n.cloud
   ```

2. **Set Environment Variables**:
   Copy variables from `.env.n8n-cloud` to your n8n cloud environment:
   ```
   N8N_CLOUD_URL=https://lionalpha.app.n8n.cloud
   WAHA_URL=http://localhost:3000
   WAHA_API_KEY=ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2
   WHATSAPP_PHONE_ID=your_whatsapp_phone_number_id
   GOOGLE_SHEETS_LEADS_ID=your_google_sheets_document_id
   MANAGER_WHATSAPP=5566999999999
   ```

### Step 2: Configure Credentials

1. **WhatsApp Business API Credentials**:
   - Type: `WhatsApp Business API`
   - Name: `WhatsApp Business API`
   - Add your access token and phone number ID

2. **Google Sheets Credentials**:
   - Type: `Google OAuth2 API`
   - Name: `Google Sheets Fitness Academy`
   - Upload the service account file from `config/google-service-account.json`

### Step 3: Import Workflow

1. **Import the Workflow**:
   - In n8n cloud, go to "Workflows" → "Import"
   - Upload `fitness-academy-disruptive-whatsapp-workflow.json`
   - The workflow will import with all nodes and connections

2. **Verify Webhook URLs**:
   - Lead Capture Webhook: `https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook`
   - WhatsApp Response Webhook: `https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses`

### Step 4: Setup Local Bridge (Required)

Since WAHA runs locally, you need the bridge to connect with n8n cloud:

1. **Start the WAHA-N8N Bridge**:
   ```bash
   node waha-n8n-bridge.js
   ```

   This starts a bridge server on `localhost:3001` that:
   - Receives webhooks from WAHA
   - Forwards messages to n8n cloud
   - Provides API endpoints for lead injection

2. **Configure WAHA Webhooks**:
   The bridge automatically configures WAHA to send webhooks to:
   ```
   http://localhost:3001/webhook/waha
   ```

### Step 5: Expose Local Services (Production Setup)

For production, you need to expose local services to n8n cloud:

#### Option A: Using ngrok (Recommended for testing)
```bash
# Expose WAHA API
ngrok http 3000

# Expose Bridge
ngrok http 3001
```

#### Option B: Using Cloudflare Tunnel (Recommended for production)
```bash
# Install cloudflared
# Create tunnel for WAHA
cloudflared tunnel --url http://localhost:3000

# Create tunnel for Bridge
cloudflared tunnel --url http://localhost:3001
```

Update the environment variables with the public URLs.

### Step 6: Test the Integration

1. **Test Connectivity**:
   ```bash
   node executar-campanha-n8n-cloud.js conectividade
   ```

2. **Test Campaign**:
   ```bash
   node executar-campanha-n8n-cloud.js teste
   ```

3. **Run Production Campaign**:
   ```bash
   node executar-campanha-n8n-cloud.js producao
   ```

## Workflow Nodes Explanation

### 1. Lead Capture Hub (Webhook)
- **URL**: `https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook`
- **Purpose**: Receives leads from website forms, social media, QR codes
- **Expected Data**:
  ```json
  {
    "source": "website_form|facebook_ads|instagram|qr_code|referral",
    "name": "Lead Name",
    "phone": "5566999999999",
    "email": "lead@email.com",
    "message": "Lead message",
    "interest": "fitness"
  }
  ```

### 2. AI Lead Qualification Engine (Code Node)
- **Purpose**: Analyzes and scores leads using AI
- **Output**: Qualified lead data with temperature (hot/warm/cold)

### 3. Analytics Dashboard (Google Sheets)
- **Purpose**: Logs all leads and analytics
- **Sheets**: `Leads_Dashboard`, `Conversations_Analytics`, `Follow_Up_Analytics`

### 4. WhatsApp Response Handler (Webhook)
- **URL**: `https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses`
- **Purpose**: Processes incoming WhatsApp messages
- **Expected Data**: WhatsApp Business API webhook format

### 5. AI Response Intelligence (Code Node)
- **Purpose**: Analyzes incoming messages with sentiment and intent detection
- **Output**: Processed response with suggested actions

### 6. Follow-up Automation (Cron + Code)
- **Purpose**: Daily follow-up sequences based on lead behavior
- **Schedule**: 9:00 AM daily for follow-ups, 6:00 PM for analytics

## Configuration Variables

Add these to your n8n cloud environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `WHATSAPP_PHONE_ID` | WhatsApp Business Phone ID | `1234567890` |
| `GOOGLE_SHEETS_LEADS_ID` | Google Sheets document ID | `1abc123def456` |
| `MANAGER_WHATSAPP` | Manager's WhatsApp for alerts | `5566999999999` |

## API Endpoints

### Bridge Endpoints (localhost:3001)
- `GET /health` - Health check
- `POST /api/inject-lead` - Manually inject leads
- `POST /api/send-message` - Send WhatsApp messages via WAHA
- `POST /api/test-n8n` - Test n8n cloud connectivity
- `GET /api/waha-status` - Check WAHA status

### N8N Cloud Webhooks
- `POST https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook` - Lead capture
- `POST https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses` - WhatsApp responses

## Monitoring and Analytics

### Real-time Monitoring
The workflow provides real-time analytics:
- Lead capture rates
- Response rates
- Conversion tracking
- ROI calculations
- Performance alerts

### Google Sheets Integration
Data is automatically logged to Google Sheets:
- **Leads_Dashboard**: All captured leads
- **Conversations_Analytics**: Message analysis
- **Follow_Up_Analytics**: Follow-up performance
- **Daily_Performance**: Daily metrics and ROI

### Performance Alerts
Automatic alerts are sent to manager when:
- Response rate < 25%
- Daily conversions < 2
- ROI below target

## Campaign Execution

### Test Mode
```bash
node executar-campanha-n8n-cloud.js teste
```
- Tests connectivity
- Sends 5 sample leads
- Simulates responses

### Production Mode
```bash
node executar-campanha-n8n-cloud.js producao
```
- Processes 50 leads in batches
- Real WhatsApp integration
- Full analytics and reporting

## Troubleshooting

### Common Issues

1. **N8N Cloud Not Accessible**:
   - Check internet connection
   - Verify n8n cloud URL
   - Check firewall settings

2. **WAHA Connection Failed**:
   - Ensure WAHA is running on port 3000
   - Check API key configuration
   - Verify WhatsApp session status

3. **Bridge Not Working**:
   - Restart bridge: `node waha-n8n-bridge.js`
   - Check port 3001 availability
   - Verify webhook configuration

4. **Webhook Not Receiving Data**:
   - Check webhook URLs in n8n cloud
   - Verify payload format
   - Check n8n cloud execution logs

### Debug Commands

```bash
# Test WAHA connectivity
curl http://localhost:3000/api/status

# Test Bridge health
curl http://localhost:3001/health

# Test N8N webhook
curl -X POST https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook \
  -H "Content-Type: application/json" \
  -d '{"source":"test","name":"Test User","phone":"5566999999999"}'
```

## Security Considerations

1. **API Keys**: Store securely in n8n cloud environment variables
2. **Webhooks**: Use HTTPS for all webhook URLs
3. **WAHA Access**: Limit access to local network or use VPN
4. **Google Sheets**: Use service account with minimal permissions

## Scaling Considerations

1. **Rate Limits**: Configure message rate limits in environment
2. **Batch Processing**: Process leads in smaller batches for cloud
3. **Error Handling**: Implement retry logic for failed requests
4. **Load Balancing**: Consider multiple WAHA instances for high volume

## Support and Maintenance

### Regular Tasks
- Monitor WAHA session status
- Check Google Sheets API quotas
- Review n8n cloud execution logs
- Update WhatsApp Business API tokens

### Backup Strategy
- Export n8n workflows regularly
- Backup Google Sheets data
- Maintain local copies of configuration

## Next Steps

After deployment:
1. Monitor initial test campaigns
2. Adjust message templates based on performance
3. Scale batch sizes based on response rates
4. Implement additional analytics dashboards
5. Consider multi-language support

## Contact and Support

For issues or questions:
- Check n8n cloud logs for workflow errors
- Review WAHA API documentation
- Monitor bridge server logs
- Test individual components separately

---

**FFMATUPA Fitness Academy N8N Cloud Integration**
*Transforming fitness marketing with AI-powered automation*