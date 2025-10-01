/**
 * MCP N8N Integration - FFGym
 * Orquestração avançada de workflows N8N para automação da academia
 */

class N8NIntegrationMCP {
    constructor(config = {}) {
        this.config = {
            n8nUrl: config.n8nUrl || 'http://localhost:5678',
            apiKey: config.apiKey || process.env.N8N_API_KEY,
            webhookUrl: config.webhookUrl || process.env.N8N_WEBHOOK_URL,
            workflows: {
                leadProcessor: 'lead-processor-main',
                leadSegmentation: 'lead-segmentation',
                campaignScheduler: 'campaign-scheduler',
                analyticsdashboard: 'analytics-dashboard',
                webhookReceiver: 'webhook-receiver-waha'
            },
            retryPolicy: {
                maxRetries: 3,
                backoffMultiplier: 2,
                initialDelay: 1000
            },
            ...config
        };

        this.workflowManager = new WorkflowManager(this.config);
        this.executionTracker = new ExecutionTracker();
        this.dataMapper = new DataMapper();
        this.errorHandler = new ErrorHandler();
        this.status = 'idle';
    }

    /**
     * Inicializa o MCP N8N Integration
     */
    async initialize() {
        console.log('🔄 Inicializando N8N Integration MCP...');

        try {
            // Verificar configurações básicas
            if (!this.config.n8nUrl) {
                throw new Error('URL do N8N não configurada');
            }

            // Verificar workflows configurados
            if (!this.config.workflows || Object.keys(this.config.workflows).length === 0) {
                throw new Error('Nenhum workflow configurado');
            }

            // Verificar conectividade com N8N
            const connectionTest = await this.makeN8NRequest('GET', '/workflows');
            if (!connectionTest.success) {
                throw new Error('Falha na conexão com N8N: ' + connectionTest.error);
            }

            this.status = 'ready';
            console.log('✅ N8N Integration MCP inicializado');

            return {
                success: true,
                status: this.status
            };
        } catch (error) {
            console.error('❌ Erro ao inicializar N8N Integration MCP:', error);
            this.status = 'error';
            throw error;
        }
    }

    /**
     * Retorna o status atual do MCP
     */
    getStatus() {
        return this.status;
    }

    /**
     * Define o provedor de analytics
     */
    setAnalyticsProvider(provider) {
        this.analyticsProvider = provider;
    }

    /**
     * Define o provedor de conversão
     */
    setConversionProvider(provider) {
        this.conversionProvider = provider;
    }

    /**
     * Define o provedor N8N
     */
    setN8NProvider(provider) {
        this.n8nProvider = provider;
    }

    /**
     * Inicializa todos os workflows necessários
     */
    async initializeWorkflows() {
        console.log('🔄 Inicializando workflows N8N para FFGym...');

        const results = {
            initialized: 0,
            failed: 0,
            active: 0,
            errors: []
        };

        for (const [workflowName, workflowId] of Object.entries(this.config.workflows)) {
            try {
                const result = await this.activateWorkflow(workflowId);

                if (result.success) {
                    results.initialized++;
                    if (result.active) results.active++;
                    console.log(`✅ Workflow ${workflowName} inicializado com sucesso`);
                } else {
                    results.failed++;
                    results.errors.push({ workflow: workflowName, error: result.error });
                    console.error(`❌ Falha ao inicializar ${workflowName}:`, result.error);
                }

            } catch (error) {
                results.failed++;
                results.errors.push({ workflow: workflowName, error: error.message });
                console.error(`❌ Erro crítico no workflow ${workflowName}:`, error);
            }
        }

        return results;
    }

