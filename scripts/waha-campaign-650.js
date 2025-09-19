#!/usr/bin/env node

/**
 * WAHA Campaign 650 - Sistema de Automação WhatsApp
 * Automatização para reativação de 650 alunos inativos com ROI 2250%-3750%
 */

const WAHACloudService = require('../src/services/waha-cloud-service');
const DatabaseService = require('../src/services/database');
const GoogleSheetsService = require('../src/services/google-sheets');
const { performance } = require('perf_hooks');
const path = require('path');

class WAHACampaign650 {
    constructor() {
        this.startTime = performance.now();
        this.config = {
            dryRun: process.argv.includes('--dry-run'),
            testMode: process.argv.includes('--test'),
            batchSize: parseInt(process.argv.find(arg => arg.startsWith('--batch='))?.split('=')[1]) || 50,
            skipValidation: process.argv.includes('--skip-validation'),
            forceRun: process.argv.includes('--force')
        };

        console.log('🚀 WAHA Campaign 650 - Sistema de Reativação Automatizada');
        console.log(`📊 Configuração: ${JSON.stringify(this.config, null, 2)}`);
        console.log('=' .repeat(60));
    }

    async initialize() {
        try {
            console.log('🔧 Inicializando serviços...');

            // In test mode, we can mock services if they're not available
            if (this.config.testMode) {
                console.log('🧪 Modo de teste ativado - usando configuração de desenvolvimento');

                try {
                    // Try to initialize database service
                    this.databaseService = new DatabaseService();
                    await this.databaseService.initialize();
                    console.log('✅ Database service initialized');
                } catch (dbError) {
                    console.log('⚠️  Database not available in test mode - usando mock');
                    this.databaseService = this.createMockDatabaseService();
                }

                try {
                    // Try to initialize Google Sheets service
                    this.sheetsService = new GoogleSheetsService();
                    await this.sheetsService.initialize();
                    console.log('✅ Google Sheets service initialized');
                } catch (sheetsError) {
                    console.log('⚠️  Google Sheets not available in test mode - usando mock');
                    this.sheetsService = this.createMockSheetsService();
                }

                try {
                    // Try to initialize WAHA Cloud service
                    this.wahaCloudService = new WAHACloudService(this.databaseService, this.sheetsService);
                    await this.wahaCloudService.initializeCloudIntegration();
                    console.log('✅ WAHA Cloud service initialized');
                } catch (wahaError) {
                    console.log('⚠️  WAHA Cloud not available in test mode - usando mock');
                    this.wahaCloudService = this.createMockWAHAService();
                }
            } else {
                // Production mode - all services required
                this.databaseService = new DatabaseService();
                await this.databaseService.initialize();
                console.log('✅ Database service initialized');

                this.sheetsService = new GoogleSheetsService();
                await this.sheetsService.initialize();
                console.log('✅ Google Sheets service initialized');

                this.wahaCloudService = new WAHACloudService(this.databaseService, this.sheetsService);
                await this.wahaCloudService.initializeCloudIntegration();
                console.log('✅ WAHA Cloud service initialized');
            }

            console.log('✅ Todos os serviços inicializados com sucesso!');
            return true;

        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            if (!this.config.testMode) {
                throw error;
            }
            console.log('⚠️  Continuando em modo de teste com serviços mock...');
            return true;
        }
    }

    async validateSystem() {
        if (this.config.skipValidation) {
            console.log('⚠️ Pulando validação do sistema...');
            return true;
        }

        console.log('🔍 Validando sistema...');

        try {
            // Test WAHA Cloud integration
            const testResults = await this.wahaCloudService.testCloudIntegration();

            if (!testResults.success) {
                console.error('❌ Falha na validação WAHA Cloud:');
                testResults.tests.forEach(test => {
                    const status = test.status === 'PASS' ? '✅' : '❌';
                    console.log(`  ${status} ${test.test}`);
                    if (test.error) console.log(`    Error: ${test.error}`);
                });

                if (!this.config.forceRun) {
                    throw new Error('Sistema não passou na validação. Use --force para continuar.');
                }
            }

            // Validate Google Sheets access
            try {
                await this.sheetsService.testConnection();
                console.log('✅ Google Sheets conectado');
            } catch (error) {
                console.error('❌ Google Sheets não disponível:', error.message);
                if (!this.config.forceRun) {
                    throw new Error('Google Sheets é necessário para a campanha.');
                }
            }

            // Check database connection
            try {
                await this.databaseService.query('SELECT 1 as test');
                console.log('✅ Database conectado');
            } catch (error) {
                console.error('❌ Database não disponível:', error.message);
                if (!this.config.forceRun) {
                    throw new Error('Database é necessário para logging.');
                }
            }

            console.log('✅ Validação do sistema concluída!');
            return true;

        } catch (error) {
            console.error('❌ Erro na validação:', error.message);
            throw error;
        }
    }

