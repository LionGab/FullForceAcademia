#!/usr/bin/env node

/**
 * WHATSAPP MASTER SYSTEM - FullForce Academia
 * Sistema completo integrado: AutoConnect + N8N + Dashboard + Self-Test
 * ROI Alvo: 2250%-3750% | 650 alunos inativos
 */

const express = require('express');
const cors = require('cors');
const AutoConnectSystem = require('./auto-connect-system');
const N8NService = require('./services/n8n-service');
const DatabaseService = require('./services/database');
require('dotenv').config();

class WhatsAppMasterSystem {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;

        this.autoConnect = null;
        this.n8nService = null;
        this.databaseService = null;

        this.stats = {
            startTime: new Date(),
            systemVersion: '1.0.0',
            campaignTarget: 650,
            roiTarget: '2250%-3750%',
            systemStatus: 'INITIALIZING'
        };

        this.setupExpress();
        this.initialize();
    }

    setupExpress() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));

        // Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Dashboard principal
        this.app.get('/', this.renderDashboard.bind(this));

        // API Routes
        this.app.get('/api/health', this.getHealth.bind(this));
        this.app.get('/api/status', this.getSystemStatus.bind(this));
        this.app.get('/api/stats', this.getStats.bind(this));

        // WhatsApp Routes
        this.app.post('/api/send/message', this.sendMessage.bind(this));
        this.app.post('/api/send/baileys', this.sendBaileys.bind(this));
        this.app.post('/api/send/waha', this.sendWAHA.bind(this));

        // Campaign Routes
        this.app.post('/api/campaign/650/trigger', this.triggerCampaign650.bind(this));
        this.app.get('/api/campaign/650/status', this.getCampaign650Status.bind(this));

        // N8N Routes
        this.app.get('/api/n8n/workflows', this.getN8NWorkflows.bind(this));
        this.app.post('/api/n8n/workflows/:id/activate', this.activateN8NWorkflow.bind(this));
        this.app.post('/api/n8n/activate-all', this.activateAllN8NWorkflows.bind(this));

        // System Control
        this.app.post('/api/system/self-test', this.performSelfTest.bind(this));
        this.app.post('/api/system/reconnect', this.forceReconnect.bind(this));

        // WAHA Webhook
        this.app.post('/webhook/waha', this.handleWAHAWebhook.bind(this));

        // Error handler
        this.app.use(this.errorHandler.bind(this));
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando WhatsApp Master System...');
            this.stats.systemStatus = 'INITIALIZING';

            // Inicializar serviços
            this.databaseService = new DatabaseService();
            await this.databaseService.initialize();

            this.n8nService = new N8NService();

            this.autoConnect = new AutoConnectSystem();

            // Ativar workflows N8N
            await this.activateAllN8NWorkflows();

            this.stats.systemStatus = 'READY';
            console.log('✅ WhatsApp Master System pronto!');

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.stats.systemStatus = 'ERROR';
            this.stats.lastError = error.message;
        }
    }

    renderDashboard(req, res) {
        const dashboardHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FullForce Academia - WhatsApp System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card {
            background: rgba(255,255,255,0.15);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .status-card h3 {
            margin-bottom: 15px;
            color: #fff;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            padding-bottom: 10px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
        }
        .status-green { color: #4CAF50; font-weight: bold; }
        .status-red { color: #f44336; font-weight: bold; }
        .status-yellow { color: #ffeb3b; font-weight: bold; }
        .campaign-card {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .campaign-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        .buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
            margin: 20px 0;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .btn-primary { background: #2196F3; }
        .btn-success { background: #4CAF50; }
        .btn-warning { background: #ff9800; }
        .btn-danger { background: #f44336; }
        .footer {
            text-align: center;
            margin-top: 30px;
            opacity: 0.8;
        }
        .auto-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9em;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .loading { animation: pulse 2s infinite; }
    </style>
    <script>
        let systemData = {};

        async function loadSystemStatus() {
            try {
                const response = await fetch('/api/status');
                systemData = await response.json();
                updateDashboard();
            } catch (error) {
                console.error('Erro ao carregar status:', error);
            }
        }

        function updateDashboard() {
            // Atualizar indicadores de status
            updateStatusIndicator('baileys-status', systemData.baileys);
            updateStatusIndicator('waha-status', systemData.waha);
            updateStatusIndicator('n8n-status', systemData.n8n);
            updateStatusIndicator('database-status', systemData.database);

            // Atualizar stats
            document.getElementById('messages-processed').textContent = systemData.stats?.messagesProcessed || 0;
            document.getElementById('campaigns-sent').textContent = systemData.stats?.campaignsSent || 0;
            document.getElementById('uptime').textContent = formatUptime(systemData.stats?.startTime);
        }

        function updateStatusIndicator(elementId, status) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = status ? '✅ Conectado' : '❌ Desconectado';
                element.className = status ? 'status-green' : 'status-red';
            }
        }

        function formatUptime(startTime) {
            if (!startTime) return 'N/A';
            const diff = Date.now() - new Date(startTime).getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return hours + 'h ' + minutes + 'm';
        }

        async function triggerCampaign() {
            const btn = document.getElementById('campaign-btn');
            btn.textContent = 'Enviando...';
            btn.disabled = true;

            try {
                const response = await fetch('/api/campaign/650/trigger', { method: 'POST' });
                const result = await response.json();

                if (result.success) {
                    alert('🚀 Campanha 650 iniciada com sucesso!');
                } else {
                    alert('❌ Erro: ' + result.error);
                }
            } catch (error) {
                alert('❌ Erro na comunicação: ' + error.message);
            }

            btn.textContent = '🚀 Iniciar Campanha 650';
            btn.disabled = false;
        }

        async function activateN8N() {
            try {
                const response = await fetch('/api/n8n/activate-all', { method: 'POST' });
                const result = await response.json();
                alert(result.success ? '✅ N8N ativado!' : '❌ Erro: ' + result.error);
                loadSystemStatus();
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        async function performSelfTest() {
            try {
                const response = await fetch('/api/system/self-test', { method: 'POST' });
                const result = await response.json();
                alert(result.success ? '✅ Self-test concluído!' : '❌ Self-test falhou: ' + result.error);
            } catch (error) {
                alert('❌ Erro: ' + error.message);
            }
        }

        // Auto-refresh a cada 10 segundos
        setInterval(loadSystemStatus, 10000);
        loadSystemStatus(); // Carregar imediatamente
    </script>
</head>
<body>
    <div class="auto-refresh">🔄 Auto-refresh: 10s</div>

    <div class="container">
        <div class="header">
            <h1>🏋️ FullForce Academia</h1>
            <h2>Sistema WhatsApp Completo</h2>
            <p>🎯 Campanha 650 Alunos | ROI Alvo: 2250%-3750%</p>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <h3>📱 Status dos Serviços</h3>
                <div class="status-item">
                    <span>Baileys (WhatsApp Direct):</span>
                    <span id="baileys-status" class="loading">🔄 Verificando...</span>
                </div>
                <div class="status-item">
                    <span>WAHA (HTTP API):</span>
                    <span id="waha-status" class="loading">🔄 Verificando...</span>
                </div>
                <div class="status-item">
                    <span>N8N (Automação):</span>
                    <span id="n8n-status" class="loading">🔄 Verificando...</span>
                </div>
                <div class="status-item">
                    <span>Database:</span>
                    <span id="database-status" class="loading">🔄 Verificando...</span>
                </div>
            </div>

            <div class="status-card">
                <h3>📊 Estatísticas do Sistema</h3>
                <div class="status-item">
                    <span>Mensagens Processadas:</span>
                    <span id="messages-processed">0</span>
                </div>
                <div class="status-item">
                    <span>Campanhas Enviadas:</span>
                    <span id="campaigns-sent">0</span>
                </div>
                <div class="status-item">
                    <span>Tempo Online:</span>
                    <span id="uptime">0h 0m</span>
                </div>
                <div class="status-item">
                    <span>Versão do Sistema:</span>
                    <span>v1.0.0</span>
                </div>
            </div>
        </div>

        <div class="campaign-card">
            <h2>🚀 Campanha de Reativação 650</h2>
            <p>Sistema pronto para disparar campanha de reativação</p>

            <div class="campaign-stats">
                <div class="stat-item">
                    <span class="stat-number">650</span>
                    <span>Alunos Alvo</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">3750%</span>
                    <span>ROI Máximo</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">R$ 84K</span>
                    <span>Receita Potencial</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">100%</span>
                    <span>Auto-Conectado</span>
                </div>
            </div>

            <div class="buttons">
                <button id="campaign-btn" class="btn btn-success" onclick="triggerCampaign()">
                    🚀 Iniciar Campanha 650
                </button>
                <button class="btn btn-primary" onclick="activateN8N()">
                    🤖 Ativar N8N
                </button>
                <button class="btn btn-warning" onclick="performSelfTest()">
                    🔍 Self-Test
                </button>
                <button class="btn btn-primary" onclick="window.open('/api/health', '_blank')">
                    📊 Health Check
                </button>
            </div>
        </div>

        <div class="footer">
            <p>© 2024 FullForce Academia - Sistema WhatsApp Completo</p>
            <p>Desenvolvido com AutoConnect + N8N + WAHA + Baileys</p>
        </div>
    </div>
</body>
</html>`;

        res.send(dashboardHTML);
    }

    async getHealth(req, res) {
        try {
            const health = {
                timestamp: new Date().toISOString(),
                status: this.stats.systemStatus,
                services: {},
                system: this.stats
            };

            if (this.autoConnect) {
                health.services = await this.autoConnect.getSystemHealth();
            }

            if (this.n8nService) {
                health.services.n8n = await this.n8nService.healthCheck();
            }

            res.json(health);

        } catch (error) {
            res.status(500).json({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async getSystemStatus(req, res) {
        try {
            const status = {
                baileys: false,
                waha: false,
                n8n: false,
                database: false,
                stats: this.stats
            };

            if (this.autoConnect) {
                const health = await this.autoConnect.getSystemHealth();
                status.baileys = health.baileys;
                status.waha = health.waha;
                status.database = health.database;
                status.stats = { ...status.stats, ...health.stats };
            }

            if (this.n8nService) {
                const n8nHealth = await this.n8nService.healthCheck();
                status.n8n = n8nHealth.n8n;
            }

            res.json(status);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = { ...this.stats };

            if (this.autoConnect) {
                const health = await this.autoConnect.getSystemHealth();
                stats.autoConnect = health.stats;
            }

            res.json(stats);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendMessage(req, res) {
        try {
            const { to, message, method = 'auto' } = req.body;

            if (!this.autoConnect) {
                return res.status(503).json({ error: 'AutoConnect não inicializado' });
            }

            const result = await this.autoConnect.sendMessage(to, message, method);
            res.json(result);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendBaileys(req, res) {
        try {
            const { to, message } = req.body;
            const result = await this.autoConnect.sendMessage(to, message, 'baileys');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendWAHA(req, res) {
        try {
            const { to, message } = req.body;
            const result = await this.autoConnect.sendMessage(to, message, 'waha');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async triggerCampaign650(req, res) {
        try {
            if (!this.autoConnect) {
                return res.status(503).json({ error: 'AutoConnect não inicializado' });
            }

            const result = await this.autoConnect.triggerCampaign650();

            // Notificar N8N
            if (this.n8nService && result.success) {
                await this.n8nService.triggerCampaign650({
                    sent: result.sent,
                    timestamp: new Date().toISOString()
                });
            }

            res.json(result);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getCampaign650Status(req, res) {
        try {
            const status = {
                campaign: 'Reativação 650 Alunos',
                target: 650,
                sent: this.stats.campaignsSent || 0,
                roi_target: '2250%-3750%',
                system_ready: this.stats.systemStatus === 'READY'
            };

            res.json(status);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getN8NWorkflows(req, res) {
        try {
            const workflows = await this.n8nService.getWorkflows();
            res.json(workflows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async activateN8NWorkflow(req, res) {
        try {
            const { id } = req.params;
            const result = await this.n8nService.activateWorkflow(id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async activateAllN8NWorkflows(req, res = null) {
        try {
            const result = await this.n8nService.activateCampaignWorkflows();

            if (res) {
                res.json(result);
            }

            return result;

        } catch (error) {
            if (res) {
                res.status(500).json({ error: error.message });
            }
            throw error;
        }
    }

    async performSelfTest(req, res) {
        try {
            if (!this.autoConnect) {
                return res.status(503).json({ error: 'AutoConnect não inicializado' });
            }

            await this.autoConnect.performSelfTest();
            res.json({ success: true, timestamp: new Date().toISOString() });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async forceReconnect(req, res) {
        try {
            if (!this.autoConnect) {
                return res.status(503).json({ error: 'AutoConnect não inicializado' });
            }

            await this.autoConnect.startAutoConnect();
            res.json({ success: true, message: 'Reconexão iniciada' });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async handleWAHAWebhook(req, res) {
        try {
            console.log('📨 WAHA Webhook recebido:', req.body);

            if (this.autoConnect && this.autoConnect.wahaService) {
                const result = await this.autoConnect.wahaService.handleWebhook(req.body);
                res.json(result);
            } else {
                res.json({ status: 'ok', message: 'Webhook processado' });
            }

        } catch (error) {
            console.error('❌ Erro no webhook WAHA:', error);
            res.status(500).json({ error: error.message });
        }
    }

    errorHandler(error, req, res, next) {
        console.error('❌ Erro na API:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }

    async start() {
        try {
            this.app.listen(this.port, () => {
                console.log(`🌐 WhatsApp Master System rodando em http://localhost:${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`💚 Health: http://localhost:${this.port}/api/health`);
                console.log(`🚀 Campanha 650: http://localhost:${this.port}/api/campaign/650/trigger`);
            });

        } catch (error) {
            console.error('❌ Erro ao iniciar servidor:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('🛑 Desligando WhatsApp Master System...');

        if (this.autoConnect) {
            await this.autoConnect.shutdown();
        }

        if (this.databaseService) {
            await this.databaseService.shutdown();
        }

        console.log('✅ WhatsApp Master System desligado');
        process.exit(0);
    }
}

module.exports = WhatsAppMasterSystem;

// Auto-start se executado diretamente
if (require.main === module) {
    const masterSystem = new WhatsAppMasterSystem();

    // Graceful shutdown handlers
    process.on('SIGINT', () => masterSystem.shutdown());
    process.on('SIGTERM', () => masterSystem.shutdown());

    // Iniciar servidor
    masterSystem.start().catch(console.error);
}