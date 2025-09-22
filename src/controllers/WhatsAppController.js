/**
 * 📱 WHATSAPP CONTROLLER - FullForce Academia
 * Enterprise WhatsApp automation controller for high-volume campaigns
 * Integrates with WAHA Cloud Service for optimal performance
 */

const WAHACloudService = require('../services/waha-cloud-service');
const MessageTemplateService = require('../services/MessageTemplateService');
const { validateMessage, sanitizePhoneNumber } = require('../utils/validators');
const { WhatsAppError, RateLimitError } = require('../utils/errors');
const logger = require('../utils/logger');

class WhatsAppController {
    constructor() {
        this.wahaService = null;
        this.templateService = new MessageTemplateService();

        this.rateLimits = {
            messagesPerMinute: 100,
            messagesPerHour: 1000,
            messagesPerDay: 10000,
            maxRetries: 3
        };

        this.messageQueue = [];
        this.processingQueue = false;
        this.rateLimitCounters = new Map();
    }

    /**
     * Initialize WhatsApp controller
     */
    async initialize(databaseService, sheetsService) {
        try {
            this.wahaService = new WAHACloudService(databaseService, sheetsService);
            await this.wahaService.initializeCloudIntegration();

            // Setup rate limiting cleanup
            this.setupRateLimitCleanup();

            logger.info('📱 WhatsApp Controller initialized successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to initialize WhatsApp Controller:', error);
            throw new WhatsAppError('Controller initialization failed', error);
        }
    }

    /**
     * Send individual WhatsApp message with rate limiting
     */
    async sendMessage(phoneNumber, message, options = {}) {
        try {
            // Validate inputs
            const cleanPhone = sanitizePhoneNumber(phoneNumber);
            validateMessage(message);

            // Check rate limits
            await this.checkRateLimits();

            // Prepare message data
            const messageData = {
                phoneNumber: cleanPhone,
                message: this.templateService.processTemplate(message, options.templateData),
                options: {
                    campaignId: options.campaignId,
                    segment: options.segment,
                    priority: options.priority || 'normal',
                    retryCount: options.retryCount || 0
                },
                timestamp: new Date()
            };

            // Send via WAHA Cloud Service
            const result = await this.wahaService.sendMessage(
                cleanPhone,
                messageData.message,
                messageData.options
            );

            // Update rate limit counters
            this.updateRateLimitCounters();

            // Log message
            await this.logMessage(messageData, result);

            logger.info('📤 Message sent successfully', {
                phone: cleanPhone,
                campaignId: options.campaignId,
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                phone: cleanPhone,
                timestamp: messageData.timestamp
            };

        } catch (error) {
            logger.error('❌ Failed to send message:', error);

            if (error.code === 'RATE_LIMIT_EXCEEDED') {
                throw new RateLimitError('Rate limit exceeded', error);
            }

            throw new WhatsAppError('Message sending failed', error);
        }
    }

    /**
     * Send bulk messages with intelligent batching
     */
    async sendBulkMessages(recipients, messageTemplate, options = {}) {
        try {
            logger.info(`📨 Starting bulk message send to ${recipients.length} recipients`);

            const results = {
                total: recipients.length,
                sent: 0,
                errors: 0,
                details: [],
                startTime: new Date()
            };

            // Configure batching
            const batchSize = options.batchSize || 50;
            const delayBetweenBatches = options.delayBetweenBatches || 30000;

            // Process in batches
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(recipients.length / batchSize);

                logger.info(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} recipients)`);

                // Process batch with staggered sending
                const batchResults = await this.processBatch(batch, messageTemplate, options);

                // Aggregate results
                results.sent += batchResults.sent;
                results.errors += batchResults.errors;
                results.details.push(...batchResults.details);

                // Delay between batches (except for last batch)
                if (i + batchSize < recipients.length) {
                    logger.info(`⏸️ Waiting ${delayBetweenBatches/1000}s before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            results.endTime = new Date();
            results.duration = results.endTime - results.startTime;
            results.successRate = (results.sent / results.total) * 100;

            logger.info('✅ Bulk message send completed', {
                total: results.total,
                sent: results.sent,
                errors: results.errors,
                successRate: `${results.successRate.toFixed(1)}%`,
                duration: `${results.duration/1000}s`
            });

            return results;

        } catch (error) {
            logger.error('❌ Failed to send bulk messages:', error);
            throw new WhatsAppError('Bulk message sending failed', error);
        }
    }