    /**
     * Processa nova campanha através dos workflows
     */
    async processCampaign(campaignData) {
        console.log(`🚀 Processando campanha ${campaignData.name} via N8N...`);

        const workflow = {
            id: campaignData.id,
            name: campaignData.name,
            type: campaignData.type || 'reactivation',
            leads: campaignData.leads || [],
            schedule: campaignData.schedule || { immediate: true },
            parameters: campaignData.parameters || {}
        };

        // Sequência de execução dos workflows
        const executionSequence = [
            { step: 'segmentation', workflow: 'leadSegmentation' },
            { step: 'scheduling', workflow: 'campaignScheduler' },
            { step: 'processing', workflow: 'leadProcessor' },
            { step: 'analytics', workflow: 'analyticsDashboard' }
        ];

        const results = {
            campaignId: workflow.id,
            executionId: this.generateExecutionId(),
            status: 'running',
            steps: {},
            summary: {
                totalLeads: workflow.leads.length,
                processed: 0,
                errors: 0,
                conversions: 0
            }
        };

        for (const step of executionSequence) {
            try {
                console.log(`🔄 Executando step: ${step.step}`);

                const stepData = this.prepareStepData(workflow, step.step, results);
                const execution = await this.executeWorkflow(step.workflow, stepData);

                results.steps[step.step] = {
                    status: execution.success ? 'completed' : 'failed',
                    executionId: execution.id,
                    duration: execution.duration,
                    data: execution.data,
                    error: execution.error
                };

                if (!execution.success) {
                    console.error(`❌ Step ${step.step} falhou:`, execution.error);
                    break;
                }

                // Atualizar dados para próximo step
                workflow.processedData = execution.data;

            } catch (error) {
                console.error(`❌ Erro crítico no step ${step.step}:`, error);
                results.steps[step.step] = {
                    status: 'error',
                    error: error.message
                };
                break;
            }
        }

        results.status = this.determineOverallStatus(results.steps);
        return results;
    }

    /**
     * Executa workflow específico
     */
    async executeWorkflow(workflowId, data = {}) {
        const executionId = this.generateExecutionId();

        try {
            console.log(`🔄 Executando workflow ${workflowId}...`);

            const startTime = Date.now();
            const response = await this.makeN8NRequest('POST', `/workflows/${workflowId}/execute`, {
                data: this.dataMapper.mapForN8N(data),
                waitTillDone: true,
                executionId
            });

            const duration = Date.now() - startTime;

            if (response.success) {
                this.executionTracker.record(workflowId, executionId, 'success', duration);

                return {
                    success: true,
                    id: executionId,
                    duration,
                    data: this.dataMapper.mapFromN8N(response.data),
                    rawResponse: response.data
                };
            } else {
                this.executionTracker.record(workflowId, executionId, 'failed', duration);

                return {
                    success: false,
                    id: executionId,
                    duration,
                    error: response.error,
                    rawResponse: response.data
                };
            }

        } catch (error) {
            this.executionTracker.record(workflowId, executionId, 'error', 0);

            return {
                success: false,
                id: executionId,
                error: error.message
            };
        }
    }

    /**
     * Processa resposta de webhook
     */
    async processWebhookResponse(webhookData) {
        console.log('📥 Processando resposta de webhook...');

        const response = {
            leadId: webhookData.leadId,
            phone: webhookData.phone,
            message: webhookData.message,
            timestamp: webhookData.timestamp || new Date().toISOString(),
            type: this.classifyResponse(webhookData.message),
            processed: false
        };

        try {
            // Executar workflow de processamento de resposta
            const processingResult = await this.executeWorkflow('webhookReceiver', {
                response,
                context: {
                    campaignId: webhookData.campaignId,
                    workflowType: 'response_processing'
                }
            });

            if (processingResult.success) {
                response.processed = true;
                response.processingResult = processingResult.data;

                // Trigger ações baseadas no tipo de resposta
                await this.handleResponseActions(response);
            }

        } catch (error) {
            console.error('❌ Erro ao processar webhook:', error);
            response.error = error.message;
        }

        return response;
    }

    /**
     * Monitora execuções ativas
     */
    async monitorActiveExecutions() {
        console.log('📊 Monitorando execuções ativas...');

        const executions = await this.getActiveExecutions();
        const monitoring = {
            total: executions.length,
            running: 0,
            waiting: 0,
            success: 0,
            error: 0,
            details: []
        };

        for (const execution of executions) {
            const status = execution.finished ?
                          (execution.success ? 'success' : 'error') :
                          (execution.waitTill ? 'waiting' : 'running');

            monitoring[status]++;

            monitoring.details.push({
                id: execution.id,
                workflowId: execution.workflowId,
                status,
                startedAt: execution.startedAt,
                duration: execution.duration,
                progress: this.calculateProgress(execution)
            });
        }

        // Verificar se há execuções presas ou com problemas
        await this.checkForProblematicExecutions(monitoring.details);

        return monitoring;
    }

