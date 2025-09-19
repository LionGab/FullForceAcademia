const express = require('express');
const router = express.Router();
const moment = require('moment');
const { body, validationResult } = require('joi');
const axios = require('axios');

// Services
const MessageHandler = require('../handlers/message-handler');
const ReactivationCampaigns = require('../services/reactivation-campaigns');
const ScheduledMessages = require('../services/scheduled-messages');

class N8NIntegrationRoutes {
    constructor(calendarService, sheetsService, whatsappService) {
        this.calendarService = calendarService;
        this.sheetsService = sheetsService;
        this.whatsappService = whatsappService;
        this.messageHandler = new MessageHandler(calendarService, sheetsService);
        this.reactivationCampaigns = new ReactivationCampaigns(sheetsService, whatsappService);
        this.scheduledMessages = new ScheduledMessages(whatsappService);

        this.setupRoutes();
    }

    setupRoutes() {
        // N8N Webhook Endpoint - Receber campanhas
        router.post('/api/n8n/send-campaign', this.validateCampaignData, this.sendCampaign.bind(this));

        // N8N Webhook Endpoint - Processar respostas
        router.post('/api/n8n/process-response', this.processResponse.bind(this));

        // N8N Health Check
        router.get('/api/n8n/health', this.healthCheck.bind(this));

        // N8N Stats Dashboard
        router.get('/api/n8n/stats', this.getStats.bind(this));

        // Trigger manual para 650 inativos
        router.post('/api/n8n/trigger-650-campaign', this.trigger650Campaign.bind(this));

        // ROI Dashboard endpoint
        router.get('/api/n8n/roi-dashboard', this.getRoiDashboard.bind(this));

        // Reactivation status update
        router.post('/api/n8n/update-status', this.updateReactivationStatus.bind(this));
    }

