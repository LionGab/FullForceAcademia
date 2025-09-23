// N8N Fallback System - Sistema Inteligente de Fallback e Recuperação
// Sistema robusto para garantir operação contínua mesmo com falhas

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const N8nAutoActivator = require('./n8n-auto-activator');

class N8nFallbackSystem {
    constructor() {
        this.config = {
            primaryWorkflow: 'https://lionalpha.app.n8n.cloud/workflow/VGhKEfrpJU47onvi',
            webhooks: {
                primary: 'https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook',
                backup: 'https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses'
            },
            localServices: {
                waha: 'http://localhost:3000',
                bridge: 'http://localhost:3001'
            },
            fallback: {
                maxFailures: 3,
                recoveryDelay: 30000, // 30 segundos
                escalationDelay: 300000, // 5 minutos
                healthCheckInterval: 60000, // 1 minuto
                criticalThreshold: 10, // Falhas críticas antes de fallback total
                backupMethods: ['local_processing', 'queue_system', 'bridge_redirect']
            },
            retry: {
                maxAttempts: 5,
                baseDelay: 5000,
                maxDelay: 60000,
                backoffFactor: 2
            }
        };

        this.state = {
            systemHealth: 'healthy', // healthy, degraded, critical, fallback
            primaryActive: false,
            fallbackActive: false,
            consecutiveFailures: 0,
            totalFailures: 0,
            lastFailure: null,
            recoveryAttempts: 0,
            currentMode: 'primary', // primary, backup, local, emergency
            uptime: 0,
            startTime: new Date()
        };

        this.queues = {
            pending: [],
            failed: [],
            processing: [],
            completed: []
        };

        this.activator = new N8nAutoActivator();
        this.logFile = path.join(__dirname, '..', 'logs', 'n8n-fallback.log');
        this.stateFile = path.join(__dirname, '..', 'logs', 'fallback-state.json');
        this.queueFile = path.join(__dirname, '..', 'logs', 'fallback-queue.json');
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] [${this.state.currentMode.toUpperCase()}] ${message}`;

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

            // Salvar filas também
            await fs.writeFile(this.queueFile, JSON.stringify(this.queues, null, 2));

        } catch (error) {
            await this.log(`Erro ao salvar estado: ${error.message}`, 'ERROR');
        }
    }

    async loadState() {
        try {
            // Carregar estado
            const stateData = await fs.readFile(this.stateFile, 'utf8');
            const parsedState = JSON.parse(stateData);

            this.state = {
                ...this.state,
                ...parsedState,
                startTime: new Date(parsedState.startTime || Date.now())
            };

            // Carregar filas
            try {
                const queueData = await fs.readFile(this.queueFile, 'utf8');
                this.queues = JSON.parse(queueData);
            } catch (queueError) {
                await this.log('Nenhuma fila anterior encontrada');
            }

            await this.log('Estado anterior carregado com sucesso');
        } catch (error) {
            await this.log('Nenhum estado anterior encontrado, iniciando fresh');
        }
    }

    async checkSystemHealth() {
        try {
            const healthChecks = {
                primaryWorkflow: false,
                wahaService: false,
                bridgeService: false,
                backupWebhook: false
            };

            // Verificar workflow primário
            try {
                const primaryTest = await this.activator.verifyWorkflowStatus();
                healthChecks.primaryWorkflow = primaryTest.active;
                this.state.primaryActive = primaryTest.active;
            } catch (error) {
                await this.log(`Primary workflow check failed: ${error.message}`, 'WARN');
            }

            // Verificar WAHA
            try {
                const wahaResponse = await axios.get(`${this.config.localServices.waha}/api/status`, { timeout: 5000 });
                healthChecks.wahaService = wahaResponse.status === 200;
            } catch (error) {
                await this.log(`WAHA check failed: ${error.message}`, 'WARN');
            }

            // Verificar Bridge
            try {
                const bridgeResponse = await axios.get(`${this.config.localServices.bridge}/health`, { timeout: 5000 });
                healthChecks.bridgeService = bridgeResponse.status === 200;
            } catch (error) {
                await this.log(`Bridge check failed: ${error.message}`, 'WARN');
            }

            // Verificar webhook backup
            try {
                const backupTest = await axios.post(this.config.webhooks.backup, {
                    source: 'fallback_health_check',
                    timestamp: new Date().toISOString()
                }, { timeout: 10000 });
                healthChecks.backupWebhook = backupTest.status === 200;
            } catch (error) {
                await this.log(`Backup webhook check failed: ${error.message}`, 'WARN');
            }

            // Determinar saúde do sistema
            const healthyServices = Object.values(healthChecks).filter(Boolean).length;
            const totalServices = Object.keys(healthChecks).length;

            if (healthyServices === totalServices) {
                this.state.systemHealth = 'healthy';
            } else if (healthyServices >= totalServices * 0.75) {
                this.state.systemHealth = 'degraded';
            } else if (healthyServices >= totalServices * 0.5) {
                this.state.systemHealth = 'critical';
            } else {
                this.state.systemHealth = 'fallback';
            }

            await this.log(`Health check: ${healthyServices}/${totalServices} services healthy - Status: ${this.state.systemHealth.toUpperCase()}`);

            return {
                overall: this.state.systemHealth,
                services: healthChecks,
                score: (healthyServices / totalServices) * 100
            };

        } catch (error) {
            await this.log(`Health check system error: ${error.message}`, 'ERROR');
            this.state.systemHealth = 'critical';
            return { overall: 'critical', error: error.message };
        }
    }

    async processWithRetry(data, method = 'primary') {
        let attempt = 1;
        let delay = this.config.retry.baseDelay;

        while (attempt <= this.config.retry.maxAttempts) {
            try {
                await this.log(`Attempt ${attempt}/${this.config.retry.maxAttempts} - Method: ${method}`);

                let result;
                switch (method) {
                    case 'primary':
                        result = await this.processPrimary(data);
                        break;
                    case 'backup':
                        result = await this.processBackup(data);
                        break;
                    case 'local':
                        result = await this.processLocal(data);
                        break;
                    case 'bridge':
                        result = await this.processBridge(data);
                        break;
                    default:
                        throw new Error(`Unknown method: ${method}`);
                }

                await this.log(`✅ Success with method ${method} on attempt ${attempt}`);
                this.state.consecutiveFailures = 0;
                return { success: true, method, attempt, result };

            } catch (error) {
                await this.log(`❌ Attempt ${attempt} failed: ${error.message}`, 'WARN');

                if (attempt === this.config.retry.maxAttempts) {
                    this.state.consecutiveFailures++;
                    this.state.totalFailures++;
                    this.state.lastFailure = new Date().toISOString();

                    await this.log(`🚨 All ${this.config.retry.maxAttempts} attempts failed for method ${method}`, 'ERROR');
                    return { success: false, method, attempts: attempt, error: error.message };
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * this.config.retry.backoffFactor, this.config.retry.maxDelay);
                attempt++;
            }
        }
    }

    async processPrimary(data) {
        const response = await axios.post(this.config.webhooks.primary, {
            ...data,
            source: `${data.source || 'fallback'}_primary`,
            timestamp: new Date().toISOString()
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        if (response.status !== 200) {
            throw new Error(`Primary webhook returned ${response.status}`);
        }

        return response.data;
    }

    async processBackup(data) {
        const response = await axios.post(this.config.webhooks.backup, {
            ...data,
            source: `${data.source || 'fallback'}_backup`,
            timestamp: new Date().toISOString(),
            fallback_method: 'backup_webhook'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        if (response.status !== 200) {
            throw new Error(`Backup webhook returned ${response.status}`);
        }

        return response.data;
    }

    async processLocal(data) {
        // Processar localmente através do bridge
        const response = await axios.post(`${this.config.localServices.bridge}/api/process-local`, {
            ...data,
            source: `${data.source || 'fallback'}_local`,
            timestamp: new Date().toISOString(),
            fallback_method: 'local_processing'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        if (!response.data.success) {
            throw new Error('Local processing failed');
        }

        return response.data;
    }

    async processBridge(data) {
        const response = await axios.post(`${this.config.localServices.bridge}/api/inject-lead`, {
            ...data,
            source: `${data.source || 'fallback'}_bridge`,
            timestamp: new Date().toISOString(),
            fallback_method: 'bridge_redirect'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        if (!response.data.success) {
            throw new Error('Bridge processing failed');
        }

        return response.data;
    }

    async addToQueue(data, priority = 'normal') {
        const queueItem = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data,
            priority,
            timestamp: new Date().toISOString(),
            attempts: 0,
            status: 'pending'
        };

        if (priority === 'high') {
            this.queues.pending.unshift(queueItem);
        } else {
            this.queues.pending.push(queueItem);
        }

        await this.log(`📥 Item added to queue: ${queueItem.id} (Priority: ${priority})`);
        await this.saveState();

        return queueItem.id;
    }

    async processQueue() {
        if (this.queues.pending.length === 0) {
            return { processed: 0, message: 'Queue empty' };
        }

        await this.log(`📤 Processing queue: ${this.queues.pending.length} items pending`);

        let processed = 0;
        let errors = 0;

        while (this.queues.pending.length > 0 && processed < 10) { // Process max 10 items per cycle
            const item = this.queues.pending.shift();
            item.status = 'processing';
            this.queues.processing.push(item);

            try {
                const methods = this.getAvailableMethods();
                let success = false;

                for (const method of methods) {
                    const result = await this.processWithRetry(item.data, method);

                    if (result.success) {
                        item.status = 'completed';
                        item.completedAt = new Date().toISOString();
                        item.result = result;

                        // Move to completed queue
                        this.queues.processing = this.queues.processing.filter(q => q.id !== item.id);
                        this.queues.completed.push(item);

                        success = true;
                        processed++;
                        break;
                    }
                }

                if (!success) {
                    item.status = 'failed';
                    item.failedAt = new Date().toISOString();
                    item.attempts++;

                    // Move to failed queue or retry
                    this.queues.processing = this.queues.processing.filter(q => q.id !== item.id);

                    if (item.attempts < 3) {
                        this.queues.pending.push(item); // Retry later
                    } else {
                        this.queues.failed.push(item); // Give up
                    }

                    errors++;
                }

            } catch (error) {
                await this.log(`❌ Queue processing error for ${item.id}: ${error.message}`, 'ERROR');

                item.status = 'failed';
                item.error = error.message;
                this.queues.processing = this.queues.processing.filter(q => q.id !== item.id);
                this.queues.failed.push(item);
                errors++;
            }
        }

        await this.saveState();
        await this.log(`📊 Queue processing complete: ${processed} processed, ${errors} errors`);

        return { processed, errors, remaining: this.queues.pending.length };
    }

    getAvailableMethods() {
        const health = this.state.systemHealth;

        switch (health) {
            case 'healthy':
                return ['primary', 'backup', 'bridge', 'local'];
            case 'degraded':
                return ['backup', 'bridge', 'local'];
            case 'critical':
                return ['bridge', 'local'];
            case 'fallback':
                return ['local'];
            default:
                return ['local'];
        }
    }

    async determineFallbackMode() {
        const health = await this.checkSystemHealth();

        if (health.overall === 'healthy' && this.state.primaryActive) {
            this.state.currentMode = 'primary';
        } else if (health.overall === 'degraded' || health.overall === 'healthy') {
            this.state.currentMode = 'backup';
        } else if (health.services.bridgeService) {
            this.state.currentMode = 'bridge';
        } else {
            this.state.currentMode = 'emergency';
        }

        await this.log(`🔄 Mode switched to: ${this.state.currentMode.toUpperCase()}`);
        await this.saveState();

        return this.state.currentMode;
    }

    async attemptRecovery() {
        try {
            this.state.recoveryAttempts++;
            await this.log(`🔧 Recovery attempt ${this.state.recoveryAttempts} starting...`);

            // Tentar ativar workflow primário
            if (!this.state.primaryActive) {
                await this.log('Attempting primary workflow activation...');
                const activationResult = await this.activator.executeActivationAttempt();

                if (activationResult.success) {
                    await this.log('✅ Primary workflow recovered!');
                    this.state.primaryActive = true;
                    this.state.consecutiveFailures = 0;
                    return { success: true, method: 'primary_activation' };
                }
            }

            // Processar fila pendente
            if (this.queues.pending.length > 0) {
                await this.log('Processing pending queue during recovery...');
                await this.processQueue();
            }

            // Verificar saúde após tentativas de recuperação
            const healthAfterRecovery = await this.checkSystemHealth();

            if (healthAfterRecovery.overall === 'healthy' || healthAfterRecovery.overall === 'degraded') {
                await this.log('✅ System recovery successful!');
                return { success: true, health: healthAfterRecovery };
            }

            return { success: false, health: healthAfterRecovery };

        } catch (error) {
            await this.log(`❌ Recovery attempt failed: ${error.message}`, 'ERROR');
            return { success: false, error: error.message };
        }
    }

    async smartProcess(data) {
        try {
            // Determinar melhor método baseado na saúde do sistema
            await this.determineFallbackMode();

            const methods = this.getAvailableMethods();

            // Tentar processar diretamente primeiro
            for (const method of methods) {
                const result = await this.processWithRetry(data, method);

                if (result.success) {
                    await this.log(`✅ Smart processing successful with method: ${method}`);
                    return result;
                }
            }

            // Se falhou, adicionar à fila
            await this.log('⚠️ Direct processing failed, adding to queue');
            const queueId = await this.addToQueue(data, 'high');

            return {
                success: false,
                queued: true,
                queueId,
                message: 'Added to priority queue for processing'
            };

        } catch (error) {
            await this.log(`❌ Smart processing error: ${error.message}`, 'ERROR');

            // Último recurso: adicionar à fila
            const queueId = await this.addToQueue(data, 'high');
            return {
                success: false,
                error: error.message,
                queued: true,
                queueId
            };
        }
    }

    async startFallbackSystem() {
        await this.log('🚀 Starting N8N Fallback System...');
        await this.loadState();

        // Health check inicial
        await this.checkSystemHealth();
        await this.determineFallbackMode();

        // Processar fila existente
        if (this.queues.pending.length > 0) {
            await this.log(`📤 Processing ${this.queues.pending.length} queued items...`);
            await this.processQueue();
        }

        // Iniciar monitoramento contínuo
        setInterval(async () => {
            try {
                await this.checkSystemHealth();

                // Se há muitas falhas consecutivas, tentar recuperação
                if (this.state.consecutiveFailures >= this.config.fallback.maxFailures) {
                    await this.attemptRecovery();
                }

                // Processar fila periodicamente
                if (this.queues.pending.length > 0) {
                    await this.processQueue();
                }

            } catch (error) {
                await this.log(`❌ Monitoring cycle error: ${error.message}`, 'ERROR');
            }
        }, this.config.fallback.healthCheckInterval);

        await this.log('✅ Fallback system active and monitoring');
        return { status: 'active', mode: this.state.currentMode };
    }

    async getSystemStatus() {
        const uptimeMinutes = Math.floor((Date.now() - this.state.startTime.getTime()) / 1000 / 60);

        return {
            timestamp: new Date().toISOString(),
            system: {
                health: this.state.systemHealth,
                mode: this.state.currentMode,
                uptime: uptimeMinutes,
                primaryActive: this.state.primaryActive
            },
            failures: {
                consecutive: this.state.consecutiveFailures,
                total: this.state.totalFailures,
                lastFailure: this.state.lastFailure
            },
            recovery: {
                attempts: this.state.recoveryAttempts
            },
            queues: {
                pending: this.queues.pending.length,
                processing: this.queues.processing.length,
                completed: this.queues.completed.length,
                failed: this.queues.failed.length
            },
            availableMethods: this.getAvailableMethods()
        };
    }
}

// Execução principal
async function main() {
    const fallbackSystem = new N8nFallbackSystem();

    try {
        const comando = process.argv[2] || 'start';

        switch (comando) {
            case 'start':
                console.log('🚀 Iniciando sistema de fallback...');
                const result = await fallbackSystem.startFallbackSystem();
                console.log('📊 Sistema ativo:', result);

                // Manter processo vivo
                process.on('SIGINT', async () => {
                    await fallbackSystem.log('📴 Fallback system sendo finalizado...');
                    await fallbackSystem.saveState();
                    process.exit(0);
                });
                break;

            case 'process':
                const testData = {
                    source: 'fallback_test',
                    name: 'Test User',
                    phone: '5566999999999',
                    message: 'Test message for fallback system'
                };

                console.log('🧪 Testando processamento inteligente...');
                const processResult = await fallbackSystem.smartProcess(testData);
                console.log('📊 Resultado:', processResult);
                break;

            case 'health':
                console.log('🔍 Verificando saúde do sistema...');
                const health = await fallbackSystem.checkSystemHealth();
                console.log('📊 Saúde:', health);
                break;

            case 'queue':
                console.log('📤 Processando fila...');
                await fallbackSystem.loadState();
                const queueResult = await fallbackSystem.processQueue();
                console.log('📊 Resultado da fila:', queueResult);
                break;

            case 'status':
                console.log('📊 Status do sistema...');
                await fallbackSystem.loadState();
                const status = await fallbackSystem.getSystemStatus();
                console.log(JSON.stringify(status, null, 2));
                break;

            case 'recovery':
                console.log('🔧 Executando recuperação...');
                await fallbackSystem.loadState();
                const recoveryResult = await fallbackSystem.attemptRecovery();
                console.log('📊 Resultado da recuperação:', recoveryResult);
                break;

            default:
                console.log('ℹ️ Comandos disponíveis:');
                console.log('  start    - Iniciar sistema de fallback');
                console.log('  process  - Testar processamento inteligente');
                console.log('  health   - Verificar saúde do sistema');
                console.log('  queue    - Processar fila pendente');
                console.log('  status   - Status detalhado');
                console.log('  recovery - Executar recuperação manual');
                break;
        }

    } catch (error) {
        console.error('❌ Erro no sistema de fallback:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = N8nFallbackSystem;