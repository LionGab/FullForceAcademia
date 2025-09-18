const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { isBusinessHours, formatTime } = require('../utils/time-utils');
const MessageHandler = require('../handlers/message-handler');
const P = require('pino');

class BaileysWhatsAppBot {
    constructor(calendarService, sheetsService) {
        this.calendarService = calendarService;
        this.sheetsService = sheetsService;
        this.messageHandler = new MessageHandler(calendarService, sheetsService);
        this.sock = null;
        this.isConnected = false;

        // Cache para evitar spam
        this.lastMessage = new Map();
        this.messageDelay = 5000; // 5 segundos

        // Logger
        this.logger = P({
            level: "info",
            transport: {
                target: "pino-pretty",
                options: { colorize: true }
            }
        });
    }

    async initialize() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');
            const { version, isLatest } = await fetchLatestBaileysVersion();

            console.log(`🔥 Academia Full Force - Iniciando WhatsApp Bot`);
            console.log(`📱 Usando WhatsApp v${version.join('.')}, isLatest: ${isLatest}`);

            this.sock = makeWASocket({
                version,
                logger: this.logger,
                printQRInTerminal: true,
                auth: state,
                generateHighQualityLinkPreview: true,
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
            this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));

            return this.sock;
        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Baileys:', error);
            throw error;
        }
    }

    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 Escaneie o QR Code acima com seu WhatsApp!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            if (shouldReconnect) {
                console.log('🔄 Reconectando WhatsApp...');
                this.initialize();
            } else {
                console.log('❌ WhatsApp desconectado. Escaneie o QR Code novamente.');
                this.isConnected = false;
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('🔥 Academia Full Force - Bot ativo e pronto!');
            this.isConnected = true;
        }
    }

    async handleMessages(m) {
        try {
            const message = m.messages[0];

            // Ignorar mensagens do próprio bot
            if (!message.message || message.key.fromMe) return;

            // Pegar texto da mensagem
            const messageText = this.extractMessageText(message);
            if (!messageText) return;

            // Pegar número do contato
            const remoteJid = message.key.remoteJid;
            const contactNumber = remoteJid.replace('@s.whatsapp.net', '');

            // Anti-spam: verificar último tempo de mensagem
            if (this.isSpam(contactNumber)) {
                console.log(`⏰ Mensagem ignorada (anti-spam): ${contactNumber}`);
                return;
            }

            console.log(`📨 Nova mensagem de ${contactNumber}: ${messageText}`);

            // Verificar horário de funcionamento
            if (!isBusinessHours()) {
                await this.sendOutOfHoursMessage(remoteJid);
                return;
            }

            // Processar mensagem com o handler existente
            const response = await this.messageHandler.processMessage({
                from: contactNumber,
                body: messageText,
                name: message.pushName || 'Cliente'
            });

            if (response) {
                await this.sendMessage(remoteJid, response);
            }

            // Salvar contato no Google Sheets
            await this.saveContactToSheets(contactNumber, message.pushName, messageText);

        } catch (error) {
            this.logger.error('❌ Erro ao processar mensagem:', error);
        }
    }

    extractMessageText(message) {
        // Extrair texto de diferentes tipos de mensagem
        if (message.message.conversation) {
            return message.message.conversation;
        }
        if (message.message.extendedTextMessage) {
            return message.message.extendedTextMessage.text;
        }
        return null;
    }

    async sendMessage(jid, text) {
        try {
            await this.sock.sendMessage(jid, { text });
            console.log(`✅ Mensagem enviada para ${jid}: ${text.substring(0, 50)}...`);
        } catch (error) {
            this.logger.error('❌ Erro ao enviar mensagem:', error);
        }
    }

    async sendOutOfHoursMessage(jid) {
        const outOfHoursMsg = process.env.MENSAGEM_FORA_HORARIO ||
            '⏰ No momento estamos fechados. Nosso horário: Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h. Deixe sua mensagem que retornaremos em breve!';

        await this.sendMessage(jid, outOfHoursMsg);
    }

    isSpam(contactNumber) {
        const now = Date.now();
        const lastTime = this.lastMessage.get(contactNumber);

        if (lastTime && (now - lastTime) < this.messageDelay) {
            return true;
        }

        this.lastMessage.set(contactNumber, now);
        return false;
    }

    async saveContactToSheets(phone, name, message) {
        try {
            if (this.sheetsService) {
                await this.sheetsService.addContact({
                    nome: name || 'Não informado',
                    telefone: phone,
                    dataContato: new Date().toLocaleString('pt-BR'),
                    status: 'Novo contato',
                    observacoes: `Primeira mensagem: ${message.substring(0, 100)}`
                });
            }
        } catch (error) {
            this.logger.error('❌ Erro ao salvar contato:', error);
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            service: 'Baileys WhatsApp Bot',
            academy: process.env.ACADEMIA_NOME || 'Academia Full Force'
        };
    }

    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.isConnected = false;
            console.log('👋 WhatsApp Bot desconectado');
        }
    }
}

module.exports = BaileysWhatsAppBot;