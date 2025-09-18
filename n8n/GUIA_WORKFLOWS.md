# Guia dos Workflows N8N - Full Force Academia

## Workflows Criados

### 1. **01-campanha-reativacao-academia.json**
**Objetivo**: Campanha principal de reativação de alunos inativos via WhatsApp

**Funcionalidades**:
- Busca dados do Google Sheets
- Processa e filtra alunos inativos
- Formata números WhatsApp (código 5565 para Matupá-MT)
- Segmenta por QUENTE/MORNO/FRIO
- Gera mensagens personalizadas por segmento
- Rate limiting (3 segundos entre mensagens)
- Envia via WhatsApp API
- Log de atividades

**Como usar**:
1. Execute manualmente pelo botão "Execute Workflow"
2. Acompanhe progresso em tempo real
3. Verifique logs na aba "Campaign_Log" do Google Sheets

### 2. **02-segmentacao-membros.json**
**Objetivo**: Análise e segmentação de membros ativos vs inativos

**Funcionalidades**:
- Compara lista de alunos ativos vs lista geral
- Identifica alunos inativos automaticamente
- Classifica por segmentos (QUENTE/MORNO/FRIO/CONGELADO)
- Calcula prioridades e potencial de reativação
- Salva resultados em nova aba "Alunos_Inativos_Segmentados"
- Gera relatório de segmentação

**Como usar**:
1. Trigger via webhook: `/webhook/segmentacao-membros`
2. Ou execute manualmente
3. Verifique resultados na nova aba criada

### 3. **03-analytics-campanhas.json**
**Objetivo**: Monitoramento automático e analytics das campanhas

**Funcionalidades**:
- Executa automaticamente a cada 2 horas
- Verifica status do WhatsApp
- Analisa logs de campanha
- Calcula métricas por segmento
- Projeta reativações e ROI
- Envia alertas via WhatsApp se houver problemas
- Salva analytics diários no Google Sheets

**Como usar**:
- Funciona automaticamente após ativação
- Verifique dados na aba "Analytics_Daily"
- Alertas enviados automaticamente para número configurado

### 4. **04-teste-sistema.json**
**Objetivo**: Validação completa do sistema antes de campanhas

**Funcionalidades**:
- Testa conexão WhatsApp
- Testa acesso Google Sheets
- Valida dados disponíveis
- Envia mensagem de teste
- Gera relatório de status
- Log de todos os testes

**Como usar**:
1. Execute antes de qualquer campanha
2. Confirme que todos os testes passaram
3. Verifique logs na aba "Test_Log"

## Como Importar os Workflows

### Passo 1: Acessar N8N
```bash
# Abrir N8N no navegador
http://localhost:5678
```

### Passo 2: Importar Workflows
1. No N8N, clique em "+" para novo workflow
2. Clique nas 3 linhas no menu (☰)
3. Selecione "Import from file"
4. Selecione cada arquivo .json da pasta `n8n/workflows/`
5. Clique "Import"
6. Salve o workflow

### Passo 3: Configurar Credenciais

#### Google Sheets API
1. Vá em Settings > Credentials
2. Adicione "Google Sheets API"
3. Use as credenciais do projeto
4. Teste a conexão

#### URLs dos WhatsApp
- Verifique se as URLs estão corretas:
  - `http://whatsapp-api:3001` (dentro do Docker)
  - ou `http://localhost:3001` (se necessário)

## Configuração das Planilhas Google

### Abas Necessárias
Crie estas abas no Google Sheets:

1. **Sheet1** (dados gerais dos alunos)
2. **Alunos_Inativos_Segmentados** (criada automaticamente)
3. **Campaign_Log** (para logs de campanha)
4. **Analytics_Daily** (para métricas diárias)
5. **Test_Log** (para logs de teste)

### Headers Sugeridos

#### Campaign_Log
```
timestamp | student_name | whatsapp | segment | message_sent | status
```

#### Analytics_Daily
```
data | mensagens_enviadas | quente | morno | frio | congelado | reativacao_projetada | receita_projetada | roi_percentual | whatsapp_status | alertas | timestamp
```

#### Test_Log
```
timestamp | teste_tipo | whatsapp_status | whatsapp_conectado | sheets_acessivel | dados_disponaveis | sistema_pronto | teste_numero | resultado
```

## Ordem de Execução Recomendada

### Setup Inicial
1. **Teste do Sistema** (04-teste-sistema.json)
   - Valida todas as conexões
   - Confirma que tudo está funcionando

2. **Segmentação de Membros** (02-segmentacao-membros.json)
   - Identifica alunos inativos
   - Cria segmentação estratégica

### Operação Diária
3. **Analytics e Monitoramento** (03-analytics-campanhas.json)
   - Ative para monitoramento contínuo
   - Deixe rodando automaticamente

4. **Campanha de Reativação** (01-campanha-reativacao-academia.json)
   - Execute quando quiser enviar mensagens
   - Respeita rate limiting automático

## Monitoramento e KPIs

### Métricas Importantes
- **Taxa de envio**: 20-50 mensagens/dia (respeitando rate limit)
- **Taxa de resposta esperada**:
  - QUENTE: 35%
  - MORNO: 25%
  - FRIO: 15%
  - CONGELADO: 5%

### Alertas Automáticos
- WhatsApp desconectado
- Baixo volume de mensagens
- Meta de reativação em risco

### ROI Projetado
- Custo operacional: R$ 500/mês
- Meta de reativação: 30% (195 alunos)
- Receita potencial: R$ 25.155/mês (195 × R$ 129)
- ROI esperado: 4.931% ((25.155 - 500) / 500 × 100)

## Solução de Problemas

### WhatsApp Não Conecta
```bash
# Verificar status do container
docker-compose -f docker-compose-whatsapp.yml logs whatsapp-api

# Reiniciar se necessário
docker-compose -f docker-compose-whatsapp.yml restart whatsapp-api
```

### Google Sheets Erro de Acesso
1. Verificar credenciais em N8N
2. Confirmar permissões nas planilhas
3. Testar IDs das planilhas

### Rate Limiting WhatsApp
- Sistema já configurado com 3s de delay
- Máximo de 20 mensagens por execução
- Monitore alertas automáticos

## Próximos Passos

1. **Importe todos os workflows**
2. **Configure as credenciais**
3. **Execute o teste do sistema**
4. **Faça a segmentação inicial**
5. **Ative o monitoramento**
6. **Lance a primeira campanha**

O sistema está pronto para reativar os 650 alunos inativos da Full Force Academia! 🏋️💪