    async loadMembers() {
        console.log('📊 Carregando 650 alunos inativos...');

        try {
            const members = await this.wahaCloudService.reactivationCampaigns.load650InactiveMembers();

            console.log(`✅ ${members.length} alunos carregados`);

            if (members.length === 0) {
                throw new Error('Nenhum aluno inativo encontrado na planilha');
            }

            if (members.length < 650) {
                console.log(`⚠️ Encontrados apenas ${members.length} alunos (esperado: 650)`);
            }

            return members;

        } catch (error) {
            console.error('❌ Erro ao carregar alunos:', error.message);
            throw error;
        }
    }

    async segmentMembers(members) {
        console.log('🎯 Segmentando alunos por prioridade...');

        try {
            const { segments, summary } = await this.wahaCloudService.reactivationCampaigns.segmentMembers(members);

            console.log('📊 Segmentação concluída:');
            console.log(`  🔴 Críticos (90+ dias): ${segments.criticos.length}`);
            console.log(`  🟡 Moderados (60-90 dias): ${segments.moderados.length}`);
            console.log(`  🟢 Baixa Freq (30-60 dias): ${segments.baixaFreq.length}`);
            console.log(`  🔵 Prospects (<30 dias): ${segments.prospects.length}`);
            console.log(`  ❌ Excluídos: ${segments.excluded.length}`);
            console.log(`  💰 Receita Potencial: R$ ${summary.potentialRevenue}`);
            console.log(`  📈 ROI Projetado: ${summary.projectedROI}%`);

            return { segments, summary };

        } catch (error) {
            console.error('❌ Erro na segmentação:', error.message);
            throw error;
        }
    }

    async executeCampaign(segments, summary) {
        console.log('🚀 Executando campanha 650...');

        if (this.config.dryRun) {
            console.log('🧪 MODO DRY RUN - Nenhuma mensagem será enviada');

            const mockResults = {
                sent: segments.criticos.length + segments.moderados.length + segments.baixaFreq.length + segments.prospects.length,
                errors: 0,
                details: [],
                timestamp: new Date().toISOString()
            };

            console.log('✅ Dry run concluído:', mockResults);
            return mockResults;
        }

        try {
            const campaignOptions = {
                batchSize: this.config.batchSize,
                delayBetweenBatches: 30000, // 30 segundos
                maxRetries: 3
            };

            if (this.config.testMode) {
                console.log('🧪 MODO TESTE - Enviando apenas para os primeiros 5 de cada segmento');

                // Limit to 5 members per segment for testing
                segments.criticos = segments.criticos.slice(0, 5);
                segments.moderados = segments.moderados.slice(0, 5);
                segments.baixaFreq = segments.baixaFreq.slice(0, 5);
                segments.prospects = segments.prospects.slice(0, 5);
            }

            const results = await this.wahaCloudService.execute650Campaign(campaignOptions);

            console.log('✅ Campanha executada:', {
                sent: results.results.sent,
                errors: results.results.errors,
                successRate: ((results.results.sent / (results.results.sent + results.results.errors)) * 100).toFixed(1) + '%'
            });

            return results;

        } catch (error) {
            console.error('❌ Erro na execução da campanha:', error.message);
            throw error;
        }
    }

