# 🔗 Google Sheets N8N WhatsApp Integration

Complete integration system for automating WhatsApp campaigns using Google Sheets data, N8N workflows, and WAHA WhatsApp API.

## 📋 Overview

This integration connects:
- **Google Sheets**: Source of inactive user data
- **N8N Cloud**: Workflow automation platform
- **WAHA**: WhatsApp HTTP API
- **Local System**: Campaign management and metrics

### 📊 Data Flow

```
Google Sheets → N8N Reader → User Segmentation → WhatsApp Automation → Results Tracking
```

## 🚀 Quick Start

### 1. Setup Integration
```bash
npm run integration:setup
```

### 2. Validate Configuration
```bash
npm run integration:validate
```

### 3. Test Integration
```bash
npm run integration:test
```

### 4. Start Integration
```bash
npm run integration:start
```

## 📂 File Structure

```
├── config/
│   ├── google-service-account.json       # Google API credentials
│   ├── google-sheets-n8n-config.json     # Integration configuration
│   ├── webhook-endpoints.json            # Webhook definitions
│   └── error-handling-config.json        # Error handling rules
│
├── n8n-workflows/
│   ├── google-sheets-inactive-users-reader.json  # Sheets reader workflow
│   ├── whatsapp-waha-automation.json             # WhatsApp automation
│   └── campaign-650-main-workflow.json           # Main campaign workflow
│
├── scripts/
│   ├── setup-google-sheets-integration.js        # Setup script
│   └── google-sheets-n8n-integration.js          # Main integration script
│
└── logs/
    ├── google-sheets.log                 # Sheets integration logs
    ├── n8n-integration.log              # N8N workflow logs
    ├── waha-whatsapp.log                # WhatsApp automation logs
    └── campaign-metrics.log             # Campaign performance logs
```

## ⚙️ Configuration

### Google Sheets Setup

1. **Spreadsheet URL**: `https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit?usp=sharing`

2. **Required Sheets**:
   - `Usuarios_Inativos`: Inactive users data
   - `Resultados_Campanha`: Campaign results (auto-created)

3. **Required Columns** (Usuarios_Inativos):
   ```
   A: nome              - User name
   B: telefone          - Phone number (with country code)
   C: email             - Email address
   D: dataRegistro      - Registration date
   E: ultimaAtividade   - Last activity date
   F: diasInativo       - Days inactive
   G: segmento          - User segment (CRITICA/ALTA/MEDIA/BAIXA)
   H: valorMensalidade  - Monthly fee
   I: historicoPagemento - Payment history (months)
   J: motivoInatividade - Inactivity reason
   K: tentativasContato - Contact attempts
   L: status            - Current status
   M: observacoes       - Observations
   ```

### N8N Workflows

Import these workflows to your N8N instance:

1. **Google Sheets Reader** (`google-sheets-inactive-users-reader.json`)
   - Reads data from Google Sheets every 5 minutes
   - Validates and processes user data
   - Triggers campaign workflow

2. **WhatsApp Automation** (`whatsapp-waha-automation.json`)
   - Manages WhatsApp message sending via WAHA
   - Handles batch processing and delays
   - Tracks delivery results

3. **Campaign 650** (`campaign-650-main-workflow.json`)
   - Main campaign orchestration
   - User segmentation and ROI tracking
   - Success/optimization alerts

### WAHA Configuration

Ensure WAHA is running on `http://localhost:3000` with session `fullforce-session`.

## 🎯 User Segmentation

Users are automatically segmented based on:

### CRITICA (Critical - 35% conversion rate)
- **Days Inactive**: 7-30 days
- **Payment History**: 6+ months
- **Monthly Value**: R$ 100+
- **Priority**: Highest
- **Delay**: Immediate

### ALTA (High - 25% conversion rate)
- **Days Inactive**: 31-60 days
- **Payment History**: 3+ months
- **Monthly Value**: R$ 80+
- **Priority**: High
- **Delay**: 1 hour

### MEDIA (Medium - 15% conversion rate)
- **Days Inactive**: 61-90 days
- **Payment History**: 1+ months
- **Monthly Value**: R$ 60+
- **Priority**: Medium
- **Delay**: 2 hours

### BAIXA (Low - 8% conversion rate)
- **Days Inactive**: 91+ days
- **Payment History**: Any
- **Monthly Value**: Any
- **Priority**: Low
- **Delay**: 3 hours

## 💬 WhatsApp Message Templates

### CRITICA Segment
```
Olá {nome}! 👋 Sentimos sua falta na academia Full Force! 💪

Notamos que você não tem vindo aos treinos ultimamente. Que tal retomar sua jornada fitness? Temos uma oferta especial esperando por você! 🎯

Vamos conversar? Estamos aqui para te apoiar! 💚
```

### ALTA Segment
```
Oi {nome}! 🌟 Como você está?

Notamos que você não tem aparecido na academia Full Force. Sabemos que a vida anda corrida, mas sua saúde é prioridade! 🏋️‍♂️

Que tal voltarmos aos treinos? Temos horários flexíveis e um time incrível te esperando! 💪
```

### MEDIA Segment
```
Olá {nome}! 😊

Sua saúde e bem-estar são importantes para nós na academia Full Force! 🌿

Sabemos que às vezes é difícil manter a rotina, mas estamos aqui para te ajudar. Que tal voltarmos aos treinos? Temos novidades especiais para você! ✨
```

