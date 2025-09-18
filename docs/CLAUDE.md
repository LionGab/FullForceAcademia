# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Academia WhatsApp Automation** is a Docker-based automation system for Full Force Academia (Matupá-MT) designed to reactivate 650 inactive members from a total of 1300 students through automated WhatsApp campaigns.

## Architecture

### Core Components

1. **N8N Automation Platform**: Workflow orchestration (http://localhost:5678)
   - PostgreSQL backend for N8N data persistence
   - Redis for queue management and caching
   - Custom workflows for WhatsApp campaign automation

2. **WhatsApp Integration**: Simple WhatsApp Web.js implementation
   - QR Code authentication via whatsapp-web.js
   - Express.js API for message sending and status monitoring
   - Local session persistence in Docker volumes

3. **Database Layer**:
   - PostgreSQL 13 for N8N workflows and execution data
   - Redis 7 for message queuing and rate limiting
   - Adminer web interface for database management (http://localhost:8081)

4. **Presentation Layer**:
   - Professional presentation dashboard (`index_melhorado_patched.html`)
   - ROI calculators and business metrics visualization
   - Full Force Academia branding and campaign materials

### Technology Stack

- **Containerization**: Docker Compose for multi-service orchestration
- **Backend**: Node.js 18 (WhatsApp service), N8N automation platform
- **Database**: PostgreSQL 13, Redis 7-alpine
- **WhatsApp**: whatsapp-web.js with Puppeteer for web automation
- **Frontend**: Vanilla HTML/CSS/JS with Montserrat typography

## Development Commands

### Environment Setup

```bash
# Start core N8N platform with database and Redis
docker-compose up -d

# Start WhatsApp service separately
docker-compose -f docker-compose-whatsapp.yml up -d

# View logs for debugging
docker-compose logs -f n8n
docker-compose -f docker-compose-whatsapp.yml logs -f whatsapp-api
```

### Service Access Points

```bash
# N8N Automation Platform
http://localhost:5678

# WhatsApp API endpoints
http://localhost:3001/status       # Connection status
http://localhost:3001/qr          # QR code generation status
http://localhost:3001/send-message # POST endpoint for sending messages

# Database management
http://localhost:8081              # Adminer (PostgreSQL GUI)
```

### WhatsApp Integration

```bash
# Check WhatsApp connection status
curl http://localhost:3001/status

# Send test message
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{"number": "5565999999999", "message": "Teste de automação"}'

# Monitor QR code generation
curl http://localhost:3001/qr
```

## Project Structure

```
├── docker-compose.yml              # Main N8N + PostgreSQL + Redis stack
├── docker-compose-whatsapp.yml     # WhatsApp Web.js service
├── whatsapp-simple/
│   └── server.js                   # WhatsApp API server (Express + whatsapp-web.js)
├── n8n/
│   └── workflows/                  # N8N workflow definitions (currently empty)
├── index_melhorado_patched.html    # Professional presentation dashboard
├── *.xls                          # Student data files (Alunos Ativos, Ausentes, Totais)
└── *.pdf                          # Academy documentation and reports
```

## Environment Configuration

### N8N Environment Variables
- `ACADEMIA_NAME=Full Force Academia`
- `ACADEMIA_LOCATION=Matupá-MT`
- `EX_STUDENTS_COUNT=561` (inactive members target)
- `MONTHLY_POTENTIAL=84150` (R$ revenue potential)
- `RATE_LIMIT_MESSAGES=20` (WhatsApp rate limiting)
- `DELAY_BETWEEN_MESSAGES=3000` (3 second delay between messages)

### Database Credentials
- PostgreSQL: `n8n/n8n_password@localhost:5432/n8n`
- Redis: `academia_redis_2024@localhost:6379`

### Network Configuration
- `academia_network`: Main Docker network for N8N services
- `whatsapp_network`: Isolated network for WhatsApp service

## Workflow Development

### N8N Workflow Patterns
- All workflows should integrate with the WhatsApp API via HTTP endpoints
- Use Redis for queue management to respect WhatsApp rate limits
- Implement proper error handling for message delivery failures
- Log all campaign activities for analytics and compliance

### WhatsApp Integration Patterns
- Format Brazilian phone numbers: `55XXXXXXXXXXX@c.us`
- Implement retry logic for failed message deliveries
- Monitor connection status before sending bulk messages
- Use webhook callbacks to N8N for response tracking

## Business Context

### Campaign Objectives
- **Target**: 650 inactive members (out of 1300 total)
- **Monthly Potential**: R$ 84,150 in reactivated revenue
- **Location**: Matupá-MT (Brazilian timezone: America/Sao_Paulo)
- **Rate Limiting**: 20 messages maximum with 3-second delays

### Data Sources
- `Alunos Ativos.xls`: Active members list
- `Alunos Ausentes.pdf`: Absent members report
- `Alunos Totais.xls`: Complete member database
- `Matriculas (4).xls`: Enrollment data

## Student Data Integration

### Google Sheets Data Sources
- **Active Students**: https://docs.google.com/spreadsheets/d/1fct6LX6IjkZtSvOPSfbm5AVwxpoXVdl7P54u9buGqNI/edit?gid=1568882620#gid=1568882620
- **General Students**: https://docs.google.com/spreadsheets/d/1QT4yy2AoI2gvnIxEhh31J8aq4c_yVJ_NCKk3bkgPo6w/edit?gid=142086563#gid=142086563

### Data Structure Analysis
- **Total Records**: ~500-600 unique student entries
- **Available Fields**: Nome completo, telefone, celular, email, idade, sexo
- **Contact Coverage**: Most entries have mobile numbers for WhatsApp
- **Missing Data**: No explicit active/inactive status, enrollment dates, or last activity

### Phone Number Formatting
Brazilian mobile format for Matupá-MT area code (65):
```bash
# Format examples for WhatsApp
+5565999999999  # Full international format
5565999999999   # National format
65999999999     # Local with area code
999999999       # Local only (will add 5565 prefix)
```

### Data Import Commands
```bash
# Import active students data
curl -H "Authorization: Bearer TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/1fct6LX6IjkZtSvOPSfbm5AVwxpoXVdl7P54u9buGqNI/values/A:Z"

# Import general students data
curl -H "Authorization: Bearer TOKEN" \
  "https://sheets.googleapis.com/v4/spreadsheets/1QT4yy2AoI2gvnIxEhh31J8aq4c_yVJ_NCKk3bkgPo6w/values/A:Z"
```

### Recommended Database Schema
```sql
-- Members table extension for Full Force Academia
CREATE TABLE academia_members (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    primeiro_nome VARCHAR(100),
    telefone VARCHAR(20),
    celular VARCHAR(20) NOT NULL,
    whatsapp_formatado VARCHAR(25), -- +5565999999999 format
    email VARCHAR(255),
    idade INTEGER,
    sexo CHAR(1),

    -- Activity classification
    status_atividade VARCHAR(20) DEFAULT 'unknown',
    dias_inativo INTEGER DEFAULT 0,
    classificacao_reativacao VARCHAR(10), -- QUENTE, MORNO, FRIO

    -- Campaign tracking
    tentativas_reativacao INTEGER DEFAULT 0,
    ultima_tentativa_reativacao TIMESTAMP,
    consentimento_lgpd BOOLEAN DEFAULT false,
    consentimento_marketing BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Campaign Strategy

### Target Segmentation (650 Inactive Members)
- **Priority 1 (QUENTE)**: 0-30 days inactive, high engagement (150 members)
- **Priority 2 (MORNO)**: 31-60 days inactive, medium engagement (200 members)
- **Priority 3 (FRIO)**: 61-90 days inactive, low engagement (200 members)
- **Priority 4 (CONGELADO)**: 90+ days inactive (100 members)

### Message Templates
```javascript
const messageTemplates = {
  QUENTE: "Oi {firstName}! 🏋️ Sentimos sua falta na Full Force! Que tal voltarmos aos treinos? Posso agendar um horário especial pra você essa semana? 💪",
  MORNO: "{firstName}, preparamos um PLANO DE RETORNO especial pra você! ✅ Avaliação gratuita ✅ Programa personalizado ✅ Acompanhamento exclusivo. Responda EU QUERO! 🔥",
  FRIO: "{firstName}, que tal uma SEGUNDA CHANCE? 🎯 Oferta especial: 🎁 7 dias grátis 🎁 Reavaliação completa 🎁 Novo plano de treino. Válido até o fim do mês!"
};
```

### LGPD Compliance Requirements
- **Data Consent**: Explicit consent for data processing
- **Marketing Consent**: Separate consent for WhatsApp campaigns
- **Opt-out Mechanism**: Easy unsubscribe via WhatsApp response
- **Data Retention**: Automatic cleanup after retention period
- **Audit Logging**: All data processing activities logged

## Development Notes

### WhatsApp Service Limitations
- Requires manual QR code scanning for initial authentication
- Session persistence handled via Docker volumes
- Rate limiting enforced to prevent WhatsApp blocking (20 msgs, 3s delay)
- No webhook integration currently active (commented out in server.js:76-80)

### Scalability Considerations
- Redis queuing system ready for high-volume campaigns
- PostgreSQL configured for N8N workflow persistence
- Docker volumes ensure data persistence across container restarts
- Separate networks for service isolation and security

### Security Requirements
- WhatsApp sessions stored in secure Docker volumes
- Database credentials configured via environment variables
- No authentication currently enabled on N8N (development setup)
- Network isolation between WhatsApp and main services
- LGPD compliance for Brazilian data protection laws