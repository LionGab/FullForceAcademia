# 🚀 FullForce Academia - N8N Integration

**Sistema Integrado de Automação para 650 Alunos Inativos | ROI Projetado: 11.700%**

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![ROI](https://img.shields.io/badge/ROI-11.700%25-brightgreen)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Integrated-25D366)
![N8N](https://img.shields.io/badge/N8N-Automated-orange)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Workflows N8N](#-workflows-n8n)
- [APIs e Endpoints](#-apis-e-endpoints)
- [Campanhas de Reativação](#-campanhas-de-reativação)
- [ROI Dashboard](#-roi-dashboard)
- [Testes e Validação](#-testes-e-validação)
- [Monitoramento](#-monitoramento)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O FullForce Academia N8N Integration é uma solução completa de automação que integra:

- **WhatsApp Business API** (via WAHA)
- **N8N Workflow Automation**
- **Google Sheets/Calendar APIs**
- **Sistema de Campanhas Inteligentes**
- **Follow-up Automático**
- **ROI Dashboard em Tempo Real**

### 🎯 Objetivos da Integração

- ✅ Automatizar campanhas para **650 alunos inativos**
- ✅ Segmentação inteligente por urgência (Crítica, Alta, Média, Baixa)
- ✅ Follow-up automático personalizado
- ✅ ROI projetado de **11.700%**
- ✅ Dashboard de monitoramento em tempo real

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google Sheets │    │       N8N       │    │   WhatsApp      │
│   650 Inativos  │◄──►│   Workflows     │◄──►│   Business API  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                FullForce Academia API                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Campaign    │ │ Scheduled   │ │ Google      │ │ N8N       │ │
│  │ Services    │ │ Messages    │ │ Integration │ │ Routes    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │   PostgreSQL    │    │   ROI Dashboard │
│   Job Queue     │    │   Database      │    │   Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Redis 6+
- PostgreSQL 13+ (opcional)
- N8N Server
- Google Cloud Service Account
- WhatsApp Business API (WAHA)

### 1. Clonagem e Dependências

```bash
cd "FullForceAcademia - Matupá"
npm install
npm run setup:n8n
```

### 2. Configuração de Ambiente

```bash
# Copiar arquivo de configuração
cp .env.n8n.example .env

# Configurar variáveis obrigatórias
nano .env
```

**Variáveis Críticas:**

```env
# N8N Configuration
N8N_URL="http://localhost:5678"
N8N_WEBHOOK_650_URL="http://localhost:5678/webhook/fullforce-650-campaign"
N8N_API_TOKEN="your-n8n-api-token"

# Google APIs
GOOGLE_SPREADSHEET_ID="1BvQhCgZJqL9T3XrM4NfP8QwHk6yS9cA2vD5eE8fF0gG"
GOOGLE_SERVICE_ACCOUNT_KEY_PATH="./config/google-service-account.json"

# WhatsApp/WAHA
WAHA_URL="http://localhost:3000"
WAHA_SESSION="default"

# Redis (para filas)
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 3. Configuração Google Cloud

1. **Criar Service Account:**
   ```bash
   # Baixar credentials do Google Cloud Console
   # Salvar em: ./config/google-service-account.json
   ```

2. **Permissões necessárias:**
   - Google Sheets API
   - Google Calendar API
   - Google Drive API (readonly)

### 4. Configuração N8N

1. **Instalar N8N:**
   ```bash
   npm install -g n8n
   # ou via Docker
   docker run -d --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Importar Workflow:**
   ```bash
   # Importar: n8n-workflow-650-inactive-users.json
   # URL: http://localhost:5678
   ```

### 5. Inicialização

```bash
# Modo desenvolvimento
npm run dev:n8n

# Modo produção
npm run start:n8n

# Com Docker
npm run docker:up
```

## 🔄 Workflows N8N

### Workflow Principal: "650 Alunos Inativos ROI 11.700%"

**Arquivo:** `n8n-workflow-650-inactive-users.json`

#### Fluxo do Workflow:

1. **🎯 Trigger** - Webhook: `/webhook/fullforce-650-campaign`
2. **📊 Carregar Dados** - Google Sheets: `Alunos_Inativos`
3. **🎯 Segmentação** - JavaScript: Classificação por urgência
4. **🔀 Roteamento** - Switch: Por tipo de urgência
5. **📱 Envio** - HTTP Request: Para API FullForce
6. **📝 Logging** - Google Sheets: `Campanhas_Log`
7. **📅 Follow-up** - Schedule: Agendamento automático

#### Segmentação Inteligente:

| Segmento | Dias Inativo | Conversão Esperada | Oferta |
|----------|--------------|-------------------|--------|
| **Críticos** | +90 dias | 35% | 60% OFF |
| **Moderados** | 60-90 dias | 25% | 50% OFF |
| **Baixa Freq** | 30-60 dias | 15% | Personal Grátis |
| **Prospects** | <30 dias | 8% | 7 dias grátis |

### Configuração do Webhook N8N:

```json
{
  "method": "POST",
  "url": "http://localhost:5678/webhook/fullforce-650-campaign",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "trigger": "manual",
    "timestamp": "2025-09-19T12:00:00Z",
    "source": "fullforce-api"
  }
}
```

## 🔌 APIs e Endpoints

### Endpoints Principais

#### 1. Trigger Campanha 650

```http
POST /api/trigger-650-campaign
Content-Type: application/json

Response:
{
  "success": true,
  "summary": {
    "totalProcessados": 650,
    "criticos": 150,
    "moderados": 200,
    "baixaFreq": 200,
    "prospects": 100,
    "projectedROI": "11700"
  }
}
```

#### 2. N8N Send Campaign

```http
POST /api/n8n/send-campaign
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "telefone": "5511999999999",
  "mensagem": "Mensagem personalizada",
  "nome": "Nome do Cliente",
  "urgencia": "CRITICA",
  "campanha": "650_reactivation",
  "expectedRevenue": 389.70,
  "conversionRate": 0.35
}
```

#### 3. Dashboard Analytics

```http
GET /api/dashboard

Response:
{
  "timestamp": "2025-09-19T12:00:00Z",
  "services": {
    "whatsapp": "connected",
    "google": "connected",
    "n8n": "connected"
  },
  "campaigns": {
    "total": 650,
    "sent": 500,
    "responses": 75,
    "conversions": 45
  }
}
```

#### 4. ROI Dashboard

```http
GET /api/n8n/roi-dashboard

Response:
{
  "roi": {
    "current": "8500",
    "projected": "11700",
    "investment": 1500,
    "revenue": 127500
  },
  "conversions": {
    "total": 45,
    "rate": "15.2",
    "bySegment": {
      "criticos": 25,
      "moderados": 15,
      "baixaFreq": 5
    }
  }
}
```

## 🎯 Campanhas de Reativação

### Sistema de Segmentação

#### Críticos (+90 dias)
- **Urgência:** MÁXIMA
- **Oferta:** 60% OFF
- **Follow-ups:** 6h, 24h, 72h
- **Conversão esperada:** 35%

```javascript
// Exemplo de mensagem crítica
🚨 *João*, ÚLTIMA CHANCE!

💔 120 dias sem você... SENTIMOS MUITO SUA FALTA!

🔥 *OFERTA EXCLUSIVA - SÓ HOJE:*
💰 VOLTA POR R$ 51,96 - 60% OFF!
⏰ *Expira em 6 HORAS*

💪 Sua saúde não pode esperar mais!

📞 Responda *SIM* agora ou perca para sempre!
```

#### Moderados (60-90 dias)
- **Urgência:** ALTA
- **Oferta:** 50% OFF
- **Follow-ups:** 12h, 48h, 1 semana
- **Conversão esperada:** 25%

#### Baixa Frequência (30-60 dias)
- **Urgência:** MÉDIA
- **Oferta:** Personal Trainer grátis
- **Follow-ups:** 24h, 1 semana
- **Conversão esperada:** 15%

#### Prospects (<30 dias)
- **Urgência:** BAIXA
- **Oferta:** 7 dias grátis
- **Follow-ups:** 3 dias, 2 semanas
- **Conversão esperada:** 8%

### Follow-up Automático

O sistema agenda automaticamente follow-ups baseados na urgência:

```javascript
// Configuração de delays
const followUpDelays = {
  'CRITICA': [6, 24, 72],    // horas
  'ALTA': [12, 48, 168],     // horas
  'MEDIA': [24, 168],        // horas
  'BAIXA': [72, 336]         // horas
};
```

## 📊 ROI Dashboard

### Métricas Principais

| Métrica | Valor | Status |
|---------|-------|--------|
| **Investimento Total** | R$ 1.500 | ✅ |
| **Receita Projetada** | R$ 177.000 | 📈 |
| **ROI Projetado** | 11.700% | 🎯 |
| **Alunos Esperados** | +195 | 👥 |

### Cálculo do ROI

```javascript
// Fórmula do ROI
const investment = 1500; // Custo da campanha
const revenue = (
  (criticos * 0.35 * avgValue * 6) +      // 35% dos críticos
  (moderados * 0.25 * avgValue * 6) +     // 25% dos moderados
  (baixaFreq * 0.15 * avgValue * 6) +     // 15% da baixa freq
  (prospects * 0.08 * avgValue * 3)       // 8% dos prospects
);

const roi = ((revenue - investment) / investment) * 100;
// Resultado esperado: 11.700%
```

### Dashboard em Tempo Real

Acesse: `http://localhost:3001/api/dashboard`

- 📊 **Campanhas enviadas** em tempo real
- 📱 **Responses recebidas** com classificação
- 💰 **ROI atual** vs projetado
- 🎯 **Taxa de conversão** por segmento
- ⏰ **Follow-ups agendados** e executados

## 🧪 Testes e Validação

### Executar Testes Completos

```bash
# Testes básicos de integração
npm run test:n8n

# Testes de carga (650 alunos)
npm run test:n8n:stress

# Trigger manual da campanha
npm run campaign:650

# Verificar dashboard
npm run dashboard:n8n
```

### Teste Manual Passo a Passo

1. **Verificar Health Check:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/n8n/health
   ```

2. **Testar Carregamento de Dados:**
   ```bash
   curl http://localhost:3001/api/google/inactive-members
   ```

3. **Executar Campanha Teste:**
   ```bash
   curl -X POST http://localhost:3001/api/trigger-650-campaign
   ```

4. **Monitorar Resultados:**
   ```bash
   curl http://localhost:3001/api/dashboard
   ```

### Validação de ROI

Execute o script de validação:

```bash
node scripts/test-n8n-integration.js
```

**Critérios de Sucesso:**
- ✅ Taxa de sucesso > 80%
- ✅ ROI projetado entre 10.000% - 15.000%
- ✅ Throughput > 5 msgs/segundo
- ✅ Todos os serviços conectados

## 📈 Monitoramento

### Logs em Tempo Real

```bash
# Logs da aplicação
npm run logs:app

# Logs N8N
npm run logs:n8n

# Logs WAHA
npm run logs:waha

# Monitor contínuo
npm run monitor:continuous
```

### Métricas de Performance

| Métrica | Meta | Atual |
|---------|------|-------|
| **Throughput** | >5 msgs/seg | 📊 |
| **Response Time** | <500ms | 📊 |
| **Error Rate** | <5% | 📊 |
| **Uptime** | >99% | 📊 |

### Alertas Automáticos

O sistema monitora:
- 🚨 **Falhas de conexão** WhatsApp/N8N/Google
- ⚠️ **Taxa de erro** acima de 5%
- 📉 **Queda no throughput**
- 💰 **ROI abaixo do esperado**

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. N8N não conecta

```bash
# Verificar se N8N está rodando
curl http://localhost:5678/healthz

# Reiniciar N8N
docker restart n8n

# Verificar logs
docker logs n8n
```

#### 2. Google Sheets erro de permissão

```bash
# Verificar service account
cat config/google-service-account.json

# Testar conexão
curl http://localhost:3001/api/google/health
```

#### 3. WhatsApp não envia

```bash
# Status do WAHA
curl http://localhost:3000/api/health

# Reiniciar sessão
curl -X POST http://localhost:3000/api/sessions/restart
```

#### 4. Redis/Fila não funciona

```bash
# Status Redis
redis-cli ping

# Limpar fila
curl -X POST http://localhost:3001/api/queue/clear
```

### Logs de Debug

Ativar debug mode:

```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Scripts de Diagnóstico

```bash
# Diagnóstico completo
node scripts/diagnostic.js

# Limpar e reiniciar
npm run cleanup:docker
npm run docker:rebuild
```

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] ✅ Todos os testes passando
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Google Service Account válido
- [ ] ✅ N8N workflows importados
- [ ] ✅ WhatsApp Business API configurado
- [ ] ✅ Redis rodando
- [ ] ✅ Backup configurado

### Comandos de Deploy

```bash
# Build produção
npm run docker:build

# Deploy com Docker
npm run docker:up

# Verificar status
npm run docker:status

# Monitorar logs
npm run monitor:services
```

### Monitoramento Pós-Deploy

1. **Primeira hora:** Verificar logs a cada 5 minutos
2. **Primeiras 24h:** Monitorar dashboard de ROI
3. **Primeira semana:** Analisar conversões e ajustar

---

## 📞 Suporte

Para suporte técnico:

- 📧 **Email:** dev@fullforceacademia.com.br
- 📱 **WhatsApp:** (65) 99999-9999
- 🐛 **Issues:** GitHub Issues
- 📚 **Docs:** [Documentação Completa](./docs/)

---

**🎯 FullForce Academia - Transformando 650 alunos inativos em receita de R$ 177.000 com ROI de 11.700%**

*Powered by N8N Workflow Automation | WhatsApp Business API | Google Cloud*