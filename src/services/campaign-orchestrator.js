const pino = require('pino');
const moment = require('moment');
const EventEmitter = require('events');

// Importar serviços do sistema
const CampaignSegmentation = require('./campaign-segmentation');
const ABTestingEngine = require('./ab-testing-engine');
const MessageTemplates = require('./message-templates');
const CampaignMonitor = require('./campaign-monitor');
const LGPDCompliance = require('./lgpd-compliance');
const CampaignAnalytics = require('./campaign-analytics');

/**
 * Sistema Orquestrador de Campanhas WhatsApp
 * Full Force Academia - Integração Completa WAHA + N8N
 */
class CampaignOrchestrator extends EventEmitter {
    constructor(databaseService, wahaService, n8nService) {
        super();

        this.databaseService = databaseService;
        this.wahaService = wahaService;
        this.n8nService = n8nService;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Inicializar componentes do sistema
        this.segmentation = new CampaignSegmentation(databaseService);
        this.abTesting = new ABTestingEngine(databaseService);
        this.templates = new MessageTemplates();
        this.monitor = new CampaignMonitor(databaseService, wahaService);
        this.lgpd = new LGPDCompliance(databaseService);
        this.analytics = new CampaignAnalytics(databaseService);

        // Estado do orquestrador
        this.state = {
            isInitialized: false,
            activeCampaigns: new Map(),
            processingQueue: [],
            stats: {
                totalProcessed: 0,
                successfulSends: 0,
                errors: 0,
                conversions: 0
            }
        };

        // Configurações da campanha
        this.campaignConfig = {
            maxConcurrentMessages: 10,
            messageInterval: 2000,        // 2 segundos entre mensagens
            retryAttempts: 3,
            retryDelay: 5000,            // 5 segundos
            batchSize: 50,               // Processar 50 leads por vez
            followUpDelays: {
                day1: 24 * 60 * 60 * 1000,    // 24 horas
                day3: 72 * 60 * 60 * 1000,    // 72 horas
                day7: 168 * 60 * 60 * 1000,   // 7 dias
                day14: 336 * 60 * 60 * 1000,  // 14 dias
                day30: 720 * 60 * 60 * 1000   // 30 dias
            }
        };

        // Fila de processamento
        this.messageQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Inicializa o sistema orquestrador completo
     */
    async initialize() {
        try {
            this.logger.info('🚀 Inicializando Sistema Orquestrador de Campanhas...');

            // 1. Verificar serviços externos
            await this.checkExternalServices();

            // 2. Inicializar monitoramento
            await this.monitor.startMonitoring();

            // 3. Configurar listeners de eventos
            this.setupEventListeners();

            // 4. Iniciar processamento da fila
            this.startQueueProcessing();

            // 5. Configurar webhooks
            await this.setupWebhooks();

            this.state.isInitialized = true;

            this.logger.info('✅ Sistema Orquestrador inicializado com sucesso');

            this.emit('orchestrator_initialized', {
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                services: this.getServiceStatus()
            });

            return true;

        } catch (error) {
            this.logger.error('❌ Erro ao inicializar Sistema Orquestrador:', error);
            throw error;
        }
    }

    /**
     * Executa campanha completa de reativação
     */
    async executeCampaign(campaignData) {
        try {
            this.logger.info(`🎯 Iniciando campanha: ${campaignData.name}`);

            // 1. Validar dados da campanha
            const validation = await this.validateCampaignData(campaignData);
            if (!validation.isValid) {
                throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
            }

            // 2. Criar registro da campanha
            const campaign = await this.createCampaignRecord(campaignData);

            // 3. Carregar e segmentar leads
            const segmentedLeads = await this.segmentation.segmentLeads(campaignData.leads);

            // 4. Configurar A/B tests se especificado
            let abTest = null;
            if (campaignData.enableABTest) {
                abTest = await this.setupABTest(campaign.id, segmentedLeads);
            }

            // 5. Processar cada segmento
            const results = await this.processSegments(campaign, segmentedLeads, abTest);

            // 6. Configurar follow-ups automáticos
            await this.scheduleFollowUps(campaign, results);

            // 7. Ativar monitoramento específico da campanha
            await this.activateCampaignMonitoring(campaign.id);

            this.logger.info(`✅ Campanha ${campaign.id} executada com sucesso`);

            return {
                campaign: campaign,
                results: results,
                abTest: abTest,
                followUpsScheduled: true
            };

        } catch (error) {
            this.logger.error(`❌ Erro ao executar campanha:`, error);
            throw error;
        }
    }

    /**
     * Processa segmentos de leads da campanha
     */
    async processSegments(campaign, segmentedLeads, abTest = null) {
        try {
            const results = {
                total: segmentedLeads.total,
                processed: 0,
                successful: 0,
                failed: 0,
                lgpdBlocked: 0,
                segmentResults: {}
            };

            for (const [segmentName, leads] of Object.entries(segmentedLeads.grupos)) {
                if (segmentName === 'stats') continue;

                this.logger.info(`📊 Processando segmento: ${segmentName} (${leads.length} leads)`);

                const segmentResult = await this.processSegmentLeads(
                    campaign,
                    segmentName,
                    leads,
                    abTest
                );

                results.segmentResults[segmentName] = segmentResult;
                results.processed += segmentResult.processed;
                results.successful += segmentResult.successful;
                results.failed += segmentResult.failed;
                results.lgpdBlocked += segmentResult.lgpdBlocked;
            }

            // Atualizar estatísticas globais
            this.state.stats.totalProcessed += results.processed;
            this.state.stats.successfulSends += results.successful;
            this.state.stats.errors += results.failed;

            return results;

        } catch (error) {
            this.logger.error('❌ Erro ao processar segmentos:', error);
            throw error;
        }
    }

    /**
     * Processa leads de um segmento específico
     */
    async processSegmentLeads(campaign, segmentName, leads, abTest = null) {
        try {
            const result = {
                segment: segmentName,
                total: leads.length,
                processed: 0,
                successful: 0,
                failed: 0,
                lgpdBlocked: 0,
                details: []
            };

            // Processar em lotes para não sobrecarregar
            const batches = this.chunkArray(leads, this.campaignConfig.batchSize);

            for (const [batchIndex, batch] of batches.entries()) {
                this.logger.info(`📦 Processando lote ${batchIndex + 1}/${batches.length} do segmento ${segmentName}`);

                for (const lead of batch) {
                    try {
                        const leadResult = await this.processLead(campaign, lead, abTest);
                        result.details.push(leadResult);

                        result.processed++;
                        if (leadResult.success) {
                            result.successful++;
                        } else if (leadResult.reason === 'LGPD_BLOCKED') {
                            result.lgpdBlocked++;
                        } else {
                            result.failed++;
                        }

                        // Delay entre mensagens para respeitar rate limits
                        if (result.processed < result.total) {
                            await this.delay(this.campaignConfig.messageInterval);
                        }

                    } catch (error) {
                        this.logger.error(`❌ Erro ao processar lead ${lead.nome}:`, error);
                        result.failed++;
                        result.details.push({
                            lead: lead,
                            success: false,
                            reason: 'PROCESSING_ERROR',
                            error: error.message
                        });
                    }
                }

                // Delay entre lotes
                if (batchIndex < batches.length - 1) {
                    await this.delay(5000); // 5 segundos entre lotes
                }
            }

            this.logger.info(`✅ Segmento ${segmentName} processado: ${result.successful}/${result.total} sucessos`);

            return result;

        } catch (error) {
            this.logger.error(`❌ Erro ao processar segmento ${segmentName}:`, error);
            throw error;
        }
    }

    /**
     * Processa um lead individual
     */
    async processLead(campaign, lead, abTest = null) {
        try {
            // 1. Verificar compliance LGPD
            const lgpdCheck = await this.lgpd.canSendMessage(lead);
            if (!lgpdCheck.canSend) {
                this.logger.warn(`🛡️ Lead ${lead.nome} bloqueado por LGPD: ${lgpdCheck.reason}`);

                // Se é primeira vez e precisa de consentimento, processar
                if (lgpdCheck.action === 'CONSENT_FLOW') {
                    await this.processLGPDConsentFlow(lead);
                }

                return {
                    lead: lead,
                    success: false,
                    reason: 'LGPD_BLOCKED',
                    lgpdReason: lgpdCheck.reason
                };
            }

            // 2. Determinar variante A/B se aplicável
            let abVariant = null;
            if (abTest) {
                abVariant = await this.abTesting.assignVariant(abTest.id, lead);
            }

            // 3. Selecionar template de mensagem
            const template = this.templates.selectTemplate(lead, {
                campaignId: campaign.id,
                abVariant: abVariant
            });

            // 4. Personalizar mensagem
            const personalizedTemplate = this.templates.personalizeTemplate(template, lead);

            // 5. Enviar mensagem via WAHA
            const sendResult = await this.sendWhatsAppMessage(
                lead.telefone,
                personalizedTemplate.message,
                {
                    campaignId: campaign.id,
                    leadId: lead.telefone,
                    segment: lead.segment,
                    abVariant: abVariant,
                    templateId: template.type || 'default'
                }
            );

            // 6. Registrar evento de A/B test
            if (abTest && sendResult.success) {
                await this.abTesting.recordEvent(abTest.id, lead.telefone, 'message_sent', {
                    variant: abVariant,
                    template: template.type
                });
            }

            // 7. Registrar no monitoramento
            if (sendResult.success) {
                this.monitor.emit('message_sent', {
                    campaignId: campaign.id,
                    phone: lead.telefone,
                    messageId: sendResult.messageId
                });
            } else {
                this.monitor.emit('error', {
                    campaignId: campaign.id,
                    phone: lead.telefone,
                    error: sendResult.error
                });
            }

            return {
                lead: lead,
                success: sendResult.success,
                messageId: sendResult.messageId,
                template: template.type,
                abVariant: abVariant,
                reason: sendResult.error || 'SUCCESS'
            };

        } catch (error) {
            this.logger.error(`❌ Erro ao processar lead ${lead.nome}:`, error);
            return {
                lead: lead,
                success: false,
                reason: 'PROCESSING_ERROR',
                error: error.message
            };
        }
    }

    /**
     * Envia mensagem WhatsApp via WAHA
     */
    async sendWhatsAppMessage(phone, message, metadata = {}) {
        try {
            if (!this.wahaService) {
                throw new Error('Serviço WAHA não disponível');
            }

            const result = await this.wahaService.sendMessage(phone, message, {
                campaignId: metadata.campaignId
            });

            if (result.success) {
                // Salvar no banco de dados
                if (this.databaseService) {
                    await this.databaseService.query(`
                        INSERT INTO messages
                        (phone, message_text, direction, message_type, campaign_id, status, created_at)
                        VALUES (?, ?, 'outbound', 'text', ?, 'SENT', datetime('now'))
                    `, [phone, message, metadata.campaignId]);
                }

                this.logger.info(`📱 Mensagem enviada para ${phone}: ${message.substring(0, 50)}...`);
            }

            return result;

        } catch (error) {
            this.logger.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Processa fluxo de consentimento LGPD
     */
    async processLGPDConsentFlow(lead) {
        try {
            // Solicitar consentimento via LGPD service
            await this.lgpd.requestConsent(lead);

            // Agendar follow-up para verificar resposta
            setTimeout(async () => {
                await this.checkConsentResponse(lead);
            }, 24 * 60 * 60 * 1000); // 24 horas

            this.logger.info(`🛡️ Fluxo de consentimento LGPD iniciado para ${lead.nome}`);

        } catch (error) {
            this.logger.error(`❌ Erro no fluxo LGPD para ${lead.nome}:`, error);
        }
    }

    /**
     * Configura A/B test para campanha
     */
    async setupABTest(campaignId, segmentedLeads) {
        try {
            const testConfig = {
                name: `Teste A/B - Campanha ${campaignId}`,
                segment: 'mixed',
                hypothesis: 'Mensagens com emoji têm maior taxa de conversão',
                targetMetric: 'conversion_rate',
                variants: {
                    A: {
                        name: 'Com Emoji',
                        template: 'standard_with_emoji'
                    },
                    B: {
                        name: 'Sem Emoji',
                        template: 'standard_without_emoji'
                    }
                }
            };

            const abTest = await this.abTesting.createABTest(testConfig);

            this.logger.info(`🧪 A/B Test criado: ${abTest.id}`);

            return abTest;

        } catch (error) {
            this.logger.error('❌ Erro ao configurar A/B test:', error);
            return null;
        }
    }

    /**
     * Agenda follow-ups automáticos
     */
    async scheduleFollowUps(campaign, results) {
        try {
            const followUpSchedules = [
                { delay: this.campaignConfig.followUpDelays.day1, type: 'day1' },
                { delay: this.campaignConfig.followUpDelays.day3, type: 'day3' },
                { delay: this.campaignConfig.followUpDelays.day7, type: 'day7' },
                { delay: this.campaignConfig.followUpDelays.day14, type: 'day14' }
            ];

            for (const schedule of followUpSchedules) {
                setTimeout(async () => {
                    await this.executeFollowUp(campaign.id, schedule.type);
                }, schedule.delay);
            }

            this.logger.info(`⏰ ${followUpSchedules.length} follow-ups agendados para campanha ${campaign.id}`);

        } catch (error) {
            this.logger.error('❌ Erro ao agendar follow-ups:', error);
        }
    }

    /**
     * Executa follow-up automático
     */
    async executeFollowUp(campaignId, followUpType) {
        try {
            this.logger.info(`🔄 Executando follow-up ${followUpType} para campanha ${campaignId}`);

            // Buscar leads que não responderam
            const nonRespondents = await this.getNonRespondents(campaignId);

            for (const lead of nonRespondents) {
                // Verificar LGPD novamente
                const lgpdCheck = await this.lgpd.canSendMessage(lead);
                if (!lgpdCheck.canSend) continue;

                // Selecionar template de follow-up
                const template = this.templates.selectTemplate(lead, {
                    followUpDay: followUpType.replace('day', ''),
                    campaignId: campaignId
                });

                // Enviar mensagem
                await this.sendWhatsAppMessage(lead.telefone, template.message, {
                    campaignId: campaignId,
                    followUpType: followUpType
                });

                // Delay entre mensagens
                await this.delay(this.campaignConfig.messageInterval);
            }

            this.logger.info(`✅ Follow-up ${followUpType} concluído: ${nonRespondents.length} mensagens enviadas`);

        } catch (error) {
            this.logger.error(`❌ Erro no follow-up ${followUpType}:`, error);
        }
    }

    /**
     * Configura webhooks para receber respostas
     */
    async setupWebhooks() {
        try {
            // Webhook para respostas do WhatsApp (WAHA)
            this.wahaService.on('message_received', async (data) => {
                await this.handleIncomingMessage(data);
            });

            // Webhook para N8N (se disponível)
            if (this.n8nService) {
                this.n8nService.on('workflow_completed', async (data) => {
                    await this.handleN8NWorkflowResult(data);
                });
            }

            this.logger.info('🔗 Webhooks configurados');

        } catch (error) {
            this.logger.error('❌ Erro ao configurar webhooks:', error);
        }
    }

    /**
     * Trata mensagens recebidas
     */
    async handleIncomingMessage(messageData) {
        try {
            const { phone, message, timestamp } = messageData;

            this.logger.info(`📨 Mensagem recebida de ${phone}: ${message}`);

            // 1. Detectar opt-out automático
            const isOptOut = await this.lgpd.detectOptOut(phone, message);
            if (isOptOut) {
                return; // LGPD service já processou
            }

            // 2. Verificar se é resposta de consentimento LGPD
            if (await this.isConsentResponse(phone, message)) {
                await this.lgpd.processConsentResponse(phone, message);
                return;
            }

            // 3. Detectar conversão
            const isConversion = await this.detectConversion(phone, message);
            if (isConversion) {
                await this.processConversion(phone, message);
            }

            // 4. Registrar resposta no monitoramento
            this.monitor.emit('response_received', {
                phone: phone,
                message: message,
                timestamp: timestamp
            });

            // 5. Registrar evento A/B se aplicável
            await this.recordABTestResponse(phone, message);

        } catch (error) {
            this.logger.error('❌ Erro ao processar mensagem recebida:', error);
        }
    }

    /**
     * Detecta conversão na resposta
     */
    async detectConversion(phone, message) {
        const conversionKeywords = [
            'sim', 'quero', 'aceito', 'vou', 'pode', 'confirmo',
            'interesse', 'agendar', 'visita', 'matricula'
        ];

        const normalizedMessage = message.toLowerCase();
        return conversionKeywords.some(keyword => normalizedMessage.includes(keyword));
    }

    /**
     * Processa conversão
     */
    async processConversion(phone, message) {
        try {
            // Registrar conversão no banco
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO campaign_conversions
                    (phone, message_text, conversion_value, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                `, [phone, message, 129.90]); // Valor padrão da mensalidade
            }

            // Atualizar estatísticas
            this.state.stats.conversions++;

            // Emitir evento de conversão
            this.monitor.emit('conversion', {
                phone: phone,
                message: message,
                value: 129.90
            });

            this.logger.info(`🎯 CONVERSÃO registrada para ${phone}!`);

        } catch (error) {
            this.logger.error('❌ Erro ao processar conversão:', error);
        }
    }

    /**
     * Métodos auxiliares
     */
    async checkExternalServices() {
        const services = {
            waha: false,
            database: false,
            n8n: false
        };

        // Verificar WAHA
        if (this.wahaService) {
            const wahaHealth = await this.wahaService.healthCheck();
            services.waha = wahaHealth.waha;
        }

        // Verificar Database
        if (this.databaseService) {
            try {
                await this.databaseService.query('SELECT 1');
                services.database = true;
            } catch (error) {
                services.database = false;
            }
        }

        // Verificar N8N (se disponível)
        services.n8n = !!this.n8nService;

        this.logger.info('🔍 Status dos serviços:', services);

        return services;
    }

    setupEventListeners() {
        // Escutar eventos do monitor
        this.monitor.on('alert_triggered', (alert) => {
            this.logger.warn(`⚠️ Alerta do monitor: ${alert.message}`);
        });

        this.monitor.on('campaigns_paused', (data) => {
            this.logger.warn(`⏸️ Campanhas pausadas: ${data.reason}`);
        });
    }

    startQueueProcessing() {
        this.isProcessingQueue = true;
        this.processMessageQueue();
    }

    async processMessageQueue() {
        while (this.isProcessingQueue) {
            if (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift();
                await this.processQueuedMessage(message);
            } else {
                await this.delay(1000); // Verificar fila a cada segundo
            }
        }
    }

    async processQueuedMessage(message) {
        try {
            // Processar mensagem da fila
            await this.sendWhatsAppMessage(message.phone, message.text, message.metadata);
        } catch (error) {
            this.logger.error('❌ Erro ao processar mensagem da fila:', error);
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async validateCampaignData(campaignData) {
        const errors = [];

        if (!campaignData.name) errors.push('Nome da campanha é obrigatório');
        if (!campaignData.leads || !Array.isArray(campaignData.leads)) {
            errors.push('Lista de leads é obrigatória');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    async createCampaignRecord(campaignData) {
        const campaign = {
            id: `CAMP_${Date.now()}`,
            name: campaignData.name,
            description: campaignData.description || '',
            createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 'ACTIVE',
            totalLeads: campaignData.leads.length
        };

        // Salvar no banco se disponível
        if (this.databaseService) {
            await this.databaseService.query(`
                INSERT INTO campaigns
                (id, name, description, status, total_leads, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [campaign.id, campaign.name, campaign.description, campaign.status, campaign.totalLeads]);
        }

        this.state.activeCampaigns.set(campaign.id, campaign);

        return campaign;
    }

    getServiceStatus() {
        return {
            waha: !!this.wahaService,
            database: !!this.databaseService,
            n8n: !!this.n8nService,
            monitor: this.monitor ? 'ACTIVE' : 'INACTIVE',
            analytics: !!this.analytics
        };
    }

    // Placeholder methods
    async activateCampaignMonitoring(campaignId) {
        this.logger.info(`📊 Monitoramento ativado para campanha ${campaignId}`);
    }

    async checkConsentResponse(lead) {
        // Implementar verificação de resposta de consentimento
    }

    async getNonRespondents(campaignId) {
        // Retornar leads que não responderam
        return [];
    }

    async isConsentResponse(phone, message) {
        // Verificar se mensagem é resposta de consentimento
        return message.toUpperCase().includes('SIM') || message.toUpperCase().includes('NÃO');
    }

    async recordABTestResponse(phone, message) {
        // Registrar resposta no A/B test se aplicável
    }

    async handleN8NWorkflowResult(data) {
        // Processar resultado de workflow N8N
        this.logger.info('📊 Resultado de workflow N8N recebido:', data);
    }

    /**
     * API pública para executar campanha com dados dos 650 leads
     */
    async executeMasterCampaign() {
        try {
            this.logger.info('🚀 Iniciando CAMPANHA MASTER Full Force Academia - 650 Leads');

            // Carregar dados segmentados existentes
            const segmentedData = require('../../processed-data/segmentacao_610_inativos.json');

            const campaignData = {
                name: 'Full Force Academia - Reativação Master 650',
                description: 'Campanha de reativação massiva com ROI projetado de 11.700%',
                leads: this.flattenSegmentedLeads(segmentedData),
                enableABTest: true,
                enableLGPD: true,
                enableAnalytics: true
            };

            const result = await this.executeCampaign(campaignData);

            this.logger.info('🎯 CAMPANHA MASTER EXECUTADA COM SUCESSO!');

            return result;

        } catch (error) {
            this.logger.error('❌ Erro na Campanha Master:', error);
            throw error;
        }
    }

    flattenSegmentedLeads(segmentedData) {
        const allLeads = [];

        Object.values(segmentedData.grupos).forEach(group => {
            if (Array.isArray(group)) {
                allLeads.push(...group);
            }
        });

        return allLeads;
    }
}

module.exports = CampaignOrchestrator;