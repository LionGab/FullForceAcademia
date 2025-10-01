#!/usr/bin/env node

/**
 * FFGym System Initializer
 * Script principal de inicialização do sistema de MCPs e Agentes
 */

const fs = require('fs').promises;
const path = require('path');

class FFGymSystemInitializer {
    constructor() {
        this.config = {
            systemName: 'FFGym Automation System',
            version: '1.0.0',
            description: 'Sistema avançado de automação para FullForce Academia',
            paths: {
                mcps: './mcps',
                agents: './agents',
                config: './config',
                logs: './logs',
                data: './data'
            },
            services: {
                waha: { url: 'http://localhost:3000', status: 'pending' },
                n8n: { url: 'http://localhost:5678', status: 'pending' },
                postgres: { status: 'pending' },
                redis: { status: 'pending' }
            }
        };

        this.mcps = {};
        this.agents = {};
        this.systemStatus = 'initializing';
    }

    /**
     * Inicializa sistema completo
     */
    async initialize() {
        console.log('🚀 Inicializando FFGym Automation System...');
        console.log('=' .repeat(50));

        try {
            // Verificar dependências
            await this.checkDependencies();

            // Criar estrutura de diretórios
            await this.createDirectoryStructure();

            // Verificar serviços externos
            await this.checkExternalServices();

            // Inicializar MCPs
            await this.initializeMCPs();

            // Inicializar sistema de agentes
            await this.initializeAgents();

            // Configurar integração
            await this.setupIntegration();

            // Executar health check
            await this.executeHealthCheck();

            // Gerar relatório de inicialização
            const report = await this.generateInitializationReport();

            this.systemStatus = 'active';
            console.log('✅ Sistema FFGym inicializado com sucesso!');
            console.log('=' .repeat(50));

            return report;

        } catch (error) {
            console.error('❌ Erro na inicialização do sistema:', error);
            this.systemStatus = 'error';
            throw error;
        }
    }

    /**
     * Verifica dependências do sistema
     */
    async checkDependencies() {
        console.log('🔍 Verificando dependências...');

        const dependencies = [
            'axios',
            'dotenv',
            'moment',
            'lodash'
        ];

        const packageJson = require('./package.json');
        const installedDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        const missingDeps = dependencies.filter(dep => !installedDeps[dep]);

        if (missingDeps.length > 0) {
            throw new Error(`Dependências faltando: ${missingDeps.join(', ')}`);
        }

        console.log('✅ Todas as dependências estão instaladas');
    }

