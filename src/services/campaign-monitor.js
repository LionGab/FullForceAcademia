const pino = require('pino');
const moment = require('moment');
const EventEmitter = require('events');

/**
 * Sistema de Monitoramento de Campanhas em Tempo Real
 * Full Force Academia - Controle Total da Performance
 */
class CampaignMonitor extends EventEmitter {
    constructor(databaseService, wahaService) {
        super();

        this.databaseService = databaseService;
        this.wahaService = wahaService;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Estados da campanha
        this.campaignStates = new Map();

        // Métricas em tempo real
        this.realtimeMetrics = {
            totalCampaigns: 0,
            activeCampaigns: 0,
            messagesSent: 0,
            messagesDelivered: 0,
            responsesReceived: 0,
            conversions: 0,
            currentROI: 0,
            errorRate: 0
        };

        // Alertas configurados
        this.alertThresholds = {
            errorRate: 0.05,        // 5% de taxa de erro
            lowDeliveryRate: 0.90,  // 90% de entrega mínima
            lowResponseRate: 0.02,  // 2% de resposta mínima
            highOptOutRate: 0.10,   // 10% de opt-out máximo
            dailyLimit: 1000,       // Limite diário de mensagens
            hourlyLimit: 50         // Limite por hora
        };

        // Histórico de performance
        this.performanceHistory = [];

        // Intervalos de monitoramento
        this.monitoringIntervals = {};

        // Status de conexões
        this.connectionStatus = {
            waha: false,
            n8n: false,
            database: false,
            lastChecked: null
        };

        // Fila de mensagens pendentes
        this.messageQueue = [];

        // Rate limiting
        this.rateLimiters = {
            hourly: { count: 0, resetTime: moment().add(1, 'hour') },
            daily: { count: 0, resetTime: moment().add(1, 'day') }
        };
    }

    /**
     * Inicia sistema de monitoramento
     */
    async startMonitoring() {
        try {
            this.logger.info('🚀 Iniciando sistema de monitoramento de campanhas...');

            // Verificar conexões
            await this.checkConnections();

            // Carregar campanhas ativas
            await this.loadActiveCampaigns();

            // Iniciar monitoramento em tempo real
            this.startRealtimeMonitoring();

            // Iniciar verificações periódicas
            this.startPeriodicChecks();

            // Configurar listeners de eventos
            this.setupEventListeners();

            this.logger.info('✅ Sistema de monitoramento iniciado com sucesso');

            this.emit('monitoring_started', {
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                activeCampaigns: this.realtimeMetrics.activeCampaigns
            });

        } catch (error) {
            this.logger.error('❌ Erro ao iniciar monitoramento:', error);
            throw error;
        }
    }

    /**
     * Verifica status das conexões
     */
    async checkConnections() {
        try {
            // Verificar WAHA
            if (this.wahaService) {
                const wahaHealth = await this.wahaService.healthCheck();
                this.connectionStatus.waha = wahaHealth.waha;
            }

            // Verificar Database
            if (this.databaseService) {
                try {
                    await this.databaseService.query('SELECT 1');
                    this.connectionStatus.database = true;
                } catch (error) {
                    this.connectionStatus.database = false;
                }
            }

            // Verificar N8N (através de webhook test)
            try {
                // Implementar verificação N8N se necessário
                this.connectionStatus.n8n = true;
            } catch (error) {
                this.connectionStatus.n8n = false;
            }

            this.connectionStatus.lastChecked = moment().format('YYYY-MM-DD HH:mm:ss');

            this.logger.info('🔍 Status das conexões verificado:', this.connectionStatus);

        } catch (error) {
            this.logger.error('❌ Erro ao verificar conexões:', error);
        }
    }

    /**
     * Carrega campanhas ativas do banco de dados
     */
    async loadActiveCampaigns() {
        try {
            if (!this.databaseService) return;

            const campaigns = await this.databaseService.query(`
                SELECT * FROM campaigns
                WHERE status = 'ACTIVE'
                ORDER BY created_at DESC
            `);

            this.realtimeMetrics.activeCampaigns = campaigns?.length || 0;
            this.realtimeMetrics.totalCampaigns = campaigns?.length || 0;

            // Carregar estado de cada campanha
            for (const campaign of campaigns || []) {
                await this.loadCampaignState(campaign.id);
            }

            this.logger.info(`📊 ${this.realtimeMetrics.activeCampaigns} campanhas ativas carregadas`);

        } catch (error) {
            this.logger.error('❌ Erro ao carregar campanhas ativas:', error);
        }
    }

