// N8N Cloud Auto-Activator - Sistema Inteligente de Ativação Automática
// Sistema avançado para ativação automática de workflows N8N Cloud

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nAutoActivator {
    constructor() {
        this.config = {
            workflowUrl: 'https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi',
            workflowId: 'VGhKEfrpJU47onvi',
            webhooks: {
                leadCapture: 'https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook',
                whatsappResponses: 'https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses'
            },
            localServices: {
                waha: 'http://localhost:3000',
                bridge: 'http://localhost:3001'
            },
            activation: {
                maxAttempts: 10,
                retryDelay: 15000, // 15 segundos
                backoffMultiplier: 1.5,
                timeout: 30000,
                verificationDelay: 10000, // 10 segundos para verificação após ativação
                healthCheckInterval: 60000 // 1 minuto
            }
        };

        this.state = {
            isActive: false,
            lastVerified: null,
            activationAttempts: 0,
            lastActivationAttempt: null,
            lastSuccess: null,
            consecutiveFailures: 0,
            totalActivations: 0,
            uptime: 0,
            startTime: new Date()
        };

        this.strategies = [
            'direct_webhook_activation',
            'bridge_activation',
            'health_check_activation',
            'bulk_webhook_test',
            'sequential_endpoint_test'
        ];

        this.logFile = path.join(__dirname, '..', 'logs', 'n8n-activator.log');
        this.stateFile = path.join(__dirname, '..', 'logs', 'activator-state.json');
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;

        console.log(logEntry);

        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            await fs.appendFile(this.logFile, logEntry + '\n');
        } catch (error) {
            console.error('Erro ao escrever log:', error.message);
        }
    }

    async saveState() {
        try {
            await fs.mkdir(path.dirname(this.stateFile), { recursive: true });
            const stateData = {
                ...this.state,
                lastUpdate: new Date().toISOString(),
                config: this.config
            };
            await fs.writeFile(this.stateFile, JSON.stringify(stateData, null, 2));
        } catch (error) {
            await this.log(`Erro ao salvar estado: ${error.message}`, 'ERROR');
        }
    }

    async loadState() {
        try {
            const stateData = await fs.readFile(this.stateFile, 'utf8');
            const parsedState = JSON.parse(stateData);

            // Merge com estado atual, preservando campos importantes
            this.state = {
                ...this.state,
                ...parsedState,
                startTime: new Date(parsedState.startTime || Date.now())
            };

            await this.log('Estado anterior carregado com sucesso');
        } catch (error) {
            await this.log('Nenhum estado anterior encontrado, iniciando fresh');
        }
    }

    async verifyWorkflowStatus() {
        try {
            await this.log('🔍 Verificando status do workflow...');

            const testPayload = {
                source: 'status_verification',
                name: 'Auto Activator Test',
                phone: '5566999999999',
                email: 'activator@test.com',
                message: 'Verificação automática de status',
                timestamp: new Date().toISOString(),
                verification_id: `verify_${Date.now()}`
            };

            const response = await axios.post(this.config.webhooks.leadCapture, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Auto-Activator/1.0'
                },
                timeout: this.config.activation.timeout
            });

            if (response.status === 200) {
                this.state.isActive = true;
                this.state.lastVerified = new Date().toISOString();
                this.state.consecutiveFailures = 0;
                this.state.lastSuccess = new Date().toISOString();

                await this.log('✅ Workflow verificado como ATIVO');
                await this.saveState();
                return { active: true, response: response.data };
            } else {
                throw new Error(`Status HTTP: ${response.status}`);
            }

        } catch (error) {
            this.state.isActive = false;
            this.state.consecutiveFailures++;

            await this.log(`❌ Workflow INATIVO: ${error.message}`, 'ERROR');
            await this.saveState();
            return { active: false, error: error.message };
        }
    }

    async activationStrategy1_DirectWebhook() {
        await this.log('🔧 Estratégia 1: Ativação direta via webhook');

        try {
            const activationPayload = {
                action: 'workflow_activation',
                workflow_id: this.config.workflowId,
                source: 'auto_activator',
                timestamp: new Date().toISOString(),
                activation_request: true,
                force_activate: true
            };

            const response = await axios.post(this.config.webhooks.leadCapture, activationPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Activator/Direct/1.0',
                    'X-Activation-Request': 'true'
                },
                timeout: this.config.activation.timeout
            });

            if (response.status >= 200 && response.status < 300) {
                await this.log('✅ Estratégia 1: Resposta positiva do webhook');
                return { success: true, strategy: 'direct_webhook', response: response.data };
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            await this.log(`❌ Estratégia 1 falhou: ${error.message}`, 'WARN');
            return { success: false, error: error.message };
        }
    }

    async activationStrategy2_Bridge() {
        await this.log('🔧 Estratégia 2: Ativação via bridge');

        try {
            // Verificar se bridge está disponível
            const bridgeHealth = await axios.get(`${this.config.localServices.bridge}/health`, { timeout: 5000 });

            if (bridgeHealth.status !== 200) {
                throw new Error('Bridge não está saudável');
            }

            // Tentar ativação via bridge
            const activationData = {
                action: 'activate_workflow',
                workflow_url: this.config.workflowUrl,
                workflow_id: this.config.workflowId,
                force: true
            };

            const response = await axios.post(`${this.config.localServices.bridge}/api/activate-n8n`,
                activationData, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Activator/Bridge/1.0'
                },
                timeout: this.config.activation.timeout
            });

            if (response.data.success) {
                await this.log('✅ Estratégia 2: Bridge reportou sucesso');
                return { success: true, strategy: 'bridge', response: response.data };
            }

            throw new Error('Bridge não conseguiu ativar');

        } catch (error) {
            await this.log(`❌ Estratégia 2 falhou: ${error.message}`, 'WARN');
            return { success: false, error: error.message };
        }
    }

    async activationStrategy3_HealthCheck() {
        await this.log('🔧 Estratégia 3: Ativação via health check múltiplo');

        try {
            const healthPayloads = [
                { action: 'health_check', source: 'auto_activator_1' },
                { action: 'ping', source: 'auto_activator_2' },
                { action: 'status_check', source: 'auto_activator_3' },
                { action: 'wake_up', source: 'auto_activator_4' }
            ];

            const promises = healthPayloads.map(async (payload, index) => {
                await new Promise(resolve => setTimeout(resolve, index * 2000)); // Staggered timing

                return axios.post(this.config.webhooks.leadCapture, {
                    ...payload,
                    timestamp: new Date().toISOString(),
                    sequence: index + 1
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                });
            });

            const results = await Promise.allSettled(promises);
            const successCount = results.filter(r => r.status === 'fulfilled').length;

            if (successCount > 0) {
                await this.log(`✅ Estratégia 3: ${successCount}/4 health checks bem-sucedidos`);
                return { success: true, strategy: 'health_check', successCount };
            }

            throw new Error('Todos os health checks falharam');

        } catch (error) {
            await this.log(`❌ Estratégia 3 falhou: ${error.message}`, 'WARN');
            return { success: false, error: error.message };
        }
    }

    async activationStrategy4_BulkTest() {
        await this.log('🔧 Estratégia 4: Teste bulk de ativação');

        try {
            const bulkPayload = {
                bulk_activation: true,
                workflows: [this.config.workflowId],
                source: 'auto_activator_bulk',
                timestamp: new Date().toISOString(),
                requests: []
            };

            // Gerar múltiplas requisições
            for (let i = 0; i < 5; i++) {
                bulkPayload.requests.push({
                    id: `req_${i}`,
                    action: 'activate',
                    timestamp: new Date().toISOString()
                });
            }

            const response = await axios.post(this.config.webhooks.leadCapture, bulkPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Activator/Bulk/1.0'
                },
                timeout: this.config.activation.timeout
            });

            if (response.status === 200) {
                await this.log('✅ Estratégia 4: Bulk test executado');
                return { success: true, strategy: 'bulk_test', response: response.data };
            }

            throw new Error(`Bulk test falhou com status ${response.status}`);

        } catch (error) {
            await this.log(`❌ Estratégia 4 falhou: ${error.message}`, 'WARN');
            return { success: false, error: error.message };
        }
    }

    async activationStrategy5_Sequential() {
        await this.log('🔧 Estratégia 5: Teste sequencial de endpoints');

        try {
            const endpoints = [
                this.config.webhooks.leadCapture,
                this.config.webhooks.whatsappResponses
            ];

            let successCount = 0;

            for (let i = 0; i < endpoints.length; i++) {
                const endpoint = endpoints[i];

                try {
                    const testPayload = {
                        sequential_test: true,
                        endpoint_index: i,
                        source: 'auto_activator_sequential',
                        timestamp: new Date().toISOString()
                    };

                    const response = await axios.post(endpoint, testPayload, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 15000
                    });

                    if (response.status === 200) {
                        successCount++;
                        await this.log(`✅ Endpoint ${i + 1} respondeu positivamente`);
                    }

                } catch (endpointError) {
                    await this.log(`⚠️ Endpoint ${i + 1} falhou: ${endpointError.message}`);
                }

                // Pausa entre testes
                if (i < endpoints.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            if (successCount > 0) {
                await this.log(`✅ Estratégia 5: ${successCount}/${endpoints.length} endpoints responderam`);
                return { success: true, strategy: 'sequential', successCount };
            }

            throw new Error('Nenhum endpoint respondeu');

        } catch (error) {
            await this.log(`❌ Estratégia 5 falhou: ${error.message}`, 'WARN');
            return { success: false, error: error.message };
        }
    }

    async executeActivationAttempt() {
        try {
            this.state.activationAttempts++;
            this.state.lastActivationAttempt = new Date().toISOString();

            await this.log(`🚀 Tentativa de ativação ${this.state.activationAttempts}/${this.config.activation.maxAttempts}`);

            const strategies = [
                this.activationStrategy1_DirectWebhook.bind(this),
                this.activationStrategy2_Bridge.bind(this),
                this.activationStrategy3_HealthCheck.bind(this),
                this.activationStrategy4_BulkTest.bind(this),
                this.activationStrategy5_Sequential.bind(this)
            ];

            let activationSuccess = false;

            // Executar estratégias em ordem
            for (let i = 0; i < strategies.length && !activationSuccess; i++) {
                const strategy = strategies[i];

                try {
                    const result = await strategy();

                    if (result.success) {
                        await this.log(`🎉 Estratégia ${i + 1} bem-sucedida!`);

                        // Aguardar e verificar se realmente ativou
                        await new Promise(resolve => setTimeout(resolve, this.config.activation.verificationDelay));

                        const verification = await this.verifyWorkflowStatus();

                        if (verification.active) {
                            activationSuccess = true;
                            this.state.totalActivations++;
                            await this.log('✅ Ativação confirmada via verificação!');
                            break;
                        } else {
                            await this.log('⚠️ Estratégia executou mas workflow ainda inativo');
                        }
                    }
                } catch (strategyError) {
                    await this.log(`❌ Erro na estratégia ${i + 1}: ${strategyError.message}`, 'ERROR');
                }

                // Pausa entre estratégias
                if (i < strategies.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            await this.saveState();
            return { success: activationSuccess, attempt: this.state.activationAttempts };

        } catch (error) {
            await this.log(`❌ Erro na tentativa de ativação: ${error.message}`, 'ERROR');
            return { success: false, error: error.message };
        }
    }

    async startAutoActivation() {
        await this.log('🚀 Iniciando sistema de auto-ativação N8N Cloud...');
        await this.loadState();

        // Verificação inicial
        const initialCheck = await this.verifyWorkflowStatus();

        if (initialCheck.active) {
            await this.log('✅ Workflow já está ativo, monitoramento iniciado');
            this.startHealthCheckMonitoring();
            return { status: 'already_active' };
        }

        await this.log('⚠️ Workflow inativo, iniciando processo de ativação automática');

        let currentDelay = this.config.activation.retryDelay;

        while (this.state.activationAttempts < this.config.activation.maxAttempts) {
            const attempt = await this.executeActivationAttempt();

            if (attempt.success) {
                await this.log('🎉 Ativação automática bem-sucedida!');
                this.startHealthCheckMonitoring();
                return { status: 'activated', attempts: this.state.activationAttempts };
            }

            if (this.state.activationAttempts < this.config.activation.maxAttempts) {
                await this.log(`⏳ Aguardando ${currentDelay / 1000}s antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));

                // Backoff exponencial
                currentDelay = Math.min(currentDelay * this.config.activation.backoffMultiplier, 300000); // Max 5 min
            }
        }

        await this.log('❌ Máximo de tentativas de ativação atingido', 'ERROR');
        return { status: 'max_attempts_reached', attempts: this.state.activationAttempts };
    }

    startHealthCheckMonitoring() {
        setInterval(async () => {
            try {
                const check = await this.verifyWorkflowStatus();

                if (!check.active) {
                    await this.log('⚠️ Workflow detectado como inativo durante monitoramento');

                    // Resetar contador para nova tentativa de ativação
                    this.state.activationAttempts = 0;
                    await this.startAutoActivation();
                }
            } catch (error) {
                await this.log(`❌ Erro no health check: ${error.message}`, 'ERROR');
            }
        }, this.config.activation.healthCheckInterval);

        await this.log('👀 Monitoramento de health check iniciado');
    }

    async getDetailedStatus() {
        const uptimeMinutes = Math.floor((Date.now() - this.state.startTime.getTime()) / 1000 / 60);

        return {
            timestamp: new Date().toISOString(),
            workflow: {
                isActive: this.state.isActive,
                lastVerified: this.state.lastVerified,
                lastSuccess: this.state.lastSuccess
            },
            activation: {
                attempts: this.state.activationAttempts,
                totalActivations: this.state.totalActivations,
                lastAttempt: this.state.lastActivationAttempt,
                consecutiveFailures: this.state.consecutiveFailures
            },
            system: {
                uptime: uptimeMinutes,
                startTime: this.state.startTime
            },
            config: {
                maxAttempts: this.config.activation.maxAttempts,
                retryDelay: this.config.activation.retryDelay,
                workflowUrl: this.config.workflowUrl
            }
        };
    }
}

// Execução principal
async function main() {
    const activator = new N8nAutoActivator();

    try {
        const comando = process.argv[2] || 'start';

        switch (comando) {
            case 'start':
                console.log('🚀 Iniciando auto-ativador...');
                const result = await activator.startAutoActivation();
                console.log('📊 Resultado:', result);

                // Manter processo vivo para monitoramento
                process.on('SIGINT', async () => {
                    await activator.log('📴 Auto-ativador sendo finalizado...');
                    process.exit(0);
                });
                break;

            case 'verify':
                console.log('🔍 Verificando status...');
                const verification = await activator.verifyWorkflowStatus();
                console.log('📊 Status:', verification);
                break;

            case 'activate':
                console.log('🔧 Executando tentativa única de ativação...');
                const activation = await activator.executeActivationAttempt();
                console.log('📊 Resultado:', activation);
                break;

            case 'status':
                console.log('📊 Gerando status detalhado...');
                const status = await activator.getDetailedStatus();
                console.log(JSON.stringify(status, null, 2));
                break;

            default:
                console.log('ℹ️ Comandos disponíveis:');
                console.log('  start    - Iniciar auto-ativação (padrão)');
                console.log('  verify   - Verificar status do workflow');
                console.log('  activate - Executar tentativa única');
                console.log('  status   - Status detalhado do sistema');
                break;
        }

    } catch (error) {
        console.error('❌ Erro no auto-ativador:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = N8nAutoActivator;