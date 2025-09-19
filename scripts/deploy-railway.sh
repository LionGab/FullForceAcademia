#!/bin/bash

# Deploy WAHA WhatsApp API to Railway for FullForce Academia
# Script para deploy automático do WAHA API no Railway

set -e

echo "🚀 Iniciando deploy WAHA para Railway..."

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado. Instalando..."
    npm install -g @railway/cli
fi

# Verificar se está logado no Railway
echo "🔐 Verificando autenticação Railway..."
if ! railway whoami &> /dev/null; then
    echo "🔑 Faça login no Railway:"
    railway login
fi

# Criar projeto no Railway se não existir
echo "📦 Configurando projeto Railway..."
if [ ! -f "railway.toml" ]; then
    railway init --name "fullforce-academia-waha"
fi

# Configurar variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."

# Variáveis essenciais do WAHA
railway variables set WAHA_API_KEY="academia_secure_key_2024_railway"
railway variables set WAHA_LOG_LEVEL="info"
railway variables set WAHA_LOG_FORMAT="json"
railway variables set WHATSAPP_DEFAULT_ENGINE="WEBJS"
railway variables set WHATSAPP_RESTART_ALL_SESSIONS="true"
railway variables set WHATSAPP_START_SESSION="default"

# Configuração de webhook (será atualizada após deploy)
railway variables set WAHA_WEBHOOK_EVENTS="message,session.status,session.upsert"
railway variables set WAHA_WEBHOOK_RETRIES="3"

# Configuração de sessão
railway variables set WAHA_SESSIONS_START_ON_STARTUP="true"
railway variables set WAHA_SESSIONS_STOP_ON_LOGOUT="false"

# Performance
railway variables set WAHA_MAX_SESSIONS="50"
railway variables set WAHA_PROXY_ENABLED="false"

# Segurança
railway variables set WAHA_API_KEY_HEADER="X-Api-Key"
railway variables set WAHA_CORS_ENABLED="true"

# FullForce Academia específico
railway variables set ACADEMIA_SESSION_NAME="fullforce-session"
railway variables set CAMPAIGN_BATCH_SIZE="50"
railway variables set CAMPAIGN_DELAY_BETWEEN_BATCHES="30000"
railway variables set AVG_MONTHLY_VALUE="129.90"

echo "💾 Criando arquivo de build Railway..."
cat > railway.toml << EOF
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.waha"

[deploy]
numReplicas = 1
sleepApplication = false
restartPolicyType = "ON_FAILURE"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"
EOF

# Deploy para Railway
echo "🚀 Fazendo deploy para Railway..."
railway up --detach

# Aguardar deploy
echo "⏳ Aguardando deploy completar..."
sleep 30

# Obter URL do deploy
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url')

if [ "$RAILWAY_URL" != "null" ] && [ "$RAILWAY_URL" != "" ]; then
    echo "✅ Deploy concluído!"
    echo "🌐 URL da aplicação: $RAILWAY_URL"

    # Configurar webhook URL
    railway variables set WEBHOOK_URL="$RAILWAY_URL/webhook/waha"

    echo "📊 Dashboard WAHA: $RAILWAY_URL"
    echo "🔗 Webhook configurado: $RAILWAY_URL/webhook/waha"
    echo "🔑 API Key: academia_secure_key_2024_railway"

    # Criar sessão WhatsApp automaticamente
    echo "📱 Criando sessão WhatsApp..."
    curl -X POST "$RAILWAY_URL/api/sessions" \
        -H "X-Api-Key: academia_secure_key_2024_railway" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "fullforce-session",
            "config": {
                "webhooks": [
                    {
                        "url": "'$RAILWAY_URL'/webhook/waha",
                        "events": ["message", "session.status", "session.upsert"]
                    }
                ]
            }
        }'

    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Acesse $RAILWAY_URL e escaneie o QR Code"
    echo "2. Configure o webhook na aplicação FullForce Academia"
    echo "3. Teste o envio de mensagens via API"
    echo ""
    echo "📚 Documentação da API: $RAILWAY_URL/docs"

else
    echo "❌ Erro no deploy. Verifique os logs:"
    railway logs
fi

echo "✅ Script de deploy concluído!"