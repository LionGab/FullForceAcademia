const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const Redis = require('redis');
require('dotenv').config();

// Core services
const HybridWhatsAppBot = require('./bot/hybrid-whatsapp-bot');
const DatabaseService = require('./services/database');

// New N8N Integration Services
const GoogleIntegration = require('./services/google-integration');
const ReactivationCampaigns = require('./services/reactivation-campaigns');
const ScheduledMessages = require('./services/scheduled-messages');
const N8NIntegrationRoutes = require('./routes/n8n-integration');

class FullForceAcademiaIntegratedApp {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;

        // Core services
        this.whatsappBot = null;
        this.databaseService = null;
        this.redisClient = null;

        // N8N Integration services
        this.googleIntegration = null;
        this.reactivationCampaigns = null;
        this.scheduledMessages = null;
        this.n8nRoutes = null;

        // Enhanced logging
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        this.isShuttingDown = false;
        this.setupGracefulShutdown();
        this.setupExpress();
    }

    setupExpress() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));

        // Rate limiting específico para N8N
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // Mais permissivo para N8N
            message: { error: 'Too many requests, please try again later.' },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Pular rate limiting para webhooks N8N locais
                return req.ip === '127.0.0.1' || req.ip === '::1' ||
                       req.headers['user-agent']?.includes('n8n');
            }
        });

        this.app.use('/api', apiLimiter);

        // CORS configuration para N8N
        this.app.use(cors({
            origin: [
                'http://localhost:5678', // N8N local
                'http://localhost:3000', // WAHA
                process.env.N8N_WEBHOOK_URL,
                process.env.FRONTEND_URL
            ].filter(Boolean),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info({
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }, 'Incoming request');
            next();
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                services: this.getServicesStatus()
            });
        });

        // Health check específico para N8N
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                n8n: {
                    integration: 'active',
                    workflows: 'ready',
                    campaigns: this.reactivationCampaigns ? 'initialized' : 'pending'
                },
                services: this.getServicesStatus()
            });
        });
    }

    async initializeServices() {
        try {
            this.logger.info('🚀 Inicializando FullForce Academia com N8N Integration...');

            // 1. Initialize Redis para filas
            await this.initializeRedis();

            // 2. Initialize Database
            await this.initializeDatabase();

            // 3. Initialize Google Integration
            await this.initializeGoogleIntegration();

            // 4. Initialize WhatsApp Bot
            await this.initializeWhatsApp();

            // 5. Initialize Campaign Services
            await this.initializeCampaignServices();

            // 6. Setup N8N Integration Routes
            await this.setupN8NRoutes();

            // 7. Setup error handling
            this.setupErrorHandling();

            // 8. Setup automated triggers
            await this.setupAutomatedTriggers();

            this.logger.info('✅ Todos os serviços inicializados com sucesso!');

        } catch (error) {
            this.logger.error('❌ Erro ao inicializar serviços:', error);
            throw error;
        }
    }

    async initializeRedis() {
        try {
            this.logger.info('🔄 Conectando ao Redis...');

            this.redisClient = Redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            });

            this.redisClient.on('error', (err) => {
                this.logger.error('❌ Redis error:', err);
            });

            this.redisClient.on('connect', () => {
                this.logger.info('✅ Redis conectado');
            });

            await this.redisClient.connect();

        } catch (error) {
            this.logger.warn('⚠️ Redis não disponível, usando modo fallback');
            this.redisClient = null;
        }
    }

    async initializeDatabase() {
        this.logger.info('🗄️ Inicializando banco de dados...');

        this.databaseService = new DatabaseService();
        await this.databaseService.initialize();

        this.logger.info('✅ Banco de dados inicializado');
    }

    async initializeGoogleIntegration() {
        this.logger.info('🔗 Inicializando Google Integration...');

        this.googleIntegration = new GoogleIntegration();
        await this.googleIntegration.initialize();

        // Configurar triggers automáticos N8N
        await this.googleIntegration.setupN8NTriggers();

        this.logger.info('✅ Google Integration inicializado');
    }

    async initializeWhatsApp() {
        this.logger.info('📱 Inicializando WhatsApp Bot...');

        this.whatsappBot = new HybridWhatsAppBot(
            this.googleIntegration, // Usar Google Integration ao invés de serviços separados
            this.databaseService,
            this.logger
        );

        await this.whatsappBot.initialize();

        this.logger.info('✅ WhatsApp Bot inicializado');
    }

    async initializeCampaignServices() {
        this.logger.info('🎯 Inicializando serviços de campanha...');

        // Reactivation Campaigns Service
        this.reactivationCampaigns = new ReactivationCampaigns(
            this.googleIntegration,
            this.whatsappBot
        );

        // Scheduled Messages Service
        this.scheduledMessages = new ScheduledMessages(
            this.whatsappBot,
            this.redisClient ? {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD
            } : null
        );

        this.logger.info('✅ Serviços de campanha inicializados');
    }

    async setupN8NRoutes() {
        this.logger.info('🔗 Configurando rotas N8N...');

        // N8N Integration Routes
        this.n8nRoutes = new N8NIntegrationRoutes(
            this.googleIntegration,
            this.googleIntegration, // Calendar também
            this.whatsappBot
        );

        this.app.use('/', this.n8nRoutes.getRoutes());

        // Endpoint específico para triggerar campanha 650
        this.app.post('/api/trigger-650-campaign', async (req, res) => {
            try {
                this.logger.info('🚀 Trigger manual da campanha 650 inativos');

                // Carregar alunos inativos
                const members = await this.googleIntegration.load650InactiveMembers();

                // Segmentar alunos
                const { segments, summary } = this.reactivationCampaigns.segmentMembers(members);

                // Executar campanha
                const results = await this.reactivationCampaigns.executeCampaign(segments, {
                    triggerN8N: true,
                    directSend: false // Usar apenas N8N por padrão
                });

                res.json({
                    success: true,
                    message: 'Campanha 650 inativos iniciada',
                    summary,
                    results,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                this.logger.error('❌ Erro ao triggerar campanha 650:', error);
                res.status(500).json({
                    success: false,
                    error: 'Erro ao iniciar campanha',
                    details: error.message
                });
            }
        });

        // Dashboard endpoint para monitoramento
        this.app.get('/api/dashboard', async (req, res) => {
            try {
                const stats = {
                    timestamp: new Date().toISOString(),
                    services: this.getServicesStatus(),
                    campaigns: await this.getCampaignStats(),
                    queue: this.scheduledMessages ? await this.scheduledMessages.getQueueStats() : null,
                    google: await this.googleIntegration.healthCheck()
                };

                res.json(stats);

            } catch (error) {
                this.logger.error('❌ Erro ao obter dashboard:', error);
                res.status(500).json({ error: error.message });
            }
        });

        this.logger.info('✅ Rotas N8N configuradas');
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            this.logger.error('❌ Unhandled error:', err);

            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
                timestamp: new Date().toISOString()
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: 'Endpoint not found',
                timestamp: new Date().toISOString()
            });
        });

        // Process error handlers
        process.on('uncaughtException', (error) => {
            this.logger.fatal('❌ Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    async setupAutomatedTriggers() {
        this.logger.info('⏰ Configurando triggers automáticos...');

        // Trigger automático diário para verificar novos inativos
        setInterval(async () => {
            try {
                if (this.isShuttingDown) return;

                this.logger.info('🔄 Verificação automática de novos inativos...');

                const members = await this.googleIntegration.load650InactiveMembers();
                const { segments } = this.reactivationCampaigns.segmentMembers(members);

                // Se há novos críticos, triggerar campanha
                if (segments.criticos.length > 0) {
                    this.logger.info(`🚨 ${segments.criticos.length} novos críticos encontrados`);
                    // Implementar lógica de trigger automático
                }

            } catch (error) {
                this.logger.error('❌ Erro na verificação automática:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 horas

        this.logger.info('✅ Triggers automáticos configurados');
    }

    getServicesStatus() {
        return {
            whatsapp: this.whatsappBot ? 'connected' : 'disconnected',
            database: this.databaseService ? 'connected' : 'disconnected',
            redis: this.redisClient ? 'connected' : 'disconnected',
            google: this.googleIntegration ? 'connected' : 'disconnected',
            campaigns: this.reactivationCampaigns ? 'ready' : 'not_ready',
            scheduler: this.scheduledMessages ? 'ready' : 'not_ready'
        };
    }

    async getCampaignStats() {
        try {
            if (!this.reactivationCampaigns) return null;

            return await this.reactivationCampaigns.getCampaignStatus();
        } catch (error) {
            this.logger.error('❌ Erro ao obter stats da campanha:', error);
            return null;
        }
    }

    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            this.logger.info(`📴 Recebido ${signal}, iniciando shutdown graceful...`);
            this.isShuttingDown = true;

            try {
                // Close WhatsApp connection
                if (this.whatsappBot) {
                    await this.whatsappBot.close();
                }

                // Close scheduled messages
                if (this.scheduledMessages) {
                    await this.scheduledMessages.close();
                }

                // Close Redis connection
                if (this.redisClient) {
                    await this.redisClient.quit();
                }

                // Close database
                if (this.databaseService) {
                    await this.databaseService.close();
                }

                this.logger.info('✅ Shutdown graceful concluído');
                process.exit(0);

            } catch (error) {
                this.logger.error('❌ Erro durante shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }

    async start() {
        try {
            await this.initializeServices();

            this.app.listen(this.port, () => {
                this.logger.info(`🚀 FullForce Academia N8N Integration rodando na porta ${this.port}`);
                this.logger.info(`📊 Dashboard: http://localhost:${this.port}/api/dashboard`);
                this.logger.info(`💊 Health: http://localhost:${this.port}/health`);
                this.logger.info(`🎯 Trigger 650: POST http://localhost:${this.port}/api/trigger-650-campaign`);
                this.logger.info(`🔗 N8N Integration: http://localhost:${this.port}/api/n8n/*`);
            });

        } catch (error) {
            this.logger.fatal('❌ Falha ao iniciar aplicação:', error);
            process.exit(1);
        }
    }
}

// Inicializar aplicação
if (require.main === module) {
    const app = new FullForceAcademiaIntegratedApp();
    app.start().catch(console.error);
}

module.exports = FullForceAcademiaIntegratedApp;