/**
 * Inicializador de todos os Agentes do sistema FFGym
 * Intelligent agents initialization
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Importar todos os agentes principais
const CampaignMasterAgent = require('./main/campaign-master-agent');
const DataAnalystAgent = require('./main/data-analyst-agent');
const MessageOptimizerAgent = require('./main/message-optimizer-agent');
const ROIOptimizerAgent = require('./main/roi-optimizer-agent');
const CriticalHandlerAgent = require('./main/critical-handler-agent');

// Importar sub-agentes
const SegmentSpecialistAgent = require('./sub-agents/segment-specialist-agent');

class AgentInitializer {
    constructor() {
        this.agents = new Map();
        this.subAgents = new Map();
        this.initializationOrder = [
            'dataAnalyst',
            'messageOptimizer',
            'roiOptimizer',
            'criticalHandler',
            'campaignMaster' // Master por último para conectar com todos
        ];
        this.segments = ['vip', 'hot', 'warm', 'cold', 'champion', 'atrisk'];
    }

    async initializeAll() {
        console.log('🤖 Inicializando todos os Agentes...');

        try {
            // Verificar se as dependências estão disponíveis
            await this.checkDependencies();

            // Inicializar agentes principais na ordem correta
            for (const agentName of this.initializationOrder) {
                await this.initializeMainAgent(agentName);
            }

            // Inicializar sub-agentes especializados
            await this.initializeSubAgents();

            // Configurar conexões entre agentes
            await this.setupAgentConnections();

            // Verificar status final
            const status = await this.getSystemStatus();

            console.log('✅ Todos os Agentes inicializados com sucesso!');
            console.log(`📊 Status: ${status.activeMain}/${status.totalMain} agentes principais ativos`);
            console.log(`📊 Sub-agentes: ${status.activeSub}/${status.totalSub} especializados ativos`);

            return {
                success: true,
                agents: this.agents,
                subAgents: this.subAgents,
                status
            };

        } catch (error) {
            console.error('❌ Erro na inicialização dos Agentes:', error);
            throw error;
        }
    }

    async initializeMainAgent(agentName) {
        try {
            console.log(`  🔄 Inicializando Agente ${agentName}...`);

            let agent;
            const config = this.getAgentConfig(agentName);

            switch (agentName) {
                case 'campaignMaster':
                    agent = new CampaignMasterAgent(config);
                    break;

                case 'dataAnalyst':
                    agent = new DataAnalystAgent(config);
                    break;

                case 'messageOptimizer':
                    agent = new MessageOptimizerAgent(config);
                    break;

                case 'roiOptimizer':
                    agent = new ROIOptimizerAgent(config);
                    break;

                case 'criticalHandler':
                    agent = new CriticalHandlerAgent(config);
                    break;

                default:
                    throw new Error(`Agente desconhecido: ${agentName}`);
            }

            // Inicializar o agente
            await agent.initialize();

            // Armazenar na coleção
            this.agents.set(agentName, agent);

            console.log(`  ✅ Agente ${agentName} inicializado`);

        } catch (error) {
            console.error(`  ❌ Erro ao inicializar Agente ${agentName}:`, error.message);

            // Crear agente mock se falhar
            this.agents.set(agentName, this.createMockAgent(agentName));
            console.log(`  ⚠️  Agente ${agentName} inicializado em modo mock`);
        }
    }

    async initializeSubAgents() {
        console.log('  🎯 Inicializando Sub-agentes especializados...');

        for (const segment of this.segments) {
            try {
                console.log(`    🔄 Inicializando Segment Specialist para ${segment}...`);

                const config = {
                    segment,
                    enabled: process.env[`AGENT_SEGMENT_${segment.toUpperCase()}_ENABLED`] !== 'false'
                };

                const subAgent = new SegmentSpecialistAgent(config);
                await subAgent.initialize();

                this.subAgents.set(`segment_${segment}`, subAgent);

                console.log(`    ✅ Segment Specialist ${segment} inicializado`);

            } catch (error) {
                console.error(`    ❌ Erro ao inicializar Segment Specialist ${segment}:`, error.message);

                // Crear sub-agente mock se falhar
                this.subAgents.set(`segment_${segment}`, this.createMockSubAgent(segment));
                console.log(`    ⚠️  Segment Specialist ${segment} inicializado em modo mock`);
            }
        }
    }

    async setupAgentConnections() {
        console.log('🔗 Configurando conexões entre Agentes...');

        try {
            const campaignMaster = this.agents.get('campaignMaster');

            if (campaignMaster) {
                // Conectar todos os agentes principais ao Campaign Master
                for (const [name, agent] of this.agents) {
                    if (name !== 'campaignMaster' && campaignMaster.addSubAgent) {
                        campaignMaster.addSubAgent(name, agent);
                        console.log(`  ✅ ${name} → Campaign Master conectado`);
                    }
                }

                // Conectar sub-agentes especializados
                for (const [name, subAgent] of this.subAgents) {
                    if (campaignMaster.addSubAgent) {
                        campaignMaster.addSubAgent(name, subAgent);
                        console.log(`  ✅ ${name} → Campaign Master conectado`);
                    }
                }

                // Conectar MCPs se disponíveis
                if (global.mcps) {
                    for (const [mcpName, mcp] of global.mcps) {
                        if (campaignMaster.addMCP) {
                            campaignMaster.addMCP(mcpName, mcp);
                            console.log(`  ✅ MCP ${mcpName} → Campaign Master conectado`);
                        }
                    }
                }
            }

            // Configurar comunicação entre agentes especializados
            await this.setupSpecializedConnections();

        } catch (error) {
            console.error('❌ Erro ao configurar conexões:', error);
        }
    }

    async setupSpecializedConnections() {
        // Message Optimizer ↔ Data Analyst
        const messageOptimizer = this.agents.get('messageOptimizer');
        const dataAnalyst = this.agents.get('dataAnalyst');

        if (messageOptimizer && dataAnalyst) {
            if (messageOptimizer.setDataProvider) {
                messageOptimizer.setDataProvider(dataAnalyst);
            }
            console.log('  ✅ Message Optimizer ↔ Data Analyst conectados');
        }

        // ROI Optimizer ↔ Data Analyst
        const roiOptimizer = this.agents.get('roiOptimizer');

        if (roiOptimizer && dataAnalyst) {
            if (roiOptimizer.setDataProvider) {
                roiOptimizer.setDataProvider(dataAnalyst);
            }
            console.log('  ✅ ROI Optimizer ↔ Data Analyst conectados');
        }

        // Critical Handler ↔ Message Optimizer
        const criticalHandler = this.agents.get('criticalHandler');

        if (criticalHandler && messageOptimizer) {
            if (criticalHandler.setMessageProvider) {
                criticalHandler.setMessageProvider(messageOptimizer);
            }
            console.log('  ✅ Critical Handler ↔ Message Optimizer conectados');
        }
    }

    getAgentConfig(agentName) {
        const baseConfig = {
            enabled: process.env[`AGENT_${agentName.toUpperCase()}_ENABLED`] === 'true',
            environment: process.env.NODE_ENV || 'development',
            academyName: process.env.ACADEMY_NAME || 'Academia Full Force',
            managerPhone: process.env.DEFAULT_MANAGER_PHONE
        };

        // Configurações específicas por agente
        switch (agentName) {
            case 'campaignMaster':
                return {
                    ...baseConfig,
                    targetROI: parseInt(process.env.META_ROI) || 3750,
                    targetConversion: parseInt(process.env.TARGET_CONVERSAO) || 10
                };

            case 'dataAnalyst':
                return {
                    ...baseConfig,
                    databaseType: process.env.DATABASE_TYPE || 'sqlite'
                };

            case 'messageOptimizer':
                return {
                    ...baseConfig,
                    rateLimits: {
                        messagesPerMinute: parseInt(process.env.MESSAGES_PER_MINUTE) || 20,
                        messagesPerHour: parseInt(process.env.MESSAGES_PER_HOUR) || 300
                    }
                };

            case 'roiOptimizer':
                return {
                    ...baseConfig,
                    targets: {
                        roiTarget: parseInt(process.env.META_ROI) || 3750,
                        conversionRate: parseFloat(process.env.TARGET_CONVERSAO) / 100 || 0.10
                    }
                };

            case 'criticalHandler':
                return {
                    ...baseConfig,
                    contacts: {
                        manager: process.env.DEFAULT_MANAGER_PHONE,
                        team: process.env.TEAM_GROUP_ID
                    }
                };

            default:
                return baseConfig;
        }
    }

    async checkDependencies() {
        const dependencies = [
            'lodash',
            'moment'
        ];

        for (const dep of dependencies) {
            try {
                require.resolve(dep);
            } catch (error) {
                console.warn(`⚠️  Dependência opcional não encontrada: ${dep}`);
            }
        }
    }

    createMockAgent(agentName) {
        return {
            name: agentName,
            status: 'mock',
            initialize: async () => ({ success: true, mode: 'mock' }),
            isEnabled: () => false,
            getMetrics: () => ({ mode: 'mock', active: false }),
            addSubAgent: () => {},
            addMCP: () => {},
            setDataProvider: () => {},
            setMessageProvider: () => {}
        };
    }

    createMockSubAgent(segment) {
        return {
            name: `segment_${segment}`,
            segment,
            status: 'mock',
            initialize: async () => ({ success: true, mode: 'mock' }),
            isEnabled: () => false,
            getMetrics: () => ({ mode: 'mock', active: false, segment })
        };
    }

    async getSystemStatus() {
        const totalMain = this.agents.size;
        const totalSub = this.subAgents.size;
        let activeMain = 0;
        let activeSub = 0;

        const statuses = {
            main: {},
            sub: {}
        };

        // Status dos agentes principais
        for (const [name, agent] of this.agents) {
            try {
                const status = agent.getStatus ? await agent.getStatus() : agent.status || 'unknown';
                statuses.main[name] = status;

                if (status === 'active' || status === 'ready') {
                    activeMain++;
                }
            } catch (error) {
                statuses.main[name] = 'error';
            }
        }

        // Status dos sub-agentes
        for (const [name, subAgent] of this.subAgents) {
            try {
                const status = subAgent.getStatus ? await subAgent.getStatus() : subAgent.status || 'unknown';
                statuses.sub[name] = status;

                if (status === 'active' || status === 'ready') {
                    activeSub++;
                }
            } catch (error) {
                statuses.sub[name] = 'error';
            }
        }

        return {
            totalMain,
            activeMain,
            totalSub,
            activeSub,
            statuses
        };
    }

    getAgent(name) {
        return this.agents.get(name);
    }

    getSubAgent(name) {
        return this.subAgents.get(name);
    }

    getAllAgents() {
        return {
            main: Array.from(this.agents.values()),
            sub: Array.from(this.subAgents.values())
        };
    }

    async shutdownAll() {
        console.log('⏹️  Desligando todos os Agentes...');

        // Desligar agentes principais
        for (const [name, agent] of this.agents) {
            try {
                if (agent.shutdown) {
                    await agent.shutdown();
                }
                console.log(`  ✅ Agente ${name} desligado`);
            } catch (error) {
                console.error(`  ❌ Erro ao desligar Agente ${name}:`, error);
            }
        }

        // Desligar sub-agentes
        for (const [name, subAgent] of this.subAgents) {
            try {
                if (subAgent.shutdown) {
                    await subAgent.shutdown();
                }
                console.log(`  ✅ Sub-agente ${name} desligado`);
            } catch (error) {
                console.error(`  ❌ Erro ao desligar Sub-agente ${name}:`, error);
            }
        }

        this.agents.clear();
        this.subAgents.clear();
        console.log('✅ Todos os Agentes desligados');
    }
}

// Função principal de inicialização
async function initializeAllAgents() {
    const initializer = new AgentInitializer();

    try {
        const result = await initializer.initializeAll();

        // Exportar instância global para uso em outros módulos
        global.agentInitializer = initializer;
        global.agents = initializer.agents;
        global.subAgents = initializer.subAgents;

        return result;
    } catch (error) {
        console.error('❌ Falha crítica na inicialização dos Agentes:', error);
        throw error;
    }
}

// Auto-inicialização se executado diretamente
if (require.main === module) {
    initializeAllAgents()
        .then(result => {
            console.log('🎉 Agentes inicializados com sucesso!');
            console.log('📊 Resultado:', JSON.stringify(result.status, null, 2));
        })
        .catch(error => {
            console.error('💥 Falha na inicialização:', error);
            process.exit(1);
        });
}

module.exports = initializeAllAgents;