    validateCampaignData = (req, res, next) => {
        const schema = {
            telefone: 'string().required().min(10).max(15)',
            mensagem: 'string().required().min(10).max(1000)',
            nome: 'string().required().min(2).max(100)',
            urgencia: 'string().valid("CRITICA", "ALTA", "MEDIA", "BAIXA").required()',
            campanha: 'string().required()',
            expectedRevenue: 'number().min(0)',
            conversionRate: 'number().min(0).max(1)',
            session: 'string().default("fullforce_650")'
        };

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: error.details
            });
        }
        next();
    };

    async sendCampaign(req, res) {
        try {
            const {
                telefone,
                mensagem,
                nome,
                urgencia,
                campanha,
                expectedRevenue,
                conversionRate,
                session
            } = req.body;

            console.log(`📱 N8N Campaign: ${campanha} para ${nome} (${telefone})`);

            // Formatar telefone brasileiro
            const phoneNumber = telefone.replace(/\D/g, '');
            const formattedPhone = phoneNumber.startsWith('55') ? phoneNumber : `55${phoneNumber}`;

            // Enviar via WhatsApp
            const result = await this.whatsappService.sendMessage(
                `${formattedPhone}@c.us`,
                mensagem,
                { session: session || 'fullforce_650' }
            );

            // Log no Google Sheets via N8N
            await this.logCampaignToSheets({
                telefone: formattedPhone,
                nome,
                mensagem: mensagem.substring(0, 100) + '...',
                urgencia,
                campanha,
                dataEnvio: moment().format('DD/MM/YYYY HH:mm:ss'),
                status: result.success ? 'Enviado' : 'Erro',
                expectedRevenue: expectedRevenue || 0,
                conversionRate: conversionRate || 0
            });

            // Agendar follow-up automático
            if (result.success) {
                await this.scheduleFollowUp(telefone, nome, urgencia, campanha);
            }

            return res.json({
                success: result.success,
                messageId: result.messageId,
                telefone: formattedPhone,
                nome,
                campanha,
                timestamp: moment().toISOString(),
                expectedRevenue,
                conversionRate
            });

        } catch (error) {
            console.error('❌ Erro ao enviar campanha N8N:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro interno do servidor',
                details: error.message
            });
        }
    }

    async processResponse(req, res) {
        try {
            const { from, message, timestamp } = req.body;

            console.log(`📨 N8N Response: ${from} - ${message}`);

            // Processar resposta através do MessageHandler
            const response = await this.messageHandler.processMessage(
                message,
                from.replace('@c.us', ''),
                { pushname: 'Cliente N8N' }
            );

            // Detectar interesse (SIM, VOLTO, QUERO, etc.)
            const interesseWords = ['sim', 'volto', 'quero', 'aceito', 'ok', 'última', 'personal', 'gratis'];
            const temInteresse = interesseWords.some(word =>
                message.toLowerCase().includes(word)
            );

            if (temInteresse) {
                // Marcar como lead quente no Google Sheets
                await this.markAsHotLead(from, message, timestamp);

                // Notificar equipe de vendas
                await this.notifySalesTeam(from, message);
            }

            return res.json({
                success: true,
                response,
                temInteresse,
                timestamp: moment().toISOString()
            });

        } catch (error) {
            console.error('❌ Erro ao processar resposta N8N:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao processar resposta'
            });
        }
    }

    async healthCheck(req, res) {
        try {
            const stats = {
                status: 'healthy',
                timestamp: moment().toISOString(),
                services: {
                    whatsapp: await this.checkWhatsAppStatus(),
                    googleSheets: await this.checkGoogleSheetsStatus(),
                    n8n: await this.checkN8NStatus()
                },
                campaign650: {
                    active: true,
                    totalSent: await this.getTotalCampaignsSent(),
                    responses: await this.getTotalResponses(),
                    conversionRate: await this.getCurrentConversionRate()
                }
            };

            return res.json(stats);

        } catch (error) {
            return res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: moment().toISOString()
            });
        }
    }

    async getStats(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');

            const stats = {
                today: {
                    sent: await this.getTodayCampaignsSent(),
                    responses: await this.getTodayResponses(),
                    conversions: await this.getTodayConversions(),
                    revenue: await this.getTodayRevenue()
                },
                campaign650: {
                    totalProcessed: 650,
                    sent: await this.getTotalCampaignsSent(),
                    pending: await this.getPendingCampaigns(),
                    responses: await this.getTotalResponses(),
                    conversions: await this.getTotalConversions(),
                    currentROI: await this.getCurrentROI(),
                    projectedROI: 11700
                },
                segments: {
                    criticos: await this.getSegmentStats('criticos'),
                    moderados: await this.getSegmentStats('moderados'),
                    baixaFreq: await this.getSegmentStats('baixaFreq'),
                    prospects: await this.getSegmentStats('prospects')
                },
                timestamp: moment().toISOString()
            };

            return res.json(stats);

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async trigger650Campaign(req, res) {
        try {
            console.log('🚀 Trigger manual campanha 650 inativos');

            // Chamar webhook N8N
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_650_URL ||
                'http://localhost:5678/webhook/fullforce-650-campaign';

            const response = await axios.post(n8nWebhookUrl, {
                trigger: 'manual',
                timestamp: moment().toISOString(),
                source: 'fullforce-api'
            });

            return res.json({
                success: true,
                message: 'Campanha 650 inativos iniciada',
                n8nResponse: response.data,
                timestamp: moment().toISOString()
            });

        } catch (error) {
            console.error('❌ Erro ao triggerar campanha 650:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao iniciar campanha',
                details: error.message
            });
        }
    }

    async getRoiDashboard(req, res) {
        try {
            const roiData = await this.sheetsService.getRange('ROI_Dashboard!A:M');
            const campaignLogs = await this.sheetsService.getRange('Campanhas_Log!A:K');

            const dashboard = {
                lastUpdate: moment().toISOString(),
                roi: {
                    current: await this.getCurrentROI(),
                    projected: 11700,
                    investment: 1500,
                    revenue: await this.getTotalRevenue()
                },
                campaigns: {
                    total: campaignLogs.length - 1, // -1 para header
                    today: this.filterTodayRecords(campaignLogs).length,
                    byUrgency: this.groupByUrgency(campaignLogs)
                },
                conversions: {
                    total: await this.getTotalConversions(),
                    rate: await this.getCurrentConversionRate(),
                    bySegment: await this.getConversionsBySegment()
                }
            };

            return res.json(dashboard);

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateReactivationStatus(req, res) {
        try {
            const { telefone, status, observacoes } = req.body;

            await this.sheetsService.updateReactivationStatus(telefone, status, observacoes);

            return res.json({
                success: true,
                telefone,
                status,
                timestamp: moment().toISOString()
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Helper methods
    async logCampaignToSheets(data) {
        try {
            // Adicionar ao log de campanhas
            await this.sheetsService.appendRow('Campanhas_Log', [
                data.telefone,
                data.nome,
                data.urgencia,
                data.campanha,
                data.dataEnvio,
                data.status,
                data.expectedRevenue,
                data.conversionRate,
                data.mensagem
            ]);
        } catch (error) {
            console.error('❌ Erro ao logar campanha:', error);
        }
    }

    async scheduleFollowUp(telefone, nome, urgencia, campanha) {
        // Implementar agendamento de follow-up
        const followUpDelays = {
            'CRITICA': [6, 24, 72], // 6h, 1 dia, 3 dias
            'ALTA': [12, 48, 168], // 12h, 2 dias, 1 semana
            'MEDIA': [24, 168], // 1 dia, 1 semana
            'BAIXA': [72, 336] // 3 dias, 2 semanas
        };

        const delays = followUpDelays[urgencia] || [24];

        // Agendar no BullMQ
        for (const delay of delays) {
            await this.scheduledMessages.scheduleFollowUp(
                telefone,
                nome,
                urgencia,
                campanha,
                delay * 60 * 60 * 1000 // converter horas para ms
            );
        }
    }

    async markAsHotLead(telefone, message, timestamp) {
        try {
            await this.sheetsService.appendRow('Hot_Leads', [
                telefone.replace('@c.us', ''),
                message,
                moment(timestamp).format('DD/MM/YYYY HH:mm:ss'),
                'N8N Campaign Response',
                'Pendente Contato'
            ]);
        } catch (error) {
            console.error('❌ Erro ao marcar hot lead:', error);
        }
    }

    async notifySalesTeam(telefone, message) {
        // Notificar equipe de vendas via WhatsApp
        const salesNumbers = process.env.SALES_TEAM_NUMBERS?.split(',') || [];

        const notification = `🔥 *HOT LEAD - Campanha 650*\n\n` +
            `📱 *Cliente:* ${telefone}\n` +
            `💬 *Mensagem:* ${message}\n` +
            `⏰ *Horário:* ${moment().format('HH:mm')}\n\n` +
            `🎯 *AÇÃO:* Entrar em contato AGORA!`;

        for (const salesNumber of salesNumbers) {
            try {
                await this.whatsappService.sendMessage(
                    `${salesNumber}@c.us`,
                    notification
                );
            } catch (error) {
                console.error(`❌ Erro ao notificar vendedor ${salesNumber}:`, error);
            }
        }
    }

    // Status check methods
    async checkWhatsAppStatus() {
        try {
            const status = await this.whatsappService.getStatus();
            return { status: 'connected', details: status };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async checkGoogleSheetsStatus() {
        try {
            await this.sheetsService.getRange('A1:A1');
            return { status: 'connected' };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async checkN8NStatus() {
        try {
            const n8nHealthUrl = process.env.N8N_HEALTH_URL || 'http://localhost:5678/healthz';
            const response = await axios.get(n8nHealthUrl, { timeout: 5000 });
            return { status: 'connected', n8n: response.data };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Analytics methods
    async getTotalCampaignsSent() {
        try {
            const logs = await this.sheetsService.getRange('Campanhas_Log!A:K');
            return logs.length - 1; // -1 para header
        } catch (error) {
            return 0;
        }
    }

    async getTotalResponses() {
        try {
            const responses = await this.sheetsService.getRange('Hot_Leads!A:E');
            return responses.length - 1;
        } catch (error) {
            return 0;
        }
    }

    async getCurrentConversionRate() {
        const sent = await this.getTotalCampaignsSent();
        const conversions = await this.getTotalConversions();
        return sent > 0 ? ((conversions / sent) * 100).toFixed(2) : 0;
    }

    async getCurrentROI() {
        const revenue = await this.getTotalRevenue();
        const investment = 1500; // Custo campanha
        return ((revenue - investment) / investment * 100).toFixed(0);
    }

    async getTotalConversions() {
        // Implementar lógica para contar conversões reais
        return 0;
    }

    async getTotalRevenue() {
        // Implementar lógica para calcular receita real
        return 0;
    }

    filterTodayRecords(records) {
        const today = moment().format('DD/MM/YYYY');
        return records.filter(record =>
            record[4]?.includes(today) // Coluna data_envio
        );
    }

    groupByUrgency(records) {
        const groups = { CRITICA: 0, ALTA: 0, MEDIA: 0, BAIXA: 0 };
        records.forEach(record => {
            const urgencia = record[2]; // Coluna urgencia
            if (groups.hasOwnProperty(urgencia)) {
                groups[urgencia]++;
            }
        });
        return groups;
    }

    getRoutes() {
        return router;
    }
}

module.exports = N8NIntegrationRoutes;