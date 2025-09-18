# 🏠 Guia Completo: Configurar Sistema em Outro Computador

## 📋 Pré-requisitos

### 1. Instalar Node.js
- Baixar do site oficial: https://nodejs.org/
- Versão recomendada: 18.x ou superior
- Verificar instalação: `node --version` e `npm --version`

### 2. Instalar Git
- Windows: https://git-scm.com/download/win
- Verificar instalação: `git --version`

### 3. Instalar Claude Code (opcional)
- Seguir instruções em: https://claude.ai/code

## 🚀 Processo de Instalação

### Passo 1: Clonar o Repositório
```bash
# Clonar o projeto do GitHub
git clone https://github.com/LionGab/FullForceAcademia.git

# Entrar na pasta do projeto
cd FullForceAcademia
```

### Passo 2: Instalar Dependências
```bash
# Instalar todas as dependências do Node.js
npm install

# Verificar se tudo foi instalado corretamente
npm list
```

### Passo 3: Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
copy .env.example .env

# Editar o arquivo .env com suas configurações
notepad .env
```

**Configurações importantes no arquivo `.env`:**
```env
# Configurações WhatsApp
WHATSAPP_SESSION_NAME=academia-session

# Configurações do Servidor
PORT=4001
HOST=localhost

# Configurações da Academia
ACADEMIA_NAME=FullForce Academia - Matupá
ACADEMIA_PHONE=+5565999999999
ACADEMIA_EMAIL=contato@fullforceacademia.com
```

### Passo 4: Primeiro Teste
```bash
# Testar se o sistema inicia corretamente
node whatsapp-baileys-waha-simple.js
```

## 📱 Conectar WhatsApp

### Método 1: Interface Web (Recomendado)
1. **Iniciar o sistema:**
   ```bash
   node whatsapp-baileys-waha-simple.js
   ```

2. **Abrir no navegador:**
   - Ir para: http://localhost:4001
   - Ou abrir diretamente: `whatsapp-qr.html`

3. **Conectar WhatsApp:**
   - Abrir WhatsApp no celular
   - Ir em Menu (⋮) → "Aparelhos conectados"
   - Tocar em "Conectar um aparelho"
   - Escanear o QR Code

### Método 2: Terminal
```bash
# Usar script específico para QR no terminal
node connect-whatsapp.js
```

## 🖥️ Scripts Disponíveis

### Scripts Principais
```bash
# Iniciar sistema completo
node whatsapp-baileys-waha-simple.js

# Conectar WhatsApp apenas
node connect-whatsapp.js

# Verificar saúde do sistema
node scripts/health-monitor.js

# Validar configurações
node scripts/validate-config.js
```

### Scripts no Windows (.bat)
- `START_ACADEMIA_AUTOMATION.bat` - Inicia sistema completo
- `RUN_ACADEMIA_FINAL.bat` - Execução rápida
- `RUN_ACADEMIA_COMPLETE.bat` - Execução com logs

## 🌐 Acessos do Sistema

### URLs Importantes
- **Dashboard Principal:** http://localhost:4001
- **Status de Saúde:** http://localhost:4001/health
- **QR Code:** Abrir `whatsapp-qr.html` no navegador

### API Endpoints
- `POST /send-message` - Enviar mensagem
- `GET /health` - Status do sistema
- `GET /qr` - Obter QR Code

## 🔧 Solução de Problemas

### Problema: Porta em Uso
```bash
# Verificar o que está usando a porta 4001
netstat -ano | findstr :4001

# Matar processo se necessário
taskkill /PID <número_do_processo> /F
```

### Problema: Dependências Faltando
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Problema: WhatsApp Não Conecta
1. Verificar se o QR Code está sendo gerado
2. Tentar limpar sessão: deletar pasta `sessions/`
3. Usar `connect-whatsapp.js` para debug

### Problema: Erro de Permissões
- Windows: Executar como Administrador
- Verificar antivírus não está bloqueando

## 📁 Estrutura de Arquivos Importantes

```
FullForceAcademia/
├── whatsapp-baileys-waha-simple.js  # Sistema principal
├── connect-whatsapp.js              # Conexão WhatsApp
├── whatsapp-qr.html                 # Interface QR Code
├── package.json                     # Dependências
├── .env                             # Configurações
├── sessions/                        # Dados WhatsApp
├── scripts/                         # Utilitários
└── src/                            # Código fonte
```

## 🔄 Manter Sistema Atualizado

### Atualizar do GitHub
```bash
# Baixar últimas mudanças
git pull origin master

# Reinstalar dependências se necessário
npm install
```

### Backup da Sessão WhatsApp
```bash
# Fazer backup da pasta sessions
xcopy sessions backup_sessions /E /I
```

## 🚨 Pontos Importantes

1. **Sessão WhatsApp:** A pasta `sessions/` contém a conexão. Fazer backup!

2. **Porta 4001:** Garantir que está livre antes de iniciar

3. **Firewall:** Pode precisar liberar a porta no firewall

4. **Antivírus:** Adicionar exceção para a pasta do projeto

5. **Rede:** Sistema funciona apenas na rede local (localhost)

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs no terminal
2. Testar com `node scripts/validate-config.js`
3. Verificar se todas as dependências estão instaladas
4. Reiniciar o sistema completamente

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Projeto clonado do GitHub
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Sistema iniciado (`node whatsapp-baileys-waha-simple.js`)
- [ ] WhatsApp conectado via QR Code
- [ ] Dashboard acessível (http://localhost:4001)
- [ ] Teste de mensagem realizado

---

🎉 **Sistema pronto para uso!** O WhatsApp da academia agora responde automaticamente às mensagens dos clientes.