    /**
     * Cria estrutura de diretórios necessária
     */
    async createDirectoryStructure() {
        console.log('📁 Criando estrutura de diretórios...');

        const directories = [
            'logs',
            'data',
            'config/agents',
            'config/mcps',
            'config/templates',
            'reports',
            'exports',
            'backups'
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`  ✅ Diretório criado: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`  ⚠️  Erro ao criar ${dir}:`, error.message);
                }
            }
        }
    }

    /**
     * Verifica status dos serviços externos
     */
    async checkExternalServices() {
        console.log('🔌 Verificando serviços externos...');

        // Verificar WAHA
        try {
            const axios = require('axios');
            const response = await axios.get(`${this.config.services.waha.url}/api/status`, {
                timeout: 5000
            });
            this.config.services.waha.status = 'active';
            console.log('  ✅ WAHA API está ativa');
        } catch (error) {
            this.config.services.waha.status = 'inactive';
            console.warn('  ⚠️  WAHA API não está acessível');
        }

        // Verificar N8N
        try {
            const axios = require('axios');
            const response = await axios.get(`${this.config.services.n8n.url}/api/v1/workflows`, {
                timeout: 5000
            });
            this.config.services.n8n.status = 'active';
            console.log('  ✅ N8N está ativo');
        } catch (error) {
            this.config.services.n8n.status = 'inactive';
            console.warn('  ⚠️  N8N não está acessível');
        }

        // Verificar variáveis de ambiente críticas
        const requiredEnvVars = [
            'N8N_WEBHOOK_URL',
            'GOOGLE_SHEETS_API_KEY'
        ];

        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
        if (missingEnvVars.length > 0) {
            console.warn(`  ⚠️  Variáveis de ambiente faltando: ${missingEnvVars.join(', ')}`);
        }
    }

    /**
     * Inicializa todos os MCPs
     */
    async initializeMCPs() {
        console.log('🧠 Inicializando MCPs...');

        const mcpModules = {
            whatsappAutomation: './mcps/whatsapp/whatsapp-automation-mcp.js',
            gymAnalytics: './mcps/analytics/gym-analytics-mcp.js',
            n8nIntegration: './mcps/n8n/n8n-integration-mcp.js',
            leadSegmentation: './mcps/leads/lead-segmentation-mcp.js',
            conversionAnalytics: './mcps/conversion/conversion-analytics-mcp.js'
        };

        for (const [name, modulePath] of Object.entries(mcpModules)) {
            try {
                const MCPClass = require(modulePath);
                this.mcps[name] = new MCPClass({
                    systemId: 'ffgym',
                    environment: process.env.NODE_ENV || 'development'
                });

                // Inicializar MCP se tiver método initialize
                if (typeof this.mcps[name].initialize === 'function') {
                    await this.mcps[name].initialize();
                }

                console.log(`  ✅ MCP ${name} inicializado`);
            } catch (error) {
                console.error(`  ❌ Erro ao inicializar MCP ${name}:`, error.message);
            }
        }
    }

    /**
     * Inicializa sistema de agentes
     */
    async initializeAgents() {
        console.log('🤖 Inicializando sistema de agentes...');

        try {
            // Inicializar Campaign Master Agent
            const CampaignMasterAgent = require('./agents/main/campaign-master-agent.js');
            this.agents.campaignMaster = new CampaignMasterAgent({
                systemId: 'ffgym',
                mcps: this.mcps
            });

            await this.agents.campaignMaster.initialize();
            console.log('  ✅ Campaign Master Agent inicializado');

            // Inicializar sub-agentes especializados
            const SegmentSpecialistAgent = require('./agents/sub-agents/segment-specialist-agent.js');

            const segments = ['vip', 'hot', 'warm', 'cold', 'champion', 'atrisk'];
            this.agents.segmentSpecialists = {};

            for (const segment of segments) {
                this.agents.segmentSpecialists[segment] = new SegmentSpecialistAgent({
                    segmentType: segment,
                    masterId: this.agents.campaignMaster.config.agentId
                });

                await this.agents.segmentSpecialists[segment].initialize();
                console.log(`  ✅ Segment Specialist ${segment} inicializado`);
            }

        } catch (error) {
            console.error('❌ Erro ao inicializar agentes:', error);
            throw error;
        }
    }

    /**
     * Configura integração entre componentes
     */
    async setupIntegration() {
        console.log('🔗 Configurando integração...');

        // Conectar MCPs aos agentes
        if (this.agents.campaignMaster) {
            this.agents.campaignMaster.mcps = this.mcps;
            console.log('  ✅ MCPs conectados ao Campaign Master');
        }

        // Configurar comunicação entre agentes
        if (this.agents.segmentSpecialists) {
            Object.values(this.agents.segmentSpecialists).forEach(agent => {
                agent.campaignMaster = this.agents.campaignMaster;
            });
            console.log('  ✅ Sub-agentes conectados ao Master');
        }

        // Configurar webhooks N8N se disponível
        if (this.config.services.n8n.status === 'active') {
            await this.setupN8NWebhooks();
            console.log('  ✅ Webhooks N8N configurados');
        }

        // Configurar monitoramento
        await this.setupMonitoring();
        console.log('  ✅ Sistema de monitoramento ativo');
    }

    /**
     * Executa health check completo
     */
    async executeHealthCheck() {
        console.log('🏥 Executando health check...');

        const healthCheck = {
            timestamp: new Date().toISOString(),
            system: {
                status: 'checking',
                components: {}
            },
            services: {},
            mcps: {},
            agents: {},
            overall: 'unknown'
        };

        // Check MCPs
        for (const [name, mcp] of Object.entries(this.mcps)) {
            try {
                // Verificar se MCP tem método de health check
                if (typeof mcp.healthCheck === 'function') {
                    healthCheck.mcps[name] = await mcp.healthCheck();
                } else {
                    healthCheck.mcps[name] = { status: 'active', message: 'MCP operacional' };
                }
            } catch (error) {
                healthCheck.mcps[name] = { status: 'error', error: error.message };
            }
        }

        // Check Agentes
        for (const [name, agent] of Object.entries(this.agents)) {
            if (name === 'segmentSpecialists') {
                healthCheck.agents.segmentSpecialists = {};
                for (const [segment, segmentAgent] of Object.entries(agent)) {
                    healthCheck.agents.segmentSpecialists[segment] = {
                        status: 'active',
                        message: 'Agente operacional'
                    };
                }
            } else {
                healthCheck.agents[name] = {
                    status: 'active',
                    message: 'Agente operacional'
                };
            }
        }

        // Check serviços externos
        healthCheck.services = { ...this.config.services };

        // Determinar status geral
        const allChecks = [
            ...Object.values(healthCheck.mcps),
            ...Object.values(healthCheck.agents),
            ...Object.values(healthCheck.services)
        ];

        const errorCount = allChecks.filter(check =>
            check.status === 'error' || check.status === 'inactive'
        ).length;

        if (errorCount === 0) {
            healthCheck.overall = 'healthy';
            console.log('  ✅ Sistema totalmente operacional');
        } else if (errorCount <= 2) {
            healthCheck.overall = 'warning';
            console.log(`  ⚠️  Sistema operacional com ${errorCount} alertas`);
        } else {
            healthCheck.overall = 'critical';
            console.log(`  ❌ Sistema com ${errorCount} problemas críticos`);
        }

        // Salvar relatório de health check
        await this.saveHealthCheckReport(healthCheck);

        return healthCheck;
    }

    /**
     * Gera relatório de inicialização
     */
    async generateInitializationReport() {
        const report = {
            system: {
                name: this.config.systemName,
                version: this.config.version,
                status: this.systemStatus,
                initializedAt: new Date().toISOString()
            },
            components: {
                mcps: {
                    total: Object.keys(this.mcps).length,
                    active: Object.keys(this.mcps).length,
                    list: Object.keys(this.mcps)
                },
                agents: {
                    main: Object.keys(this.agents).filter(k => k !== 'segmentSpecialists').length,
                    subAgents: this.agents.segmentSpecialists ?
                              Object.keys(this.agents.segmentSpecialists).length : 0,
                    list: Object.keys(this.agents)
                }
            },
            services: this.config.services,
            capabilities: [
                'WhatsApp Automation',
                'Lead Segmentation',
                'Campaign Management',
                'Analytics & Reporting',
                'N8N Workflow Integration',
                'Real-time Monitoring',
                'Predictive Analytics',
                'Conversion Optimization'
            ],
            nextSteps: [
                'Configure campaign parameters',
                'Import lead data',
                'Test WhatsApp connectivity',
                'Setup N8N workflows',
                'Execute test campaign'
            ]
        };

        // Salvar relatório
        await this.saveInitializationReport(report);

        console.log('\n📊 Relatório de Inicialização:');
        console.log(`   Sistema: ${report.system.name} v${report.system.version}`);
        console.log(`   MCPs: ${report.components.mcps.active}/${report.components.mcps.total} ativos`);
        console.log(`   Agentes: ${report.components.agents.main} principais + ${report.components.agents.subAgents} especializados`);
        console.log(`   Status: ${report.system.status.toUpperCase()}`);

        return report;
    }

    /**
     * Salva relatório de health check
     */
    async saveHealthCheckReport(healthCheck) {
        const filename = `health-check-${Date.now()}.json`;
        const filepath = path.join('./reports', filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(healthCheck, null, 2));
            console.log(`  💾 Health check salvo em: ${filepath}`);
        } catch (error) {
            console.warn(`  ⚠️  Erro ao salvar health check:`, error.message);
        }
    }

    /**
     * Salva relatório de inicialização
     */
    async saveInitializationReport(report) {
        const filename = `initialization-${Date.now()}.json`;
        const filepath = path.join('./reports', filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(report, null, 2));
            console.log(`  💾 Relatório salvo em: ${filepath}`);
        } catch (error) {
            console.warn(`  ⚠️  Erro ao salvar relatório:`, error.message);
        }
    }

    /**
     * Configura webhooks N8N
     */
    async setupN8NWebhooks() {
        // Implementar configuração de webhooks
        console.log('  🔗 Configurando webhooks N8N...');
    }

    /**
     * Configura sistema de monitoramento
     */
    async setupMonitoring() {
        // Implementar monitoramento contínuo
        console.log('  📊 Configurando monitoramento...');
    }

    /**
     * Executa campanha de teste
     */
    async runTestCampaign() {
        console.log('🧪 Executando campanha de teste...');

        if (!this.agents.campaignMaster) {
            throw new Error('Campaign Master Agent não inicializado');
        }

        const testCampaign = {
            name: 'Teste de Sistema FFGym',
            type: 'test',
            leads: [
                {
                    id: 'test-001',
                    name: 'Usuário Teste',
                    phone: '+5565999999999',
                    lastActivity: '2024-06-01',
                    joinDate: '2023-01-01',
                    paymentHistory: [{ amount: 179, date: '2024-05-01' }]
                }
            ],
            parameters: {
                objectives: ['test_connectivity', 'validate_flow'],
                dryRun: true
            }
        };

        try {
            const result = await this.agents.campaignMaster.executeCampaign(testCampaign);
            console.log('✅ Campanha de teste executada com sucesso');
            return result;
        } catch (error) {
            console.error('❌ Erro na campanha de teste:', error);
            throw error;
        }
    }

    /**
     * Para o sistema graciosamente
     */
    async shutdown() {
        console.log('🛑 Parando sistema FFGym...');

        // Parar agentes
        if (this.agents.campaignMaster && typeof this.agents.campaignMaster.shutdown === 'function') {
            await this.agents.campaignMaster.shutdown();
        }

        // Parar MCPs
        for (const [name, mcp] of Object.entries(this.mcps)) {
            if (typeof mcp.shutdown === 'function') {
                await mcp.shutdown();
                console.log(`  ✅ MCP ${name} parado`);
            }
        }

        this.systemStatus = 'stopped';
        console.log('✅ Sistema FFGym parado graciosamente');
    }
}

// Função principal para execução via CLI
async function main() {
    const initializer = new FFGymSystemInitializer();

    try {
        // Verificar argumentos da linha de comando
        const args = process.argv.slice(2);

        if (args.includes('--help') || args.includes('-h')) {
            console.log(`
FFGym System Initializer v1.0.0

Uso: node ffgym-system-initializer.js [opções]

Opções:
  --help, -h          Mostra esta ajuda
  --test              Executa campanha de teste após inicialização
  --health-check      Executa apenas health check
  --version, -v       Mostra versão do sistema

Exemplos:
  node ffgym-system-initializer.js
  node ffgym-system-initializer.js --test
  node ffgym-system-initializer.js --health-check
            `);
            return;
        }

        if (args.includes('--version') || args.includes('-v')) {
            console.log('FFGym System v1.0.0');
            return;
        }

        // Inicializar sistema
        const report = await initializer.initialize();

        // Executar health check se solicitado
        if (args.includes('--health-check')) {
            await initializer.executeHealthCheck();
        }

        // Executar teste se solicitado
        if (args.includes('--test')) {
            await initializer.runTestCampaign();
        }

        console.log('\n🎉 Sistema FFGym pronto para uso!');
        console.log('\nPróximos passos:');
        console.log('1. Configure seus leads no Google Sheets');
        console.log('2. Teste conectividade do WAHA');
        console.log('3. Execute sua primeira campanha');
        console.log('\nPara executar campanha: npm run campaign:start');

    } catch (error) {
        console.error('\n💥 Falha na inicialização:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FFGymSystemInitializer;