// WAHA to N8N Cloud Bridge
// This script creates a bridge between local WAHA API and n8n cloud webhooks

const express = require('express');
const axios = require('axios');
const cors = require('cors');

class WAHAToN8nBridge {
    constructor() {
        this.app = express();
        this.port = process.env.BRIDGE_PORT || 3001;
        this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        this.wahaApiKey = process.env.WAHA_API_KEY || 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.n8nCloudUrl = process.env.N8N_CLOUD_URL || 'https://lionalpha.app.n8n.cloud';

        this.webhookUrls = {
            leadCapture: `${this.n8nCloudUrl}/webhook/fitness-academy-webhook`,
            whatsappResponses: `${this.n8nCloudUrl}/webhook/whatsapp-responses`
        };

        this.setupMiddleware();
        this.setupRoutes();

        console.log('🌉 WAHA to N8N Cloud Bridge initialized');
        console.log(`📱 WAHA URL: ${this.wahaUrl}`);
        console.log(`☁️ N8N Cloud URL: ${this.n8nCloudUrl}`);
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    waha: this.wahaUrl,
                    n8n_cloud: this.n8nCloudUrl
                }
            });
        });

        // Webhook receiver from WAHA
        this.app.post('/webhook/waha', async (req, res) => {
            try {
                console.log('📥 Received webhook from WAHA');
                console.log('📋 Payload:', JSON.stringify(req.body, null, 2));

                // Forward to n8n cloud
                await this.forwardToN8nCloud(req.body);

                res.json({ status: 'forwarded', timestamp: new Date().toISOString() });
            } catch (error) {
                console.error('❌ Error processing WAHA webhook:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Manual lead injection endpoint
        this.app.post('/api/inject-lead', async (req, res) => {
            try {
                console.log('📥 Injecting lead manually');

                const leadData = {
                    source: req.body.source || 'manual',
                    name: req.body.name,
                    phone: req.body.phone,
                    email: req.body.email || '',
                    message: req.body.message || '',
                    timestamp: new Date().toISOString()
                };

                const result = await this.sendToLeadCaptureWebhook(leadData);

                res.json({
                    status: 'success',
                    leadData,
                    result
                });
            } catch (error) {
                console.error('❌ Error injecting lead:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // WAHA API proxy endpoints
        this.app.post('/api/send-message', async (req, res) => {
            try {
                const { phone, message, session = 'default' } = req.body;

                const result = await this.sendViaWAHA(phone, message, session);

                res.json({
                    status: 'sent',
                    phone,
                    messageId: result.id,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Error sending message via WAHA:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get WAHA status
        this.app.get('/api/waha-status', async (req, res) => {
            try {
                const status = await this.getWAHAStatus();
                res.json(status);
            } catch (error) {
                console.error('❌ Error getting WAHA status:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Test n8n cloud connectivity
        this.app.post('/api/test-n8n', async (req, res) => {
            try {
                const testData = {
                    source: 'bridge_test',
                    name: 'Test User',
                    phone: '5566999999999',
                    email: 'test@bridge.com',
                    message: 'Test from WAHA bridge',
                    timestamp: new Date().toISOString()
                };

                const result = await this.sendToLeadCaptureWebhook(testData);

                res.json({
                    status: 'success',
                    message: 'N8N cloud connectivity test passed',
                    result
                });
            } catch (error) {
                console.error('❌ N8N connectivity test failed:', error);
                res.status(500).json({
                    status: 'failed',
                    error: error.message
                });
            }
        });
    }

    async forwardToN8nCloud(wahaPayload) {
        try {
            // Check if this is a message event
            if (wahaPayload.event === 'message' || wahaPayload.messages) {
                console.log('📤 Forwarding message to n8n cloud...');

                // Transform WAHA payload to WhatsApp Business API format expected by n8n
                const n8nPayload = this.transformWAHAToN8nFormat(wahaPayload);

                const response = await axios.post(this.webhookUrls.whatsappResponses, n8nPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'WAHA-N8N-Bridge/1.0'
                    },
                    timeout: 15000
                });

                console.log('✅ Message forwarded to n8n cloud successfully');
                return response.data;
            }
        } catch (error) {
            console.error('❌ Error forwarding to n8n cloud:', error.message);
            throw error;
        }
    }

    transformWAHAToN8nFormat(wahaPayload) {
        // Transform WAHA webhook format to WhatsApp Business API format
        const message = wahaPayload.payload || wahaPayload;

        return {
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            from: message.from?.replace('@c.us', '') || message.chatId?.replace('@c.us', ''),
                            id: message.id || `msg_${Date.now()}`,
                            timestamp: Math.floor((message.timestamp || Date.now()) / 1000),
                            type: message.type || 'text',
                            text: {
                                body: message.body || message.text || ''
                            }
                        }],
                        contacts: [{
                            profile: {
                                name: message.notifyName || message.sender?.name || 'Lead'
                            },
                            wa_id: message.from?.replace('@c.us', '') || message.chatId?.replace('@c.us', '')
                        }]
                    }
                }]
            }]
        };
    }

    async sendToLeadCaptureWebhook(leadData) {
        try {
            console.log('📤 Sending lead to n8n cloud lead capture webhook...');

            const response = await axios.post(this.webhookUrls.leadCapture, leadData, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WAHA-N8N-Bridge/1.0'
                },
                timeout: 15000
            });

            console.log('✅ Lead sent to n8n cloud successfully');
            return response.data;
        } catch (error) {
            console.error('❌ Error sending lead to n8n cloud:', error.message);
            throw error;
        }
    }

    async sendViaWAHA(phone, message, session = 'default') {
        try {
            console.log(`📤 Sending message via WAHA to ${phone}`);

            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const chatId = `${cleanPhone}@c.us`;

            const response = await axios.post(`${this.wahaUrl}/api/sendText`, {
                session: session,
                chatId: chatId,
                text: message
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 10000
            });

            console.log('✅ Message sent via WAHA successfully');
            return response.data;
        } catch (error) {
            console.error('❌ Error sending via WAHA:', error.message);
            throw error;
        }
    }

    async getWAHAStatus() {
        try {
            const response = await axios.get(`${this.wahaUrl}/api/sessions`, {
                headers: {
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 5000
            });

            return {
                status: 'connected',
                sessions: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async setupWAHAWebhook() {
        try {
            console.log('🔧 Setting up WAHA webhook...');

            const webhookUrl = `http://localhost:${this.port}/webhook/waha`;

            const webhookConfig = {
                url: webhookUrl,
                events: ['message'],
                retries: 3
            };

            const response = await axios.post(`${this.wahaUrl}/api/webhooks`, webhookConfig, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.wahaApiKey
                }
            });

            console.log('✅ WAHA webhook configured successfully');
            console.log(`📡 Webhook URL: ${webhookUrl}`);

            return response.data;
        } catch (error) {
            console.error('❌ Error setting up WAHA webhook:', error.message);
            throw error;
        }
    }

    async start() {
        try {
            // Test WAHA connectivity
            const wahaStatus = await this.getWAHAStatus();
            console.log('📊 WAHA Status:', wahaStatus.status);

            // Setup WAHA webhook
            await this.setupWAHAWebhook();

            // Start bridge server
            this.app.listen(this.port, () => {
                console.log(`🌉 WAHA to N8N Bridge running on port ${this.port}`);
                console.log(`📋 Health check: http://localhost:${this.port}/health`);
                console.log(`📱 Inject lead: POST http://localhost:${this.port}/api/inject-lead`);
                console.log(`🧪 Test N8N: POST http://localhost:${this.port}/api/test-n8n`);
            });

        } catch (error) {
            console.error('❌ Failed to start bridge:', error);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const bridge = new WAHAToN8nBridge();

    try {
        await bridge.start();
    } catch (error) {
        console.error('❌ Bridge startup failed:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Gracefully shutting down WAHA to N8N Bridge...');
    process.exit(0);
});

// Execute if called directly
if (require.main === module) {
    main();
}

module.exports = WAHAToN8nBridge;