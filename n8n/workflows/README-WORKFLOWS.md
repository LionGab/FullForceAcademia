# Academia WhatsApp Automation - N8N Workflows

## 📋 Workflows Criados

### ✅ Follow-up Segmentado:

1. **01-academia-followup-7-dias-quente.json**
   - **Objetivo**: Re-engajamento suave para membros inativos há 7 dias
   - **Classificação**: QUENTE
   - **Mensagem**: Tom motivacional, convite para voltar
   - **Trigger**: Diário (24h)
   - **Rate Limit**: 3 segundos entre mensagens

2. **02-academia-followup-14-dias-morno.json**
   - **Objetivo**: Oferta motivacional para membros inativos há 14 dias
   - **Classificação**: MORNO
   - **Mensagem**: Plano de retorno especial com benefícios
   - **Trigger**: Diário (24h)
   - **Rate Limit**: 3 segundos entre mensagens

3. **03-academia-followup-30-dias-frio.json**
   - **Objetivo**: Promoção especial para membros inativos há 30 dias
   - **Classificação**: FRIO
   - **Mensagem**: Segunda chance com ofertas especiais
   - **Trigger**: Diário (24h)
   - **Rate Limit**: 3 segundos entre mensagens

4. **04-academia-followup-60-dias-ultima-chance.json**
   - **Objetivo**: Última tentativa para membros inativos há 60 dias
   - **Classificação**: CONGELADO
   - **Mensagem**: Oferta final com desconto significativo
   - **Trigger**: Diário (24h)
   - **Processo**: Marca como inativo final após 3 tentativas

### ✅ Triggers Automáticos:

5. **05-inatividade-detector-automatico.json**
   - **Objetivo**: Detectar automaticamente inatividade e classificar membros
   - **Frequência**: A cada 6 horas
   - **Função**:
     - Calcula dias de inatividade
     - Classifica em QUENTE, MORNO, FRIO, CONGELADO
     - Atualiza status na base de dados
     - Dispara workflows específicos quando necessário
   - **Logs**: Registra todas as mudanças de status

### ✅ Escalação Inteligente:

6. **06-escalacao-inteligente.json**
   - **Objetivo**: Escalar comunicação quando WhatsApp falha
   - **Sequência**: WhatsApp → SMS → Ligação telefônica
   - **Webhook**: `/escalacao-inteligente`
   - **Lógica**:
     - 3+ tentativas WhatsApp → SMS
     - 2+ tentativas SMS → Agendar ligação
     - Notifica equipe via Slack
   - **Integração**: Twilio para SMS

### ✅ Personalização por Perfil:

7. **07-personalizacao-perfil.json**
   - **Objetivo**: Personalizar mensagens baseado no perfil do membro
   - **Webhook**: `/personalizacao-perfil`
   - **Personas Detectadas**:
     - **Fitness Enthusiast**: Alto engajamento, plano premium
     - **Bargain Hunter**: Sensível a preço, busca promoções
     - **Busy Professional**: Baixo engajamento, falta tempo
     - **Health Seeker**: Foco em saúde e bem-estar
     - **Social Butterfly**: Jovem, prefere atividades em grupo
     - **Casual Member**: Perfil padrão
   - **Timing Inteligente**: Envia no horário preferido do membro

## 🗄️ Estrutura de Banco de Dados Necessária