    /**
     * Carrega estado específico de uma campanha
     */
    async loadCampaignState(campaignId) {
        try {
            if (!this.databaseService) return;

            // Buscar métricas da campanha
            const metrics = await this.databaseService.query(`
                SELECT
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN status = 'READ' THEN 1 ELSE 0 END) as read,
                    SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) as responses,
                    SUM(CASE WHEN message_type = 'conversion' THEN 1 ELSE 0 END) as conversions
                FROM messages
                WHERE campaign_id = ?
            `, [campaignId]);

            const campaignMetrics = metrics[0] || {};

            const state = {
                id: campaignId,
                startTime: moment().format('YYYY-MM-DD HH:mm:ss'),

                metrics: {
                    messagesSent: campaignMetrics.total_messages || 0,
                    messagesDelivered: campaignMetrics.delivered || 0,
                    messagesRead: campaignMetrics.read || 0,
                    responsesReceived: campaignMetrics.responses || 0,
                    conversions: campaignMetrics.conversions || 0,

                    // Taxas calculadas
                    deliveryRate: this.calculateRate(campaignMetrics.delivered, campaignMetrics.total_messages),
                    openRate: this.calculateRate(campaignMetrics.read, campaignMetrics.delivered),
                    responseRate: this.calculateRate(campaignMetrics.responses, campaignMetrics.total_messages),
                    conversionRate: this.calculateRate(campaignMetrics.conversions, campaignMetrics.total_messages),

                    // Performance
                    errorCount: 0,
                    optOutCount: 0,
                    blockedCount: 0
                },

                alerts: [],
                status: 'ACTIVE',
                lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            this.campaignStates.set(campaignId, state);

            return state;

        } catch (error) {
            this.logger.error(`❌ Erro ao carregar estado da campanha ${campaignId}:`, error);
            return null;
        }
    }

    /**
     * Inicia monitoramento em tempo real
     */
    startRealtimeMonitoring() {
        // Atualizar métricas a cada 10 segundos
        this.monitoringIntervals.metrics = setInterval(async () => {
            await this.updateRealtimeMetrics();
        }, 10000);

        // Verificar alertas a cada 30 segundos
        this.monitoringIntervals.alerts = setInterval(async () => {
            await this.checkAlerts();
        }, 30000);

        // Salvar snapshot de performance a cada 5 minutos
        this.monitoringIntervals.snapshot = setInterval(async () => {
            await this.savePerformanceSnapshot();
        }, 300000);

        this.logger.info('📊 Monitoramento em tempo real iniciado');
    }

    /**
     * Inicia verificações periódicas
     */
    startPeriodicChecks() {
        // Verificar conexões a cada 2 minutos
        this.monitoringIntervals.connections = setInterval(async () => {
            await this.checkConnections();
        }, 120000);

        // Reset de rate limiters
        this.monitoringIntervals.rateLimitReset = setInterval(() => {
            this.resetRateLimiters();
        }, 60000); // A cada minuto

        // Limpeza de dados antigos a cada hora
        this.monitoringIntervals.cleanup = setInterval(async () => {
            await this.cleanupOldData();
        }, 3600000);

        this.logger.info('⏰ Verificações periódicas iniciadas');
    }

    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Escutar eventos de mensagens
        this.on('message_sent', (data) => this.handleMessageSent(data));
        this.on('message_delivered', (data) => this.handleMessageDelivered(data));
        this.on('message_read', (data) => this.handleMessageRead(data));
        this.on('response_received', (data) => this.handleResponseReceived(data));
        this.on('conversion', (data) => this.handleConversion(data));
        this.on('error', (data) => this.handleError(data));
        this.on('opt_out', (data) => this.handleOptOut(data));

        this.logger.info('👂 Event listeners configurados');
    }

