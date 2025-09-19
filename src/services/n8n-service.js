const axios = require('axios');
const pino = require('pino');

class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_URL || 'http://localhost:5678';
        this.webhookURL = process.env.N8N_WEBHOOK_650_URL || `${this.baseURL}/webhook/fullforce-650-campaign`;
        this.apiKey = process.env.N8N_API_KEY;
        this.enabled = !process.env.MOCK_N8N;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Create axios instance
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: this.apiKey ? {
                'X-N8N-API-KEY': this.apiKey
            } : {}
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        this.api.interceptors.request.use(
            (config) => {
                this.logger.debug(`N8N Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                this.logger.error('N8N Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response) => {
                this.logger.debug(`N8N Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                this.logger.error('N8N Response Error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    url: error.config?.url
                });
                return Promise.reject(error);
            }
        );
    }

    async healthCheck() {
        try {
            if (!this.enabled) {
                return { n8n: false, mock: true, message: 'N8N em modo mock' };
            }

            const response = await this.api.get('/healthz');
            return {
                n8n: true,
                status: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('❌ N8N health check failed:', error.message);
            return {
                n8n: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async getWorkflows() {
        try {
            if (!this.enabled) {
                return this.getMockWorkflows();
            }

            const response = await this.api.get('/api/v1/workflows');
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get workflows:', error.message);
            throw error;
        }
    }

    async getWorkflow(workflowId) {
        try {
            if (!this.enabled) {
                return this.getMockWorkflow(workflowId);
            }

            const response = await this.api.get(`/api/v1/workflows/${workflowId}`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get workflow:', error.message);
            throw error;
        }
    }

    async activateWorkflow(workflowId) {
        try {
            if (!this.enabled) {
                this.logger.info(`🤖 [MOCK] Ativando workflow ${workflowId}`);
                return { active: true, id: workflowId, mock: true };
            }

            const response = await this.api.patch(`/api/v1/workflows/${workflowId}`, {
                active: true
            });

            this.logger.info(`✅ Workflow ${workflowId} ativado`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to activate workflow:', error.message);
            throw error;
        }
    }

    async deactivateWorkflow(workflowId) {
        try {
            if (!this.enabled) {
                this.logger.info(`🤖 [MOCK] Desativando workflow ${workflowId}`);
                return { active: false, id: workflowId, mock: true };
            }

            const response = await this.api.patch(`/api/v1/workflows/${workflowId}`, {
                active: false
            });

            this.logger.info(`⏹️ Workflow ${workflowId} desativado`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to deactivate workflow:', error.message);
            throw error;
        }
    }

    async triggerWebhook(data, webhookUrl = null) {
        try {
            const url = webhookUrl || this.webhookURL;

            if (!this.enabled) {
                this.logger.info('🤖 [MOCK] Webhook triggered:', data);
                return {
                    success: true,
                    mock: true,
                    data: data,
                    timestamp: new Date().toISOString()
                };
            }

            const response = await axios.post(url, data, {
                timeout: 30000
            });

            this.logger.info('✅ Webhook triggered successfully');
            return {
                success: true,
                data: response.data,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('❌ Failed to trigger webhook:', error.message);
            throw error;
        }
    }

    async triggerCampaign650(campaignData) {
        try {
            const payload = {
                event: 'campaign_650_trigger',
                timestamp: new Date().toISOString(),
                campaign: {
                    name: 'Reativação 650 Alunos',
                    type: 'reactivation',
                    target_count: 650,
                    ...campaignData
                },
                config: {
                    conversion_rates: {
                        criticos: parseFloat(process.env.CONVERSION_RATE_CRITICOS) || 0.35,
                        moderados: parseFloat(process.env.CONVERSION_RATE_MODERADOS) || 0.25,
                        baixa_freq: parseFloat(process.env.CONVERSION_RATE_BAIXA_FREQ) || 0.15,
                        prospects: parseFloat(process.env.CONVERSION_RATE_PROSPECTS) || 0.08
                    },
                    avg_monthly_value: parseFloat(process.env.AVG_MONTHLY_VALUE) || 129.90,
                    projected_roi: parseFloat(process.env.PROJECTED_ROI_PERCENTAGE) || 11700
                }
            };

            return await this.triggerWebhook(payload);

        } catch (error) {
            this.logger.error('❌ Failed to trigger campaign 650:', error.message);
            throw error;
        }
    }

    async sendMessage(messageData) {
        try {
            const payload = {
                event: 'whatsapp_message',
                timestamp: new Date().toISOString(),
                message: messageData
            };

            return await this.triggerWebhook(payload);

        } catch (error) {
            this.logger.error('❌ Failed to send message via N8N:', error.message);
            throw error;
        }
    }

    async getExecutions(workflowId = null, limit = 10) {
        try {
            if (!this.enabled) {
                return this.getMockExecutions(workflowId, limit);
            }

            const params = { limit };
            if (workflowId) {
                params.workflowId = workflowId;
            }

            const response = await this.api.get('/api/v1/executions', { params });
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get executions:', error.message);
            throw error;
        }
    }

    async getExecution(executionId) {
        try {
            if (!this.enabled) {
                return this.getMockExecution(executionId);
            }

            const response = await this.api.get(`/api/v1/executions/${executionId}`);
            return response.data;
        } catch (error) {
            this.logger.error('❌ Failed to get execution:', error.message);
            throw error;
        }
    }

    // Mock methods for development
    getMockWorkflows() {
        return {
            data: [
                {
                    id: 'workflow-650-reactivation',
                    name: 'FullForce 650 Reactivation Campaign',
                    active: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'workflow-whatsapp-responder',
                    name: 'Academia WhatsApp Auto Responder',
                    active: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]
        };
    }

    getMockWorkflow(workflowId) {
        return {
            id: workflowId,
            name: workflowId === 'workflow-650-reactivation'
                ? 'FullForce 650 Reactivation Campaign'
                : 'Academia WhatsApp Auto Responder',
            active: true,
            nodes: [],
            connections: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    getMockExecutions(workflowId, limit) {
        const executions = [];
        for (let i = 0; i < limit; i++) {
            executions.push({
                id: `exec-${Date.now()}-${i}`,
                workflowId: workflowId || 'workflow-650-reactivation',
                status: i === 0 ? 'running' : 'success',
                startedAt: new Date(Date.now() - i * 60000).toISOString(),
                finishedAt: i === 0 ? null : new Date(Date.now() - i * 60000 + 30000).toISOString()
            });
        }
        return { data: executions };
    }

    getMockExecution(executionId) {
        return {
            id: executionId,
            workflowId: 'workflow-650-reactivation',
            status: 'success',
            data: {
                startData: {},
                resultData: {
                    runData: {}
                }
            },
            startedAt: new Date(Date.now() - 60000).toISOString(),
            finishedAt: new Date().toISOString()
        };
    }

    async activateCampaignWorkflows() {
        try {
            this.logger.info('🚀 Ativando workflows de campanha...');

            const workflows = [
                'workflow-650-reactivation',
                'workflow-whatsapp-responder'
            ];

            const results = [];

            for (const workflowId of workflows) {
                try {
                    const result = await this.activateWorkflow(workflowId);
                    results.push({ workflowId, success: true, result });
                    this.logger.info(`✅ Workflow ${workflowId} ativado`);
                } catch (error) {
                    results.push({ workflowId, success: false, error: error.message });
                    this.logger.error(`❌ Falha ao ativar workflow ${workflowId}:`, error.message);
                }
            }

            return {
                success: results.every(r => r.success),
                results: results,
                activated: results.filter(r => r.success).length,
                total: workflows.length
            };

        } catch (error) {
            this.logger.error('❌ Erro ao ativar workflows:', error.message);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            const health = await this.healthCheck();

            if (!this.enabled) {
                return {
                    enabled: false,
                    mock: true,
                    status: 'MOCK_MODE',
                    workflows: await this.getWorkflows(),
                    timestamp: new Date().toISOString()
                };
            }

            const workflows = await this.getWorkflows();
            const executions = await this.getExecutions(null, 5);

            return {
                enabled: true,
                health: health,
                workflows: workflows,
                recent_executions: executions,
                webhook_url: this.webhookURL,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('❌ Erro ao obter status do sistema:', error.message);
            return {
                enabled: this.enabled,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = N8NService;