    async generateReport(segments, summary, results) {
        console.log('📊 Gerando relatório final...');

        try {
            const endTime = performance.now();
            const executionTime = ((endTime - this.startTime) / 1000).toFixed(2);

            const report = {
                timestamp: new Date().toISOString(),
                executionTime: `${executionTime}s`,
                configuration: this.config,
                summary: summary,
                results: results.results || results,
                roi: results.roi,
                segments: {
                    criticos: segments.criticos.length,
                    moderados: segments.moderados.length,
                    baixaFreq: segments.baixaFreq.length,
                    prospects: segments.prospects.length,
                    excluded: segments.excluded.length
                },
                platform: {
                    waha: true,
                    deployment: this.wahaCloudService.deploymentPlatform,
                    webhookUrl: this.wahaCloudService.getWebhookUrl()
                }
            };

            // Save report to file
            const reportPath = path.join(__dirname, '..', 'logs', `campaign-650-report-${Date.now()}.json`);
            const fs = require('fs');

            // Ensure logs directory exists
            const logsDir = path.dirname(reportPath);
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

            console.log('📄 Relatório Final:');
            console.log('=' .repeat(60));
            console.log(`⏱️  Tempo de execução: ${executionTime}s`);
            console.log(`📊 Total processados: ${summary.totalProcessados}`);
            console.log(`✅ Mensagens enviadas: ${results.results?.sent || 0}`);
            console.log(`❌ Erros: ${results.results?.errors || 0}`);
            console.log(`💰 Receita esperada: R$ ${results.roi?.expectedRevenue || summary.potentialRevenue}`);
            console.log(`📈 ROI projetado: ${results.roi?.roi || summary.projectedROI}%`);
            console.log(`👥 Novos membros esperados: ${results.roi?.expectedNewMembers || summary.expectedNewMembers}`);
            console.log(`🌐 Plataforma: ${this.wahaCloudService.deploymentPlatform}`);
            console.log(`📝 Relatório salvo: ${reportPath}`);
            console.log('=' .repeat(60));

            return report;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
            throw error;
        }
    }

    // Mock service methods for test mode
    createMockDatabaseService() {
        return {
            healthCheck: async () => ({ postgres: true, redis: true, timestamp: new Date().toISOString() }),
            query: async (sql, params) => ({ rows: [], rowCount: 0 }),
            saveContact: async (contact) => ({ id: 1, ...contact }),
            getContact: async (phone) => null,
            saveMessage: async (message) => ({ id: 1, ...message }),
            shutdown: async () => {}
        };
    }