    /**
     * Process batch of messages with staggered sending
     */
    async processBatch(batch, messageTemplate, options) {
        const batchResults = {
            sent: 0,
            errors: 0,
            details: []
        };

        // Process batch in parallel with staggered delays
        await Promise.all(batch.map(async (recipient, index) => {
            try {
                // Stagger messages within batch (2 seconds apart)
                const delay = index * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));

                // Personalize message
                const personalizedMessage = this.templateService.personalizeMessage(
                    messageTemplate,
                    recipient
                );

                // Send message
                const result = await this.sendMessage(
                    recipient.telefone,
                    personalizedMessage,
                    {
                        ...options,
                        templateData: recipient,
                        priority: recipient.priority || 'normal'
                    }
                );

                batchResults.sent++;
                batchResults.details.push({
                    phone: recipient.telefone,
                    name: recipient.nome,
                    status: 'sent',
                    messageId: result.messageId,
                    timestamp: new Date()
                });

            } catch (error) {
                batchResults.errors++;
                batchResults.details.push({
                    phone: recipient.telefone,
                    name: recipient.nome,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date()
                });

                logger.error(`❌ Failed to send to ${recipient.nome}:`, error);
            }
        }));

        return batchResults;
    }

    /**
     * Handle incoming WhatsApp messages
     */
    async handleIncomingMessage(messageData) {
        try {
            logger.info('📨 Received incoming WhatsApp message', {
                from: messageData.from,
                type: messageData.type
            });

            // Parse and validate message
            const parsedMessage = this.parseIncomingMessage(messageData);

            // Determine message intent
            const intent = await this.determineMessageIntent(parsedMessage);

            // Route to appropriate handler
            const response = await this.routeMessageByIntent(parsedMessage, intent);

            // Send automated response if needed
            if (response.shouldRespond) {
                await this.sendAutomatedResponse(parsedMessage.from, response.message);
            }

            // Log interaction
            await this.logIncomingMessage(parsedMessage, intent, response);

            return {
                success: true,
                intent,
                response: response.shouldRespond ? response.message : null
            };

        } catch (error) {
            logger.error('❌ Failed to handle incoming message:', error);
            throw new WhatsAppError('Message handling failed', error);
        }
    }

    /**
     * Parse incoming message data
     */
    parseIncomingMessage(messageData) {
        return {
            id: messageData.id,
            from: sanitizePhoneNumber(messageData.from),
            type: messageData.type,
            text: messageData.body || '',
            timestamp: new Date(messageData.timestamp * 1000),
            mediaUrl: messageData.mediaUrl || null,
            isGroup: messageData.fromMe === false && messageData.from.includes('@g.us')
        };
    }

    /**
     * Determine message intent for intelligent responses
     */
    async determineMessageIntent(message) {
        const text = message.text.toLowerCase().trim();

        // Interest indicators
        if (text.match(/\b(sim|yes|quero|interessado|voltei|voltar)\b/)) {
            return 'interest';
        }

        // Information requests
        if (text.match(/\b(preço|valor|horário|endereço|localização)\b/)) {
            return 'information_request';
        }

        // Negative responses
        if (text.match(/\b(não|nao|stop|parar|remover|sair)\b/)) {
            return 'opt_out';
        }

        // Questions
        if (text.includes('?') || text.match(/\b(como|quando|onde|que|qual)\b/)) {
            return 'question';
        }

        return 'general';
    }

    /**
     * Route message to appropriate handler based on intent
     */
    async routeMessageByIntent(message, intent) {
        switch (intent) {
            case 'interest':
                return this.handleInterestResponse(message);

            case 'information_request':
                return this.handleInformationRequest(message);

            case 'opt_out':
                return this.handleOptOut(message);

            case 'question':
                return this.handleQuestion(message);

            default:
                return this.handleGeneralMessage(message);
        }
    }

    /**
     * Intent handlers
     */
    async handleInterestResponse(message) {
        return {
            shouldRespond: true,
            message: `🎉 Que ótimo, ${this.getFirstName(message.from)}!

Vamos agendar sua volta?

📞 Entre em contato conosco:
WhatsApp: (65) 99999-9999
📍 Endereço: Rua das Academias, 123 - Matupá

Horários especiais para ex-alunos:
🕘 Manhã: 6h às 12h
🕕 Tarde: 14h às 22h

Aguardamos você! 💪`
        };
    }

    async handleInformationRequest(message) {
        return {
            shouldRespond: true,
            message: `📋 Informações Full Force Academia:

💰 Planos a partir de R$ 89,90
⏰ Funcionamento: Seg-Sex 6h-22h, Sáb 8h-18h
📍 Endereço: Rua das Academias, 123 - Matupá
📞 WhatsApp: (65) 99999-9999

🎁 Oferta especial para ex-alunos!
Entre em contato para mais detalhes.`
        };
    }

    async handleOptOut(message) {
        // Add to opt-out list
        await this.addToOptOutList(message.from);

        return {
            shouldRespond: true,
            message: `Entendido! Você foi removido da nossa lista de contatos.

Se mudar de ideia, sempre será bem-vindo na Full Force Academia! 🤝`
        };
    }

    async handleQuestion(message) {
        return {
            shouldRespond: true,
            message: `🤔 Ótima pergunta!

Para um atendimento personalizado, entre em contato:
📞 WhatsApp: (65) 99999-9999
📧 Email: contato@fullforceacademia.com

Nossa equipe está pronta para esclarecer todas as suas dúvidas! 😊`
        };
    }

    async handleGeneralMessage(message) {
        return {
            shouldRespond: true,
            message: `Olá! 👋

Obrigado pelo contato! Para um atendimento mais rápido:
📞 WhatsApp: (65) 99999-9999

Estamos aqui para ajudar! 💪`
        };
    }

    /**
     * Rate limiting management
     */
    async checkRateLimits() {
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const hour = Math.floor(now / 3600000);
        const day = Math.floor(now / 86400000);

        const minuteCount = this.rateLimitCounters.get(`minute:${minute}`) || 0;
        const hourCount = this.rateLimitCounters.get(`hour:${hour}`) || 0;
        const dayCount = this.rateLimitCounters.get(`day:${day}`) || 0;

        if (minuteCount >= this.rateLimits.messagesPerMinute) {
            throw new RateLimitError('Per-minute rate limit exceeded');
        }

        if (hourCount >= this.rateLimits.messagesPerHour) {
            throw new RateLimitError('Per-hour rate limit exceeded');
        }

        if (dayCount >= this.rateLimits.messagesPerDay) {
            throw new RateLimitError('Daily rate limit exceeded');
        }
    }

    updateRateLimitCounters() {
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const hour = Math.floor(now / 3600000);
        const day = Math.floor(now / 86400000);

        this.rateLimitCounters.set(`minute:${minute}`,
            (this.rateLimitCounters.get(`minute:${minute}`) || 0) + 1);
        this.rateLimitCounters.set(`hour:${hour}`,
            (this.rateLimitCounters.get(`hour:${hour}`) || 0) + 1);
        this.rateLimitCounters.set(`day:${day}`,
            (this.rateLimitCounters.get(`day:${day}`) || 0) + 1);
    }

    setupRateLimitCleanup() {
        // Clean old rate limit counters every 5 minutes
        setInterval(() => {
            const now = Date.now();
            const currentMinute = Math.floor(now / 60000);
            const currentHour = Math.floor(now / 3600000);
            const currentDay = Math.floor(now / 86400000);

            // Remove old counters
            for (const [key] of this.rateLimitCounters) {
                if (key.startsWith('minute:')) {
                    const minute = parseInt(key.split(':')[1]);
                    if (currentMinute - minute > 2) {
                        this.rateLimitCounters.delete(key);
                    }
                } else if (key.startsWith('hour:')) {
                    const hour = parseInt(key.split(':')[1]);
                    if (currentHour - hour > 2) {
                        this.rateLimitCounters.delete(key);
                    }
                } else if (key.startsWith('day:')) {
                    const day = parseInt(key.split(':')[1]);
                    if (currentDay - day > 2) {
                        this.rateLimitCounters.delete(key);
                    }
                }
            }
        }, 300000); // 5 minutes
    }

    /**
     * Utility methods
     */
    getFirstName(phoneNumber) {
        // This would typically look up the name from database
        return 'amigo(a)';
    }

    async addToOptOutList(phoneNumber) {
        // Add to database opt-out list
        logger.info(`📵 Added ${phoneNumber} to opt-out list`);
    }

    async logMessage(messageData, result) {
        // Log message to database for tracking
    }

    async logIncomingMessage(message, intent, response) {
        // Log incoming message and response
    }

    async sendAutomatedResponse(phoneNumber, message) {
        return this.sendMessage(phoneNumber, message, {
            campaignId: 'automated_response',
            priority: 'high'
        });
    }

    /**
     * Get WhatsApp service status
     */
    async getStatus() {
        try {
            if (!this.wahaService) {
                return { status: 'not_initialized' };
            }

            const wahaStatus = await this.wahaService.getCloudStatus();
            const rateLimitStatus = this.getRateLimitStatus();

            return {
                status: 'active',
                waha: wahaStatus,
                rateLimits: rateLimitStatus,
                messageQueue: this.messageQueue.length,
                timestamp: new Date()
            };
        } catch (error) {
            logger.error('❌ Failed to get WhatsApp status:', error);
            return { status: 'error', error: error.message };
        }
    }

    getRateLimitStatus() {
        const now = Date.now();
        const minute = Math.floor(now / 60000);
        const hour = Math.floor(now / 3600000);
        const day = Math.floor(now / 86400000);

        return {
            perMinute: {
                current: this.rateLimitCounters.get(`minute:${minute}`) || 0,
                limit: this.rateLimits.messagesPerMinute
            },
            perHour: {
                current: this.rateLimitCounters.get(`hour:${hour}`) || 0,
                limit: this.rateLimits.messagesPerHour
            },
            perDay: {
                current: this.rateLimitCounters.get(`day:${day}`) || 0,
                limit: this.rateLimits.messagesPerDay
            }
        };
    }
}

module.exports = WhatsAppController;