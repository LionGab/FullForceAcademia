const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const WhatsAppBot = require('./bot/whatsapp-bot');
const GoogleCalendarService = require('./services/google-calendar');
const GoogleSheetsService = require('./services/google-sheets');
const MessageHandler = require('./handlers/message-handler');

class FullForceAcademiaApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.whatsappClient = null;
        this.bot = null;

        this.setupExpress();
        this.initializeServices();
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());

        this.app.get('/', (req, res) => {
            res.json({
                message: 'Academia Full Force - Assistente Virtual WhatsApp',
                status: this.whatsappClient ? 'Connected' : 'Disconnected',
                version: '1.0.0'
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                whatsapp: this.whatsappClient ? 'connected' : 'disconnected'
            });
        });
    }

    async initializeServices() {
        try {
            // Inicializar serviços do Google
            const calendarService = new GoogleCalendarService();
            const sheetsService = new GoogleSheetsService();

            // Configurar cliente WhatsApp
            this.whatsappClient = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './sessions'
                }),
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
            });

            // Configurar bot
            this.bot = new WhatsAppBot(this.whatsappClient, calendarService, sheetsService);

            // Configurar eventos
            this.setupWhatsAppEvents();

            // Inicializar WhatsApp
            await this.whatsappClient.initialize();

            console.log('🚀 Academia Full Force - Sistema iniciado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inicializar serviços:', error);
            process.exit(1);
        }
    }

    setupWhatsAppEvents() {
        this.whatsappClient.on('qr', (qr) => {
            console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.whatsappClient.on('ready', () => {
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('🔥 Academia Full Force - Assistente Virtual ativo!');
        });

        this.whatsappClient.on('authenticated', () => {
            console.log('🔐 WhatsApp autenticado com sucesso!');
        });

        this.whatsappClient.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
        });

        this.whatsappClient.on('disconnected', (reason) => {
            console.log('📱 WhatsApp desconectado:', reason);
        });

        this.whatsappClient.on('message', async (message) => {
            await this.bot.handleMessage(message);
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌐 Servidor rodando na porta ${this.port}`);
            console.log(`📊 Dashboard: http://localhost:${this.port}`);
            console.log('🔥 Academia Full Force - Assistente Virtual');
            console.log('⚡ Aguardando conexão WhatsApp...');
        });
    }
}

// Inicializar aplicação
const app = new FullForceAcademiaApp();
app.start();