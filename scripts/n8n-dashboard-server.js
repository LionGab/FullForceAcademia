// N8N Dashboard Server - Servidor web para dashboard em tempo real
// Sistema de monitoramento web integrado

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

// Importar sistemas de monitoramento
const N8nWorkflowMonitor = require('./n8n-workflow-monitor');
const N8nAutoActivator = require('./n8n-auto-activator');
const N8nFallbackSystem = require('./n8n-fallback-system');
const N8nAlertSystem = require('./n8n-alert-system');

class N8nDashboardServer {
    constructor(port = 3002) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Inicializar sistemas de monitoramento
        this.monitor = new N8nWorkflowMonitor();
        this.activator = new N8nAutoActivator();
        this.fallbackSystem = new N8nFallbackSystem();
        this.alertSystem = new N8nAlertSystem();

        this.connectedClients = 0;
        this.dashboardData = {};
        this.isMonitoring = false;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname)));

        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Servir dashboard principal
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'n8n-dashboard.html'));
        });

        // API Routes
        this.app.get('/api/status', async (req, res) => {
            try {
                const status = await this.getDashboardData();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/activate-workflow', async (req, res) => {
            try {
                console.log('🔧 API: Tentativa de ativação de workflow...');
                const result = await this.activator.executeActivationAttempt();

                this.broadcastToClients('workflow-activation-result', result);

                res.json({
                    success: true,
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Erro na ativação via API:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.app.post('/api/test-connectivity', async (req, res) => {
            try {
                console.log('🧪 API: Teste de conectividade...');
                const result = await this.monitor.testWorkflowConnectivity();

                this.broadcastToClients('connectivity-test-result', result);

                res.json({
                    success: true,
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Erro no teste de conectividade:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.app.post('/api/emergency-fallback', async (req, res) => {
            try {
                console.log('🚨 API: Ativação de fallback emergencial...');
                const result = await this.fallbackSystem.attemptRecovery();

                this.broadcastToClients('emergency-fallback-result', result);

                res.json({
                    success: true,
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Erro no fallback emergencial:', error);
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.app.get('/api/logs', async (req, res) => {
            try {
                const logs = await this.getSystemLogs();
                res.json({
                    success: true,
                    logs,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/alerts', async (req, res) => {
            try {
                const alerts = await this.alertSystem.getAlertsDashboard();
                res.json({
                    success: true,
                    alerts,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/acknowledge-alert/:alertId', async (req, res) => {
            try {
                const { alertId } = req.params;
                const result = await this.alertSystem.acknowledgeAlert(alertId);

                this.broadcastToClients('alert-acknowledged', { alertId, result });

                res.json({
                    success: true,
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'n8n-dashboard-server',
                uptime: process.uptime(),
                connectedClients: this.connectedClients,
                monitoring: this.isMonitoring,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.connectedClients++;
            console.log(`📱 Cliente conectado. Total: ${this.connectedClients}`);

            // Enviar dados iniciais
            this.sendInitialData(socket);

            // Handlers de eventos
            socket.on('request-dashboard-data', async () => {
                try {
                    const data = await this.getDashboardData();
                    socket.emit('dashboard-data', data);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('activate-workflow', async () => {
                try {
                    const result = await this.activator.executeActivationAttempt();
                    this.broadcastToClients('workflow-activation-result', result);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('test-connectivity', async () => {
                try {
                    const result = await this.monitor.testWorkflowConnectivity();
                    this.broadcastToClients('connectivity-test-result', result);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('emergency-fallback', async () => {
                try {
                    const result = await this.fallbackSystem.attemptRecovery();
                    this.broadcastToClients('emergency-fallback-result', result);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                this.connectedClients--;
                console.log(`📱 Cliente desconectado. Total: ${this.connectedClients}`);
            });
        });
    }

    async sendInitialData(socket) {
        try {
            const data = await this.getDashboardData();
            socket.emit('dashboard-data', data);
        } catch (error) {
            socket.emit('error', { message: 'Erro ao carregar dados iniciais' });
        }
    }

    broadcastToClients(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    async getDashboardData() {
        try {
            // Coletar dados de todos os sistemas
            const [
                monitorStatus,
                activatorStatus,
                fallbackStatus,
                alertsDashboard
            ] = await Promise.allSettled([
                this.monitor.getStatus(),
                this.activator.getDetailedStatus(),
                this.fallbackSystem.getSystemStatus(),
                this.alertSystem.getAlertsDashboard()
            ]);

            // Agregar dados
            const dashboardData = {
                timestamp: new Date().toISOString(),
                server: {
                    uptime: process.uptime(),
                    connectedClients: this.connectedClients,
                    monitoring: this.isMonitoring
                },
                monitor: monitorStatus.status === 'fulfilled' ? monitorStatus.value : { error: monitorStatus.reason },
                activator: activatorStatus.status === 'fulfilled' ? activatorStatus.value : { error: activatorStatus.reason },
                fallback: fallbackStatus.status === 'fulfilled' ? fallbackStatus.value : { error: fallbackStatus.reason },
                alerts: alertsDashboard.status === 'fulfilled' ? alertsDashboard.value : { error: alertsDashboard.reason }
            };

            this.dashboardData = dashboardData;
            return dashboardData;

        } catch (error) {
            console.error('❌ Erro ao coletar dados do dashboard:', error);
            return {
                timestamp: new Date().toISOString(),
                error: error.message,
                server: {
                    uptime: process.uptime(),
                    connectedClients: this.connectedClients,
                    monitoring: this.isMonitoring
                }
            };
        }
    }

    async getSystemLogs() {
        try {
            const logFiles = [
                path.join(__dirname, '..', 'logs', 'n8n-monitor.log'),
                path.join(__dirname, '..', 'logs', 'n8n-activator.log'),
                path.join(__dirname, '..', 'logs', 'n8n-fallback.log'),
                path.join(__dirname, '..', 'logs', 'n8n-alerts.log')
            ];

            const logs = [];

            for (const logFile of logFiles) {
                try {
                    const content = await fs.readFile(logFile, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());

                    // Pegar as últimas 50 linhas de cada arquivo
                    const recentLines = lines.slice(-50);
                    logs.push(...recentLines);
                } catch (fileError) {
                    // Arquivo pode não existir ainda
                    console.log(`Log file not found: ${logFile}`);
                }
            }

            // Ordenar logs por timestamp e pegar os mais recentes
            const sortedLogs = logs
                .map(line => {
                    const timestampMatch = line.match(/\[([\d-T:.]+)\]/);
                    return {
                        line,
                        timestamp: timestampMatch ? new Date(timestampMatch[1]) : new Date(0)
                    };
                })
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 100)
                .map(item => item.line);

            return sortedLogs;

        } catch (error) {
            console.error('❌ Erro ao ler logs:', error);
            return [`[ERROR] Erro ao carregar logs: ${error.message}`];
        }
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoramento já está ativo');
            return;
        }

        console.log('🚀 Iniciando monitoramento integrado...');
        this.isMonitoring = true;

        try {
            // Inicializar sistemas em paralelo
            await Promise.allSettled([
                this.fallbackSystem.startFallbackSystem(),
                this.alertSystem.startMonitoring()
            ]);

            // Atualização periódica do dashboard
            setInterval(async () => {
                try {
                    const data = await this.getDashboardData();
                    this.broadcastToClients('dashboard-update', data);
                } catch (error) {
                    console.error('❌ Erro na atualização periódica:', error);
                }
            }, 30000); // 30 segundos

            console.log('✅ Monitoramento integrado ativo');

        } catch (error) {
            console.error('❌ Erro ao iniciar monitoramento:', error);
            this.isMonitoring = false;
            throw error;
        }
    }

    async start() {
        try {
            // Iniciar servidor HTTP
            this.server.listen(this.port, () => {
                console.log('\n🎯 FFMATUPA N8N DASHBOARD SERVER');
                console.log('================================');
                console.log(`🌐 Servidor rodando em: http://localhost:${this.port}`);
                console.log(`📊 Dashboard disponível em: http://localhost:${this.port}`);
                console.log(`🔗 API base URL: http://localhost:${this.port}/api`);
                console.log(`💻 WebSocket conectado para atualizações em tempo real`);
                console.log('================================\n');
            });

            // Iniciar monitoramento
            await this.startMonitoring();

            // Graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n📴 Finalizando dashboard server...');
                this.server.close(() => {
                    console.log('✅ Dashboard server finalizado');
                    process.exit(0);
                });
            });

            return {
                status: 'started',
                port: this.port,
                url: `http://localhost:${this.port}`,
                monitoring: this.isMonitoring
            };

        } catch (error) {
            console.error('❌ Erro ao iniciar dashboard server:', error);
            throw error;
        }
    }

    stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('📴 Dashboard server parado');
                resolve();
            });
        });
    }
}

// Execução principal
async function main() {
    const server = new N8nDashboardServer(3002);

    try {
        const comando = process.argv[2] || 'start';

        switch (comando) {
            case 'start':
                console.log('🚀 Iniciando dashboard server...');
                await server.start();
                break;

            case 'test':
                console.log('🧪 Testando dashboard server...');
                const result = await server.start();
                console.log('📊 Resultado:', result);

                // Parar após 10 segundos para teste
                setTimeout(() => {
                    server.stop();
                }, 10000);
                break;

            default:
                console.log('ℹ️ Comandos disponíveis:');
                console.log('  start - Iniciar dashboard server');
                console.log('  test  - Teste do dashboard server');
                break;
        }

    } catch (error) {
        console.error('❌ Erro no dashboard server:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = N8nDashboardServer;