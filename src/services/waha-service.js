const axios = require('axios');
const pino = require('pino');

class WAHAService {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.baseURL = process.env.WAHA_API_URL || 'http://localhost:3000';
        this.apiKey = process.env.WAHA_API_KEY || 'academia_secure_key_2024';
        this.sessionName = 'academia-session';

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Create axios instance with default config
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                this.logger.debug(`WAHA Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.logger.error('WAHA Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => {
                this.logger.debug(`WAHA Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.logger.error('WAHA Response Error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    url: error.config?.url
                });
                return Promise.reject(error);
            }
        );
    }

    // Session management
    async createSession() {
        try {
            const response = await this.api.post(`/api/sessions`, {
                name: this.sessionName,
                config: {
                    webhooks: [
                        {
                            url: process.env.WEBHOOK_URL || 'http://localhost:3001/webhook/waha',
                            events: ['message', 'session.status', 'session.upsert']
                        }
                    ]
                }
            });

            this.logger.info('✅ WAHA session created successfully', response.data);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to create WAHA session:', error.message);
            throw error;
        }
    }

    async getSessionStatus() {
        try {
            const response = await this.api.get(`/api/sessions/${this.sessionName}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return { status: 'NOT_FOUND' };
            }
            throw error;
        }
    }

    async startSession() {
        try {
            const response = await this.api.post(`/api/sessions/${this.sessionName}/start`);
            this.logger.info('✅ WAHA session started', response.data);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to start WAHA session:', error.message);
            throw error;
        }
    }

    async stopSession() {
        try {
            const response = await this.api.post(`/api/sessions/${this.sessionName}/stop`);
            this.logger.info('✅ WAHA session stopped', response.data);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to stop WAHA session:', error.message);
            throw error;
        }
    }

    async getQRCode() {
        try {
            const response = await this.api.get(`/api/sessions/${this.sessionName}/auth/qr`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get QR code:', error.message);
            throw error;
        }
    }

    // Message operations
    async sendMessage(chatId, message) {
        try {
            const payload = {
                chatId: chatId,
                text: message
            };

            const response = await this.api.post(
                `/api/sessions/${this.sessionName}/chats/${chatId}/messages/text`,
                payload
            );

            this.logger.info(`✅ Message sent via WAHA to ${chatId}`);

            // Log to database
            await this.databaseService.saveMessage({
                phone: chatId.replace('@c.us', ''),
                message_text: message,
                direction: 'outbound',
                message_type: 'text'
            });

            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to send message via WAHA:', error.message);
            throw error;
        }
    }

    async sendImage(chatId, imageUrl, caption = '') {
        try {
            const payload = {
                chatId: chatId,
                file: {
                    url: imageUrl
                },
                caption: caption
            };

            const response = await this.api.post(
                `/api/sessions/${this.sessionName}/chats/${chatId}/messages/image`,
                payload
            );

            this.logger.info(`✅ Image sent via WAHA to ${chatId}`);

            // Log to database
            await this.databaseService.saveMessage({
                phone: chatId.replace('@c.us', ''),
                message_text: `[IMAGE] ${caption}`,
                direction: 'outbound',
                message_type: 'image'
            });

            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to send image via WAHA:', error.message);
            throw error;
        }
    }

    async sendDocument(chatId, documentUrl, filename) {
        try {
            const payload = {
                chatId: chatId,
                file: {
                    url: documentUrl
                },
                filename: filename
            };

            const response = await this.api.post(
                `/api/sessions/${this.sessionName}/chats/${chatId}/messages/document`,
                payload
            );

            this.logger.info(`✅ Document sent via WAHA to ${chatId}`);

            // Log to database
            await this.databaseService.saveMessage({
                phone: chatId.replace('@c.us', ''),
                message_text: `[DOCUMENT] ${filename}`,
                direction: 'outbound',
                message_type: 'document'
            });

            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to send document via WAHA:', error.message);
            throw error;
        }
    }

    // Contact and chat operations
    async getChats() {
        try {
            const response = await this.api.get(`/api/sessions/${this.sessionName}/chats`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get chats:', error.message);
            throw error;
        }
    }

    async getChatMessages(chatId, limit = 50) {
        try {
            const response = await this.api.get(
                `/api/sessions/${this.sessionName}/chats/${chatId}/messages`,
                { params: { limit } }
            );
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get chat messages:', error.message);
            throw error;
        }
    }

    async getContactInfo(contactId) {
        try {
            const response = await this.api.get(
                `/api/sessions/${this.sessionName}/contacts/${contactId}`
            );
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get contact info:', error.message);
            throw error;
        }
    }

    // Webhook handling
    async handleWebhook(payload) {
        try {
            const { event, session, data } = payload;

            this.logger.info(`📨 WAHA Webhook received: ${event}`, {
                session,
                dataType: data?.type || 'unknown'
            });

            switch (event) {
                case 'message':
                    await this.handleMessageWebhook(data);
                    break;
                case 'session.status':
                    await this.handleSessionStatusWebhook(data);
                    break;
                case 'session.upsert':
                    await this.handleSessionUpsertWebhook(data);
                    break;
                default:
                    this.logger.warn(`Unhandled webhook event: ${event}`);
            }

            return { success: true, event };
        } catch (error) {
            this.logger.error('❌ Failed to handle webhook:', error);
            throw error;
        }
    }

    async handleMessageWebhook(messageData) {
        try {
            const { from, body, type } = messageData;

            if (!from || !body) {
                this.logger.warn('Invalid message data received');
                return;
            }

            // Extract phone number
            const phone = from.replace('@c.us', '');

            // Save to database
            await this.databaseService.saveMessage({
                phone: phone,
                message_text: body,
                direction: 'inbound',
                message_type: type || 'text'
            });

            this.logger.info(`📨 Message logged from ${phone}: ${body.substring(0, 50)}...`);

            // Return message data for further processing
            return {
                phone,
                message: body,
                type: type || 'text',
                originalData: messageData
            };

        } catch (error) {
            this.logger.error('❌ Failed to handle message webhook:', error);
            throw error;
        }
    }

    async handleSessionStatusWebhook(statusData) {
        this.logger.info('📱 Session status updated:', statusData);

        // Cache session status
        await this.databaseService.setCache(
            `waha:session:${this.sessionName}:status`,
            statusData,
            300 // 5 minutes
        );
    }

    async handleSessionUpsertWebhook(upsertData) {
        this.logger.info('🔄 Session upserted:', upsertData);

        // Cache session data
        await this.databaseService.setCache(
            `waha:session:${this.sessionName}:data`,
            upsertData,
            3600 // 1 hour
        );
    }

    // Health and monitoring
    async healthCheck() {
        try {
            const response = await this.api.get('/api/health');
            return {
                waha: true,
                status: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('❌ WAHA health check failed:', error.message);
            return {
                waha: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async getSessionStats() {
        try {
            const status = await this.getSessionStatus();
            const health = await this.healthCheck();

            return {
                session: status,
                health: health,
                api_url: this.baseURL,
                session_name: this.sessionName
            };
        } catch (error) {
            this.logger.error('❌ Failed to get session stats:', error.message);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Utility methods
    formatPhoneNumber(phone) {
        // Remove any formatting and ensure it has the @c.us suffix for WAHA
        const cleanPhone = phone.replace(/\D/g, '');
        return `${cleanPhone}@c.us`;
    }

    async initialize() {
        try {
            this.logger.info('🚀 Initializing WAHA service...');

            // Check if session exists
            const sessionStatus = await this.getSessionStatus();

            if (sessionStatus.status === 'NOT_FOUND') {
                this.logger.info('📱 Creating new WAHA session...');
                await this.createSession();
            }

            // Start session if not already started
            if (sessionStatus.status !== 'WORKING') {
                this.logger.info('▶️ Starting WAHA session...');
                await this.startSession();
            }

            this.logger.info('✅ WAHA service initialized successfully');
            return true;

        } catch (error) {
            this.logger.error('❌ Failed to initialize WAHA service:', error.message);
            throw error;
        }
    }

    async shutdown() {
        try {
            this.logger.info('🛑 Shutting down WAHA service...');
            await this.stopSession();
            this.logger.info('✅ WAHA service shutdown complete');
        } catch (error) {
            this.logger.error('❌ Error during WAHA shutdown:', error.message);
        }
    }
}

module.exports = WAHAService;