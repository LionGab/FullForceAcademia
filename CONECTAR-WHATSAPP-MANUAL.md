# 🚀 CONEXÃO WHATSAPP CLIENTE - MANUAL URGENTE

## ⚡ WAHA ESTÁ FUNCIONANDO!

✅ **WAHA API**: http://localhost:3000
✅ **Interface Web**: Swagger disponível
✅ **Docker Container**: Rodando corretamente

---

## 📱 PASSOS PARA CONECTAR WHATSAPP:

### 1️⃣ Acesse a Interface Web
```bash
# Abrir no navegador:
http://localhost:3000
```

### 2️⃣ Na Interface Swagger:

1. **Criar Sessão**:
   - Encontre: `POST /api/sessions`
   - Clique em "Try it out"
   - Use este JSON:
   ```json
   {
     "name": "cliente-academia",
     "config": {
       "webhooks": []
     }
   }
   ```
   - Clique "Execute"

2. **Iniciar Sessão**:
   - Encontre: `POST /api/sessions/{session}/start`
   - Session: `cliente-academia`
   - Clique "Execute"

3. **Obter QR Code**:
   - Encontre: `GET /api/screenshot`
   - Session: `cliente-academia`
   - Clique "Execute"
   - Baixe a imagem do QR Code

### 3️⃣ Escaneie com WhatsApp:
1. 📱 Abra WhatsApp no celular
2. ⚙️ Configurações > WhatsApp Web
3. 📷 Escaneie o QR Code baixado
4. ✅ Aguarde confirmação

### 4️⃣ Verificar Conexão:
- Use: `GET /api/sessions/{session}`
- Status deve ser: `WORKING`

---

## 🎯 ENDPOINTS IMPORTANTES:

### Enviar Mensagem:
```bash
POST /api/sendText
{
  "session": "cliente-academia",
  "chatId": "5566999999999@c.us",
  "text": "Mensagem teste"
}
```

### Verificar Status:
```bash
GET /api/sessions/cliente-academia
```

### Obter Screenshot:
```bash
GET /api/screenshot?session=cliente-academia
```

---

## 🔧 COMANDOS RÁPIDOS:

### Via cURL:
```bash
# Criar sessão
curl -X POST "http://localhost:3000/api/sessions" \
  -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2" \
  -H "Content-Type: application/json" \
  -d '{"name":"cliente-academia","config":{"webhooks":[]}}'

# Iniciar sessão
curl -X POST "http://localhost:3000/api/sessions/cliente-academia/start" \
  -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2"

# Obter screenshot/QR
curl -X GET "http://localhost:3000/api/screenshot?session=cliente-academia" \
  -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2" \
  --output qr-code.png

# Verificar status
curl -X GET "http://localhost:3000/api/sessions/cliente-academia" \
  -H "X-Api-Key: ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2"
```

---

## 📊 INTEGRAÇÃO COM N8N:

Após conectar o WhatsApp:

1. **Configure webhooks no N8N Cloud**
2. **Use o bridge**: `waha-n8n-bridge.js`
3. **Execute campanhas**: Scripts disponíveis

---

## 🚨 RESOLUÇÃO DE PROBLEMAS:

### QR Code não aparece:
- Aguarde 30 segundos após iniciar sessão
- Use a interface web no navegador
- Verifique se a sessão está no status `SCAN_QR_CODE`

### Erro 401/422:
- Verifique API Key: `ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2`
- Use a interface web como fallback

### Session não inicia:
- Pare e reinicie a sessão
- Use nome único para a sessão

---

## ✅ SISTEMA PRONTO!

**WAHA Local**: ✅ Funcionando
**Scripts**: ✅ Configurados
**N8N Integration**: ✅ Disponível
**WhatsApp Connection**: 🔄 Aguardando escaneamento

Execute os passos acima para conectar o WhatsApp do cliente **AGORA**!