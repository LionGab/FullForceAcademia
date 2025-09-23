/**
 * Inicializador de todos os MCPs do sistema FFGym
 * Model Context Protocols initialization
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Importar todos os MCPs
const WhatsAppAutomationMCP = require('./whatsapp/whatsapp-automation-mcp');
const GymAnalyticsMCP = require('./analytics/gym-analytics-mcp');
const N8NIntegrationMCP = require('./n8n/n8n-integration-mcp');
const LeadSegmentationMCP = require('./leads/lead-segmentation-mcp');
const ConversionAnalyticsMCP = require('./conversion/conversion-analytics-mcp');

class MCPInitializer {
    constructor() {
        this.mcps = new Map();
        this.initializationOrder = [
            'whatsappAutomation',
            'gymAnalytics',
            'leadSegmentation',
            'n8nIntegration',
            'conversionAnalytics'
        ];
    }

    async initializeAll() {
        console.log('🧠 Inicializando todos os MCPs...');

        try {
            // Verificar se as dependências estão disponíveis
            await this.checkDependencies();

            // Inicializar MCPs na ordem correta
            for (const mcpName of this.initializationOrder) {
                await this.initializeMCP(mcpName);
            }

            // Configurar conexões entre MCPs
            await this.setupMCPConnections();

            // Verificar status final
            const status = await this.getSystemStatus();

            console.log('✅ Todos os MCPs inicializados com sucesso!');
            console.log(`📊 Status: ${status.active}/${status.total} MCPs ativos`);

            return {
                success: true,
                mcps: this.mcps,
                status
            };

        } catch (error) {
            console.error('❌ Erro na inicialização dos MCPs:', error);
            throw error;
        }
    }

    async initializeMCP(mcpName) {
        try {
            console.log(`  🔄 Inicializando MCP ${mcpName}...`);

            let mcp;
            switch (mcpName) {
                case 'whatsappAutomation':
                    mcp = new WhatsAppAutomationMCP({
                        wahaUrl: process.env.WAHA_URL || 'http://localhost:3000',
                        apiKey: process.env.WAHA_API_KEY,
                        enabled: process.env.MCP_WHATSAPP_ENABLED === 'true'
                    });
                    break;

                case 'gymAnalytics':
                    mcp = new GymAnalyticsMCP({
                        databaseType: process.env.DATABASE_TYPE || 'sqlite',
                        enabled: process.env.MCP_ANALYTICS_ENABLED === 'true'
                    });
                    break;

                case 'leadSegmentation':
                    mcp = new LeadSegmentationMCP({
                        enabled: process.env.MCP_LEADS_ENABLED === 'true'
                    });
                    break;

                case 'n8nIntegration':
                    mcp = new N8NIntegrationMCP({
                        n8nUrl: process.env.N8N_CLOUD_URL,
                        webhookUrl: process.env.N8N_WEBHOOK_URL,
                        enabled: process.env.MCP_N8N_ENABLED === 'true'
                    });
                    break;

                case 'conversionAnalytics':
                    mcp = new ConversionAnalyticsMCP({
                        targetROI: process.env.META_ROI || 3750,
                        enabled: process.env.MCP_CONVERSION_ENABLED === 'true'
                    });
                    break;

                default:
                    throw new Error(`MCP desconhecido: ${mcpName}`);
            }

            // Inicializar o MCP
            await mcp.initialize();

            // Armazenar na coleção
            this.mcps.set(mcpName, mcp);

            console.log(`  ✅ MCP ${mcpName} inicializado`);

        } catch (error) {
            console.error(`  ❌ Erro ao inicializar MCP ${mcpName}:`, error.message);

            // Crear MCP mock se falhar
            this.mcps.set(mcpName, this.createMockMCP(mcpName));
            console.log(`  ⚠️  MCP ${mcpName} inicializado em modo mock`);
        }
    }

    async setupMCPConnections() {
        console.log('🔗 Configurando conexões entre MCPs...');

        try {
            // Conectar WhatsApp MCP com Analytics
            const whatsappMCP = this.mcps.get('whatsappAutomation');
            const analyticsMCP = this.mcps.get('gymAnalytics');

            if (whatsappMCP && analyticsMCP) {
                whatsappMCP.setAnalyticsProvider(analyticsMCP);
                console.log('  ✅ WhatsApp ↔ Analytics conectados');
            }

            // Conectar Lead Segmentation com Conversion Analytics
            const leadsMCP = this.mcps.get('leadSegmentation');
            const conversionMCP = this.mcps.get('conversionAnalytics');

            if (leadsMCP && conversionMCP) {
                leadsMCP.setConversionProvider(conversionMCP);
                console.log('  ✅ Leads ↔ Conversion conectados');
            }

            // Conectar N8N com todos os outros MCPs
            const n8nMCP = this.mcps.get('n8nIntegration');
            if (n8nMCP) {
                for (const [name, mcp] of this.mcps) {
                    if (name !== 'n8nIntegration' && mcp.setN8NProvider) {
                        mcp.setN8NProvider(n8nMCP);
                    }
                }
                console.log('  ✅ N8N conectado a todos os MCPs');
            }

        } catch (error) {
            console.error('❌ Erro ao configurar conexões:', error);
        }
    }

    async checkDependencies() {
        const dependencies = [
            'axios',
            'moment',
            'lodash'
        ];

        for (const dep of dependencies) {
            try {
                require.resolve(dep);
            } catch (error) {
                throw new Error(`Dependência faltando: ${dep}`);
            }
        }
    }

    createMockMCP(mcpName) {
        return {
            name: mcpName,
            status: 'mock',
            initialize: async () => ({ success: true, mode: 'mock' }),
            isEnabled: () => false,
            getMetrics: () => ({ mode: 'mock', active: false }),
            setAnalyticsProvider: () => {},
            setConversionProvider: () => {},
            setN8NProvider: () => {}
        };
    }

    async getSystemStatus() {
        const total = this.mcps.size;
        let active = 0;
        const statuses = {};

        for (const [name, mcp] of this.mcps) {
            try {
                const status = mcp.getStatus ? await mcp.getStatus() : 'unknown';
                statuses[name] = status;

                if (status === 'active' || status === 'ready') {
                    active++;
                }
            } catch (error) {
                statuses[name] = 'error';
            }
        }

        return {
            total,
            active,
            statuses
        };
    }

    getMCP(name) {
        return this.mcps.get(name);
    }

    getAllMCPs() {
        return Array.from(this.mcps.values());
    }

    async shutdownAll() {
        console.log('⏹️  Desligando todos os MCPs...');

        for (const [name, mcp] of this.mcps) {
            try {
                if (mcp.shutdown) {
                    await mcp.shutdown();
                }
                console.log(`  ✅ MCP ${name} desligado`);
            } catch (error) {
                console.error(`  ❌ Erro ao desligar MCP ${name}:`, error);
            }
        }

        this.mcps.clear();
        console.log('✅ Todos os MCPs desligados');
    }
}

// Função principal de inicialização
async function initializeAllMCPs() {
    const initializer = new MCPInitializer();

    try {
        const result = await initializer.initializeAll();

        // Exportar instância global para uso em outros módulos
        global.mcpInitializer = initializer;
        global.mcps = initializer.mcps;

        return result;
    } catch (error) {
        console.error('❌ Falha crítica na inicialização dos MCPs:', error);
        throw error;
    }
}

// Auto-inicialização se executado diretamente
if (require.main === module) {
    initializeAllMCPs()
        .then(result => {
            console.log('🎉 MCPs inicializados com sucesso!');
            console.log('📊 Resultado:', JSON.stringify(result.status, null, 2));
        })
        .catch(error => {
            console.error('💥 Falha na inicialização:', error);
            process.exit(1);
        });
}

module.exports = initializeAllMCPs;