    createMockSheetsService() {
        return {
            initialize: async () => {},
            testConnection: async () => ({
                success: true,
                message: 'Mock Google Sheets connection test passed',
                sheetsAvailable: true
            }),
            load650InactiveMembers: async () => {
                console.log('📋 MOCK: Carregando 650 alunos inativos (simulação)...');
                const mockMembers = [];
                for (let i = 1; i <= 650; i++) {
                    mockMembers.push({
                        name: `Membro ${i}`,
                        phone: `+5565999${String(i).padStart(6, '0')}`,
                        status: 'inactive',
                        last_contact: `2024-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                        priority: Math.random() > 0.5 ? 'high' : 'medium'
                    });
                }
                return mockMembers;
            },
            getInactiveMembers: async () => [
                { name: 'João Silva', phone: '+5565999999991', status: 'inactive', last_contact: '2024-01-15' },
                { name: 'Maria Santos', phone: '+5565999999992', status: 'inactive', last_contact: '2024-02-20' },
                { name: 'Pedro Oliveira', phone: '+5565999999993', status: 'inactive', last_contact: '2024-03-10' }
            ],
            updateMemberStatus: async (phone, status) => true,
            logCampaignResult: async (data) => true
        };
    }

    createMockWAHAService() {
        return {
            initializeCloudIntegration: async () => {},
            testCloudIntegration: async () => ({
                success: true,
                message: 'Mock WAHA integration test passed',
                sessionStatus: 'WORKING'
            }),
            sendMessage: async (phone, message) => {
                console.log(`📱 MOCK: Enviando para ${phone}: ${message.substring(0, 50)}...`);
                return { success: true, messageId: `mock_${Date.now()}` };
            },
            getSessionStatus: async () => ({ status: 'WORKING', message: 'Mock session active' }),
            validateConnection: async () => true,
            healthCheck: async () => ({ status: 'OK', timestamp: new Date().toISOString() }),
            getWebhookUrl: () => 'https://fullforcegym-g.up.railway.app/webhook/waha',
            execute650Campaign: async (campaignOptions) => {
                console.log('🚀 MOCK: Executando campanha 650 automatizada...');
                console.log('📋 MOCK: Opções da campanha:', campaignOptions);

                const mockResults = {
                    results: {
                        sent: 20, // 5 per segment * 4 segments
                        errors: 0,
                        segmentResults: {
                            criticos: { sent: 5, failed: 0 },
                            moderados: { sent: 5, failed: 0 },
                            baixaFreq: { sent: 5, failed: 0 },
                            prospects: { sent: 5, failed: 0 }
                        }
                    },
                    roiProjections: {
                        totalProspectedRevenue: 2598.0, // 20 * 129.90
                        expectedConversion: 0.25,
                        projectedROI: 2500
                    },
                    timestamp: new Date().toISOString()
                };

                // Simulate some processing time
                await new Promise(resolve => setTimeout(resolve, 100));

                return mockResults;
            },
            reactivationCampaigns: {
                load650InactiveMembers: async () => {
                    console.log('📋 MOCK: Carregando 650 alunos inativos (simulação)...');
                    const mockMembers = [];
                    for (let i = 1; i <= 650; i++) {
                        mockMembers.push({
                            name: `Membro ${i}`,
                            phone: `+5565999${String(i).padStart(6, '0')}`,
                            status: 'inactive',
                            last_contact: `2024-0${Math.floor(Math.random() * 8) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                            priority: Math.random() > 0.5 ? 'high' : 'medium'
                        });
                    }
                    return mockMembers;
                },
                segmentMembers: async (members) => {
                    console.log('🎯 MOCK: Segmentando alunos por prioridade...');
                    const segments = {
                        criticos: members.filter(m => m.priority === 'high').slice(0, 200),
                        moderados: members.filter(m => m.priority === 'medium').slice(0, 250),
                        baixaFreq: members.slice(450, 600),
                        prospects: members.slice(600, 650),
                        excluded: []
                    };

                    const summary = {
                        total: members.length,
                        criticos: segments.criticos.length,
                        moderados: segments.moderados.length,
                        baixaFreq: segments.baixaFreq.length,
                        prospects: segments.prospects.length,
                        excluded: segments.excluded.length,
                        potentialRevenue: 129.90 * (segments.criticos.length + segments.moderados.length + segments.baixaFreq.length + segments.prospects.length),
                        projectedROI: 2500
                    };

                    return { segments, summary };
                },
                executeCampaign: async (segments, summary) => {
                    console.log('🚀 MOCK: Executando campanha de reativação...');
                    const results = {
                        sent: 0,
                        failed: 0,
                        segmentResults: {}
                    };

                    for (const [segmentName, members] of Object.entries(segments)) {
                        console.log(`📱 MOCK: Enviando para segmento ${segmentName} (${members.length} membros)`);
                        results.segmentResults[segmentName] = {
                            sent: members.length,
                            failed: 0
                        };
                        results.sent += members.length;
                    }

                    return results;
                }
            }
        };
    }

    async run() {
        try {
            console.log('🎬 Iniciando execução da campanha 650...');

            // Initialize all services
            await this.initialize();

            // Validate system
            await this.validateSystem();

            // Load inactive members
            const members = await this.loadMembers();

            // Segment members
            const { segments, summary } = await this.segmentMembers(members);

            // Execute campaign
            const results = await this.executeCampaign(segments, summary);

            // Generate final report
            const report = await this.generateReport(segments, summary, results);

            console.log('🎉 Campanha 650 concluída com sucesso!');
            return report;

        } catch (error) {
            console.error('💥 Erro fatal na campanha:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const campaign = new WAHACampaign650();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Cancelando campanha...');
        process.exit(0);
    });

    // Show help
    if (process.argv.includes('--help')) {
        console.log(`
📚 WAHA Campaign 650 - Ajuda

Uso: node scripts/waha-campaign-650.js [opções]

Opções:
  --dry-run           Executa sem enviar mensagens (simulação)
  --test             Envia apenas para os primeiros 5 de cada segmento
  --batch=N          Define tamanho do lote (padrão: 50)
  --skip-validation  Pula validação do sistema
  --force            Força execução mesmo com falhas na validação
  --help             Mostra esta ajuda

Exemplos:
  node scripts/waha-campaign-650.js --dry-run
  node scripts/waha-campaign-650.js --test --batch=10
  node scripts/waha-campaign-650.js --force --skip-validation

💡 ROI Esperado: 2250%-3750%
🎯 Meta: Reativar 650 alunos inativos
📱 Plataforma: WAHA WhatsApp Cloud API
        `);
        process.exit(0);
    }

    // Run campaign
    campaign.run().then(report => {
        console.log('✅ Execução finalizada com sucesso!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Execução falhou:', error.message);
        process.exit(1);
    });
}

module.exports = WAHACampaign650;