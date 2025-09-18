#!/usr/bin/env node

/**
 * ============================================================================
 * WHATSAPP BAILEYS + WAHA - SISTEMA SIMPLES OTIMIZADO
 * Stack leve e eficiente para sistemas pequenos de academia
 * Baileys (conexão direta) + WAHA (API HTTP) + N8N (automação)
 * ============================================================================
 */

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

class WhatsAppBaileysWAHA {
    constructor() {
        this.config = {
            // WAHA Configuration
            waha: {
                url: process.env.WAHA_URL || 'http://localhost:3000',
                apiKey: process.env.WAHA_API_KEY || 'academia_secure_key_2024',
                session: process.env.WAHA_SESSION || 'academia-session'
            },

            // N8N Webhook
            n8n: {
                webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/academia-whatsapp',
                enabled: process.env.N8N_ENABLED === 'true'
            },

            // Academia Configuration
            academia: {
                name: process.env.ACADEMIA_NAME || 'Academia',
                phone: process.env.ACADEMIA_PHONE || '+5511999999999',
                businessHours: {
                    start: 6,  // 6h
                    end: 22,   // 22h
                    days: [1, 2, 3, 4, 5, 6] // Segunda a Sábado
                }
            }
        };

        this.baileysSock = null;
        this.isConnected = false;
        this.messageCache = new Map();
        this.rateLimitCache = new Map();

        // Express server para webhooks
        this.app = express();
        this.setupExpress();

        console.log('🚀 WhatsApp Baileys + WAHA Sistema Inicializado');
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                baileys: this.isConnected ? 'connected' : 'disconnected',
                waha: 'configured',
                timestamp: new Date().toISOString()
            });
        });

        // Webhook para receber mensagens do WAHA
        this.app.post('/webhook/waha', this.handleWAHAWebhook.bind(this));

        // Endpoint para enviar mensagens via Baileys
        this.app.post('/send/baileys', this.sendMessageBaileys.bind(this));

        // Endpoint para enviar mensagens via WAHA
        this.app.post('/send/waha', this.sendMessageWAHA.bind(this));

        // Dashboard simples
        this.app.get('/', (req, res) => {
            res.send(`
                <html>
                <head><title>WhatsApp Academia - Status</title></head>
                <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
                    <h1>🏋️ Academia WhatsApp System</h1>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 10px 0;">
                        <h3>📊 Status</h3>
                        <p><strong>Baileys:</strong> ${this.isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
                        <p><strong>WAHA:</strong> ✅ Configurado</p>
                        <p><strong>N8N:</strong> ${this.config.n8n.enabled ? '✅ Ativo' : '⚠️ Desabilitado'}</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 10px 0;">
                        <h3>🔧 Endpoints</h3>
                        <p><code>POST /send/baileys</code> - Enviar via Baileys</p>
                        <p><code>POST /send/waha</code> - Enviar via WAHA</p>
                        <p><code>GET /health</code> - Health check</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 10px 0;">
                        <h3>💬 Cache Stats</h3>
                        <p><strong>Mensagens em cache:</strong> ${this.messageCache.size}</p>
                        <p><strong>Rate limits ativos:</strong> ${this.rateLimitCache.size}</p>
                    </div>
                </body>
                </html>
            `);
        });
    }

    /**
     * Inicializar Baileys (conexão direta WhatsApp)
     */
    async initializeBaileys() {
        try {
            console.log('📱 Inicializando Baileys...');

            const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth');
            const { version } = await fetchLatestBaileysVersion();

            this.baileysSock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true
            });

            // Event handlers
            this.baileysSock.ev.on('creds.update', saveCreds);
            this.baileysSock.ev.on('connection.update', this.handleBaileysConnection.bind(this));
            this.baileysSock.ev.on('messages.upsert', this.handleBaileysMessages.bind(this));

            console.log('✅ Baileys configurado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao inicializar Baileys:', error.message);
        }
    }

    /**
     * Handler para conexão Baileys
     */
    handleBaileysConnection(update) {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('📱 Conexão fechada, reconectando:', shouldReconnect);

            if (shouldReconnect) {
                setTimeout(() => this.initializeBaileys(), 5000);
            }
            this.isConnected = false;

        } else if (connection === 'open') {
            console.log('✅ Baileys conectado com sucesso!');
            this.isConnected = true;
        }
    }

    /**
     * Handler para mensagens recebidas via Baileys
     */
    async handleBaileysMessages(m) {
        try {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;

            const from = message.key.remoteJid;
            const messageText = message.message.conversation ||
                             message.message.extendedTextMessage?.text || '';

            // Anti-spam check
            if (this.isSpam(from, messageText)) {
                console.log('🚫 Mensagem ignorada (spam):', from);
                return;
            }

            console.log('📨 Mensagem recebida (Baileys):', { from, text: messageText.substring(0, 50) });

            // Processar mensagem
            await this.processMessage({
                from,
                text: messageText,
                timestamp: new Date(),
                source: 'baileys'
            });

        } catch (error) {
            console.error('❌ Erro ao processar mensagem Baileys:', error);
        }
    }

    /**
     * Handler para webhook WAHA
     */
    async handleWAHAWebhook(req, res) {
        try {
            const payload = req.body;
            console.log('📨 Webhook WAHA recebido:', payload.event);

            if (payload.event === 'message' && payload.payload) {
                const { from, body } = payload.payload;

                await this.processMessage({
                    from,
                    text: body,
                    timestamp: new Date(),
                    source: 'waha'
                });
            }

            res.json({ status: 'ok' });

        } catch (error) {
            console.error('❌ Erro no webhook WAHA:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Processar mensagem recebida (universal)
     */
    async processMessage(messageData) {
        try {
            const { from, text, timestamp, source } = messageData;

            // Salvar no cache
            this.messageCache.set(`${from}-${timestamp.getTime()}`, messageData);

            // Limpar cache se muito grande
            if (this.messageCache.size > 1000) {
                const oldestKey = this.messageCache.keys().next().value;
                this.messageCache.delete(oldestKey);
            }

            // Verificar horário de funcionamento
            if (!this.isBusinessHours()) {
                await this.sendAutoReply(from, 'Olá! Estamos fora do horário de atendimento. Nossa equipe responderá em breve! 🏋️', source);
                return;
            }

            // Processar comando/mensagem
            const response = await this.generateResponse(text);

            if (response) {
                await this.sendAutoReply(from, response, source);
            }

            // Enviar para N8N se configurado
            if (this.config.n8n.enabled) {
                await this.sendToN8N(messageData);
            }

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    }

    /**
     * Gerar resposta automática
     */
    async generateResponse(text) {
        const textLower = text.toLowerCase().trim();

        // Respostas simples para academia
        const responses = {
            'ola': 'Olá! Bem-vindo(a) à nossa academia! 🏋️ Como posso ajudar?',
            'oi': 'Oi! Tudo bem? Estou aqui para ajudar! 💪',
            'menu': `📋 *MENU PRINCIPAL*

🏋️ Digite "planos" - Ver nossos planos
⏰ Digite "horarios" - Horários de funcionamento
📍 Digite "endereco" - Nossa localização
📞 Digite "contato" - Falar com atendente
💰 Digite "promocao" - Promoções ativas

Como posso ajudar hoje?`,

            'planos': `💰 *NOSSOS PLANOS*

🥉 **BÁSICO** - R$ 89,90/mês
✅ Musculação + Cardio
✅ Horário livre

🥈 **PREMIUM** - R$ 129,90/mês
✅ Musculação + Cardio + Aulas
✅ Personal Trainer 1x/mês
✅ Avaliação física

🥇 **VIP** - R$ 189,90/mês
✅ Tudo do Premium
✅ Personal Trainer 4x/mês
✅ Suplementação inclusa

Digite "contrato" para se matricular! 🚀`,

            'horarios': `⏰ *HORÁRIOS DE FUNCIONAMENTO*

📅 Segunda a Sexta: 6h às 22h
📅 Sábado: 8h às 18h
📅 Domingo: 8h às 14h

Estamos sempre prontos para você! 💪`,

            'endereco': `📍 *NOSSA LOCALIZAÇÃO*

${this.config.academia.name}
📧 Endereço aqui
📱 ${this.config.academia.phone}

Venha nos visitar! 🏃‍♀️`,

            'contato': 'Um momento! Vou chamar um de nossos atendentes para falar com você! 👨‍💼',
            'promocao': '🎉 *PROMOÇÃO ESPECIAL!* Primeira semana GRÁTIS! Aproveite! 🏋️‍♀️'
        };

        // Buscar resposta
        for (const [key, response] of Object.entries(responses)) {
            if (textLower.includes(key)) {
                return response;
            }
        }

        // Resposta padrão
        if (textLower.length > 3) {
            return 'Olá! Digite "menu" para ver todas as opções disponíveis! 📋';
        }

        return null;
    }

    /**
     * Enviar resposta automática
     */
    async sendAutoReply(to, message, preferredSource = 'baileys') {
        try {
            if (preferredSource === 'baileys' && this.isConnected) {
                await this.sendMessageBaileys({ body: { to, message } }, null, true);
            } else {
                await this.sendMessageWAHA({ body: { to, message } }, null, true);
            }
        } catch (error) {
            console.error('❌ Erro ao enviar resposta:', error);
        }
    }

    /**
     * Enviar mensagem via Baileys
     */
    async sendMessageBaileys(req, res, isInternal = false) {
        try {
            const { to, message } = req.body;

            if (!this.isConnected) {
                const error = 'Baileys não está conectado';
                if (!isInternal) return res.status(503).json({ error });
                throw new Error(error);
            }

            // Rate limiting
            if (!this.checkRateLimit(to)) {
                const error = 'Rate limit excedido';
                if (!isInternal) return res.status(429).json({ error });
                console.log('⚠️ Rate limit:', to);
                return;
            }

            await this.baileysSock.sendMessage(to, { text: message });

            console.log('✅ Mensagem enviada (Baileys):', { to, message: message.substring(0, 50) });

            if (!isInternal) {
                res.json({ status: 'sent', method: 'baileys', timestamp: new Date() });
            }

        } catch (error) {
            console.error('❌ Erro ao enviar (Baileys):', error);
            if (!isInternal) {
                res.status(500).json({ error: error.message });
            }
        }
    }

    /**
     * Enviar mensagem via WAHA
     */
    async sendMessageWAHA(req, res, isInternal = false) {
        try {
            const { to, message } = req.body;

            const response = await axios.post(`${this.config.waha.url}/api/sendText`, {
                session: this.config.waha.session,
                chatId: to,
                text: message
            }, {
                headers: {
                    'X-API-KEY': this.config.waha.apiKey
                }
            });

            console.log('✅ Mensagem enviada (WAHA):', { to, message: message.substring(0, 50) });

            if (!isInternal) {
                res.json({ status: 'sent', method: 'waha', timestamp: new Date(), wahaResponse: response.data });
            }

        } catch (error) {
            console.error('❌ Erro ao enviar (WAHA):', error);
            if (!isInternal) {
                res.status(500).json({ error: error.message });
            }
        }
    }

    /**
     * Enviar dados para N8N
     */
    async sendToN8N(messageData) {
        try {
            await axios.post(this.config.n8n.webhookUrl, {
                event: 'message_received',
                data: messageData,
                timestamp: new Date().toISOString()
            });

            console.log('✅ Dados enviados para N8N');

        } catch (error) {
            console.error('❌ Erro ao enviar para N8N:', error.message);
        }
    }

    /**
     * Verificar se é horário de funcionamento
     */
    isBusinessHours() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        const { start, end, days } = this.config.academia.businessHours;

        return days.includes(day) && hour >= start && hour < end;
    }

    /**
     * Verificar rate limiting
     */
    checkRateLimit(contact) {
        const now = Date.now();
        const limit = 10; // 10 mensagens por minuto
        const window = 60000; // 1 minuto

        if (!this.rateLimitCache.has(contact)) {
            this.rateLimitCache.set(contact, []);
        }

        const timestamps = this.rateLimitCache.get(contact);

        // Remover timestamps antigos
        const validTimestamps = timestamps.filter(t => now - t < window);
        this.rateLimitCache.set(contact, validTimestamps);

        if (validTimestamps.length >= limit) {
            return false;
        }

        validTimestamps.push(now);
        return true;
    }

    /**
     * Verificar spam
     */
    isSpam(from, text) {
        const cacheKey = `${from}-${text}`;
        const now = Date.now();

        if (this.messageCache.has(cacheKey)) {
            const lastTime = this.messageCache.get(cacheKey).timestamp.getTime();
            if (now - lastTime < 5000) { // 5 segundos
                return true;
            }
        }

        return false;
    }

    /**
     * Limpeza automática de cache
     */
    startCleanupTask() {
        setInterval(() => {
            // Limpar rate limit cache
            const now = Date.now();
            for (const [contact, timestamps] of this.rateLimitCache.entries()) {
                const validTimestamps = timestamps.filter(t => now - t < 60000);
                if (validTimestamps.length === 0) {
                    this.rateLimitCache.delete(contact);
                } else {
                    this.rateLimitCache.set(contact, validTimestamps);
                }
            }

            // Limpar message cache (manter últimas 500 mensagens)
            if (this.messageCache.size > 500) {
                const entries = Array.from(this.messageCache.entries());
                const toKeep = entries.slice(-500);
                this.messageCache.clear();
                toKeep.forEach(([key, value]) => this.messageCache.set(key, value));
            }

            console.log('🧹 Limpeza automática concluída');
        }, 300000); // 5 minutos
    }

    /**
     * Inicializar sistema completo
     */
    async start() {
        try {
            console.log('🚀 Iniciando WhatsApp Baileys + WAHA Sistema...\n');

            // Iniciar servidor Express
            const port = process.env.PORT || 4001;
            this.app.listen(port, () => {
                console.log(`🌐 Servidor rodando em http://localhost:${port}`);
                console.log(`📊 Dashboard: http://localhost:${port}`);
                console.log(`💚 Health: http://localhost:${port}/health`);
            });

            // Inicializar Baileys
            await this.initializeBaileys();

            // Iniciar limpeza automática
            this.startCleanupTask();

            console.log('\n✅ Sistema WhatsApp Academia pronto para uso!');
            console.log('📱 Baileys: Conexão direta WhatsApp');
            console.log('🔌 WAHA: API HTTP disponível');
            console.log('🤖 N8N: Automação configurada');
            console.log('💪 Academia: Respostas automáticas ativas\n');

        } catch (error) {
            console.error('❌ Erro ao iniciar sistema:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    async stop() {
        console.log('🛑 Encerrando sistema...');

        if (this.baileysSock) {
            await this.baileysSock.logout();
        }

        process.exit(0);
    }
}

// Inicialização
if (require.main === module) {
    const whatsappSystem = new WhatsAppBaileysWAHA();

    // Handlers de shutdown
    process.on('SIGINT', () => whatsappSystem.stop());
    process.on('SIGTERM', () => whatsappSystem.stop());

    // Iniciar sistema
    whatsappSystem.start().catch(console.error);
}

module.exports = WhatsAppBaileysWAHA;