const ExcelStudentParser = require('./services/excel-student-parser');
const WAHACloudService = require('./services/waha-cloud-service');
const ReactivationCampaigns = require('./services/reactivation-campaigns');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class ExcelCampaignAutomation {
    constructor() {
        this.excelParser = new ExcelStudentParser();
        this.wahaService = null;
        this.reactivationCampaigns = null;
        this.results = {
            processing: null,
            segmentation: null,
            campaign: null,
            roi: null
        };
    }

    async initialize() {
        try {
            console.log('🚀 Inicializando Excel Campaign Automation...');

            // Inicializar serviços
            this.wahaService = new WAHACloudService(null, null);
            this.reactivationCampaigns = new ReactivationCampaigns(null, this.wahaService);

            // Testar conexão WAHA
            await this.wahaService.initialize();

            console.log('✅ Sistema inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    async processExcelAndLaunchCampaign(excelFilePath, options = {}) {
        try {
            console.log('🎯 INICIANDO PROCESSAMENTO COMPLETO DE CAMPANHA');
            console.log('=' .repeat(60));

            const startTime = Date.now();

            // ETAPA 1: Processar arquivo Excel
            console.log('📊 ETAPA 1: Processando arquivo Excel...');
            const processingResults = await this.excelParser.parseExcelFile(excelFilePath, options);
            this.results.processing = processingResults;

            if (processingResults.validStudents === 0) {
                throw new Error('Nenhum aluno válido encontrado no arquivo Excel');
            }

            // Converter para formato compatível com ReactivationCampaigns
            const formattedStudents = this.convertToReactivationFormat(processingResults.categorization);

            console.log('✅ ETAPA 1 CONCLUÍDA');
            console.log(`   • Total processado: ${processingResults.totalProcessed}`);
            console.log(`   • Alunos válidos: ${processingResults.validStudents}`);
            console.log(`   • Taxa de sucesso: ${((processingResults.validStudents / processingResults.totalProcessed) * 100).toFixed(1)}%`);

            // ETAPA 2: Segmentação inteligente
            console.log('\\n🎯 ETAPA 2: Aplicando segmentação inteligente...');
            const { segments, summary } = this.reactivationCampaigns.segmentMembers(formattedStudents);
            this.results.segmentation = { segments, summary };

            console.log('✅ ETAPA 2 CONCLUÍDA');
            console.log(`   • Críticos: ${segments.criticos.length}`);
            console.log(`   • Moderados: ${segments.moderados.length}`);
            console.log(`   • Baixa Freq: ${segments.baixaFreq.length}`);
            console.log(`   • Prospects: ${segments.prospects.length}`);
            console.log(`   • ROI Projetado: ${summary.projectedROI}%`);

            // ETAPA 3: Executar campanha via WAHA Cloud
            if (!options.dryRun) {
                console.log('\\n📱 ETAPA 3: Executando campanha WhatsApp...');

                const campaignOptions = {
                    batchSize: options.batchSize || 50,
                    delayBetweenBatches: options.delayBetweenBatches || 30000,
                    directSend: true,
                    triggerN8N: false
                };

                const campaignResults = await this.wahaService.executeCloudCampaign(segments, campaignOptions);
                this.results.campaign = campaignResults;

                console.log('✅ ETAPA 3 CONCLUÍDA');
                console.log(`   • Mensagens enviadas: ${campaignResults.sent}`);
                console.log(`   • Erros: ${campaignResults.errors}`);
                console.log(`   • Taxa de sucesso: ${((campaignResults.sent / (campaignResults.sent + campaignResults.errors)) * 100).toFixed(1)}%`);

                // ETAPA 4: Calcular ROI real
                console.log('\\n📊 ETAPA 4: Calculando ROI final...');
                const roiCalculation = this.wahaService.calculateROI(summary, campaignResults);
                this.results.roi = roiCalculation;

                console.log('✅ ETAPA 4 CONCLUÍDA');
                console.log(`   • Investimento: R$ ${roiCalculation.investment}`);
                console.log(`   • Receita esperada: R$ ${roiCalculation.expectedRevenue}`);
                console.log(`   • ROI Final: ${roiCalculation.roi}%`);
                console.log(`   • Novos membros esperados: ${roiCalculation.expectedNewMembers}`);
            } else {
                console.log('\\n🧪 MODO DRY-RUN: Campanha não executada (apenas simulação)');
            }

            // Salvar resultados e gerar relatório
            await this.saveResults(excelFilePath, options);

            const totalTime = Math.round((Date.now() - startTime) / 1000);
            console.log('\\n🎉 CAMPANHA CONCLUÍDA COM SUCESSO!');
            console.log('=' .repeat(60));
            console.log(`⏱️ Tempo total: ${totalTime}s`);

            return this.generateFinalReport();

        } catch (error) {
            console.error('❌ ERRO NA EXECUÇÃO DA CAMPANHA:', error);
            throw error;
        }
    }

    convertToReactivationFormat(categorization) {
        const allStudents = [
            ...categorization.criticos,
            ...categorization.moderados,
            ...categorization.baixaFreq,
            ...categorization.prospects
        ];

        return allStudents.map((student, index) => ({
            index: index + 1,
            nome: student.nome,
            telefone: student.telefone,
            email: student.email || '',
            plano: student.plano || 'Básico',
            valorPlano: student.valorPlano || 129.90,
            ultimaAtividade: student.ultimaAtividade,
            frequenciaMensal: student.frequenciaMensal || 0,
            motivoInatividade: student.motivoInatividade || 'Não informado',
            dataCadastro: student.dataCadastro || student.ultimaAtividade,
            status: student.status || 'Inativo',
            observacoes: student.observacoes || '',
            campanhaAnterior: student.campanhaAnterior || 'Nunca'
        }));
    }

    async saveResults(originalFilePath, options) {
        try {
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const baseName = path.basename(originalFilePath, path.extname(originalFilePath));
            const outputDir = path.join(path.dirname(originalFilePath), 'processed-results');

            // Criar diretório se não existir
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Salvar resultados detalhados
            const resultsFile = path.join(outputDir, `${baseName}_results_${timestamp}.json`);
            await fs.promises.writeFile(resultsFile, JSON.stringify(this.results, null, 2));

            // Salvar relatório de segmentação
            const segmentationFile = path.join(outputDir, `${baseName}_segmentation_${timestamp}.json`);
            await fs.promises.writeFile(segmentationFile, JSON.stringify(this.results.segmentation, null, 2));

            // Salvar relatório de campanha (se executada)
            if (this.results.campaign) {
                const campaignFile = path.join(outputDir, `${baseName}_campaign_${timestamp}.json`);
                await fs.promises.writeFile(campaignFile, JSON.stringify(this.results.campaign, null, 2));
            }

            console.log(`💾 Resultados salvos em: ${outputDir}`);

        } catch (error) {
            console.error('❌ Erro ao salvar resultados:', error);
        }
    }

    generateFinalReport() {
        const report = {
            executionSummary: {
                timestamp: moment().toISOString(),
                mode: this.results.campaign ? 'EXECUÇÃO REAL' : 'DRY RUN',
                totalStudentsProcessed: this.results.processing?.totalProcessed || 0,
                validStudents: this.results.processing?.validStudents || 0,
                campaignExecuted: !!this.results.campaign
            },
            segmentationResults: {
                criticos: this.results.segmentation?.segments.criticos.length || 0,
                moderados: this.results.segmentation?.segments.moderados.length || 0,
                baixaFreq: this.results.segmentation?.segments.baixaFreq.length || 0,
                prospects: this.results.segmentation?.segments.prospects.length || 0,
                excluded: this.results.segmentation?.segments.excluded?.length || 0
            },
            campaignPerformance: this.results.campaign ? {
                messagesSent: this.results.campaign.sent,
                errors: this.results.campaign.errors,
                successRate: `${((this.results.campaign.sent / (this.results.campaign.sent + this.results.campaign.errors)) * 100).toFixed(1)}%`
            } : null,
            roiProjection: this.results.roi ? {
                investment: this.results.roi.investment,
                expectedRevenue: this.results.roi.expectedRevenue,
                roi: `${this.results.roi.roi}%`,
                expectedNewMembers: this.results.roi.expectedNewMembers
            } : {
                projectedROI: this.results.segmentation?.summary.projectedROI || 'N/A',
                expectedRevenue: this.results.segmentation?.summary.potentialRevenue || 'N/A'
            }
        };

        return report;
    }

    // Método para testing e validação
    async testWithSampleData(sampleFilePath) {
        try {
            console.log('🧪 MODO TESTE: Processando dados de amostra...');

            const results = await this.processExcelAndLaunchCampaign(sampleFilePath, {
                dryRun: true,
                batchSize: 5,
                delayBetweenBatches: 1000
            });

            console.log('✅ Teste concluído com sucesso');
            return results;

        } catch (error) {
            console.error('❌ Erro no teste:', error);
            throw error;
        }
    }

    // Método para executar campanha real
    async executeRealCampaign(excelFilePath, options = {}) {
        console.log('🚨 ATENÇÃO: EXECUTANDO CAMPANHA REAL COM DADOS REAIS');
        console.log('📧 Mensagens WhatsApp serão enviadas para números reais!');

        const defaultOptions = {
            dryRun: false,
            batchSize: 50,
            delayBetweenBatches: 30000, // 30 segundos entre lotes
            ...options
        };

        return await this.processExcelAndLaunchCampaign(excelFilePath, defaultOptions);
    }
}

// Função para execução CLI
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('📋 Uso: node excel-campaign-automation.js <caminho-do-excel> [--dry-run] [--test]');
        console.log('');
        console.log('Exemplos:');
        console.log('  node excel-campaign-automation.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx --dry-run');
        console.log('  node excel-campaign-automation.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx');
        process.exit(1);
    }

    const excelPath = args[0];
    const isDryRun = args.includes('--dry-run');
    const isTest = args.includes('--test');

    try {
        const automation = new ExcelCampaignAutomation();
        await automation.initialize();

        let results;
        if (isTest) {
            results = await automation.testWithSampleData(excelPath);
        } else if (isDryRun) {
            results = await automation.processExcelAndLaunchCampaign(excelPath, { dryRun: true });
        } else {
            results = await automation.executeRealCampaign(excelPath);
        }

        console.log('\\n📊 RELATÓRIO FINAL:');
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('❌ ERRO FATAL:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = ExcelCampaignAutomation;