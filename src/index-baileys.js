const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
require('dotenv').config();

const HybridWhatsAppBot = require('./bot/hybrid-whatsapp-bot');
const DatabaseService = require('./services/database');
const GoogleCalendarService = require('./services/google-calendar');
const GoogleSheetsService = require('./services/google-sheets');

class FullForceAcademiaApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.whatsappBot = null;
        this.databaseService = null;

        // Enhanced logging
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        this.setupExpress();
        this.initializeServices();
    }

    setupExpress() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Disable for API usage
            crossOriginEmbedderPolicy: false
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging middleware
        if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
            this.app.use((req, res, next) => {
                this.logger.info(`${req.method} ${req.path}`, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
                next();
            });
        }

        // Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Root endpoint
        this.app.get('/', async (req, res) => {
            try {
                const botStatus = this.whatsappBot ? this.whatsappBot.getStatus() : null;
                const dbHealth = this.databaseService ? await this.databaseService.healthCheck() : null;

                res.json({
                    message: '🔥 Academia Full Force - Assistente Virtual WhatsApp',
                    status: botStatus?.activeMode || 'Disconnected',
                    version: '3.0.0 - Hybrid Edition',
                    academy: process.env.ACADEMIA_NOME || 'Academia Full Force',
                    whatsapp: botStatus,
                    database: dbHealth,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.logger.error('Error in root endpoint:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Health check endpoint (required by Docker)
        this.app.get('/health', async (req, res) => {
            try {
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'Full Force Academia WhatsApp Bot',
                    version: '3.0.0'
                };

                // WhatsApp status
                if (this.whatsappBot) {
                    health.whatsapp = await this.whatsappBot.healthCheck();
                } else {
                    health.whatsapp = { status: 'not_initialized' };
                }

                // Database status
                if (this.databaseService) {
                    health.database = await this.databaseService.healthCheck();
                } else {
                    health.database = { status: 'not_initialized' };
                }

                // Overall health determination
                const isHealthy = health.whatsapp.status !== 'error' &&
                                health.database.postgres &&
                                health.database.redis;

                if (!isHealthy) {
                    health.status = 'degraded';
                }

                res.status(isHealthy ? 200 : 503).json(health);
            } catch (error) {
                this.logger.error('Health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
        });

        // Send message endpoint
        this.app.post('/send-message', async (req, res) => {
            try {
                const { phone, message } = req.body;

                if (!phone || !message) {
                    return res.status(400).json({
                        error: 'Phone and message are required',
                        received: { phone: !!phone, message: !!message }
                    });
                }

                if (!this.whatsappBot) {
                    return res.status(503).json({ error: 'WhatsApp service not initialized' });
                }

                const success = await this.whatsappBot.sendMessage(phone, message);

                if (success) {
                    res.json({
                        success: true,
                        message: 'Mensagem enviada com sucesso',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    res.status(500).json({
                        error: 'Falha ao enviar mensagem',
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                this.logger.error('Error sending message:', error);
                res.status(500).json({
                    error: 'Erro interno do servidor',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // WAHA webhook endpoint
        this.app.post('/webhook/waha', async (req, res) => {
            try {
                if (!this.whatsappBot || !this.whatsappBot.handleWAHAWebhook) {
                    return res.status(503).json({ error: 'WhatsApp service not available' });
                }

                const result = await this.whatsappBot.handleWAHAWebhook(req.body);
                res.json(result);
            } catch (error) {
                this.logger.error('WAHA webhook error:', error);
                res.status(500).json({ error: 'Webhook processing failed' });
            }
        });

        // Analytics endpoint
        this.app.get('/analytics', async (req, res) => {
            try {
                if (!this.databaseService) {
                    return res.status(503).json({ error: 'Database service not available' });
                }

                // Get basic analytics from database
                const client = await this.databaseService.pgPool.connect();
                try {
                    const [messagesStats, contactsStats, membersStats] = await Promise.all([
                        client.query(`
                            SELECT
                                COUNT(*) as total_messages,
                                COUNT(*) FILTER (WHERE direction = 'inbound') as inbound_messages,
                                COUNT(*) FILTER (WHERE direction = 'outbound') as outbound_messages,
                                COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') as messages_24h
                            FROM messages
                        `),
                        client.query('SELECT COUNT(*) as total_contacts FROM contacts'),
                        client.query('SELECT COUNT(*) as total_members FROM members')
                    ]);

                    res.json({
                        messages: messagesStats.rows[0],
                        contacts: contactsStats.rows[0],
                        members: membersStats.rows[0],
                        timestamp: new Date().toISOString()
                    });
                } finally {
                    client.release();
                }
            } catch (error) {
                this.logger.error('Analytics error:', error);
                res.status(500).json({ error: 'Failed to get analytics' });
            }
        });

        // Status endpoint
        this.app.get('/status', async (req, res) => {
            try {
                const status = {
                    application: {
                        name: 'Full Force Academia WhatsApp Bot',
                        version: '3.0.0',
                        uptime: process.uptime(),
                        environment: process.env.NODE_ENV || 'development',
                        timestamp: new Date().toISOString()
                    },
                    whatsapp: this.whatsappBot ? this.whatsappBot.getStatus() : { status: 'not_initialized' },
                    database: this.databaseService ? await this.databaseService.healthCheck() : { status: 'not_initialized' },
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                };

                res.json(status);
            } catch (error) {
                this.logger.error('Status error:', error);
                res.status(500).json({ error: 'Failed to get status' });
            }
        });

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            this.logger.error('Unhandled error:', error);
            res.status(500).json({
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });
    }

    async initializeServices() {
        try {
            this.logger.info('🚀 Iniciando Academia Full Force - WhatsApp Bot...');

            // Initialize database service first
            this.logger.info('🗄️ Inicializando Database Service...');
            this.databaseService = new DatabaseService();
            await this.databaseService.initializeConnections();

            // Initialize Google services
            this.logger.info('📊 Inicializando Google Services...');
            const calendarService = new GoogleCalendarService();
            const sheetsService = new GoogleSheetsService();

            // Initialize hybrid WhatsApp bot
            this.logger.info('📱 Inicializando Hybrid WhatsApp Bot...');
            this.whatsappBot = new HybridWhatsAppBot(
                this.databaseService,
                calendarService,
                sheetsService
            );
            await this.whatsappBot.initialize();

            this.logger.info('✅ Todos os serviços inicializados com sucesso!');

        } catch (error) {
            this.logger.error('❌ Erro ao inicializar serviços:', error);
            throw error;
        }
    }

    async start() {
        try {
            // Initialize services first
            await this.initializeServices();

            // Start the server
            this.server = this.app.listen(this.port, () => {
                this.logger.info('');
                this.logger.info('🔥 ====================================');
                this.logger.info('🔥   ACADEMIA FULL FORCE - BOT ATIVO');
                this.logger.info('🔥 ====================================');
                this.logger.info(`🌐 Servidor rodando em: http://localhost:${this.port}`);
                this.logger.info(`📱 WhatsApp Bot: Hybrid Edition (Baileys + WAHA)`);
                this.logger.info(`🏢 Academia: ${process.env.ACADEMIA_NOME || 'Academia Full Force'}`);
                this.logger.info('');
                this.logger.info('📋 Endpoints disponíveis:');
                this.logger.info(`   GET  / - Status do sistema`);
                this.logger.info(`   GET  /health - Health check`);
                this.logger.info(`   GET  /status - Status completo`);
                this.logger.info(`   GET  /analytics - Analytics básicos`);
                this.logger.info(`   POST /send-message - Enviar mensagem`);
                this.logger.info(`   POST /webhook/waha - WAHA webhooks`);
                this.logger.info('');
                this.logger.info('💪 Pronto para transformar vidas!');
                this.logger.info('🔥 ====================================');
            });

            // Handle server errors
            this.server.on('error', (error) => {
                this.logger.error('Server error:', error);
                this.shutdown();
            });

        } catch (error) {
            this.logger.error('❌ Failed to start application:', error);
            await this.shutdown();
            process.exit(1);
        }
    }

    async shutdown() {
        this.logger.info('🛑 Finalizando Academia Full Force Bot...');

        try {
            // Shutdown WhatsApp bot
            if (this.whatsappBot) {
                await this.whatsappBot.shutdown();
            }

            // Shutdown database connections
            if (this.databaseService) {
                await this.databaseService.shutdown();
            }

            // Close server
            if (this.server) {
                this.server.close();
            }

            this.logger.info('👋 Bot finalizado com sucesso!');
        } catch (error) {
            this.logger.error('Error during shutdown:', error);
        }

        process.exit(0);
    }
}

// Tratamento de sinais para shutdown graceful
process.on('SIGINT', async () => {
    console.log('\\n🛑 Recebido SIGINT, finalizando bot...');
    if (global.app) {
        await global.app.shutdown();
    }
});

process.on('SIGTERM', async () => {
    console.log('\\n🛑 Recebido SIGTERM, finalizando bot...');
    if (global.app) {
        await global.app.shutdown();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    if (global.app) {
        global.app.shutdown();
    } else {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    if (global.app) {
        global.app.shutdown();
    } else {
        process.exit(1);
    }
});

// Inicializar aplicação apenas se executado diretamente
if (require.main === module) {
    const app = new FullForceAcademiaApp();
    global.app = app;
    app.start().catch((error) => {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    });
}

module.exports = FullForceAcademiaApp;