```sql
-- Tabelas principais (devem existir)
CREATE TABLE IF NOT EXISTS academia_members (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    primeiro_nome VARCHAR(100),
    whatsapp_formatado VARCHAR(25),
    status_atividade VARCHAR(20) DEFAULT 'active',
    classificacao_reativacao VARCHAR(15),
    dias_inativo INTEGER DEFAULT 0,
    tentativas_reativacao INTEGER DEFAULT 0,
    ultima_tentativa_reativacao TIMESTAMP,
    ultima_atividade TIMESTAMP,
    consentimento_marketing BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de campanhas
CREATE TABLE IF NOT EXISTS campaign_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    campaign_type VARCHAR(50),
    message_sent TEXT,
    whatsapp_number VARCHAR(25),
    channel VARCHAR(20) DEFAULT 'whatsapp',
    status VARCHAR(20) DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de mudanças de status
CREATE TABLE IF NOT EXISTS status_change_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    classification VARCHAR(15),
    days_inactive INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Queue de ligações
CREATE TABLE IF NOT EXISTS call_queue (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    phone_number VARCHAR(20),
    student_name VARCHAR(255),
    priority INTEGER DEFAULT 2,
    scheduled_for TIMESTAMP,
    attempt_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de escalação
CREATE TABLE IF NOT EXISTS escalation_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    from_channel VARCHAR(20),
    to_channel VARCHAR(20),
    escalation_reason TEXT,
    total_attempts_before INTEGER,
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mensagens agendadas
CREATE TABLE IF NOT EXISTS message_schedule (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    whatsapp_number VARCHAR(25),
    message_content TEXT,
    scheduled_time TIMESTAMP,
    persona_type VARCHAR(30),
    campaign_type VARCHAR(20),
    priority INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de personalização
CREATE TABLE IF NOT EXISTS personalization_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES academia_members(id),
    persona_detected VARCHAR(30),
    tone_used VARCHAR(30),
    focus_area VARCHAR(30),
    urgency_level VARCHAR(20),
    engagement_score INTEGER,
    message_sent TEXT,
    delivery_method VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Perfis de engajamento (opcional - para personalização avançada)
CREATE TABLE IF NOT EXISTS member_engagement (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES academia_members(id),
    score_engajamento INTEGER DEFAULT 50,
    responde_whatsapp BOOLEAN DEFAULT true,
    prefere_promocao BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atividades dos membros (opcional - para personalização)
CREATE TABLE IF NOT EXISTS member_activities (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES academia_members(id),
    modalidade_preferida VARCHAR(50) DEFAULT 'musculação',
    horario_preferido VARCHAR(20) DEFAULT 'manhã',
    frequencia_semanal INTEGER DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dados financeiros (opcional - para personalização)
CREATE TABLE IF NOT EXISTS member_financial (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES academia_members(id),
    inadimplente BOOLEAN DEFAULT false,
    plano_premium BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Como Importar os Workflows

### 1. Via Interface N8N:
1. Acesse http://localhost:5678
2. Clique em \"Workflows\" → \"Add workflow\" → \"Import from JSON\"
3. Copie o conteúdo de cada arquivo .json
4. Cole no campo de importação
5. Clique em \"Import\"

### 2. Via API (Programático):
```bash
# Para cada workflow
curl -X POST http://localhost:5678/api/v1/workflows/import \\
  -H \"Content-Type: application/json\" \\
  -d @01-academia-followup-7-dias-quente.json
```

## ⚙️ Configurações Necessárias

### 1. Credenciais PostgreSQL:
- **Nome**: `postgres_academia`
- **Host**: `postgres_n8n` ou `localhost`
- **Port**: `5432`
- **Database**: `n8n`
- **User**: `n8n`
- **Password**: `n8n_password`

### 2. Credenciais Twilio (para SMS):
- **Account SID**: Configurar em Environment Variables
- **Auth Token**: Configurar nas credenciais N8N
- **Phone Number**: Número Twilio verificado

### 3. Webhook Slack (opcional):
- **URL**: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

### 4. Variáveis de Ambiente:
```bash
# .env do N8N
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_PHONE_NUMBER=+5565999999999
```

## 📊 Monitoramento e Analytics

### Métricas Importantes:
- **Taxa de Resposta por Classificação**: QUENTE > MORNO > FRIO > CONGELADO
- **Efetividade da Escalação**: WhatsApp vs SMS vs Ligação
- **Performance das Personas**: Qual persona tem melhor engajamento
- **Timing Ideal**: Horários com maior taxa de resposta

### Queries úteis:
```sql
-- Taxa de resposta por classificação
SELECT
    classificacao_reativacao,
    COUNT(*) as total_mensagens,
    COUNT(CASE WHEN status = 'replied' THEN 1 END) as respostas,
    ROUND(COUNT(CASE WHEN status = 'replied' THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_resposta
FROM campaign_logs cl
JOIN academia_members m ON cl.student_id = m.id
WHERE cl.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY classificacao_reativacao
ORDER BY taxa_resposta DESC;

-- Efetividade da escalação
SELECT
    to_channel,
    COUNT(*) as total_escalacoes,
    AVG(total_attempts_before) as media_tentativas_antes
FROM escalation_logs
WHERE escalated_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY to_channel;
```

## 🔄 Ativação dos Workflows

### Ordem de Ativação Recomendada:
1. **05-inatividade-detector-automatico.json** (Base para tudo)
2. **01, 02, 03, 04** (Follow-ups segmentados)
3. **06-escalacao-inteligente.json** (Escalação)
4. **07-personalizacao-perfil.json** (Personalização)

### Status dos Workflows:
- ✅ **ATIVO**: Executando automaticamente
- ⏸️ **PAUSADO**: Criado mas não executando
- 🔄 **TESTE**: Executar manualmente para validar

## 📞 Endpoints Webhook

- **Escalação**: `POST http://localhost:5678/webhook/escalacao-inteligente`
- **Personalização**: `POST http://localhost:5678/webhook/personalizacao-perfil`

### Payload Exemplo:
```json
{
  \"whatsapp_number\": \"+5565999999999\",
  \"campaign_type\": \"MORNO\",
  \"force_escalation\": false
}
```

## 🎯 Resultados Esperados

- **30% de taxa de reativação** (objetivo principal)
- **R$ 84.150/mês** em receita recuperada
- **Redução de 70%** no trabalho manual
- **Aumento de 40%** na taxa de resposta com personalização
- **Escalação inteligente** com 85% de efetividade

---

**🏋️ Full Force Academia - Matupá/MT**
*Automação inteligente para reativação de membros inativos*