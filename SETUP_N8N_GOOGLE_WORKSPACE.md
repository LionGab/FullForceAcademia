# 🔥 SETUP N8N CLOUD + GOOGLE WORKSPACE

## 🚀 **CONFIGURAÇÃO COMPLETA PARA ACADEMIA**

### **Seu Workspace Google:**
- ✅ **Email**: contato@primeliontecnologia.com
- ✅ **Domínio**: primeliontecnologia.com
- ✅ **Gerenciado**: Workspace Google

---

## 📋 **1. N8N CLOUD SETUP**

### **Acessar N8N Cloud:**
1. **Vá para**: https://n8n.cloud
2. **Fazer login com**: contato@primeliontecnologia.com
3. **Criar workspace**: "Academia Full Force"

### **Configurar Credenciais Google:**
1. **Google Sheets API**
   - Usar credenciais do workspace primeliontecnologia.com
   - Scope: `https://www.googleapis.com/auth/spreadsheets`

2. **Google OAuth2 API**
   - Client ID do workspace
   - Client Secret do workspace
   - Redirect URI: `https://app.n8n.cloud/rest/oauth2-credential/callback`

---

## 📊 **2. GOOGLE SHEETS ESTRUTURADO**

### **Criar Planilha no Google Workspace:**
1. **Drive do workspace**: drive.google.com
2. **Nova planilha**: "Academia Full Force - Sistema Conversão"
3. **Compartilhar com**: contato@primeliontecnologia.com (Editor)

### **Estrutura das 5 Abas:**

#### **ABA 1: ALUNOS**
```
A1: Nome
B1: Telefone
C1: Email
D1: Plano
E1: Status
F1: Última Atividade
G1: Frequência Mensal
H1: Valor Plano
```

#### **ABA 2: CONVERSAS**
```
A1: Telefone
B1: Nome
C1: Mensagem
D1: Intenção
E1: Prioridade
F1: Data_Hora
G1: Status
H1: Observações
```

#### **ABA 3: CAMPANHAS**
```
A1: Telefone
B1: Nome
C1: Urgência
D1: Data_Envio
E1: Status
F1: Tipo_Campanha
G1: Observações
```

#### **ABA 4: RESPOSTAS_ENVIADAS**
```
A1: Telefone
B1: Nome
C1: Prioridade
D1: Data_Hora
E1: Status
F1: Tipo
```

#### **ABA 5: RESULTADOS**
```
A1: Métrica
B1: Valor
C1: Data
D1: Meta
E1: % Atingido
```

---

## 🤖 **3. WORKFLOWS N8N CLOUD**

### **Upload dos Workflows:**
1. **Fazer upload de**:
   - `academia-reactivation-campaign-n8n.json`
   - `academia-webhook-responder-n8n.json`
   - `academia-whatsapp-n8n-workflow.json`

### **Configurar URLs dos Webhooks:**

#### **Webhook Principal:**
```
https://[SUA-INSTANCIA].app.n8n.cloud/webhook/academia-trigger
```

#### **Webhook Respostas WhatsApp:**
```
https://[SUA-INSTANCIA].app.n8n.cloud/webhook/whatsapp-response
```

---

## 🔗 **4. INTEGRAÇÃO WHATSAPP ↔ N8N**

### **Atualizar arquivo .env:**
```bash
# N8N Cloud
N8N_WEBHOOK_URL=https://[SUA-INSTANCIA].app.n8n.cloud/webhook/academia-trigger
N8N_RESPONSE_WEBHOOK=https://[SUA-INSTANCIA].app.n8n.cloud/webhook/whatsapp-response

# Google Workspace
GOOGLE_SHEETS_ID=[ID_DA_PLANILHA]
GOOGLE_WORKSPACE_EMAIL=contato@primeliontecnologia.com
```

### **Script de Integração:**
```javascript
// Adicionar ao whatsapp bot
async function sendToN8N(messageData) {
    try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
            evento: 'mensagem_recebida',
            dados: messageData,
            timestamp: new Date().toISOString(),
            workspace: 'primeliontecnologia.com'
        });
    } catch (error) {
        console.error('Erro N8N:', error);
    }
}
```

---

## 📱 **5. GOOGLE SHEETS API SETUP**

### **Ativar APIs no Google Cloud Console:**
1. **Console**: console.cloud.google.com
2. **Projeto**: Selecionar projeto do workspace
3. **APIs habilitadas**:
   - Google Sheets API
   - Google Drive API
   - Google OAuth2 API

### **Criar Credenciais de Serviço:**
1. **IAM & Admin** → **Service Accounts**
2. **Criar conta de serviço**: "n8n-academia-service"
3. **Baixar JSON** das credenciais
4. **Compartilhar planilha** com email da service account

---

## 🚀 **6. FLUXO DE AUTOMAÇÃO COMPLETO**

### **1. CAMPANHA DE REATIVAÇÃO:**
```
Trigger Manual/Schedule
    ↓
Carregar Base Google Sheets (Alunos Inativos)
    ↓
Segmentar por Urgência (Crítico/Alto/Médio)
    ↓
Gerar Mensagens Personalizadas
    ↓
Enviar via WhatsApp Bot (localhost:4001)
    ↓
Log na aba CAMPANHAS
```

### **2. RESPOSTA AUTOMÁTICA:**
```
WhatsApp Recebe Mensagem
    ↓
Webhook para N8N
    ↓
Analisar Intenção (IA/Regras)
    ↓
Gerar Resposta Apropriada
    ↓
Enviar via WhatsApp
    ↓
Log na aba CONVERSAS
```

---

## 💰 **7. DASHBOARD DE RESULTADOS**

### **Fórmulas Google Sheets:**

#### **Conversões (RESULTADOS B6):**
```
=COUNTIFS(Campanhas!F:F,"Reativação",Campanhas!E:E,"Convertido")
```

#### **Receita Recuperada (RESULTADOS B7):**
```
=SUMIFS(Alunos!H:H,Alunos!E:E,"Reativado",Alunos!F:F,">="&TODAY()-30)
```

#### **Taxa de Resposta (RESULTADOS B8):**
```
=COUNTA(Conversas!A:A)/COUNTA(Campanhas!A:A)*100
```

---

## 🎯 **8. PRÓXIMOS PASSOS IMEDIATOS:**

1. ✅ **WhatsApp Bot rodando** (localhost:4001)
2. 🔲 **Criar conta N8N Cloud** com contato@primeliontecnologia.com
3. 🔲 **Configurar Google Sheets** no workspace
4. 🔲 **Upload workflows** no N8N Cloud
5. 🔲 **Configurar credenciais** Google no N8N
6. 🔲 **Testar primeira campanha**

---

## 💡 **VANTAGENS DO SETUP:**

✅ **N8N Cloud**: Sem limites de workspace
✅ **Google Workspace**: Integração nativa
✅ **Escalabilidade**: Suporta milhares de mensagens
✅ **Monitoramento**: Dashboard em tempo real
✅ **Backup**: Tudo na nuvem Google

---

## 🔥 **RESULTADOS ESPERADOS:**

| KPI | Meta | Realista |
|-----|------|----------|
| 📈 Inativos | 650 | 650 |
| 📱 Respostas | 195 (30%) | 130 (20%) |
| 💰 Conversões | 65 (10%) | 39 (6%) |
| 💵 Receita/mês | R$ 5.850 | R$ 3.510 |
| 🎯 ROI | 1.200% | 720% |

**🚀 SISTEMA PROFISSIONAL PRONTO PARA ESCALAR! 💪**