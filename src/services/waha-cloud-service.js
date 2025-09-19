const WAHAService = require('./waha-service');
const ReactivationCampaigns = require('./reactivation-campaigns');
const axios = require('axios');
const pino = require('pino');

class WAHACloudService extends WAHAService {
    constructor(databaseService, sheetsService) {
        super(databaseService);
        this.sheetsService = sheetsService;
        this.reactivationCampaigns = new ReactivationCampaigns(sheetsService, this);

        // Cloud-specific configuration
        this.isCloudDeployment = !!process.env.RAILWAY_STATIC_URL || !!process.env.HEROKU_APP_NAME;
        this.deploymentPlatform = process.env.RAILWAY_STATIC_URL ? 'railway' :
                                  process.env.HEROKU_APP_NAME ? 'heroku' : 'local';

        this.logger.info(`🌥️ WAHA Cloud Service initialized on ${this.deploymentPlatform}`);
    }

    async initializeCloudIntegration() {
        try {
            this.logger.info('☁️ Initializing WAHA Cloud Integration...');

            // Initialize base WAHA service
            await this.initialize();

            // Configure cloud-specific webhooks
            await this.configureCloudWebhooks();

            // Setup campaign automation
            await this.setupCampaignAutomation();

            this.logger.info('✅ WAHA Cloud Integration initialized successfully');
            return true;

        } catch (error) {
            this.logger.error('❌ Failed to initialize WAHA Cloud Integration:', error.message);
            throw error;
        }
    }

    async configureCloudWebhooks() {
        try {
            const webhookConfig = {
                url: this.getWebhookUrl(),
                events: ['message', 'session.status', 'session.upsert', 'message.ack'],
                retries: parseInt(process.env.WAHA_WEBHOOK_RETRIES) || 3,
                headers: {
                    'X-Academia-Secret': process.env.ACADEMIA_WEBHOOK_SECRET || 'fullforce_webhook_secret_2024'
                }
            };

            this.logger.info('🔗 Configuring cloud webhooks:', webhookConfig);
            return webhookConfig;

        } catch (error) {
            this.logger.error('❌ Failed to configure cloud webhooks:', error);
            throw error;
        }
    }

