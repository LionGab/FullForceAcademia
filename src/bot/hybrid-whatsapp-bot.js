const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { isBusinessHours, formatTime } = require('../utils/time-utils');
const MessageHandler = require('../handlers/message-handler');
const WAHAService = require('../services/waha-service');
const pino = require('pino');

class HybridWhatsAppBot {
    constructor(databaseService, calendarService, sheetsService) {
        this.databaseService = databaseService;
        this.calendarService = calendarService;
        this.sheetsService = sheetsService;
        this.messageHandler = new MessageHandler(calendarService, sheetsService);

        // Baileys setup
        this.sock = null;
        this.baileysConnected = false;

        // WAHA setup
        this.wahaService = new WAHAService(databaseService);
        this.wahaConnected = false;

        // Hybrid mode configuration
        this.preferredMode = process.env.WHATSAPP_PREFERRED_MODE || 'baileys'; // 'baileys' or 'waha'
        this.fallbackEnabled = process.env.WHATSAPP_FALLBACK_ENABLED !== 'false';

        // Message queue for failover scenarios
        this.messageQueue = [];
        this.processingQueue = false;

        // Logger
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        this.logger.info('🔀 Hybrid WhatsApp Bot initialized', {
            preferredMode: this.preferredMode,
            fallbackEnabled: this.fallbackEnabled
        });
    }

    async initialize() {
        try {
            this.logger.info('🚀 Initializing Hybrid WhatsApp Bot...');

            // Initialize both services
            await Promise.allSettled([
                this.initializeBaileys(),
                this.initializeWAHA()
            ]);

            // Start message queue processor
            this.startMessageQueueProcessor();

            this.logger.info('✅ Hybrid WhatsApp Bot initialization complete', {
                baileys: this.baileysConnected,
                waha: this.wahaConnected,
                activeMode: this.getActiveMode()
            });

            return true;
        } catch (error) {
            this.logger.error('❌ Failed to initialize Hybrid WhatsApp Bot:', error);
            throw error;
        }
    }

    async initializeBaileys() {
        try {
            this.logger.info('📱 Initializing Baileys...');

            const { state, saveCreds } = await useMultiFileAuthState('./sessions/baileys_auth_info');
            const { version, isLatest } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                version,
                logger: this.logger.child({ component: 'baileys' }),
                printQRInTerminal: process.env.NODE_ENV === 'development',
                auth: state,
                generateHighQualityLinkPreview: true,
                markOnlineOnConnect: false,
            });

            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('connection.update', this.handleBaileysConnectionUpdate.bind(this));
            this.sock.ev.on('messages.upsert', this.handleBaileysMessages.bind(this));

