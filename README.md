# 🔥 Academia Full Force - Assistente Virtual WhatsApp

Sistema completo de atendimento virtual via WhatsApp para a Academia Full Force, com integração ao Google Calendar e Google Sheets.

## 🚀 Características Principais

### 💪 Assistente Virtual Inteligente
- **Tom energético e motivador** - Personalidade Full Force autêntica
- **Reconhecimento de intenções** - Entende o que o cliente precisa
- **Respostas contextuais** - Adapta-se à situação e horário
- **Anti-spam** - Proteção contra mensagens excessivas

### 📅 Agendamento Inteligente
- **Integração Google Calendar** - Sincronização em tempo real
- **Horários disponíveis** - Verifica automaticamente a agenda
- **Confirmação automática** - Processo simplificado de agendamento
- **Lembretes** - Notificações antes das sessões

### 📊 Gestão de Dados
- **Google Sheets** - Armazenamento automático de contatos
- **Histórico completo** - Rastreamento de interações
- **Analytics** - Relatórios de performance
- **Base de conhecimento** - Planos, preços e promoções

### ⏰ Controle de Horário
- **Horário de funcionamento** - Respeita os horários da academia
- **Mensagens automáticas** - Resposta fora do horário
- **Urgências** - Reconhece emergências médicas

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime principal
- **WhatsApp Web.js** - Integração WhatsApp
- **Google APIs** - Calendar e Sheets
- **Express.js** - Servidor web e dashboard
- **Moment.js** - Manipulação de datas e horários

## 📦 Instalação

### 1. Clone o projeto
```bash
git clone [repository-url]
cd full-force-academia
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Google API
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_ID=seu_calendario_id
GOOGLE_SHEETS_ID=sua_planilha_id

# Academia
ACADEMIA_NOME=Academia Full Force
ACADEMIA_TELEFONE=+5511999999999
ACADEMIA_ENDERECO=Rua das Academias, 123 - São Paulo, SP
ACADEMIA_HORARIO_FUNCIONAMENTO=Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h
```

### 4. Configure as APIs do Google

#### Google Calendar API:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google Calendar API
4. Crie credenciais OAuth 2.0
5. Configure as URLs de redirecionamento

#### Google Sheets API:
1. No mesmo projeto, ative a Google Sheets API
2. Use as mesmas credenciais OAuth 2.0
3. Crie uma planilha e anote o ID

### 5. Execute o sistema
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📱 Configuração do WhatsApp

1. **Execute o sistema**
2. **Escaneie o QR Code** que aparecerá no terminal
3. **Aguarde a confirmação** de conexão
4. **Teste o funcionamento** enviando uma mensagem

## 🎯 Funcionalidades do Assistente

### Comandos Principais
- **Menu** - `menu`, `ajuda`, `opções`
- **Agendamento** - `agendar`, `marcar treino`
- **Cancelamento** - `cancelar`, `desmarcar`
- **Horários** - `horário`, `funcionamento`
- **Planos** - `planos`, `valores`, `preços`
- **Localização** - `endereço`, `onde fica`
- **Contato** - `falar com atendente`

### Fluxos Automáticos
1. **Primeiro Contato** - Mensagem de boas-vindas + menu
2. **Agendamento** - Lista horários → confirmação → Google Calendar
3. **Informações** - Respostas diretas sobre academia
4. **Escalação** - Transfere para atendimento humano quando necessário

## 📊 Estrutura de Dados

### Google Sheets - Abas necessárias:

#### Contatos
| Nome | Telefone | Data Contato | Status | Observações |
|------|----------|--------------|--------|-------------|
| João Silva | +5511999999999 | 15/09/2024 10:30 | Prospect | Primeiro contato |

#### Planos
| Nome | Valor | Descrição | Benefícios |
|------|-------|-----------|------------|
| Plano Básico | 89,90 | Musculação + Cardio | Acesso livre |

#### Agendamentos
| Cliente | Telefone | Data | Horário | Atividade | Status | Criado em | Observações |
|---------|----------|------|---------|-----------|--------|-----------|-------------|

#### Promoções
| Título | Descrição | Desconto | Válido até | Condições |
|--------|-----------|----------|------------|-----------|

## 🔧 Configuração Avançada

### Personalização da Personalidade
Edite `config/agent-personality.js` para:
- Modificar tom de voz
- Adicionar frases motivacionais
- Configurar emojis
- Ajustar comportamentos

### Horários de Funcionamento
Modifique em `src/utils/time-utils.js`:
```javascript
// Segunda a Sexta: 6h às 22h
if (day >= 1 && day <= 5) {
    return hour >= 6 && hour < 22;
}
```

### Templates de Mensagem
Personalize em `src/handlers/message-handler.js`:
```javascript
messages: {
    welcome: "Sua mensagem personalizada...",
    menu: "Seu menu personalizado..."
}
```

## 📈 Monitoramento

### Dashboard Web
Acesse `http://localhost:3000` para:
- Status da conexão WhatsApp
- Estatísticas em tempo real
- Health check do sistema

### Logs do Sistema
```bash
# Ver logs em tempo real
npm run dev

# Logs são salvos automaticamente
tail -f logs/system.log
```

### Analytics
- Contatos por dia/mês
- Agendamentos realizados
- Taxa de conversão
- Horários mais procurados

## 🛡️ Segurança

### Proteções Implementadas
- **Anti-spam** - Limite de mensagens por usuário
- **Validação de entrada** - Sanitização de dados
- **Rate limiting** - Controle de velocidade
- **Logs auditoria** - Rastreamento completo

### Boas Práticas
- Nunca commite arquivos `.env`
- Tokens do Google com expiração
- Backup regular dos dados
- Monitoramento de erros

## 🔄 Backup e Recuperação

### Backup Automático
```bash
# Configurar backup diário dos dados
crontab -e
0 2 * * * /path/to/backup-script.sh
```

### Sessão WhatsApp
- Dados salvos em `./sessions/`
- Backup automático a cada conexão
- Recuperação em caso de desconexão

## 🚨 Solução de Problemas

### WhatsApp não conecta
1. Verifique se não há outra instância rodando
2. Delete a pasta `./sessions/` e reconecte
3. Confirme que o número não está em outros dispositivos

### Google APIs não funcionam
1. Verifique as credenciais no `.env`
2. Confirme que as APIs estão ativadas
3. Verifique cotas e limites

### Mensagens não chegam
1. Teste a conexão: `GET http://localhost:3000/health`
2. Verifique logs de erro
3. Confirme horário de funcionamento

## 📞 Suporte

Para suporte técnico:
- **Email**: suporte@academiaFullForce.com
- **WhatsApp**: +5511999999999
- **Documentação**: [Link para docs]

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Integração com sistema de pagamento**
- [ ] **Bot de retenção de alunos**
- [ ] **Dashboard analytics avançado**
- [ ] **API para app mobile**
- [ ] **Integração com wearables**
- [ ] **AI para recomendação de treinos**

### Melhorias Planejadas
- [ ] **Reconhecimento de voz**
- [ ] **Chatbot multi-idioma**
- [ ] **Integração com Instagram**
- [ ] **Sistema de gamificação**

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**🔥 Academia Full Force - Transformação em cada treino! 💪**

*Desenvolvido com energia e dedicação para potencializar o atendimento da sua academia.*