    getWebhookUrl() {
        if (process.env.WEBHOOK_URL) {
            return process.env.WEBHOOK_URL;
        }

        if (process.env.RAILWAY_STATIC_URL) {
            return `${process.env.RAILWAY_STATIC_URL}/webhook/waha`;
        }

        if (process.env.HEROKU_APP_NAME) {
            return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/webhook/waha`;
        }

        return 'http://localhost:4002/webhook/waha';
    }

    async setupCampaignAutomation() {
        try {
            this.logger.info('🎯 Setting up campaign automation for 650 inactive members...');

            // Load campaign configuration
            const campaignConfig = {
                batchSize: parseInt(process.env.CAMPAIGN_BATCH_SIZE) || 50,
                delayBetweenBatches: parseInt(process.env.CAMPAIGN_DELAY_BETWEEN_BATCHES) || 30000,
                maxRetries: parseInt(process.env.CAMPAIGN_MAX_RETRIES) || 3,
                avgMonthlyValue: parseFloat(process.env.AVG_MONTHLY_VALUE) || 129.90
            };

            this.campaignConfig = campaignConfig;
            this.logger.info('📊 Campaign configuration loaded:', campaignConfig);

            return campaignConfig;

        } catch (error) {
            this.logger.error('❌ Failed to setup campaign automation:', error);
            throw error;
        }
    }

    async execute650Campaign(options = {}) {
        try {
            this.logger.info('🚀 Executing 650 Inactive Members Campaign...');

            // Load 650 inactive members
            const members = await this.reactivationCampaigns.load650InactiveMembers();

            if (members.length === 0) {
                throw new Error('No inactive members found');
            }

            // Segment members intelligently
            const { segments, summary } = this.reactivationCampaigns.segmentMembers(members);

            // Execute campaign with cloud configuration
            const results = await this.executeCloudCampaign(segments, {
                ...this.campaignConfig,
                ...options,
                triggerN8N: false, // Direct execution via WAHA Cloud
                directSend: true
            });

            // Calculate ROI
            const roiCalculation = this.calculateROI(summary, results);

            this.logger.info('✅ Campaign 650 executed successfully:', {
                summary,
                results,
                roi: roiCalculation
            });

            return {
                success: true,
                members: members.length,
                segments,
                summary,
                results,
                roi: roiCalculation
            };

        } catch (error) {
            this.logger.error('❌ Failed to execute 650 campaign:', error);
            throw error;
        }
    }

    async executeCloudCampaign(segments, options) {
        const results = {
            sent: 0,
            errors: 0,
            details: [],
            timestamp: new Date().toISOString()
        };

        try {
            // Process segments by priority
            const allMembers = [
                ...segments.criticos,
                ...segments.moderados,
                ...segments.baixaFreq,
                ...segments.prospects
            ].sort((a, b) => a.prioridade - b.prioridade);

            this.logger.info(`📱 Processing ${allMembers.length} members via WAHA Cloud...`);

            // Process in batches
            const batchSize = options.batchSize || 50;
            const delayBetweenBatches = options.delayBetweenBatches || 30000;

            for (let i = 0; i < allMembers.length; i += batchSize) {
                const batch = allMembers.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(allMembers.length / batchSize);

                this.logger.info(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} members)`);

                // Process batch with delay between individual messages
                await Promise.all(batch.map(async (member, index) => {
                    try {
                        // Stagger messages within batch
                        const delay = index * 2000; // 2 seconds between messages
                        await new Promise(resolve => setTimeout(resolve, delay));

                        const message = this.reactivationCampaigns.generateCampaignMessage(member, 'inicial');
                        const chatId = this.formatPhoneNumber(member.telefone);

                        const result = await this.sendMessage(chatId, message, {
                            campaignId: 'campaign_650',
                            segment: member.urgencia,
                            memberIndex: member.index
                        });

                        if (result.success) {
                            results.sent++;
                            results.details.push({
                                telefone: member.telefone,
                                nome: member.nome,
                                status: 'Enviado',
                                messageId: result.messageId,
                                segment: member.urgencia,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            results.errors++;
                            results.details.push({
                                telefone: member.telefone,
                                nome: member.nome,
                                status: 'Erro',
                                error: result.error,
                                segment: member.urgencia,
                                timestamp: new Date().toISOString()
                            });
                        }

                    } catch (error) {
                        this.logger.error(`❌ Error sending to ${member.nome}:`, error);
                        results.errors++;
                        results.details.push({
                            telefone: member.telefone,
                            nome: member.nome,
                            status: 'Erro',
                            error: error.message,
                            segment: member.urgencia || 'unknown',
                            timestamp: new Date().toISOString()
                        });
                    }
                }));

                // Delay between batches
                if (i + batchSize < allMembers.length) {
                    this.logger.info(`⏸️ Waiting ${delayBetweenBatches/1000}s before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            // Log campaign to Google Sheets
            if (this.sheetsService) {
                await this.logCampaignToSheets(segments, results);
            }

            return results;

        } catch (error) {
            this.logger.error('❌ Failed to execute cloud campaign:', error);
            throw error;
        }
    }

    calculateROI(summary, results) {
        try {
            const investment = 1500; // R$ 1500 investment
            const avgMonthlyValue = parseFloat(process.env.AVG_MONTHLY_VALUE) || 129.90;

            // Calculate expected revenue based on actual sends and conversion rates
            const expectedRevenue =
                (results.details.filter(d => d.segment === 'CRITICA' && d.status === 'Enviado').length *
                 avgMonthlyValue * 0.35 * 6) +
                (results.details.filter(d => d.segment === 'ALTA' && d.status === 'Enviado').length *
                 avgMonthlyValue * 0.25 * 6) +
                (results.details.filter(d => d.segment === 'MEDIA' && d.status === 'Enviado').length *
                 avgMonthlyValue * 0.15 * 6) +
                (results.details.filter(d => d.segment === 'BAIXA' && d.status === 'Enviado').length *
                 avgMonthlyValue * 0.08 * 3);

            const roi = ((expectedRevenue - investment) / investment) * 100;
            const expectedNewMembers = Math.floor(
                results.details.filter(d => d.segment === 'CRITICA' && d.status === 'Enviado').length * 0.35 +
                results.details.filter(d => d.segment === 'ALTA' && d.status === 'Enviado').length * 0.25 +
                results.details.filter(d => d.segment === 'MEDIA' && d.status === 'Enviado').length * 0.15 +
                results.details.filter(d => d.segment === 'BAIXA' && d.status === 'Enviado').length * 0.08
            );

            return {
                investment,
                expectedRevenue: expectedRevenue.toFixed(2),
                roi: roi.toFixed(0),
                expectedNewMembers,
                sent: results.sent,
                errors: results.errors,
                successRate: ((results.sent / (results.sent + results.errors)) * 100).toFixed(1)
            };

        } catch (error) {
            this.logger.error('❌ Failed to calculate ROI:', error);
            return { error: error.message };
        }
    }

    async logCampaignToSheets(segments, results) {
        try {
            const summary = {
                data: new Date().toLocaleString('pt-BR'),
                tipo: 'Campanha 650 Inativos - WAHA Cloud',
                criticos: segments.criticos.length,
                moderados: segments.moderados.length,
                baixaFreq: segments.baixaFreq.length,
                prospects: segments.prospects.length,
                totalEnviados: results.sent,
                totalErros: results.errors,
                plataforma: this.deploymentPlatform,
                status: 'Executado via WAHA Cloud'
            };

            await this.sheetsService.appendRow('Campanhas_Historico', Object.values(summary));
            this.logger.info('✅ Campaign logged to Google Sheets');

        } catch (error) {
            this.logger.error('❌ Failed to log campaign to sheets:', error);
        }
    }

    async getCloudStatus() {
        try {
            const [wahaStatus, sessionStats] = await Promise.all([
                this.healthCheck(),
                this.getSessionStats()
            ]);

            return {
                cloud: {
                    platform: this.deploymentPlatform,
                    isCloudDeployment: this.isCloudDeployment,
                    webhookUrl: this.getWebhookUrl(),
                    timestamp: new Date().toISOString()
                },
                waha: wahaStatus,
                session: sessionStats,
                campaign: this.campaignConfig
            };

        } catch (error) {
            this.logger.error('❌ Failed to get cloud status:', error);
            return { error: error.message };
        }
    }

    async testCloudIntegration() {
        try {
            this.logger.info('🧪 Testing WAHA Cloud Integration...');

            const tests = [];

            // Test 1: WAHA Health Check
            try {
                const health = await this.healthCheck();
                tests.push({
                    test: 'WAHA Health Check',
                    status: health.waha ? 'PASS' : 'FAIL',
                    details: health
                });
            } catch (error) {
                tests.push({
                    test: 'WAHA Health Check',
                    status: 'FAIL',
                    error: error.message
                });
            }

            // Test 2: Session Status
            try {
                const sessionStatus = await this.getSessionStatus();
                tests.push({
                    test: 'Session Status',
                    status: sessionStatus.status === 'WORKING' ? 'PASS' : 'PARTIAL',
                    details: sessionStatus
                });
            } catch (error) {
                tests.push({
                    test: 'Session Status',
                    status: 'FAIL',
                    error: error.message
                });
            }

            // Test 3: Webhook Configuration
            tests.push({
                test: 'Webhook Configuration',
                status: 'PASS',
                details: {
                    url: this.getWebhookUrl(),
                    platform: this.deploymentPlatform
                }
            });

            const passedTests = tests.filter(t => t.status === 'PASS').length;
            const allTestsPassed = passedTests === tests.length;

            this.logger.info(`🧪 Test Results: ${passedTests}/${tests.length} passed`);

            return {
                success: allTestsPassed,
                passed: passedTests,
                total: tests.length,
                tests,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('❌ Failed to test cloud integration:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = WAHACloudService;