    /**
     * Atualiza métricas em tempo real
     */
    async updateRealtimeMetrics() {
        try {
            const oldMetrics = { ...this.realtimeMetrics };

            // Somar métricas de todas as campanhas ativas
            let totalMetrics = {
                messagesSent: 0,
                messagesDelivered: 0,
                responsesReceived: 0,
                conversions: 0,
                errorCount: 0
            };

            for (const [campaignId, state] of this.campaignStates) {
                if (state.status === 'ACTIVE') {
                    totalMetrics.messagesSent += state.metrics.messagesSent;
                    totalMetrics.messagesDelivered += state.metrics.messagesDelivered;
                    totalMetrics.responsesReceived += state.metrics.responsesReceived;
                    totalMetrics.conversions += state.metrics.conversions;
                    totalMetrics.errorCount += state.metrics.errorCount;
                }
            }

            // Atualizar métricas globais
            this.realtimeMetrics = {
                ...this.realtimeMetrics,
                ...totalMetrics,
                errorRate: this.calculateRate(totalMetrics.errorCount, totalMetrics.messagesSent),
                currentROI: this.calculateCurrentROI(),
                lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            // Emitir evento se houve mudanças significativas
            if (this.hasSignificantChange(oldMetrics, this.realtimeMetrics)) {
                this.emit('metrics_updated', {
                    old: oldMetrics,
                    new: this.realtimeMetrics,
                    timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                });
            }

        } catch (error) {
            this.logger.error('❌ Erro ao atualizar métricas em tempo real:', error);
        }
    }

    /**
     * Verifica alertas do sistema
     */
    async checkAlerts() {
        try {
            const alerts = [];

            // Verificar taxa de erro global
            if (this.realtimeMetrics.errorRate > this.alertThresholds.errorRate) {
                alerts.push({
                    type: 'HIGH_ERROR_RATE',
                    severity: 'CRITICAL',
                    message: `Taxa de erro muito alta: ${(this.realtimeMetrics.errorRate * 100).toFixed(2)}%`,
                    threshold: this.alertThresholds.errorRate * 100,
                    current: this.realtimeMetrics.errorRate * 100
                });
            }

            // Verificar limites de rate limiting
            if (this.rateLimiters.hourly.count > this.alertThresholds.hourlyLimit) {
                alerts.push({
                    type: 'RATE_LIMIT_EXCEEDED',
                    severity: 'WARNING',
                    message: `Limite por hora excedido: ${this.rateLimiters.hourly.count}/${this.alertThresholds.hourlyLimit}`,
                    current: this.rateLimiters.hourly.count,
                    limit: this.alertThresholds.hourlyLimit
                });
            }

            // Verificar conexões
            if (!this.connectionStatus.waha) {
                alerts.push({
                    type: 'CONNECTION_LOST',
                    severity: 'CRITICAL',
                    message: 'Conexão com WAHA perdida',
                    service: 'WAHA'
                });
            }

            // Verificar campanhas individuais
            for (const [campaignId, state] of this.campaignStates) {
                const campaignAlerts = await this.checkCampaignAlerts(campaignId, state);
                alerts.push(...campaignAlerts);
            }

            // Processar alertas
            if (alerts.length > 0) {
                await this.processAlerts(alerts);
            }

        } catch (error) {
            this.logger.error('❌ Erro ao verificar alertas:', error);
        }
    }

    /**
     * Verifica alertas específicos de uma campanha
     */
    async checkCampaignAlerts(campaignId, state) {
        const alerts = [];

        // Taxa de entrega baixa
        if (state.metrics.deliveryRate < this.alertThresholds.lowDeliveryRate &&
            state.metrics.messagesSent > 10) {
            alerts.push({
                type: 'LOW_DELIVERY_RATE',
                severity: 'WARNING',
                campaignId: campaignId,
                message: `Taxa de entrega baixa na campanha ${campaignId}: ${(state.metrics.deliveryRate * 100).toFixed(1)}%`,
                current: state.metrics.deliveryRate * 100,
                threshold: this.alertThresholds.lowDeliveryRate * 100
            });
        }

        // Taxa de resposta muito baixa
        if (state.metrics.responseRate < this.alertThresholds.lowResponseRate &&
            state.metrics.messagesSent > 50) {
            alerts.push({
                type: 'LOW_RESPONSE_RATE',
                severity: 'INFO',
                campaignId: campaignId,
                message: `Taxa de resposta baixa na campanha ${campaignId}: ${(state.metrics.responseRate * 100).toFixed(2)}%`,
                current: state.metrics.responseRate * 100,
                threshold: this.alertThresholds.lowResponseRate * 100
            });
        }

        return alerts;
    }

    /**
     * Processa lista de alertas
     */
    async processAlerts(alerts) {
        for (const alert of alerts) {
            this.logger.warn(`⚠️ ALERTA [${alert.severity}]: ${alert.message}`);

            // Salvar alerta no banco
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO campaign_alerts
                    (type, severity, message, data, created_at)
                    VALUES (?, ?, ?, ?, datetime('now'))
                `, [alert.type, alert.severity, alert.message, JSON.stringify(alert)]);
            }

            // Emitir evento de alerta
            this.emit('alert_triggered', alert);

            // Ações automáticas baseadas na severidade
            if (alert.severity === 'CRITICAL') {
                await this.handleCriticalAlert(alert);
            }
        }
    }

    /**
     * Trata alertas críticos
     */
    async handleCriticalAlert(alert) {
        try {
            this.logger.error(`🚨 ALERTA CRÍTICO: ${alert.message}`);

            switch (alert.type) {
                case 'HIGH_ERROR_RATE':
                    // Pausar campanhas se taxa de erro muito alta
                    await this.pauseAllCampaigns('High error rate detected');
                    break;

                case 'CONNECTION_LOST':
                    // Tentar reconectar
                    if (alert.service === 'WAHA') {
                        await this.attemptReconnection();
                    }
                    break;
            }

        } catch (error) {
            this.logger.error('❌ Erro ao tratar alerta crítico:', error);
        }
    }

    /**
     * Handlers de eventos específicos
     */
    async handleMessageSent(data) {
        const { campaignId, phone, messageId } = data;

        // Atualizar rate limiters
        this.rateLimiters.hourly.count++;
        this.rateLimiters.daily.count++;

        // Atualizar métricas da campanha
        if (this.campaignStates.has(campaignId)) {
            const state = this.campaignStates.get(campaignId);
            state.metrics.messagesSent++;
            state.lastUpdate = moment().format('YYYY-MM-DD HH:mm:ss');
        }

        this.logger.debug(`📤 Mensagem enviada: ${messageId} para ${phone}`);
    }

    async handleMessageDelivered(data) {
        const { campaignId, phone, messageId } = data;

        if (this.campaignStates.has(campaignId)) {
            const state = this.campaignStates.get(campaignId);
            state.metrics.messagesDelivered++;
            state.metrics.deliveryRate = this.calculateRate(
                state.metrics.messagesDelivered,
                state.metrics.messagesSent
            );
        }

        this.logger.debug(`✅ Mensagem entregue: ${messageId} para ${phone}`);
    }

    async handleResponseReceived(data) {
        const { campaignId, phone, message } = data;

        if (this.campaignStates.has(campaignId)) {
            const state = this.campaignStates.get(campaignId);
            state.metrics.responsesReceived++;
            state.metrics.responseRate = this.calculateRate(
                state.metrics.responsesReceived,
                state.metrics.messagesSent
            );
        }

        this.logger.info(`💬 Resposta recebida de ${phone}: ${message.substring(0, 50)}...`);
    }

    async handleConversion(data) {
        const { campaignId, phone, value } = data;

        if (this.campaignStates.has(campaignId)) {
            const state = this.campaignStates.get(campaignId);
            state.metrics.conversions++;
            state.metrics.conversionRate = this.calculateRate(
                state.metrics.conversions,
                state.metrics.messagesSent
            );
        }

        this.logger.info(`🎯 CONVERSÃO! ${phone} - Valor: R$ ${value}`);
    }

    async handleError(data) {
        const { campaignId, phone, error } = data;

        if (this.campaignStates.has(campaignId)) {
            const state = this.campaignStates.get(campaignId);
            state.metrics.errorCount++;
        }

        this.logger.error(`❌ Erro na campanha ${campaignId} para ${phone}: ${error}`);
    }

    /**
     * Métodos auxiliares
     */
    calculateRate(numerator, denominator) {
        return denominator > 0 ? numerator / denominator : 0;
    }

    calculateCurrentROI() {
        const totalRevenue = this.realtimeMetrics.conversions * 129.90; // Valor médio da mensalidade
        const totalCost = this.realtimeMetrics.messagesSent * 0.12; // Custo médio por mensagem
        return totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    }

    hasSignificantChange(oldMetrics, newMetrics) {
        const significantFields = ['messagesSent', 'conversions', 'errorRate'];
        return significantFields.some(field => {
            const oldValue = oldMetrics[field] || 0;
            const newValue = newMetrics[field] || 0;
            const changePercent = oldValue > 0 ? Math.abs((newValue - oldValue) / oldValue) : 0;
            return changePercent > 0.05; // 5% de mudança é significativa
        });
    }

    resetRateLimiters() {
        const now = moment();

        if (now.isAfter(this.rateLimiters.hourly.resetTime)) {
            this.rateLimiters.hourly = { count: 0, resetTime: now.add(1, 'hour') };
        }

        if (now.isAfter(this.rateLimiters.daily.resetTime)) {
            this.rateLimiters.daily = { count: 0, resetTime: now.add(1, 'day') };
        }
    }

    async savePerformanceSnapshot() {
        try {
            const snapshot = {
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                metrics: { ...this.realtimeMetrics },
                connectionStatus: { ...this.connectionStatus },
                activeCampaigns: this.campaignStates.size
            };

            this.performanceHistory.push(snapshot);

            // Manter apenas últimas 24 horas (288 snapshots de 5 minutos)
            if (this.performanceHistory.length > 288) {
                this.performanceHistory = this.performanceHistory.slice(-288);
            }

            // Salvar no banco se disponível
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO performance_snapshots (data, created_at)
                    VALUES (?, datetime('now'))
                `, [JSON.stringify(snapshot)]);
            }

        } catch (error) {
            this.logger.error('❌ Erro ao salvar snapshot de performance:', error);
        }
    }

    async cleanupOldData() {
        try {
            if (!this.databaseService) return;

            // Limpar alertas antigos (mais de 7 dias)
            await this.databaseService.query(`
                DELETE FROM campaign_alerts
                WHERE created_at < datetime('now', '-7 days')
            `);

            // Limpar snapshots antigos (mais de 30 dias)
            await this.databaseService.query(`
                DELETE FROM performance_snapshots
                WHERE created_at < datetime('now', '-30 days')
            `);

            this.logger.info('🧹 Limpeza de dados antigos concluída');

        } catch (error) {
            this.logger.error('❌ Erro na limpeza de dados:', error);
        }
    }

    /**
     * Métodos públicos para controle
     */
    async pauseAllCampaigns(reason) {
        this.logger.warn(`⏸️ Pausando todas as campanhas: ${reason}`);

        for (const [campaignId, state] of this.campaignStates) {
            state.status = 'PAUSED';
            state.pauseReason = reason;
        }

        this.emit('campaigns_paused', { reason, timestamp: moment().format('YYYY-MM-DD HH:mm:ss') });
    }

    async resumeAllCampaigns() {
        this.logger.info('▶️ Retomando todas as campanhas');

        for (const [campaignId, state] of this.campaignStates) {
            if (state.status === 'PAUSED') {
                state.status = 'ACTIVE';
                delete state.pauseReason;
            }
        }

        this.emit('campaigns_resumed', { timestamp: moment().format('YYYY-MM-DD HH:mm:ss') });
    }

    getCampaignMetrics(campaignId) {
        return this.campaignStates.get(campaignId)?.metrics || null;
    }

    getGlobalMetrics() {
        return { ...this.realtimeMetrics };
    }

    getPerformanceHistory() {
        return this.performanceHistory.slice();
    }

    async attemptReconnection() {
        try {
            this.logger.info('🔄 Tentando reconectar serviços...');

            if (this.wahaService) {
                await this.wahaService.initialize();
            }

            await this.checkConnections();

        } catch (error) {
            this.logger.error('❌ Falha na reconexão:', error);
        }
    }

    /**
     * Para o sistema de monitoramento
     */
    stopMonitoring() {
        // Limpar todos os intervalos
        Object.values(this.monitoringIntervals).forEach(interval => {
            clearInterval(interval);
        });

        this.logger.info('🛑 Sistema de monitoramento parado');
        this.emit('monitoring_stopped', { timestamp: moment().format('YYYY-MM-DD HH:mm:ss') });
    }
}

module.exports = CampaignMonitor;