# 🔥 FullForce Academia - WhatsApp Baileys + WAHA Stack

Sistema WhatsApp completo e otimizado para academias pequenas, utilizando stack híbrido Baileys + WAHA.

## 🚀 **Stack Tecnológico Híbrido**

### **Conexões WhatsApp:**
- **🎯 Baileys** - Conexão direta via QR Code (primário)
- **🔌 WAHA** - API HTTP para automação (backup)
- **🤖 N8N** - Workflows visuais para automação
- **📊 Express** - Dashboard e endpoints

### **Infraestrutura:**
- **Docker Compose** - Orquestração completa
- **PostgreSQL** - Database persistente
- **Redis** - Cache e filas
- **Adminer** - Interface database

## ⚡ **Setup Rápido (5 minutos)**

### **1. Clone e Configure**
```bash
git clone https://github.com/LionGab/FullForceAcademia.git
cd FullForceAcademia

# Copiar configurações
cp .env.example .env
```

### **2. Configurar Ambiente**
```env
# Editar .env com suas configurações
ACADEMIA_NAME="Sua Academia"
ACADEMIA_PHONE="+5511999999999"
WAHA_API_KEY=sua_chave_secreta
```

### **3. Iniciar Sistema**
```bash
# Instalar dependências
npm install

# Subir stack Docker
npm run docker:up

# Iniciar WhatsApp Bot
npm start
```

### **4. Conectar WhatsApp**
1. **QR Code** aparecerá no terminal
2. **Escanear** com WhatsApp do celular
3. **Aguardar** confirmação de conexão
4. **Testar** enviando mensagem

## 📱 **Acesso aos Serviços**

- **🏠 Dashboard Principal**: http://localhost:4000
- **📊 Health Check**: http://localhost:4000/health
- **🤖 N8N Automação**: http://localhost:5678
- **🔌 WAHA API**: http://localhost:3000
- **🗄️ Database Manager**: http://localhost:8080

## 🎯 **Funcionalidades**

### **🤖 Respostas Automáticas**
- ✅ Saudações inteligentes
- ✅ Menu interativo
- ✅ Informações de planos
- ✅ Horários de funcionamento
- ✅ Localização da academia
- ✅ Conexão com atendente

### **⚡ Otimizações**
- ✅ **Anti-spam** - Proteção contra spam
- ✅ **Rate limiting** - 10 msgs/min por contato
- ✅ **Cache inteligente** - Otimização memória
- ✅ **Fallback automático** - WAHA se Baileys falhar
- ✅ **Horário comercial** - Resposta fora do horário
- ✅ **Limpeza automática** - Gestão de cache

### **🔄 Sistema Híbrido**
- **Baileys (Primário)**: Conexão direta, gratuita, QR Code
- **WAHA (Backup)**: API HTTP, webhooks, escalável
- **Redundância**: Se um falha, outro assume automaticamente

## 📡 **API Endpoints**

### **Envio de Mensagens**
```bash
# Via Baileys (conexão direta)
POST /send/baileys
{
  "to": "+5511999999999",
  "message": "Sua mensagem"
}

# Via WAHA (API HTTP)
POST /send/waha
{
  "to": "+5511999999999",
  "message": "Sua mensagem"
}
```

### **Webhooks**
```bash
# Receber mensagens WAHA
POST /webhook/waha

# Status do sistema
GET /health
```

## 🐳 **Docker Stack**

### **Serviços Inclusos:**
```yaml
services:
  waha:           # WhatsApp HTTP API
  n8n:            # Workflow Automation
  postgres:       # Database
  redis:          # Cache & Queues
  adminer:        # DB Management
```

### **Comandos Docker:**
```bash
npm run docker:up      # Iniciar todos os serviços
npm run docker:down    # Parar todos os serviços
npm run docker:logs    # Ver logs em tempo real
```

## 🎛️ **Comandos WhatsApp**

### **Usuários podem enviar:**
- `ola`, `oi` → Saudação personalizada
- `menu` → Menu principal completo
- `planos` → Informações de planos e preços
- `horarios` → Horários de funcionamento
- `endereco` → Localização da academia
- `contato` → Chamar atendente humano
- `promocao` → Promoções ativas

## 🔧 **Configuração Avançada**

### **Personalizar Respostas**
Editar `whatsapp-baileys-waha-simple.js`:
```javascript
const responses = {
    'planos': 'Suas informações de planos...',
    'horarios': 'Seus horários personalizados...'
    // Adicionar mais respostas
};
```

### **Configurar Horários**
Editar `.env`:
```env
BUSINESS_HOURS_START=6    # 6h
BUSINESS_HOURS_END=22     # 22h
BUSINESS_DAYS=1,2,3,4,5,6 # Segunda a Sábado
```

### **Integração N8N**
1. Acessar `localhost:5678`
2. Criar workflows visuais
3. Webhook: `http://localhost:4000/webhook/waha`
4. Automatizar campanhas e follow-ups

## 🚨 **Troubleshooting**

### **Baileys não conecta:**
```bash
# Limpar sessão
rm -rf baileys_auth
npm start
```

### **Docker não inicia:**
```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar portas ocupadas
netstat -tulpn | grep :3000
```

### **WAHA não responde:**
```bash
# Ver logs do container
docker logs academia-waha

# Testar API diretamente
curl http://localhost:3000/api/health
```

## 📈 **Roadmap**

### **Próximas Funcionalidades:**
- [ ] Dashboard analytics avançado
- [ ] Integração Google Calendar/Sheets
- [ ] Sistema de agendamento
- [ ] Campanhas de reativação
- [ ] Multi-academia support
- [ ] App mobile complementar

### **Melhorias Planejadas:**
- [ ] IA para respostas mais inteligentes
- [ ] Integração com sistemas de pagamento
- [ ] Bot de retenção de alunos
- [ ] Relatórios de conversão
- [ ] API para terceiros

## 🏋️ **Vantagens para Academia**

### **📈 Benefícios:**
- **Atendimento 24/7** - Cliente sempre atendido
- **Redução de custos** - Menos atendimento manual
- **Aumento conversão** - Respostas rápidas e precisas
- **Organização** - Todas as conversas centralizadas
- **Escalabilidade** - Cresce com a academia

### **💪 Resultados Esperados:**
- **+50% Eficiência** no atendimento
- **+30% Conversão** de leads
- **-70% Tempo resposta** médio
- **+90% Disponibilidade** do atendimento

## 📞 **Suporte**

### **Documentação:**
- **Setup**: `SETUP_BAILEYS_WAHA.md`
- **Configuração**: `.env.example`
- **Troubleshooting**: Este README

### **Contato:**
- **GitHub Issues**: Para bugs e sugestões
- **Email**: suporte@academia.com
- **WhatsApp**: Teste o próprio sistema! 😄

## 📄 **Licença**

MIT License - Livre para uso comercial e modificação.

---

**🔥 FullForce Academia - Stack Baileys + WAHA**
*Sistema WhatsApp híbrido, otimizado e pronto para produção!*

💪 **Transforme o atendimento da sua academia hoje mesmo!**