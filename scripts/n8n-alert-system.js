// N8N Alert System - Sistema Inteligente de Alertas e Notificações
// Sistema avançado para monitoramento e alertas em tempo real

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class N8nAlertSystem {
    constructor() {
        this.config = {
            webhooks: {
                primary: 'https://lionalpha.app.n8n.cloud/webhook/fitness-academy-webhook',
                backup: 'https://lionalpha.app.n8n.cloud/webhook/whatsapp-responses'
            },
            localServices: {
                waha: 'http://localhost:3000',
                bridge: 'http://localhost:3001'
            },
            alerts: {
                checkInterval: 30000, // 30 segundos
                escalationTime: 300000, // 5 minutos
                criticalThreshold: 5, // Falhas consecutivas
                notificationCooldown: 600000, // 10 minutos
                retryInterval: 60000 // 1 minuto
            },
            notifications: {
                managerWhatsApp: '5566999999999',
                email: 'admin@ffmatupa.com',
                webhookUrl: null, // Webhook para notificações externas
                enableSounds: true,
                enableDesktop: true
            },
            thresholds: {
                responseTime: 10000, // 10 segundos
                errorRate: 0.1, // 10%
                uptimeMinimum: 0.95 // 95%
            }
        };

        this.state = {
            alerts: [],
            metrics: {
                totalChecks: 0,
                totalFailures: 0,
                consecutiveFailures: 0,
                lastFailure: null,
                lastSuccess: null,
                uptimeStart: new Date(),
                downtime: 0,
                avgResponseTime: 0,
                responseTimes: []
            },
            services: {
                n8nPrimary: { status: 'unknown', lastCheck: null, failures: 0 },
                n8nBackup: { status: 'unknown', lastCheck: null, failures: 0 },
                waha: { status: 'unknown', lastCheck: null, failures: 0 },
                bridge: { status: 'unknown', lastCheck: null, failures: 0 }
            },
            notifications: {
                sent: [],
                lastNotification: null,
                cooldownActive: false
            }
        };

        this.alertTypes = {
            WORKFLOW_DOWN: {
                severity: 'critical',
                message: 'Workflow N8N Cloud está inativo',
                action: 'Tentativa automática de ativação iniciada'
            },
            HIGH_ERROR_RATE: {
                severity: 'warning',
                message: 'Taxa de erro elevada detectada',
                action: 'Monitoramento intensivo ativado'
            },
            SERVICE_UNAVAILABLE: {
                severity: 'error',
                message: 'Serviço indisponível',
                action: 'Fallback automático ativado'
            },
            SLOW_RESPONSE: {
                severity: 'warning',
                message: 'Tempo de resposta elevado',
                action: 'Verificação de performance iniciada'
            },
            RECOVERY_SUCCESS: {
                severity: 'success',
                message: 'Sistema recuperado com sucesso',
                action: 'Operação normal retomada'
            },
            UPTIME_LOW: {
                severity: 'error',
                message: 'Uptime abaixo do limite',
                action: 'Investigação automática iniciada'
            }
        };

        this.logFile = path.join(__dirname, '..', 'logs', 'n8n-alerts.log');
        this.alertsFile = path.join(__dirname, '..', 'logs', 'alerts-history.json');
        this.metricsFile = path.join(__dirname, '..', 'logs', 'metrics.json');
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

    async saveData() {
        try {
            await fs.mkdir(path.dirname(this.alertsFile), { recursive: true });

            // Salvar histórico de alertas
            await fs.writeFile(this.alertsFile, JSON.stringify({
                alerts: this.state.alerts.slice(-100), // Últimos 100 alertas
                lastUpdate: new Date().toISOString()
            }, null, 2));

            // Salvar métricas
            await fs.writeFile(this.metricsFile, JSON.stringify({
                metrics: this.state.metrics,
                services: this.state.services,
                notifications: {
                    sent: this.state.notifications.sent.slice(-50), // Últimas 50 notificações
                    lastNotification: this.state.notifications.lastNotification
                },
                lastUpdate: new Date().toISOString()
            }, null, 2));

        } catch (error) {
            await this.log(`Erro ao salvar dados: ${error.message}`, 'ERROR');
        }
    }

    async loadData() {
        try {
            // Carregar alertas
            const alertsData = await fs.readFile(this.alertsFile, 'utf8');
            const parsedAlerts = JSON.parse(alertsData);
            this.state.alerts = parsedAlerts.alerts || [];

            // Carregar métricas
            const metricsData = await fs.readFile(this.metricsFile, 'utf8');
            const parsedMetrics = JSON.parse(metricsData);

            this.state.metrics = { ...this.state.metrics, ...parsedMetrics.metrics };
            this.state.services = { ...this.state.services, ...parsedMetrics.services };
            this.state.notifications = { ...this.state.notifications, ...parsedMetrics.notifications };

            await this.log('Dados históricos carregados com sucesso');
        } catch (error) {
            await this.log('Nenhum dado histórico encontrado, iniciando fresh');
        }
    }

    async createAlert(type, details = {}) {
        const alertConfig = this.alertTypes[type];
        if (!alertConfig) {
            await this.log(`Tipo de alerta desconhecido: ${type}`, 'ERROR');
            return null;
        }

        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity: alertConfig.severity,
            message: alertConfig.message,
            action: alertConfig.action,
            details,
            timestamp: new Date().toISOString(),
            acknowledged: false,
            resolved: false
        };

        this.state.alerts.push(alert);

        await this.log(`🚨 ALERTA [${alert.severity.toUpperCase()}] ${type}: ${alert.message}`, 'ALERT');

        // Enviar notificação se necessário
        if (alert.severity === 'critical' || alert.severity === 'error') {
            await this.sendNotification(alert);
        }

        await this.saveData();
        return alert;
    }

    async checkWorkflowHealth(webhookUrl, serviceName) {
        const startTime = Date.now();

        try {
            this.state.metrics.totalChecks++;

            const testPayload = {
                source: 'alert_health_check',
                name: 'Alert System Check',
                phone: '5566999999999',
                timestamp: new Date().toISOString(),
                health_check: true
            };

            const response = await axios.post(webhookUrl, testPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: this.config.thresholds.responseTime
            });

            const responseTime = Date.now() - startTime;

            // Atualizar métricas de tempo de resposta
            this.state.metrics.responseTimes.push(responseTime);
            if (this.state.metrics.responseTimes.length > 100) {
                this.state.metrics.responseTimes = this.state.metrics.responseTimes.slice(-100);
            }

            this.state.metrics.avgResponseTime =
                this.state.metrics.responseTimes.reduce((a, b) => a + b, 0) /
                this.state.metrics.responseTimes.length;

            // Atualizar status do serviço
            this.state.services[serviceName] = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                failures: 0,
                responseTime
            };

            this.state.metrics.consecutiveFailures = 0;
            this.state.metrics.lastSuccess = new Date().toISOString();

            // Verificar se tempo de resposta está alto
            if (responseTime > this.config.thresholds.responseTime) {
                await this.createAlert('SLOW_RESPONSE', {
                    service: serviceName,
                    responseTime,
                    threshold: this.config.thresholds.responseTime
                });
            }

            await this.log(`✅ ${serviceName} saudável (${responseTime}ms)`);
            return { healthy: true, responseTime, service: serviceName };

        } catch (error) {
            const responseTime = Date.now() - startTime;

            this.state.metrics.totalFailures++;
            this.state.metrics.consecutiveFailures++;
            this.state.metrics.lastFailure = new Date().toISOString();

            // Atualizar status do serviço
            this.state.services[serviceName].status = 'unhealthy';
            this.state.services[serviceName].lastCheck = new Date().toISOString();
            this.state.services[serviceName].failures++;

            await this.log(`❌ ${serviceName} falhou: ${error.message}`, 'ERROR');

            // Criar alerta se crítico
            if (this.state.metrics.consecutiveFailures >= this.config.alerts.criticalThreshold) {
                await this.createAlert('WORKFLOW_DOWN', {
                    service: serviceName,
                    error: error.message,
                    consecutiveFailures: this.state.metrics.consecutiveFailures
                });
            }

            return { healthy: false, error: error.message, responseTime, service: serviceName };
        }
    }

    async checkServiceHealth(serviceUrl, serviceName) {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${serviceUrl}/api/status`, { timeout: 5000 });
            const responseTime = Date.now() - startTime;

            this.state.services[serviceName] = {
                status: 'healthy',
                lastCheck: new Date().toISOString(),
                failures: 0,
                responseTime
            };

            await this.log(`✅ ${serviceName} service healthy`);
            return { healthy: true, responseTime };

        } catch (error) {
            this.state.services[serviceName].status = 'unhealthy';
            this.state.services[serviceName].lastCheck = new Date().toISOString();
            this.state.services[serviceName].failures++;

            await this.log(`❌ ${serviceName} service unhealthy: ${error.message}`, 'WARN');

            await this.createAlert('SERVICE_UNAVAILABLE', {
                service: serviceName,
                error: error.message
            });

            return { healthy: false, error: error.message };
        }
    }

    async performHealthCheck() {
        try {
            await this.log('🔍 Executando verificação de saúde completa...');

            const checks = await Promise.allSettled([
                this.checkWorkflowHealth(this.config.webhooks.primary, 'n8nPrimary'),
                this.checkWorkflowHealth(this.config.webhooks.backup, 'n8nBackup'),
                this.checkServiceHealth(this.config.localServices.waha, 'waha'),
                this.checkServiceHealth(this.config.localServices.bridge, 'bridge')
            ]);

            const results = {
                n8nPrimary: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false, error: checks[0].reason },
                n8nBackup: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false, error: checks[1].reason },
                waha: checks[2].status === 'fulfilled' ? checks[2].value : { healthy: false, error: checks[2].reason },
                bridge: checks[3].status === 'fulfilled' ? checks[3].value : { healthy: false, error: checks[3].reason }
            };

            // Calcular uptime
            const healthyServices = Object.values(results).filter(r => r.healthy).length;
            const totalServices = Object.keys(results).length;
            const currentUptime = healthyServices / totalServices;

            if (currentUptime < this.config.thresholds.uptimeMinimum) {
                await this.createAlert('UPTIME_LOW', {
                    currentUptime,
                    threshold: this.config.thresholds.uptimeMinimum,
                    healthyServices,
                    totalServices
                });
            }

            // Calcular taxa de erro
            const errorRate = this.state.metrics.totalChecks > 0 ?
                this.state.metrics.totalFailures / this.state.metrics.totalChecks : 0;

            if (errorRate > this.config.thresholds.errorRate) {
                await this.createAlert('HIGH_ERROR_RATE', {
                    errorRate,
                    threshold: this.config.thresholds.errorRate,
                    totalChecks: this.state.metrics.totalChecks,
                    totalFailures: this.state.metrics.totalFailures
                });
            }

            await this.saveData();

            return {
                results,
                uptime: currentUptime,
                errorRate,
                avgResponseTime: this.state.metrics.avgResponseTime
            };

        } catch (error) {
            await this.log(`❌ Erro na verificação de saúde: ${error.message}`, 'ERROR');
            return { error: error.message };
        }
    }

    async sendNotification(alert) {
        // Verificar cooldown
        if (this.state.notifications.cooldownActive) {
            await this.log('Notificação em cooldown, pulando...', 'WARN');
            return { sent: false, reason: 'cooldown' };
        }

        try {
            const notification = {
                id: `notif_${Date.now()}`,
                alertId: alert.id,
                timestamp: new Date().toISOString(),
                type: alert.type,
                severity: alert.severity,
                message: alert.message,
                channels: []
            };

            // Enviar via WhatsApp se WAHA estiver disponível
            if (this.state.services.waha.status === 'healthy') {
                try {
                    const whatsappMessage = `🚨 ALERTA FFMATUPA N8N
Severidade: ${alert.severity.toUpperCase()}
Tipo: ${alert.type}
Mensagem: ${alert.message}
Ação: ${alert.action}
Horário: ${new Date().toLocaleString('pt-BR')}

Status dos serviços:
N8N Primary: ${this.state.services.n8nPrimary.status}
N8N Backup: ${this.state.services.n8nBackup.status}
WAHA: ${this.state.services.waha.status}
Bridge: ${this.state.services.bridge.status}`;

                    await axios.post(`${this.config.localServices.waha}/api/sendText`, {
                        chatId: `${this.config.notifications.managerWhatsApp}@c.us`,
                        text: whatsappMessage
                    });

                    notification.channels.push('whatsapp');
                    await this.log('📱 Notificação WhatsApp enviada');

                } catch (whatsappError) {
                    await this.log(`❌ Erro ao enviar WhatsApp: ${whatsappError.message}`, 'ERROR');
                }
            }

            // Enviar para webhook externo se configurado
            if (this.config.notifications.webhookUrl) {
                try {
                    await axios.post(this.config.notifications.webhookUrl, {
                        alert,
                        timestamp: new Date().toISOString(),
                        source: 'n8n_alert_system'
                    });

                    notification.channels.push('webhook');
                    await this.log('🔗 Notificação webhook enviada');

                } catch (webhookError) {
                    await this.log(`❌ Erro ao enviar webhook: ${webhookError.message}`, 'ERROR');
                }
            }

            // Notificação desktop (simulada)
            if (this.config.notifications.enableDesktop) {
                console.log(`\n🚨 NOTIFICAÇÃO DESKTOP 🚨`);
                console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);
                console.log(`Ação: ${alert.action}`);
                console.log(`Horário: ${new Date().toLocaleString('pt-BR')}\n`);

                notification.channels.push('desktop');
            }

            // Ativar cooldown
            this.state.notifications.cooldownActive = true;
            this.state.notifications.lastNotification = new Date().toISOString();
            this.state.notifications.sent.push(notification);

            setTimeout(() => {
                this.state.notifications.cooldownActive = false;
            }, this.config.alerts.notificationCooldown);

            await this.log(`📢 Notificação enviada via: ${notification.channels.join(', ')}`);
            return { sent: true, channels: notification.channels, id: notification.id };

        } catch (error) {
            await this.log(`❌ Erro ao enviar notificação: ${error.message}`, 'ERROR');
            return { sent: false, error: error.message };
        }
    }

    async acknowledgeAlert(alertId) {
        const alert = this.state.alerts.find(a => a.id === alertId);
        if (!alert) {
            return { success: false, error: 'Alert not found' };
        }

        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();

        await this.log(`✅ Alerta reconhecido: ${alertId}`);
        await this.saveData();

        return { success: true, alert };
    }

    async resolveAlert(alertId) {
        const alert = this.state.alerts.find(a => a.id === alertId);
        if (!alert) {
            return { success: false, error: 'Alert not found' };
        }

        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();

        await this.log(`✅ Alerta resolvido: ${alertId}`);
        await this.saveData();

        // Criar alerta de recuperação se foi crítico
        if (alert.severity === 'critical') {
            await this.createAlert('RECOVERY_SUCCESS', {
                originalAlert: alertId,
                originalType: alert.type
            });
        }

        return { success: true, alert };
    }

    async startMonitoring() {
        await this.log('🚀 Iniciando sistema de alertas N8N...');
        await this.loadData();

        // Primeira verificação
        await this.performHealthCheck();

        // Monitoramento contínuo
        const monitoringInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                await this.log(`❌ Erro no ciclo de monitoramento: ${error.message}`, 'ERROR');
            }
        }, this.config.alerts.checkInterval);

        // Limpeza de alertas antigos (diária)
        setInterval(() => {
            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            this.state.alerts = this.state.alerts.filter(alert =>
                new Date(alert.timestamp).getTime() > oneDayAgo
            );
        }, 24 * 60 * 60 * 1000);

        await this.log('✅ Sistema de alertas ativo');

        return {
            status: 'active',
            checkInterval: this.config.alerts.checkInterval,
            monitoring: true
        };
    }

    async getAlertsDashboard() {
        const recentAlerts = this.state.alerts.slice(-20);
        const criticalAlerts = this.state.alerts.filter(a => a.severity === 'critical' && !a.resolved);
        const unacknowledgedAlerts = this.state.alerts.filter(a => !a.acknowledged && !a.resolved);

        const uptimeHours = (Date.now() - this.state.metrics.uptimeStart.getTime()) / 1000 / 60 / 60;
        const errorRate = this.state.metrics.totalChecks > 0 ?
            (this.state.metrics.totalFailures / this.state.metrics.totalChecks * 100).toFixed(2) : 0;

        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalAlerts: this.state.alerts.length,
                criticalAlerts: criticalAlerts.length,
                unacknowledgedAlerts: unacknowledgedAlerts.length,
                recentAlerts: recentAlerts.length
            },
            metrics: {
                uptime: uptimeHours,
                totalChecks: this.state.metrics.totalChecks,
                totalFailures: this.state.metrics.totalFailures,
                consecutiveFailures: this.state.metrics.consecutiveFailures,
                errorRate: `${errorRate}%`,
                avgResponseTime: `${Math.round(this.state.metrics.avgResponseTime)}ms`
            },
            services: this.state.services,
            recentAlerts: recentAlerts.map(alert => ({
                id: alert.id,
                type: alert.type,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp,
                acknowledged: alert.acknowledged,
                resolved: alert.resolved
            })),
            notifications: {
                sent: this.state.notifications.sent.length,
                lastNotification: this.state.notifications.lastNotification,
                cooldownActive: this.state.notifications.cooldownActive
            }
        };
    }
}

// Execução principal
async function main() {
    const alertSystem = new N8nAlertSystem();

    try {
        const comando = process.argv[2] || 'start';

        switch (comando) {
            case 'start':
                console.log('🚀 Iniciando sistema de alertas...');
                const result = await alertSystem.startMonitoring();
                console.log('📊 Sistema ativo:', result);

                // Manter processo vivo
                process.on('SIGINT', async () => {
                    await alertSystem.log('📴 Sistema de alertas sendo finalizado...');
                    await alertSystem.saveData();
                    process.exit(0);
                });
                break;

            case 'check':
                console.log('🔍 Executando verificação única...');
                const healthResult = await alertSystem.performHealthCheck();
                console.log('📊 Resultado:', healthResult);
                break;

            case 'dashboard':
                console.log('📊 Dashboard de alertas...');
                await alertSystem.loadData();
                const dashboard = await alertSystem.getAlertsDashboard();
                console.log(JSON.stringify(dashboard, null, 2));
                break;

            case 'test-alert':
                console.log('🧪 Criando alerta de teste...');
                await alertSystem.loadData();
                const testAlert = await alertSystem.createAlert('WORKFLOW_DOWN', {
                    test: true,
                    message: 'Alerta de teste do sistema'
                });
                console.log('📊 Alerta criado:', testAlert);
                break;

            case 'acknowledge':
                const alertId = process.argv[3];
                if (!alertId) {
                    console.log('❌ ID do alerta é obrigatório');
                    process.exit(1);
                }
                await alertSystem.loadData();
                const ackResult = await alertSystem.acknowledgeAlert(alertId);
                console.log('📊 Resultado:', ackResult);
                break;

            default:
                console.log('ℹ️ Comandos disponíveis:');
                console.log('  start        - Iniciar monitoramento');
                console.log('  check        - Verificação única');
                console.log('  dashboard    - Dashboard de alertas');
                console.log('  test-alert   - Criar alerta de teste');
                console.log('  acknowledge <id> - Reconhecer alerta');
                break;
        }

    } catch (error) {
        console.error('❌ Erro no sistema de alertas:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = N8nAlertSystem;