# 🚀 Guia de Configuração - Academia Full Force

Este guia detalha todos os passos para configurar o assistente virtual da Academia Full Force.

## 📋 Pré-requisitos

### Sistema
- **Node.js** 16+ (recomendado: 18+)
- **NPM** ou **Yarn**
- **Git** (opcional)
- **Conta Google** com acesso a Calendar e Sheets

### Conhecimentos Básicos
- Linha de comando básica
- Configuração de variáveis de ambiente
- Conceitos básicos de APIs

## 🔧 Instalação Passo a Passo

### 1. Preparação do Ambiente

#### 1.1 Instalar Node.js
```bash
# Verificar se está instalado
node --version
npm --version

# Se não estiver instalado, baixe de: https://nodejs.org/
```

#### 1.2 Criar diretório do projeto
```bash
mkdir full-force-academia
cd full-force-academia
```

### 2. Configuração do Projeto

#### 2.1 Baixar os arquivos
```bash
# Se usando Git
git clone [repository-url] .

# Ou copie todos os arquivos para a pasta
```

#### 2.2 Instalar dependências
```bash
npm install
```

### 3. Configuração do Google Cloud

#### 3.1 Criar projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Criar Projeto"
3. Nome do projeto: "Academia Full Force Bot"
4. Anote o **Project ID**

#### 3.2 Ativar APIs necessárias

1. No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
2. Procure e ative:
   - **Google Calendar API**
   - **Google Sheets API**

#### 3.3 Criar credenciais OAuth 2.0

1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "+ CRIAR CREDENCIAIS" > "ID do cliente OAuth 2.0"
3. Tipo de aplicativo: "Aplicativo da Web"
4. Nome: "Full Force Academia Bot"
5. URLs de redirecionamento autorizadas:
   ```
   http://localhost:3000/oauth2callback
   ```
6. Anote o **Client ID** e **Client Secret**

### 4. Configuração do Google Calendar

#### 4.1 Criar calendário dedicado

