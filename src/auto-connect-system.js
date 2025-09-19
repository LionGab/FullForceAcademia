#!/usr/bin/env node

/**
 * AUTO-CONNECT SYSTEM - FullForce Academia
 * Sistema de auto-conexão inteligente para Baileys + WAHA + N8N
 * Garante 100% uptime com reconexão automática e self-test
 */

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const WAHAService = require('./services/waha-service');
const DatabaseService = require('./services/database');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class AutoConnectSystem {
    constructor() {
        this.config = {
            // Sistema config
            maxReconnectAttempts: 10,
            reconnectDelay: 5000,
            healthCheckInterval: 30000,
            selfTestInterval: 300000, // 5 minutos

            // WhatsApp config
            ownNumber: process.env.ACADEMIA_PHONE || '+5565999999999',
            sessionName: 'fullforce-auto-session',

            // Services
            baileys: {
                enabled: true,
                connected: false,
                attempts: 0
            },
            waha: {
                enabled: true,
                connected: false,
                attempts: 0
            },
            n8n: {
                enabled: !process.env.MOCK_N8N,
                connected: false,
                url: process.env.N8N_URL || 'http://localhost:5678'
            }
        };

        this.baileysSock = null;
        this.wahaService = null;
        this.databaseService = null;
        this.systemStats = {
            startTime: new Date(),
            lastSelfTest: null,
            messagesProcessed: 0,
            campaignsSent: 0,
            errors: 0
        };

        this.intervals = [];
        this.isShuttingDown = false;

        console.log('🚀 AutoConnect System inicializado');
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔧 Inicializando serviços...');

            // Inicializar database
            this.databaseService = new DatabaseService();
            await this.databaseService.initialize();

            // Inicializar WAHA
            this.wahaService = new WAHAService(this.databaseService);

            // Criar diretórios necessários
            await this.createDirectories();

            // Iniciar auto-connect para todos os serviços
            await this.startAutoConnect();

            // Iniciar monitoramento
            this.startHealthMonitoring();
            this.startSelfTest();

            console.log('✅ AutoConnect System ativo!');

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            process.exit(1);
        }
    }

    async createDirectories() {
        const dirs = [
            './baileys_auth',
            './logs',
            './data',
            './sessions'
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Diretório já existe ou erro menor
            }
        }
    }

    async startAutoConnect() {
        console.log('🔄 Iniciando auto-connect para todos os serviços...');

        // Auto-connect Baileys
        if (this.config.baileys.enabled) {
            this.connectBaileys();
        }

        // Auto-connect WAHA
        if (this.config.waha.enabled) {
            this.connectWAHA();
        }

        // Auto-connect N8N
        if (this.config.n8n.enabled) {
            this.connectN8N();
        }
    }

    async connectBaileys() {
        try {
            console.log('📱 Conectando Baileys...');

            const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth');
            const { version } = await fetchLatestBaileysVersion();

            this.baileysSock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: true,
                browser: ['FullForce Academia', 'Chrome', '110.0.0'],
                markOnlineOnConnect: true,
                syncFullHistory: false,
                generateHighQualityLinkPreview: true
            });

            // Event handlers
            this.baileysSock.ev.on('creds.update', saveCreds);
            this.baileysSock.ev.on('connection.update', this.handleBaileysConnection.bind(this));
            this.baileysSock.ev.on('messages.upsert', this.handleBaileysMessages.bind(this));

        } catch (error) {
            console.error('❌ Erro ao conectar Baileys:', error);
            this.scheduleReconnect('baileys');
        }
    }

    handleBaileysConnection(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 QR Code gerado - escaneie para conectar');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(`📱 Baileys desconectado. Reconectar: ${shouldReconnect}`);
            console.log('Motivo:', lastDisconnect?.error?.output?.statusCode);

            this.config.baileys.connected = false;

            if (shouldReconnect) {
                this.scheduleReconnect('baileys');
            } else {
                console.log('❌ Baileys foi deslogado. QR Code necessário.');
            }

        } else if (connection === 'open') {
            console.log('✅ Baileys conectado com sucesso!');
            this.config.baileys.connected = true;
            this.config.baileys.attempts = 0;

            // Self-test inicial
            setTimeout(() => this.performSelfTest(), 5000);
        }
    }

    async handleBaileysMessages(m) {
        try {
            const message = m.messages[0];
            if (!message.message || message.key.fromMe) return;

            const from = message.key.remoteJid;
            const messageText = message.message.conversation ||
                             message.message.extendedTextMessage?.text || '';

            this.systemStats.messagesProcessed++;

            console.log(`📨 Mensagem recebida: ${from} -> ${messageText.substring(0, 50)}...`);

            // Salvar no banco
            await this.databaseService.saveMessage({
                phone: from.replace('@s.whatsapp.net', ''),
                message_text: messageText,
                direction: 'inbound',
                message_type: 'text'
            });

        } catch (error) {
            console.error('❌ Erro ao processar mensagem Baileys:', error);
            this.systemStats.errors++;
        }
    }

    async connectWAHA() {
        try {
            console.log('🔌 Conectando WAHA...');

            await this.wahaService.initialize();
            this.config.waha.connected = true;
            this.config.waha.attempts = 0;

            console.log('✅ WAHA conectado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao conectar WAHA:', error);
            this.config.waha.connected = false;
            this.scheduleReconnect('waha');
        }
    }

    async connectN8N() {
        try {
            console.log('🤖 Conectando N8N...');

            const response = await axios.get(`${this.config.n8n.url}/healthz`, {
                timeout: 10000
            });

            if (response.status === 200) {
                this.config.n8n.connected = true;
                console.log('✅ N8N conectado com sucesso!');
            }

        } catch (error) {
            console.error('❌ Erro ao conectar N8N:', error);
            this.config.n8n.connected = false;

            // Tentar novamente em 30 segundos
            setTimeout(() => this.connectN8N(), 30000);
        }
    }

    scheduleReconnect(service) {
        const config = this.config[service];
        if (config.attempts >= this.config.maxReconnectAttempts) {
            console.error(`❌ Máximo de tentativas atingido para ${service}`);
            return;
        }

        config.attempts++;
        const delay = this.config.reconnectDelay * config.attempts;

        console.log(`🔄 Reagendando conexão ${service} em ${delay/1000}s (tentativa ${config.attempts})`);

        setTimeout(() => {
            if (service === 'baileys') this.connectBaileys();
            else if (service === 'waha') this.connectWAHA();
            else if (service === 'n8n') this.connectN8N();
        }, delay);
    }

    startHealthMonitoring() {
        const interval = setInterval(async () => {
            if (this.isShuttingDown) return;

            try {
                const health = await this.getSystemHealth();

                if (!health.overall) {
                    console.log('⚠️ Sistema com problemas, tentando reconectar...');
                    await this.startAutoConnect();
                }

            } catch (error) {
                console.error('❌ Erro no health check:', error);
            }
        }, this.config.healthCheckInterval);

        this.intervals.push(interval);
    }

    startSelfTest() {
        const interval = setInterval(async () => {
            if (this.isShuttingDown) return;
            await this.performSelfTest();
        }, this.config.selfTestInterval);

        this.intervals.push(interval);
    }

    async performSelfTest() {
        try {
            console.log('🔍 Executando self-test...');

            if (this.config.baileys.connected && this.baileysSock) {
                // Testar envio para próprio número
                const testMessage = `🤖 Self-test AutoConnect ${new Date().toLocaleTimeString()}`;

                await this.baileysSock.sendMessage(
                    this.config.ownNumber.replace('+', '') + '@s.whatsapp.net',
                    { text: testMessage }
                );

                console.log('✅ Self-test Baileys: OK');
            }

            if (this.config.waha.connected && this.wahaService) {
                const health = await this.wahaService.healthCheck();
                console.log(`✅ Self-test WAHA: ${health.waha ? 'OK' : 'FALHA'}`);
            }

            this.systemStats.lastSelfTest = new Date();

        } catch (error) {
            console.error('❌ Self-test falhou:', error);
            this.systemStats.errors++;
        }
    }

    async getSystemHealth() {
        const health = {
            baileys: this.config.baileys.connected,
            waha: this.config.waha.connected,
            n8n: this.config.n8n.connected,
            database: false,
            overall: false,
            timestamp: new Date(),
            stats: this.systemStats
        };

        try {
            // Test database
            const dbHealth = await this.databaseService.healthCheck();
            health.database = dbHealth.postgres || dbHealth.redis;

        } catch (error) {
            console.error('Database health check failed:', error);
        }

        // Overall health
        health.overall = health.baileys && health.database;

        return health;
    }

    async sendMessage(to, message, method = 'auto') {
        try {
            let result = null;

            if (method === 'auto' || method === 'baileys') {
                if (this.config.baileys.connected && this.baileysSock) {
                    const chatId = to.includes('@') ? to : to.replace('+', '') + '@s.whatsapp.net';
                    await this.baileysSock.sendMessage(chatId, { text: message });
                    result = { method: 'baileys', success: true };
                    console.log(`✅ Mensagem enviada via Baileys para ${to}`);
                }
            }

            if (!result && (method === 'auto' || method === 'waha')) {
                if (this.config.waha.connected && this.wahaService) {
                    result = await this.wahaService.sendMessage(to, message);
                    console.log(`✅ Mensagem enviada via WAHA para ${to}`);
                }
            }

            if (result && result.success) {
                this.systemStats.messagesProcessed++;

                // Salvar no banco
                await this.databaseService.saveMessage({
                    phone: to.replace(/[@s.whatsapp.net|@c.us]/g, ''),
                    message_text: message,
                    direction: 'outbound',
                    message_type: 'text'
                });
            }

            return result || { success: false, error: 'Nenhum serviço disponível' };

        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            this.systemStats.errors++;
            return { success: false, error: error.message };
        }
    }

    async triggerCampaign650() {
        try {
            console.log('🚀 Iniciando Campanha 650...');

            if (!this.config.baileys.connected && !this.config.waha.connected) {
                throw new Error('Nenhum serviço WhatsApp conectado');
            }

            // Mensagem da campanha
            const campaignMessage = `🏋️ *REATIVAÇÃO ESPECIAL - Academia Full Force*

Olá! 👋

Sentimos sua falta na academia! 💪

🎯 *OFERTA EXCLUSIVA DE VOLTA:*
✅ 50% OFF no primeiro mês
✅ Avaliação física GRATUITA
✅ Acompanhamento personalizado

💰 De R$ 129,90 por apenas R$ 64,95

⏰ *Oferta válida até ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}*

📱 Responda "QUERO VOLTAR" para garantir!

Academia Full Force - Transformando vidas! 🔥`;

            // Simular envio para alguns números (para teste)
            const testNumbers = [this.config.ownNumber];

            for (const number of testNumbers) {
                const result = await this.sendMessage(number, campaignMessage);

                if (result.success) {
                    this.systemStats.campaignsSent++;
                    console.log(`✅ Campanha enviada para ${number}`);
                } else {
                    console.error(`❌ Falha ao enviar para ${number}:`, result.error);
                }

                // Delay entre envios
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`✅ Campanha 650 concluída. Enviadas: ${this.systemStats.campaignsSent}`);
            return { success: true, sent: this.systemStats.campaignsSent };

        } catch (error) {
            console.error('❌ Erro na Campanha 650:', error);
            return { success: false, error: error.message };
        }
    }

    async shutdown() {
        this.isShuttingDown = true;
        console.log('🛑 Desligando AutoConnect System...');

        // Limpar intervals
        this.intervals.forEach(interval => clearInterval(interval));

        // Fechar conexões
        if (this.baileysSock) {
            try {
                await this.baileysSock.logout();
            } catch (error) {
                // Ignorar erros de logout
            }
        }

        if (this.wahaService) {
            await this.wahaService.shutdown();
        }

        if (this.databaseService) {
            await this.databaseService.shutdown();
        }

        console.log('✅ AutoConnect System desligado');
    }
}

module.exports = AutoConnectSystem;

// Auto-start se executado diretamente
if (require.main === module) {
    const autoConnect = new AutoConnectSystem();

    // Graceful shutdown handlers
    process.on('SIGINT', () => autoConnect.shutdown().then(() => process.exit(0)));
    process.on('SIGTERM', () => autoConnect.shutdown().then(() => process.exit(0)));
}