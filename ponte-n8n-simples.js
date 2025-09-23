// Ponte Simples WAHA -> N8N Cloud
// Esta ponte funciona sem configurar webhooks no WAHA

const express = require('express');
const axios = require('axios');

class PonteN8nSimples {
    constructor() {
        this.app = express();
        this.port = 3001;
        this.wahaUrl = 'http://localhost:3000';
        this.wahaApiKey = 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.n8nCloudUrl = 'https://lionalpha.app.n8n.cloud';

        this.webhookUrls = {
            leadCapture: `${this.n8nCloudUrl}/webhook/fitness-academy-webhook`,
            whatsappResponses: `${this.n8nCloudUrl}/webhook/whatsapp-responses`
        };

        this.setupServer();
        console.log('🌉 Ponte N8N Simples inicializada');
        console.log(`📱 WAHA: ${this.wahaUrl}`);
        console.log(`☁️ N8N Cloud: ${this.n8nCloudUrl}`);
    }

    setupServer() {
        this.app.use(express.json());

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                ponte: 'simples'
            });
        });

        // Injetar lead direto no N8N Cloud
        this.app.post('/api/inject-lead', async (req, res) => {
            try {
                console.log('📥 Injetando lead no N8N Cloud...');

                const leadData = {
                    source: req.body.source || 'manual',
                    name: req.body.name,
                    phone: req.body.phone,
                    email: req.body.email || '',
                    message: req.body.message || '',
                    timestamp: new Date().toISOString(),
                    campaign_id: `fitness_academy_${Date.now()}`
                };

                const result = await this.enviarParaN8nCloud(leadData);

                res.json({
                    success: true,
                    leadData,
                    result,
                    timestamp: new Date().toISOString()
                });

                console.log('✅ Lead enviado para N8N Cloud');

            } catch (error) {
                console.error('❌ Erro injetando lead:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Enviar mensagem via WAHA
        this.app.post('/api/send-message', async (req, res) => {
            try {
                const { phone, message } = req.body;

                console.log(`📤 Enviando mensagem para ${phone}...`);

                const result = await this.enviarViaWAHA(phone, message);

                res.json({
                    success: true,
                    phone,
                    messageId: result.id,
                    timestamp: new Date().toISOString()
                });

                console.log('✅ Mensagem enviada via WAHA');

            } catch (error) {
                console.error('❌ Erro enviando mensagem:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Testar conectividade N8N
        this.app.post('/api/test-n8n', async (req, res) => {
            try {
                console.log('🧪 Testando N8N Cloud...');

                const testData = {
                    source: 'ponte_test',
                    name: 'Teste Ponte',
                    phone: '5566999999999',
                    email: 'teste@ponte.com',
                    message: 'Teste de conectividade N8N Cloud',
                    timestamp: new Date().toISOString()
                };

                const result = await this.enviarParaN8nCloud(testData);

                res.json({
                    success: true,
                    message: 'N8N Cloud conectado com sucesso',
                    result
                });

                console.log('✅ Teste N8N Cloud passou');

            } catch (error) {
                console.error('❌ Teste N8N Cloud falhou:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Status WAHA
        this.app.get('/api/waha-status', async (req, res) => {
            try {
                const status = await this.verificarWAHA();
                res.json(status);
            } catch (error) {
                res.json({
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async enviarParaN8nCloud(leadData) {
        try {
            const response = await axios.post(this.webhookUrls.leadCapture, leadData, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Ponte-N8N-Simples/1.0'
                },
                timeout: 15000
            });

            return response.data;
        } catch (error) {
            console.error('❌ Erro enviando para N8N:', error.message);
            throw error;
        }
    }

    async enviarViaWAHA(phone, message) {
        try {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const chatId = `${cleanPhone}@c.us`;

            const response = await axios.post(`${this.wahaUrl}/api/sendText`, {
                session: 'default',
                chatId: chatId,
                text: message
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 10000
            });

            return response.data;
        } catch (error) {
            console.error('❌ Erro enviando via WAHA:', error.message);
            throw error;
        }
    }

    async verificarWAHA() {
        try {
            const response = await axios.get(`${this.wahaUrl}/api/sessions/default`, {
                headers: {
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 5000
            });

            return {
                status: 'connected',
                session: response.data,
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

    start() {
        this.app.listen(this.port, () => {
            console.log(`🌉 Ponte N8N Simples rodando na porta ${this.port}`);
            console.log(`📋 Health: http://localhost:${this.port}/health`);
            console.log(`📤 Inject Lead: POST http://localhost:${this.port}/api/inject-lead`);
            console.log(`💬 Send Message: POST http://localhost:${this.port}/api/send-message`);
            console.log(`🧪 Test N8N: POST http://localhost:${this.port}/api/test-n8n`);
            console.log(`📊 WAHA Status: GET http://localhost:${this.port}/api/waha-status`);
        });
    }
}

// Executar
if (require.main === module) {
    const ponte = new PonteN8nSimples();
    ponte.start();
}

module.exports = PonteN8nSimples;