1. Acesse [Google Calendar](https://calendar.google.com/)
2. Lado esquerdo, clique no "+" ao lado de "Outros calendários"
3. Selecione "Criar novo calendário"
4. Nome: "Academia Full Force - Agendamentos"
5. Descrição: "Calendário para agendamentos via WhatsApp"
6. Fuso horário: "São Paulo"
7. Clique em "Criar calendário"

#### 4.2 Obter ID do calendário

1. Nas configurações do calendário criado
2. Seção "Integrar calendário"
3. Copie o **ID do calendário** (formato: xxx@group.calendar.google.com)

### 5. Configuração do Google Sheets

#### 5.1 Criar planilha dedicada

1. Acesse [Google Sheets](https://sheets.google.com/)
2. Crie uma nova planilha
3. Nome: "Full Force Academia - Dados"
4. Anote o **ID da planilha** (da URL)

#### 5.2 Configurar abas necessárias

Crie as seguintes abas com os cabeçalhos:

**Aba "Contatos":**
| A | B | C | D | E |
|---|---|---|---|---|
| Nome | Telefone | Data Contato | Status | Observações |

**Aba "Planos":**
| A | B | C | D |
|---|---|---|---|
| Nome | Valor | Descrição | Benefícios |

**Aba "Agendamentos":**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Cliente | Telefone | Data | Horário | Atividade | Status | Criado em | Observações |

**Aba "Promocoes":**
| A | B | C | D | E |
|---|---|---|---|---|
| Título | Descrição | Desconto | Válido até | Condições |

#### 5.3 Preencher dados iniciais

**Aba "Planos" - Adicione:**
```
Plano Básico | 89,90 | Musculação + Cardio | Acesso livre à musculação e cardio
Plano Completo | 129,90 | Todas as modalidades | Musculação, cardio, aulas coletivas
Plano Premium | 179,90 | Tudo + Personal Trainer | Acesso total + 2 sessões de personal/mês
```

**Aba "Promocoes" - Adicione:**
```
Primeira Semana Grátis | Experimente nossa academia por 7 dias | 100% | 31/12/2024 | Válido para novos alunos
Desconto Anual | Pague 10 meses e ganhe 2 | 2 meses grátis | 31/12/2024 | Pagamento à vista
```

### 6. Configuração das Variáveis de Ambiente

#### 6.1 Criar arquivo .env
```bash
cp .env.example .env
```

#### 6.2 Preencher as variáveis
```env
# Configurações do Google API
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_ID=calendario_id@group.calendar.google.com
GOOGLE_SHEETS_ID=id_da_sua_planilha

# Configurações da Academia
ACADEMIA_NOME=Academia Full Force
ACADEMIA_TELEFONE=+5511999999999
ACADEMIA_ENDERECO=Rua das Academias, 123 - São Paulo, SP
ACADEMIA_HORARIO_FUNCIONAMENTO=Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h

# Configurações do Sistema
PORT=3000
NODE_ENV=development
DEBUG=true

# Mensagens Personalizadas
MENSAGEM_BOAS_VINDAS=🔥 Olá! Sou o assistente virtual da *Academia Full Force*! Como posso ajudá-lo hoje?
MENSAGEM_HORARIO_FUNCIONAMENTO=📅 Nosso horário de funcionamento: Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h
MENSAGEM_FORA_HORARIO=⏰ No momento estamos fechados. Nosso horário: Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h. Deixe sua mensagem que retornaremos em breve!
```

### 7. Autenticação com Google

#### 7.1 Executar fluxo de autenticação

1. Execute o sistema:
```bash
npm run dev
```

2. Acesse: `http://localhost:3000/auth/google`

3. Faça login com sua conta Google

4. Autorize as permissões:
   - Ver e editar calendários
   - Ver e editar planilhas

5. Copie os tokens gerados e adicione ao `.env`:
```env
GOOGLE_ACCESS_TOKEN=seu_access_token
GOOGLE_REFRESH_TOKEN=seu_refresh_token
```

### 8. Configuração do WhatsApp

#### 8.1 Preparar dispositivo

1. **Instale WhatsApp** no seu telefone (se não tiver)
2. **Configure um número** dedicado para a academia (recomendado)
3. **Certifique-se** que o WhatsApp está funcionando normalmente

#### 8.2 Conectar o bot

1. Execute o sistema:
```bash
npm run dev
```

2. **Aguarde o QR Code** aparecer no terminal

3. **Abra WhatsApp** no seu celular

4. Vá em **Configurações > Aparelhos conectados**

5. **Escaneie o QR Code** do terminal

6. **Aguarde a confirmação** de conexão

#### 8.3 Testar funcionamento

1. Envie uma mensagem para o número conectado
2. Deve receber resposta automática
3. Teste comandos como "menu", "planos", "horário"

### 9. Verificação da Instalação

#### 9.1 Health Check
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-09-14T...",
  "whatsapp": "connected"
}
```

#### 9.2 Teste de integração

1. **Google Calendar**: Tente agendar um horário
2. **Google Sheets**: Verifique se contatos são salvos
3. **WhatsApp**: Teste todos os comandos principais

### 10. Configuração de Produção

#### 10.1 Processo daemon (PM2)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start src/index.js --name "full-force-bot"

# Configurar auto-start
pm2 startup
pm2 save
```

#### 10.2 Configurar HTTPS (opcional)
```bash
# Usando certbot
sudo certbot --nginx -d seudominio.com
```

#### 10.3 Backup automático
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h
0 2 * * * /path/to/backup-script.sh
```

## 🔧 Personalização

### Modificar horários de funcionamento
Em `src/utils/time-utils.js`:
```javascript
// Segunda a Sexta: 6h às 22h
if (day >= 1 && day <= 5) {
    return hour >= 6 && hour < 22;
}
```

### Personalizar mensagens
Em `src/handlers/message-handler.js`:
```javascript
this.messages = {
    welcome: "Sua mensagem personalizada...",
    menu: "Seu menu personalizado..."
};
```

### Ajustar personalidade
Em `config/agent-personality.js`:
```javascript
tone: {
    primary: 'direto_motivador',
    characteristics: [
        'Enérgico e positivo',
        // Adicione características...
    ]
}
```

## 🚨 Solução de Problemas Comuns

### Erro de autenticação Google
```bash
# Limpar tokens e reautenticar
rm .env
cp .env.example .env
# Refazer processo de autenticação
```

### WhatsApp não conecta
```bash
# Limpar sessão e reconectar
rm -rf sessions/
npm run dev
# Escanear novo QR Code
```

### Erros de permissão
```bash
# Verificar permissões das pastas
chmod 755 sessions/
chmod 644 .env
```

### Problemas de dependências
```bash
# Reinstalar dependências
rm -rf node_modules/
rm package-lock.json
npm install
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** do sistema
2. **Consulte a documentação** técnica
3. **Entre em contato** com o suporte técnico

---

**✅ Configuração concluída! Sua Academia Full Force agora tem um assistente virtual profissional! 🔥💪**