    /**
     * Otimiza performance dos workflows
     */
    async optimizeWorkflowPerformance() {
        console.log('⚡ Otimizando performance dos workflows...');

        const optimizations = {
            applied: [],
            recommendations: [],
            performance: {}
        };

        // Analisar histórico de execuções
        const analytics = await this.analyzeExecutionHistory();

        // Otimizações automáticas
        if (analytics.averageExecutionTime > 30000) { // > 30 segundos
            await this.enableWorkflowCaching();
            optimizations.applied.push('workflow_caching');
        }

        if (analytics.errorRate > 0.05) { // > 5% erro
            await this.adjustRetryPolicies();
            optimizations.applied.push('retry_optimization');
        }

        // Recomendações manuais
        if (analytics.peakHours.length > 0) {
            optimizations.recommendations.push({
                type: 'scheduling',
                description: 'Distribuir execuções fora dos horários de pico',
                impact: 'medium',
                effort: 'low'
            });
        }

        return optimizations;
    }

    /**
     * Cria workflow personalizado
     */
    async createCustomWorkflow(workflowDefinition) {
        console.log(`🔧 Criando workflow customizado: ${workflowDefinition.name}`);

        const workflow = {
            name: workflowDefinition.name,
            nodes: this.buildWorkflowNodes(workflowDefinition),
            connections: this.buildWorkflowConnections(workflowDefinition),
            active: true,
            tags: ['ffgym', 'custom'],
            settings: {
                executionOrder: 'v1',
                saveManualExecutions: true,
                callerPolicy: 'workflowsFromSameOwner'
            }
        };

        try {
            const response = await this.makeN8NRequest('POST', '/workflows', workflow);

            if (response.success) {
                console.log(`✅ Workflow ${workflowDefinition.name} criado com sucesso`);
                return {
                    success: true,
                    workflowId: response.data.id,
                    workflow: response.data
                };
            } else {
                console.error(`❌ Falha ao criar workflow:`, response.error);
                return {
                    success: false,
                    error: response.error
                };
            }

        } catch (error) {
            console.error(`❌ Erro ao criar workflow:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sincroniza dados entre workflows
     */
    async synchronizeWorkflowData() {
        console.log('🔄 Sincronizando dados entre workflows...');

        const syncPoints = [
            { from: 'leadSegmentation', to: 'campaignScheduler', data: 'segments' },
            { from: 'campaignScheduler', to: 'leadProcessor', data: 'schedule' },
            { from: 'leadProcessor', to: 'analyticsBoard', data: 'results' }
        ];

        const syncResults = [];

        for (const sync of syncPoints) {
            try {
                const sourceData = await this.getWorkflowData(sync.from, sync.data);
                const syncResult = await this.updateWorkflowData(sync.to, sync.data, sourceData);

                syncResults.push({
                    from: sync.from,
                    to: sync.to,
                    data: sync.data,
                    success: syncResult.success,
                    recordsUpdated: syncResult.recordsUpdated
                });

            } catch (error) {
                syncResults.push({
                    from: sync.from,
                    to: sync.to,
                    data: sync.data,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            totalSyncs: syncResults.length,
            successful: syncResults.filter(r => r.success).length,
            failed: syncResults.filter(r => !r.success).length,
            details: syncResults
        };
    }

    // Métodos auxiliares

    async activateWorkflow(workflowId) {
        try {
            const response = await this.makeN8NRequest('PATCH', `/workflows/${workflowId}`, {
                active: true
            });

            return {
                success: response.success,
                active: response.data?.active || false,
                error: response.error
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async makeN8NRequest(method, endpoint, data = null) {
        const axios = require('axios');
        const url = `${this.config.n8nUrl}/api/v1${endpoint}`;

        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        };

        if (this.config.apiKey) {
            config.headers['X-N8N-API-KEY'] = this.config.apiKey;
        }

        if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
            config.data = data;
        }

        try {
            const response = await axios(config);
            return {
                success: true,
                data: response.data,
                status: response.status
            };

        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status: error.response?.status
            };
        }
    }

    prepareStepData(workflow, step, previousResults) {
        const baseData = {
            campaignId: workflow.id,
            workflowStep: step,
            timestamp: new Date().toISOString()
        };

        switch (step) {
            case 'segmentation':
                return {
                    ...baseData,
                    leads: workflow.leads,
                    segmentationRules: workflow.parameters.segmentation
                };

            case 'scheduling':
                return {
                    ...baseData,
                    segments: previousResults.steps?.segmentation?.data?.segments,
                    schedule: workflow.schedule
                };

            case 'processing':
                return {
                    ...baseData,
                    scheduledCampaigns: previousResults.steps?.scheduling?.data?.campaigns,
                    messageTemplates: workflow.parameters.messages
                };

            case 'analytics':
                return {
                    ...baseData,
                    campaignResults: previousResults.steps?.processing?.data?.results
                };

            default:
                return baseData;
        }
    }

    classifyResponse(message) {
        if (!message) return 'unknown';

        const text = message.toLowerCase();

        if (/quero\s+minha\s+vaga/i.test(text)) return 'conversion';
        if (/interessado|interesse/i.test(text)) return 'interest';
        if (/não\s+quero|pare/i.test(text)) return 'opt_out';
        if (/preço|valor|caro/i.test(text)) return 'price_objection';
        if (/horário|tempo/i.test(text)) return 'time_objection';

        return 'general';
    }

    async handleResponseActions(response) {
        switch (response.type) {
            case 'conversion':
                await this.triggerConversionWorkflow(response);
                break;

            case 'interest':
                await this.triggerNurturingWorkflow(response);
                break;

            case 'opt_out':
                await this.triggerOptOutWorkflow(response);
                break;

            case 'price_objection':
            case 'time_objection':
                await this.triggerObjectionHandlingWorkflow(response);
                break;

            default:
                await this.triggerGeneralResponseWorkflow(response);
        }
    }

    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    determineOverallStatus(steps) {
        const stepStatuses = Object.values(steps).map(step => step.status);

        if (stepStatuses.includes('error')) return 'error';
        if (stepStatuses.includes('failed')) return 'failed';
        if (stepStatuses.some(status => status !== 'completed')) return 'running';

        return 'completed';
    }

    calculateProgress(execution) {
        // Lógica simplificada de cálculo de progresso
        if (execution.finished) return 100;
        if (execution.stoppedAt) return 0;

        // Estimar progresso baseado no tempo decorrido
        const elapsed = Date.now() - new Date(execution.startedAt).getTime();
        const estimatedTotal = 60000; // 1 minuto estimado

        return Math.min(95, (elapsed / estimatedTotal) * 100);
    }

    async getActiveExecutions() {
        const response = await this.makeN8NRequest('GET', '/executions?filter={"status":"running"}');
        return response.success ? response.data.data : [];
    }

    async checkForProblematicExecutions(executions) {
        // Verificar execuções que estão rodando há muito tempo
        const longRunning = executions.filter(exec => {
            if (exec.status !== 'running') return false;
            const elapsed = Date.now() - new Date(exec.startedAt).getTime();
            return elapsed > 300000; // 5 minutos
        });

        for (const execution of longRunning) {
            console.warn(`⚠️ Execução ${execution.id} rodando há muito tempo`);
            // Implementar lógica de intervenção se necessário
        }
    }
}

/**
 * Gerenciador de workflows
 */
class WorkflowManager {
    constructor(config) {
        this.config = config;
        this.workflows = new Map();
    }

    async loadWorkflows() {
        // Implementar carregamento de workflows
    }

    async saveWorkflow(workflow) {
        // Implementar salvamento de workflow
    }
}

/**
 * Rastreador de execuções
 */
class ExecutionTracker {
    constructor() {
        this.executions = new Map();
    }

    record(workflowId, executionId, status, duration) {
        const record = {
            workflowId,
            executionId,
            status,
            duration,
            timestamp: new Date().toISOString()
        };

        if (!this.executions.has(workflowId)) {
            this.executions.set(workflowId, []);
        }

        this.executions.get(workflowId).push(record);
    }

    getHistory(workflowId, limit = 100) {
        return this.executions.get(workflowId)?.slice(-limit) || [];
    }
}

/**
 * Mapeador de dados
 */
class DataMapper {
    mapForN8N(data) {
        // Converter dados para formato N8N
        return {
            json: data
        };
    }

    mapFromN8N(n8nData) {
        // Converter dados do formato N8N
        return n8nData?.json || n8nData;
    }
}

/**
 * Tratador de erros
 */
class ErrorHandler {
    async handleError(error, context) {
        console.error(`❌ Erro em ${context}:`, error);

        // Implementar lógica de tratamento de erros
        // - Logging
        // - Alertas
        // - Recovery automático
    }
}

module.exports = N8NIntegrationMCP;