### BAIXA Segment
```
Oi {nome}! 👋

Lembra da academia Full Force? 🏋️‍♀️ Sabemos que faz um tempo, mas sua vaga ainda está aqui te esperando!

Temos promoções especiais para ex-alunos e muitas novidades. Que tal dar uma passadinha para conhecer? 😊
```

## 🔗 Webhook Endpoints

### N8N Cloud Webhooks
- **Manual Trigger**: `https://lionalpha.app.n8n.cloud/webhook/google-sheets-manual-trigger`
- **Campaign Trigger**: `https://lionalpha.app.n8n.cloud/webhook/campaign-650-trigger`
- **WAHA Automation**: `https://lionalpha.app.n8n.cloud/webhook/whatsapp-waha-trigger`

### Local Endpoints
- **WAHA Webhook**: `http://localhost:3005/webhook/waha`
- **Campaign Metrics**: `http://localhost:3005/api/campaigns/update-batch-results`
- **Dashboard**: `http://localhost:3005/api/dashboard`

## 📊 Monitoring & Logging

### Log Files
- `./logs/google-sheets.log` - Google Sheets integration
- `./logs/n8n-integration.log` - N8N workflow execution
- `./logs/waha-whatsapp.log` - WhatsApp message sending
- `./logs/campaign-metrics.log` - Campaign performance
- `./logs/error.log` - System errors

### Health Checks
```bash
npm run integration:verify
```

### Dashboard Access
```bash
npm run dashboard:n8n
```

## 🚨 Error Handling

### Automatic Recovery
- **Network Errors**: 3 retry attempts with exponential backoff
- **Rate Limits**: Automatic delay and retry
- **Service Failures**: Circuit breaker pattern
- **Data Validation**: Error logging with fallback

### Monitoring Alerts
- **High Error Rate**: Email + webhook notification
- **Service Down**: Immediate admin notification
- **Campaign Failures**: Automatic pause and review

### Circuit Breaker
- **Google Sheets**: 5 failures → 60s timeout
- **N8N**: 8 failures → 45s timeout
- **WAHA**: 15 failures → 30s timeout

## 🧪 Testing

### Manual Tests
```bash
# Test Google Sheets connection
npm run sheets:test

# Test webhook endpoints
npm run integration:test

# Trigger manual Google Sheets read
npm run sheets:manual
```

### Automated Testing
```bash
# Run full integration test
npm run integration:test

# Validate configurations only
npm run integration:validate
```

## 🔧 Troubleshooting

### Common Issues

#### Google Sheets Access Denied
```bash
# Check service account permissions
cat config/google-service-account.json
# Ensure service account email has access to spreadsheet
```

#### N8N Webhook Not Found
```bash
# Import workflows to N8N
# Check webhook URLs in N8N interface
```

#### WAHA Session Not Working
```bash
# Check WAHA service status
curl http://localhost:3000/api/health

# Check session status
curl http://localhost:3000/api/sessions/fullforce-session/status
```

#### High Error Rates
```bash
# Check error logs
tail -f logs/error.log

# Check service health
npm run integration:verify
```

### Performance Optimization

#### Batch Processing
- **Default Batch Size**: 20 users per batch
- **Delay Between Batches**: 30 seconds
- **Segment Delays**: 1-3 hours between segments

#### Rate Limiting
- **Google Sheets**: 100 requests/15 minutes
- **WAHA**: 50 messages/minute
- **N8N**: No specific limits

## 📈 Campaign Metrics

### Expected ROI
- **Investment**: R$ 1,500
- **Target ROI**: 2,250%+ (R$ 33,750+ revenue)
- **Conversion Rates**: 8-35% by segment
- **Monthly Value**: R$ 129.90 average

### Success Metrics
- **Messages Sent**: Target 650 users
- **Response Rate**: Monitor via dashboard
- **Conversion Rate**: Track by segment
- **Revenue Impact**: Calculate ROI automatically

## 🔄 Integration Commands

```bash
# Setup and Configuration
npm run integration:setup          # Complete setup process
npm run integration:validate       # Validate configurations
npm run integration:verify         # Verify service connections

# Execution
npm run integration:start          # Start integration
npm run integration:start:force    # Force refresh and start
npm run integration:test           # Run integration test

# Manual Operations
npm run sheets:manual              # Manual Google Sheets trigger
npm run sheets:test                # Test Google Sheets connection

# Monitoring
npm run dashboard:n8n              # Open dashboard
npm run health:all                 # Check all services
```

## 🆘 Support

### Log Analysis
```bash
# View recent errors
tail -n 100 logs/error.log

# Monitor real-time activity
tail -f logs/google-sheets.log

# Check campaign metrics
tail -f logs/campaign-metrics.log
```

### Service Status
```bash
# Check all services
npm run health:all

# Check individual services
curl http://localhost:3000/api/health  # WAHA
curl http://localhost:3005/health      # Local API
```

### Emergency Procedures

#### Stop All Campaigns
```bash
# Kill all background processes
pkill -f "n8n"
pkill -f "waha"
```

#### Reset Integration
```bash
# Clear logs and restart
rm -rf logs/*
npm run integration:setup
```

---

## 📞 Contact

For technical support or questions about this integration:
- **Project**: FullForce Academia WhatsApp Automation
- **Documentation**: This file
- **Logs Location**: `./logs/`
- **Configuration**: `./config/`

**Important**: Always backup your configurations before making changes!