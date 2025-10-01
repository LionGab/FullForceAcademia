// N8N Cloud Workflow Monitor & Auto-Activation System
// Sistema automatizado para monitoramento e ativação de workflows N8N Cloud

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nWorkflowMonitor {
    constructor() {
        this.config = {
            workflowUrl: 'https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi',
            webhookLeadCapture: 'https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook',
            webhookWhatsappResponses: 'https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses',
            wahaUrl: 'http://localhost:3000',
            bridgeUrl: 'http://localhost:3001',
            wahaApiKey: 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2',
            monitorInterval: 30000, // 30 segundos
            maxRetries: 5,
            retryDelay: 10000 // 10 segundos
        };

        this.status = {
            workflowActive: false,
            lastCheck: null,
            consecutiveFailures: 0,
            lastActivationAttempt: null,
            totalActivationAttempts: 0,
            uptime: 0,
            startTime: new Date()
        };

        this.alerts = [];
        this.metrics = {
            checks: 0,
            failures: 0,
            successes: 0,
            activationAttempts: 0,
            activationSuccesses: 0
        };

        this.logFile = path.join(__dirname, '..', 'logs', 'n8n-monitor.log');
        this.statusFile = path.join(__dirname, '..', 'logs', 'n8n-status.json');
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

    async saveStatus() {
        try {
            await fs.mkdir(path.dirname(this.statusFile), { recursive: true });
            const statusData = {
                ...this.status,
                metrics: this.metrics,
                alerts: this.alerts.slice(-10), // Últimos 10 alertas
                lastUpdate: new Date().toISOString()
            };
            await fs.writeFile(this.statusFile, JSON.stringify(statusData, null, 2));
        } catch (error) {
            await this.log(`Erro ao salvar status: ${error.message}`, 'ERROR');
        }
    }

    async addAlert(type, message, severity = 'warning') {
        const alert = {
            timestamp: new Date().toISOString(),
            type,
            message,
            severity
        };

        this.alerts.push(alert);
        await this.log(`ALERTA [${severity.toUpperCase()}] ${type}: ${message}`, 'ALERT');

        // Manter apenas os últimos 50 alertas
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }
    }

    async testWorkflowConnectivity() {
        try {
            this.metrics.checks++;
            await this.log('Testando conectividade do webhook N8N...');

            const testPayload = {
                source: 'connectivity_test',
                name: 'Monitor Test',
                phone: '5566999999999',
                email: 'monitor@test.com',
                message: 'Teste de conectividade automático',
                timestamp: new Date().toISOString(),
                test: true
            };

            const response = await axios.post(this.config.webhookLeadCapture, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Monitor/1.0'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                this.status.workflowActive = true;
                this.status.consecutiveFailures = 0;
                this.metrics.successes++;
                await this.log('✅ Workflow N8N ativo e respondendo');
                return { active: true, response: response.data };
            } else {
                throw new Error(`Status HTTP inválido: ${response.status}`);
            }

        } catch (error) {
            this.status.workflowActive = false;
            this.status.consecutiveFailures++;
            this.metrics.failures++;

            await this.log(`❌ Workflow N8N não está ativo: ${error.message}`, 'ERROR');
            await this.addAlert('workflow_inactive',
                `Workflow não responde. Erro: ${error.message}`, 'error');

            return { active: false, error: error.message };
        } finally {
            this.status.lastCheck = new Date().toISOString();
            await this.saveStatus();
        }
    }

    async testServiceAvailability() {
        const services = {
            waha: false,
            bridge: false,
            n8nCloud: false
        };

        try {
            // Teste WAHA
            const wahaResponse = await axios.get(`${this.config.wahaUrl}/api/status`, { timeout: 5000 });
            services.waha = true;
            await this.log('✅ WAHA service disponível');
        } catch (error) {
            await this.log(`⚠️ WAHA service indisponível: ${error.message}`, 'WARN');
            await this.addAlert('waha_unavailable', 'WAHA API não está respondendo');
        }

        try {
            // Teste Bridge
            const bridgeResponse = await axios.get(`${this.config.bridgeUrl}/health`, { timeout: 5000 });
            services.bridge = true;
            await this.log('✅ Bridge service disponível');
        } catch (error) {
            await this.log(`⚠️ Bridge service indisponível: ${error.message}`, 'WARN');
            await this.addAlert('bridge_unavailable', 'Bridge N8N não está respondendo');
        }

        // Teste N8N Cloud
        const n8nTest = await this.testWorkflowConnectivity();
        services.n8nCloud = n8nTest.active;

        return services;
    }

    async attemptWorkflowActivation() {
        try {
            this.metrics.activationAttempts++;
            this.status.totalActivationAttempts++;
            this.status.lastActivationAttempt = new Date().toISOString();

            await this.log('🔄 Tentando ativar workflow automaticamente...');

            // Estratégia 1: Teste de ativação via webhook direto
            await this.log('Estratégia 1: Enviando payload de ativação...');

            const activationPayload = {
                action: 'activate_workflow',
                workflow_id: 'VGhKEfrpJU47onvi',
                source: 'auto_activation_system',
                timestamp: new Date().toISOString()
            };

            const activationTest = await axios.post(this.config.webhookLeadCapture, activationPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'N8N-Auto-Activator/1.0'
                },
                timeout: 20000
            });

            if (activationTest.status === 200) {
                await this.log('✅ Possível ativação bem-sucedida');

                // Aguardar um pouco e testar novamente
                await new Promise(resolve => setTimeout(resolve, 5000));

                const verificationTest = await this.testWorkflowConnectivity();
                if (verificationTest.active) {
                    this.metrics.activationSuccesses++;
                    await this.log('🎉 Workflow ativado automaticamente com sucesso!');
                    await this.addAlert('activation_success', 'Workflow ativado automaticamente', 'success');
                    return { success: true, method: 'webhook_activation' };
                }
            }

            // Estratégia 2: Via bridge se disponível
            try {
                await this.log('Estratégia 2: Tentando via bridge...');

                const bridgeActivation = await axios.post(`${this.config.bridgeUrl}/api/activate-n8n`, {
                    workflow_url: this.config.workflowUrl
                }, { timeout: 15000 });

                if (bridgeActivation.data.success) {
                    const verificationTest = await this.testWorkflowConnectivity();
                    if (verificationTest.active) {
                        this.metrics.activationSuccesses++;
                        await this.log('🎉 Workflow ativado via bridge!');
                        await this.addAlert('activation_success', 'Workflow ativado via bridge', 'success');
                        return { success: true, method: 'bridge_activation' };
                    }
                }
            } catch (bridgeError) {
                await this.log(`Bridge activation falhou: ${bridgeError.message}`, 'WARN');
            }

            // Se chegou aqui, nenhuma estratégia funcionou
            await this.log('❌ Ativação automática falhou', 'ERROR');
            await this.addAlert('activation_failed',
                'Todas as estratégias de ativação automática falharam', 'error');

            return { success: false, error: 'Auto-activation failed' };

        } catch (error) {
            await this.log(`❌ Erro durante tentativa de ativação: ${error.message}`, 'ERROR');
            await this.addAlert('activation_error',
                `Erro na ativação automática: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async monitoringCycle() {
        try {
            await this.log('🔍 Iniciando ciclo de monitoramento...');

            // 1. Testar disponibilidade dos serviços
            const services = await this.testServiceAvailability();

            // 2. Se N8N não estiver ativo, tentar ativação automática
            if (!services.n8nCloud && this.status.consecutiveFailures >= 2) {
                await this.log('⚠️ Workflow inativo por múltiplos ciclos, tentando ativação automática...');

                if (this.status.consecutiveFailures <= this.config.maxRetries) {
                    const activationResult = await this.attemptWorkflowActivation();

                    if (activationResult.success) {
                        // Resetar contadores após ativação bem-sucedida
                        this.status.consecutiveFailures = 0;
                    }
                } else {
                    await this.addAlert('max_retries_exceeded',
                        'Máximo de tentativas de ativação excedido', 'critical');
                }
            }

            // 3. Atualizar métricas de uptime
            const now = new Date();
            const uptimeMinutes = Math.floor((now - this.status.startTime) / 1000 / 60);
            this.status.uptime = uptimeMinutes;

            // 4. Relatório do ciclo
            await this.log(`📊 Status: N8N=${services.n8nCloud ? 'ATIVO' : 'INATIVO'}, ` +
                          `WAHA=${services.waha ? 'OK' : 'ERRO'}, ` +
                          `Bridge=${services.bridge ? 'OK' : 'ERRO'}, ` +
                          `Falhas consecutivas: ${this.status.consecutiveFailures}`);

            return services;

        } catch (error) {
            await this.log(`❌ Erro no ciclo de monitoramento: ${error.message}`, 'ERROR');
            await this.addAlert('monitoring_error',
                `Erro no monitoramento: ${error.message}`, 'error');
        }
    }

    async startMonitoring() {
        await this.log('🚀 Iniciando sistema de monitoramento N8N Cloud...');
        await this.log(`📊 Configurações:`);
        await this.log(`   - Workflow URL: ${this.config.workflowUrl}`);
        await this.log(`   - Intervalo de monitoramento: ${this.config.monitorInterval / 1000}s`);
        await this.log(`   - Máximo de tentativas: ${this.config.maxRetries}`);

        // Executar primeiro teste imediatamente
        await this.monitoringCycle();

        // Agendar execuções periódicas
        setInterval(async () => {
            await this.monitoringCycle();
        }, this.config.monitorInterval);

        await this.log('✅ Sistema de monitoramento ativo');
    }

    async getStatus() {
        return {
            timestamp: new Date().toISOString(),
            status: this.status,
            metrics: this.metrics,
            config: {
                workflowUrl: this.config.workflowUrl,
                monitorInterval: this.config.monitorInterval,
                maxRetries: this.config.maxRetries
            },
            recentAlerts: this.alerts.slice(-5)
        };
    }

    async generateReport() {
        const report = await this.getStatus();

        console.log('\n📊 RELATÓRIO DE MONITORAMENTO N8N CLOUD');
        console.log('======================================');
        console.log(`📅 Gerado em: ${report.timestamp}`);
        console.log(`⏱️ Uptime: ${this.status.uptime} minutos`);
        console.log(`🔄 Total de verificações: ${this.metrics.checks}`);
        console.log(`✅ Sucessos: ${this.metrics.successes}`);
        console.log(`❌ Falhas: ${this.metrics.failures}`);
        console.log(`🔧 Tentativas de ativação: ${this.metrics.activationAttempts}`);
        console.log(`🎯 Ativações bem-sucedidas: ${this.metrics.activationSuccesses}`);
        console.log(`📈 Taxa de sucesso: ${this.metrics.checks > 0 ?
                    (this.metrics.successes / this.metrics.checks * 100).toFixed(2) : 0}%`);
        console.log(`🔄 Status atual: ${this.status.workflowActive ? 'ATIVO' : 'INATIVO'}`);
        console.log(`⚠️ Falhas consecutivas: ${this.status.consecutiveFailures}`);

        if (this.alerts.length > 0) {
            console.log('\n🚨 ALERTAS RECENTES:');
            this.alerts.slice(-5).forEach(alert => {
                console.log(`   [${alert.timestamp}] ${alert.severity.toUpperCase()}: ${alert.message}`);
            });
        }

        return report;
    }
}

// Sistema de execução e comandos
async function main() {
    const monitor = new N8nWorkflowMonitor();

    try {
        const comando = process.argv[2] || 'monitor';

        switch (comando) {
            case 'monitor':
                console.log('🚀 Iniciando monitoramento contínuo...');
                await monitor.startMonitoring();

                // Manter o processo rodando
                process.on('SIGINT', async () => {
                    await monitor.log('📴 Sistema de monitoramento sendo finalizado...');
                    await monitor.generateReport();
                    process.exit(0);
                });
                break;

            case 'test':
                console.log('🧪 Executando teste único...');
                const testResult = await monitor.testWorkflowConnectivity();
                console.log('📊 Resultado:', testResult);
                break;

            case 'activate':
                console.log('🔧 Tentando ativação manual...');
                const activationResult = await monitor.attemptWorkflowActivation();
                console.log('📊 Resultado:', activationResult);
                break;

            case 'status':
                console.log('📊 Gerando relatório de status...');
                await monitor.generateReport();
                break;

            case 'services':
                console.log('🔍 Testando todos os serviços...');
                const services = await monitor.testServiceAvailability();
                console.log('📊 Status dos serviços:', services);
                break;

            default:
                console.log('ℹ️ Comandos disponíveis:');
                console.log('  monitor   - Monitoramento contínuo (padrão)');
                console.log('  test      - Teste único de conectividade');
                console.log('  activate  - Tentativa manual de ativação');
                console.log('  status    - Relatório de status detalhado');
                console.log('  services  - Teste de todos os serviços');
                break;
        }

    } catch (error) {
        console.error('❌ Erro no sistema de monitoramento:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = N8nWorkflowMonitor;