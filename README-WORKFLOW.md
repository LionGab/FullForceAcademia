# 🚀 Workflow N8N - Reativação Inativos FullForce

## ⚡ Configuração Rápida

### 1. Deploy Automático
```bash
cd C:\Users\User\Desktop\OneDrive\Aplicativos\FFMATUPA
node scripts/deploy-n8n-workflow.js
```

### 2. Configuração Manual no N8N

1. **Acesse:** https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi
2. **Import:** Use o arquivo `n8n-workflows/complete-workflow-config.json`
3. **Configure:**
   - Google Sheets: Usar service account já configurado
   - WAHA Token: Inserir token do WhatsApp
   - Ativar workflow

## 📊 Estrutura do Workflow

### Fluxo Principal:
1. **Google Sheets** → Lê planilha de inativos
2. **Segmentação** → Filtra por prioridade (CRITICA, ALTA, MEDIA)
3. **Processamento** → Formata dados e personaliza mensagens
4. **WhatsApp** → Envia mensagens via WAHA
5. **Analytics** → Calcula estatísticas
6. **Resultados** → Salva na aba "Resultados"

### 🎯 Segmentação de Mensagens:

- **CRITICA**: 50% OFF + urgência
- **ALTA**: Novidades + desconto especial
- **MEDIA**: Promoção + convite amigável
- **DEFAULT**: Mensagem padrão

## 🔧 Configurações Necessárias

### Google Sheets API:
- ✅ Service Account: `fullforce@fullforce-academia-2024.iam.gserviceaccount.com`
- ✅ Planilha ID: `1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo`
- ✅ Permissões: Leitura/Escrita

### WAHA WhatsApp:
- 🔑 Endpoint: `https://waha.lionalpha.app/api/sendText`
- 🔑 Token: Configurar no N8N
- 📱 Sessão: `default`

## 📈 Métricas Esperadas

- **📞 Volume**: ~650 usuários inativos
- **🎯 Segmentação**: 4 níveis de prioridade
- **⚡ Velocidade**: ~100 mensagens/minuto
- **📊 ROI**: Meta de 2,250% de retorno
- **✅ Taxa Sucesso**: >95% de entrega

## 🚨 Monitoramento

### Logs Automáticos:
- Estatísticas em tempo real
- Detalhes de envio/erro
- Salvamento na planilha

### Verificação:
```bash
# Status do workflow
curl -H "X-N8N-API-KEY: YOUR_KEY" \
  https://lionalpha.app.n8n.cloud/api/v1/workflows/VGhKEfrpJU47onvi
```

## ✅ Checklist de Deploy

- [ ] Workflow importado no N8N
- [ ] Credenciais Google configuradas
- [ ] Token WAHA inserido
- [ ] Workflow ativado
- [ ] Teste executado com sucesso
- [ ] Monitoramento ativo

🎉 **Pronto!** O sistema está configurado para reativar os inativos da FullForce automaticamente.