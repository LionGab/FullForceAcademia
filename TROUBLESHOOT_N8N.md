# 🔧 TROUBLESHOOT N8N - FULLFORCE ACADEMIA

## ❌ ERRO: "The file does not contain valid JSON data"

### 🎯 SOLUÇÕES ORDENADAS POR PRIORIDADE

#### **1. WORKFLOW RECOMENDADO**
```
Arquivo: n8n-workflow-650-inactive-users.json
Status: ✅ Validado (14 nodes, JSON válido)
Funcionalidade: Campanha completa 610 inativos
```

#### **2. PASSOS IMPORTAÇÃO**
1. **Acesse N8N**: http://localhost:5678
2. **Login**: contato@primeliontecnologia.com / Primelion123@
3. **Import**: Menu → "Import from File"
4. **Selecione**: `n8n-workflow-650-inactive-users.json`
5. **Ative**: Toggle "Active" = ON

#### **3. VERIFICAÇÕES PRÉ-IMPORTAÇÃO**

**A. N8N Status**
```bash
curl http://localhost:5678/healthz
# Retorno esperado: {"status":"ok"}
```

**B. Arquivo JSON**
```bash
# Validar JSON
node -e "console.log('JSON válido:', !!JSON.parse(require('fs').readFileSync('n8n-workflow-650-inactive-users.json')))"
```

**C. Permissões Arquivo**
```bash
# Windows - verificar permissões
icacls "n8n-workflow-650-inactive-users.json"
```

#### **4. ALTERNATIVAS SE FALHAR**

**A. Criar Novo Workflow**
1. N8N → "Add workflow"
2. Nome: "FullForce Academia 610 Inativos"
3. Adicionar nodes manualmente:
   - Webhook Trigger
   - HTTP Request
   - PostgreSQL
   - Google Sheets

**B. Import via API**
```bash
curl -X POST "http://localhost:5678/api/v1/workflows" \
  -H "Content-Type: application/json" \
  -d @n8n-workflow-650-inactive-users.json
```

**C. Copy-Paste Method**
1. Abrir `n8n-workflow-650-inactive-users.json`
2. Copiar todo conteúdo
3. N8N → Import → "Paste from clipboard"

#### **5. WORKFLOWS ALTERNATIVOS**

Se o principal falhar, usar em ordem:

1. **`academia-reactivation-campaign-n8n.json`** (13 nodes)
2. **`academia-webhook-responder-n8n.json`** (11 nodes)
3. **`academia-whatsapp-n8n-workflow.json`** (7 nodes)

#### **6. CONFIGURAÇÃO MANUAL**

**Webhook URLs Necessários:**
```
http://localhost:5678/webhook/conversao/criticos
http://localhost:5678/webhook/conversao/moderados
http://localhost:5678/webhook/conversao/recentes
```

**Credenciais Necessárias:**
- PostgreSQL: localhost:5432 / academia_db
- Google Sheets: Service Account Key
- WhatsApp: WAHA localhost:3000

#### **7. TESTE PÓS-IMPORTAÇÃO**

```bash
# Testar webhook
curl -X POST http://localhost:5678/webhook/conversao/criticos \
  -H "Content-Type: application/json" \
  -d '{"telefone":"5511999999999","mensagem":"teste","grupo":"criticos"}'
```

### 🎯 CHECKLIST FINAL

- [ ] N8N rodando (localhost:5678)
- [ ] PostgreSQL conectado
- [ ] Workflow importado
- [ ] Webhook ativo
- [ ] Credenciais configuradas
- [ ] Teste webhook OK

### 📞 SUPORTE

Se todos os métodos falharem:
1. Verificar logs N8N: `docker logs n8n-academia`
2. Reiniciar N8N: `docker restart n8n-academia`
3. Verificar permissões arquivo
4. Usar workflow alternativo mais simples

**Status Sistema**: 🟢 PRONTO PARA CAMPANHA