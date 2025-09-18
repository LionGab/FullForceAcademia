# 🚀 WhatsApp Baileys + WAHA - Setup Simples para Academia

## 🎯 **Sistema Otimizado para Academias Pequenas**

### ⚡ **Stack Leve e Eficiente:**
- **Baileys** - Conexão direta WhatsApp (QR Code)
- **WAHA** - API HTTP para automação
- **N8N** - Workflows visuais (opcional)
- **Express** - Dashboard e endpoints

---

## 🚀 **Setup Rápido (5 minutos)**

### 1. **Instalar Dependências**
```bash
# Copiar arquivos essenciais
cp package-baileys-waha.json package.json
cp .env.baileys-waha .env

# Instalar pacotes
npm install
```

### 2. **Iniciar Docker Stack**
```bash
# Subir WAHA + N8N + PostgreSQL + Redis
docker-compose -f docker-compose-academia-waha.yml up -d

# Verificar status
docker-compose -f docker-compose-academia-waha.yml ps
```

### 3. **Configurar Ambiente**
```bash
# Editar configurações
nano .env

# Configurações principais:
ACADEMIA_NAME="Sua Academia"
ACADEMIA_PHONE="+5511999999999"
WAHA_API_KEY=sua_chave_secreta
```

### 4. **Iniciar Sistema**
```bash
# Modo desenvolvimento (com logs)
npm run dev

# Modo produção
npm start
```

### 5. **Conectar WhatsApp**
1. **QR Code aparecerá no terminal**
2. **Escanear com WhatsApp** no celular
3. **Aguardar confirmação** de conexão
4. **Testar envio** de mensagem

---

## 📊 **Endpoints Disponíveis**

### **Dashboard Principal**
- `http://localhost:4000` - Dashboard com status

### **Health Check**
- `GET http://localhost:4000/health` - Status do sistema

### **Envio de Mensagens**
```bash
# Via Baileys (conexão direta)
curl -X POST http://localhost:4000/send/baileys \
  -H "Content-Type: application/json" \
  -d '{"to": "+5511999999999", "message": "Teste Baileys"}'

# Via WAHA (API HTTP)
curl -X POST http://localhost:4000/send/waha \
  -H "Content-Type: application/json" \
  -d '{"to": "+5511999999999", "message": "Teste WAHA"}'
```

### **Webhook WAHA**
- `POST http://localhost:4000/webhook/waha` - Receber mensagens

---

## 🤖 **Respostas Automáticas Configuradas**

### **Comandos Disponíveis:**
- `ola`, `oi` → Saudação
- `menu` → Menu principal
- `planos` → Planos da academia
- `horarios` → Horários de funcionamento
- `endereco` → Localização
- `contato` → Chamar atendente
- `promocao` → Promoções ativas

### **Recursos Automáticos:**
- ✅ **Horário comercial** - Resposta fora do horário
- ✅ **Anti-spam** - Proteção contra spam
- ✅ **Rate limiting** - 10 msgs/minuto por contato
- ✅ **Cache inteligente** - Otimização de memória
- ✅ **Fallback WAHA** - Se Baileys falhar

---

## 🔧 **Configurações Docker**

### **Serviços Inclusos:**
- **WAHA** → `localhost:3000` (WhatsApp API)
- **N8N** → `localhost:5678` (Automação)
- **PostgreSQL** → `localhost:5432` (Database)
- **Redis** → `localhost:6379` (Cache)
- **Adminer** → `localhost:8080` (DB Manager)

### **Comandos Docker:**
```bash
# Iniciar todos os serviços
npm run docker:up

# Parar todos os serviços
npm run docker:down

# Ver logs em tempo real
npm run docker:logs

# Reset completo
npm run docker:down && npm run clean && npm run setup
```

---

## 💡 **Vantagens do Stack Baileys + WAHA**

### **✅ Baileys (Primário):**
- Conexão direta via QR Code
- Sem limitações de API
- Gratuito e estável
- Baixa latência

### **✅ WAHA (Backup):**
- API HTTP padronizada
- Webhooks automáticos
- Integração fácil N8N
- Escalabilidade

### **✅ Sistema Híbrido:**
- **Redundância**: Se Baileys falha → WAHA
- **Flexibilidade**: Dois métodos de envio
- **Performance**: Cache otimizado
- **Simplicidade**: Setup de 5 minutos

---

## 🎯 **Uso Recomendado**

### **Para Academia Pequena (ideal):**
```bash
# Setup simples
npm run setup

# Conectar WhatsApp via QR Code
npm start

# Pronto! Sistema funcionando
```

### **Para Múltiplas Academias:**
- Usar `fitness-academy-automation` (Business API)
- Este stack para desenvolvimento/teste

### **Para Integração N8N:**
1. Acessar `http://localhost:5678`
2. Criar workflows visuais
3. Webhook: `http://sistema:4000/webhook/waha`

---

## 🚨 **Troubleshooting**

### **Baileys não conecta:**
```bash
# Limpar sessão e reconectar
rm -rf baileys_auth
npm start
```

### **Docker não sobe:**
```bash
# Verificar Docker Desktop
docker --version
docker-compose --version

# Verificar portas
netstat -tulpn | grep :3000
```

### **WAHA não funciona:**
```bash
# Verificar container
docker logs academia-waha

# Testar API
curl http://localhost:3000/api/health
```

### **Rate limit ativo:**
- **Aguardar 1 minuto** para envio
- **Configurar** `.env` → `RATE_LIMIT_MESSAGES`

---

## 📈 **Próximos Passos**

### **Personalização:**
1. Editar respostas em `whatsapp-baileys-waha-simple.js`
2. Configurar horários em `.env`
3. Adicionar comandos personalizados

### **Integração:**
1. Conectar com sistema da academia
2. Adicionar Google Calendar/Sheets
3. Configurar webhooks personalizados

### **Produção:**
1. Usar PM2 para persistência
2. Configurar SSL/HTTPS
3. Backup automático sessões

---

## 🎉 **Sistema Pronto!**

**✅ Stack Baileys + WAHA configurado**
**✅ Respostas automáticas ativas**
**✅ Dashboard funcionando**
**✅ N8N integrado**
**✅ Cache otimizado**

**💪 Sua academia está digital!**