            this.logger.info('✅ Baileys initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize Baileys:', error);
            this.baileysConnected = false;
        }
    }

    async initializeWAHA() {
        try {
            this.logger.info('🌐 Initializing WAHA...');
            await this.wahaService.initialize();
            this.wahaConnected = true;
            this.logger.info('✅ WAHA initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize WAHA:', error);
            this.wahaConnected = false;
        }
    }

    handleBaileysConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr && process.env.NODE_ENV === 'development') {
            this.logger.info('📱 Baileys QR Code available - scan with WhatsApp');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            this.baileysConnected = false;

            if (shouldReconnect) {
                this.logger.info('🔄 Reconnecting Baileys...');
                setTimeout(() => this.initializeBaileys(), 5000);
            } else {
                this.logger.warn('❌ Baileys logged out - manual re-authentication required');
            }
        } else if (connection === 'open') {
            this.logger.info('✅ Baileys connected successfully');
            this.baileysConnected = true;
            this.processMessageQueue();
        }
    }

    async handleBaileysMessages(m) {
        try {
            const message = m.messages[0];

            // Ignore messages from bot or invalid messages
            if (!message.message || message.key.fromMe) return;

            const messageText = this.extractMessageText(message);
            if (!messageText) return;

            const remoteJid = message.key.remoteJid;
            const phone = remoteJid.replace('@s.whatsapp.net', '');
            const contactName = message.pushName || 'Cliente';

            this.logger.info(`📨 Baileys message from ${phone}: ${messageText.substring(0, 50)}...`);

            // Process message through hybrid handler
            await this.processIncomingMessage({
                phone,
                message: messageText,
                name: contactName,
                source: 'baileys',
                originalData: message
            });

        } catch (error) {
            this.logger.error('❌ Error handling Baileys message:', error);
        }
    }

    async handleWAHAWebhook(webhookData) {
        try {
            const messageInfo = await this.wahaService.handleWebhook(webhookData);

            if (messageInfo && messageInfo.phone) {
                this.logger.info(`📨 WAHA message from ${messageInfo.phone}: ${messageInfo.message.substring(0, 50)}...`);

                // Process message through hybrid handler
                await this.processIncomingMessage({
                    phone: messageInfo.phone,
                    message: messageInfo.message,
                    name: 'Cliente', // WAHA might not provide name in webhook
                    source: 'waha',
                    originalData: messageInfo.originalData
                });
            }

            return { success: true };
        } catch (error) {
            this.logger.error('❌ Error handling WAHA webhook:', error);
            throw error;
        }
    }

    async processIncomingMessage(messageData) {
        try {
            const { phone, message, name, source } = messageData;

            // Check for spam
            const isSpam = await this.databaseService.isSpamUser(phone);
            if (isSpam) {
                this.logger.info(`⏰ Message ignored (anti-spam): ${phone}`);
                return;
            }

            // Save message to database
            await this.databaseService.saveMessage({
                phone,
                message_text: message,
                direction: 'inbound',
                message_type: 'text'
            });

            // Save/update contact
            await this.databaseService.saveContact({
                phone,
                name,
                notes: `Last contact via ${source}`
            });

            // Check business hours
            if (!isBusinessHours()) {
                await this.sendOutOfHoursMessage(phone);
                return;
            }

            // Process message with handler
            const response = await this.messageHandler.processMessage({
                from: phone,
                body: message,
                name: name
            });

            if (response) {
                await this.sendMessage(phone, response);
            }

            // Analytics
            await this.databaseService.saveAnalytics('messages_received', 1, {
                source,
                phone,
                message_length: message.length
            });

        } catch (error) {
            this.logger.error('❌ Error processing incoming message:', error);
        }
    }

    async sendMessage(phone, message) {
        try {
            const activeMode = this.getActiveMode();

            this.logger.info(`📤 Sending message via ${activeMode} to ${phone}: ${message.substring(0, 50)}...`);

            let success = false;

            // Try preferred mode first
            if (activeMode === 'baileys' && this.baileysConnected) {
                success = await this.sendViaBaileys(phone, message);
            } else if (activeMode === 'waha' && this.wahaConnected) {
                success = await this.sendViaWAHA(phone, message);
            }

            // Fallback to alternative mode if enabled and preferred failed
            if (!success && this.fallbackEnabled) {
                this.logger.warn(`⚠️ ${activeMode} failed, trying fallback...`);

                if (activeMode === 'baileys' && this.wahaConnected) {
                    success = await this.sendViaWAHA(phone, message);
                } else if (activeMode === 'waha' && this.baileysConnected) {
                    success = await this.sendViaBaileys(phone, message);
                }
            }

            // Queue message if both failed
            if (!success) {
                this.logger.error('❌ Both WhatsApp services failed, queuing message');
                this.messageQueue.push({ phone, message, timestamp: Date.now() });
            } else {
                // Save to database
                await this.databaseService.saveMessage({
                    phone,
                    message_text: message,
                    direction: 'outbound',
                    message_type: 'text'
                });

                // Analytics
                await this.databaseService.saveAnalytics('messages_sent', 1, {
                    mode: activeMode,
                    phone,
                    message_length: message.length
                });
            }

            return success;

        } catch (error) {
            this.logger.error('❌ Error sending message:', error);
            return false;
        }
    }

    async sendViaBaileys(phone, message) {
        try {
            if (!this.baileysConnected || !this.sock) {
                return false;
            }

            const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
            await this.sock.sendMessage(jid, { text: message });

            this.logger.info(`✅ Message sent via Baileys to ${phone}`);
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to send via Baileys:', error);
            return false;
        }
    }

    async sendViaWAHA(phone, message) {
        try {
            if (!this.wahaConnected) {
                return false;
            }

            const chatId = this.wahaService.formatPhoneNumber(phone);
            await this.wahaService.sendMessage(chatId, message);

            this.logger.info(`✅ Message sent via WAHA to ${phone}`);
            return true;
        } catch (error) {
            this.logger.error('❌ Failed to send via WAHA:', error);
            return false;
        }
    }

    async sendOutOfHoursMessage(phone) {
        const outOfHoursMsg = process.env.MENSAGEM_FORA_HORARIO ||
            '⏰ No momento estamos fechados. Nosso horário: Segunda a Sexta: 6h às 22h | Sábado: 8h às 18h | Domingo: 8h às 14h. Deixe sua mensagem que retornaremos em breve!';

        await this.sendMessage(phone, outOfHoursMsg);
    }

    extractMessageText(message) {
        if (message.message.conversation) {
            return message.message.conversation;
        }
        if (message.message.extendedTextMessage) {
            return message.message.extendedTextMessage.text;
        }
        return null;
    }

    getActiveMode() {
        // Determine which mode to use based on connections and preferences
        if (this.preferredMode === 'baileys' && this.baileysConnected) {
            return 'baileys';
        } else if (this.preferredMode === 'waha' && this.wahaConnected) {
            return 'waha';
        } else if (this.baileysConnected) {
            return 'baileys';
        } else if (this.wahaConnected) {
            return 'waha';
        } else {
            return 'none';
        }
    }

    startMessageQueueProcessor() {
        setInterval(async () => {
            if (this.messageQueue.length > 0 && !this.processingQueue) {
                await this.processMessageQueue();
            }
        }, 30000); // Check every 30 seconds
    }

    async processMessageQueue() {
        if (this.processingQueue || this.messageQueue.length === 0) {
            return;
        }

        this.processingQueue = true;
        this.logger.info(`📋 Processing message queue (${this.messageQueue.length} messages)`);

        const messagesToProcess = [...this.messageQueue];
        this.messageQueue = [];

        for (const queuedMessage of messagesToProcess) {
            const { phone, message, timestamp } = queuedMessage;

            // Skip very old messages (older than 1 hour)
            if (Date.now() - timestamp > 3600000) {
                this.logger.warn(`⏰ Skipping old queued message to ${phone}`);
                continue;
            }

            const success = await this.sendMessage(phone, message);
            if (!success) {
                // Re-queue if still failing
                this.messageQueue.push(queuedMessage);
            }

            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.processingQueue = false;
    }

    getStatus() {
        const activeMode = this.getActiveMode();

        return {
            hybrid: true,
            activeMode,
            baileys: {
                connected: this.baileysConnected,
                available: !!this.sock
            },
            waha: {
                connected: this.wahaConnected,
                available: !!this.wahaService
            },
            messageQueue: this.messageQueue.length,
            preferredMode: this.preferredMode,
            fallbackEnabled: this.fallbackEnabled,
            academy: process.env.ACADEMIA_NOME || 'Academia Full Force'
        };
    }

    async healthCheck() {
        const wahaHealth = this.wahaConnected ? await this.wahaService.healthCheck() : { waha: false };

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            whatsapp: {
                hybrid: true,
                activeMode: this.getActiveMode(),
                baileys: this.baileysConnected,
                waha: this.wahaConnected
            },
            messageQueue: this.messageQueue.length,
            waha: wahaHealth
        };
    }

    async shutdown() {
        this.logger.info('🛑 Shutting down Hybrid WhatsApp Bot...');

        // Process remaining queued messages
        if (this.messageQueue.length > 0) {
            this.logger.info(`📋 Processing ${this.messageQueue.length} remaining messages...`);
            await this.processMessageQueue();
        }

        // Shutdown Baileys
        if (this.sock) {
            try {
                await this.sock.logout();
                this.baileysConnected = false;
            } catch (error) {
                this.logger.error('Error shutting down Baileys:', error);
            }
        }

        // Shutdown WAHA
        if (this.wahaService) {
            await this.wahaService.shutdown();
            this.wahaConnected = false;
        }

        this.logger.info('✅ Hybrid WhatsApp Bot shutdown complete');
    }
}

module.exports = HybridWhatsAppBot;