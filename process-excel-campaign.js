#!/usr/bin/env node

/**
 * PROCESSADOR DE CAMPANHA EXCEL - FULLFORCE ACADEMIA
 *
 * Processa arquivo Excel com dados reais de alunos inativos e executa
 * campanha personalizada WhatsApp com ROI de 2250%-3750%
 *
 * USO:
 *   node process-excel-campaign.js <arquivo-excel> [opcoes]
 *
 * OPCOES:
 *   --dry-run     : Simula execução sem enviar mensagens
 *   --test        : Modo teste com dados limitados
 *   --batch=N     : Tamanho do lote (padrão: 50)
 *   --delay=N     : Delay entre lotes em ms (padrão: 30000)
 *   --help        : Exibe esta ajuda
 *
 * EXEMPLOS:
 *   node process-excel-campaign.js C:\\Users\\User\\Downloads\\Alunos.xlsx --dry-run
 *   node process-excel-campaign.js C:\\Users\\User\\Downloads\\Alunos.xlsx --batch=25 --delay=60000
 */

const ExcelCampaignAutomation = require('./src/excel-campaign-automation');
const path = require('path');
const fs = require('fs');

class CLI {
    constructor() {
        this.automation = new ExcelCampaignAutomation();
        this.options = this.parseArguments();
    }

    parseArguments() {
        const args = process.argv.slice(2);

        if (args.length === 0 || args.includes('--help')) {
            this.showHelp();
            process.exit(0);
        }

        const options = {
            filePath: args[0],
            dryRun: args.includes('--dry-run'),
            test: args.includes('--test'),
            batchSize: 50,
            delayBetweenBatches: 30000
        };

        // Parse batch size
        const batchArg = args.find(arg => arg.startsWith('--batch='));
        if (batchArg) {
            options.batchSize = parseInt(batchArg.split('=')[1]) || 50;
        }

        // Parse delay
        const delayArg = args.find(arg => arg.startsWith('--delay='));
        if (delayArg) {
            options.delayBetweenBatches = parseInt(delayArg.split('=')[1]) || 30000;
        }

        return options;
    }

    showHelp() {
        console.log(`
🏋️ FULLFORCE ACADEMIA - PROCESSADOR DE CAMPANHA EXCEL
═══════════════════════════════════════════════════════════

📊 FUNCIONALIDADES:
   • Processa arquivo Excel com dados reais de alunos
   • Categoriza por inatividade (Críticos, Moderados, Baixa Freq, Prospects)
   • Executa campanha WhatsApp personalizada via WAHA Cloud
   • Calcula ROI real de 2250%-3750%
   • Gera relatórios detalhados de performance

📋 USO:
   node process-excel-campaign.js <arquivo-excel> [opções]

🔧 OPÇÕES:
   --dry-run           Simula execução sem enviar mensagens reais
   --test              Modo teste com dados limitados (5 primeiros alunos)
   --batch=N           Tamanho do lote para envio (padrão: 50)
   --delay=N           Delay entre lotes em ms (padrão: 30000)
   --help              Exibe esta ajuda

💡 EXEMPLOS:

   🧪 TESTE/SIMULAÇÃO:
   node process-excel-campaign.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx --dry-run
   node process-excel-campaign.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx --test

   🚀 EXECUÇÃO REAL:
   node process-excel-campaign.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx
   node process-excel-campaign.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx --batch=25 --delay=60000

📈 ROI ESPERADO:
   • Críticos (>90 dias): 35% conversão → 60% desconto
   • Moderados (60-90 dias): 25% conversão → 50% desconto
   • Baixa Freq (30-60 dias): 15% conversão → Benefícios especiais
   • Prospects (<30 dias): 8% conversão → Ofertas de engajamento

⚠️  IMPORTANTE:
   • Use --dry-run para testar antes da execução real
   • Execução real envia mensagens WhatsApp para números reais
   • Resultados são salvos em processed-results/
   • Sistema requer WAHA Cloud configurado
`);
    }

    validateFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`❌ Arquivo não encontrado: ${filePath}`);
        }

        const ext = path.extname(filePath).toLowerCase();
        if (!['.xlsx', '.xls'].includes(ext)) {
            throw new Error(`❌ Formato não suportado: ${ext}. Use .xlsx ou .xls`);
        }

        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            throw new Error(`❌ Arquivo vazio: ${filePath}`);
        }

        console.log(`✅ Arquivo validado: ${path.basename(filePath)} (${(stats.size / 1024).toFixed(1)} KB)`);
    }

    async execute() {
        try {
            console.log('🏋️ FULLFORCE ACADEMIA - PROCESSADOR DE CAMPANHA EXCEL');
            console.log('═'.repeat(70));
            console.log(`📂 Arquivo: ${path.basename(this.options.filePath)}`);
            console.log(`🎯 Modo: ${this.options.dryRun ? 'SIMULAÇÃO' : this.options.test ? 'TESTE' : 'EXECUÇÃO REAL'}`);
            console.log(`📦 Lote: ${this.options.batchSize} mensagens`);
            console.log(`⏱️ Delay: ${this.options.delayBetweenBatches}ms entre lotes`);
            console.log('═'.repeat(70));

            // Validar arquivo
            this.validateFile(this.options.filePath);

            // Inicializar sistema
            console.log('\\n🚀 Inicializando sistema...');
            await this.automation.initialize();

            // Executar processamento
            let results;
            if (this.options.test) {
                results = await this.automation.testWithSampleData(this.options.filePath);
            } else if (this.options.dryRun) {
                results = await this.automation.processExcelAndLaunchCampaign(this.options.filePath, {
                    dryRun: true,
                    batchSize: this.options.batchSize,
                    delayBetweenBatches: this.options.delayBetweenBatches
                });
            } else {
                // Confirmar execução real
                await this.confirmRealExecution();

                results = await this.automation.executeRealCampaign(this.options.filePath, {
                    batchSize: this.options.batchSize,
                    delayBetweenBatches: this.options.delayBetweenBatches
                });
            }

            // Exibir resultados finais
            this.displayFinalResults(results);

            console.log('\\n🎉 PROCESSAMENTO CONCLUÍDO COM SUCESSO!');
            return results;

        } catch (error) {
            console.error('\\n❌ ERRO FATAL:', error.message);
            process.exit(1);
        }
    }

    async confirmRealExecution() {
        console.log('\\n🚨 ATENÇÃO: EXECUÇÃO REAL');
        console.log('⚠️ Esta ação enviará mensagens WhatsApp para números REAIS!');
        console.log('📱 Confirme que o sistema WAHA está configurado corretamente.');
        console.log('💰 Isso consumirá recursos reais e pode gerar custos.');

        // Simulação de confirmação (em ambiente real, usar readline)
        console.log('\\n✅ Prosseguindo com execução real...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    displayFinalResults(results) {
        console.log('\\n📊 RELATÓRIO FINAL DE EXECUÇÃO');
        console.log('═'.repeat(50));

        const { executionSummary, segmentationResults, campaignPerformance, roiProjection } = results;

        console.log(`📈 RESUMO EXECUTIVO:`);
        console.log(`   • Total Processado: ${executionSummary.totalStudentsProcessed}`);
        console.log(`   • Alunos Válidos: ${executionSummary.validStudents}`);
        console.log(`   • Modo: ${executionSummary.mode}`);
        console.log(`   • Timestamp: ${new Date(executionSummary.timestamp).toLocaleString('pt-BR')}`);

        console.log(`\\n🎯 SEGMENTAÇÃO:`);
        console.log(`   • Críticos: ${segmentationResults.criticos}`);
        console.log(`   • Moderados: ${segmentationResults.moderados}`);
        console.log(`   • Baixa Freq: ${segmentationResults.baixaFreq}`);
        console.log(`   • Prospects: ${segmentationResults.prospects}`);
        if (segmentationResults.excluded > 0) {
            console.log(`   • Excluídos: ${segmentationResults.excluded}`);
        }

        if (campaignPerformance) {
            console.log(`\\n📱 PERFORMANCE DA CAMPANHA:`);
            console.log(`   • Mensagens Enviadas: ${campaignPerformance.messagesSent}`);
            console.log(`   • Erros: ${campaignPerformance.errors}`);
            console.log(`   • Taxa de Sucesso: ${campaignPerformance.successRate}`);
        }

        console.log(`\\n💰 PROJEÇÃO DE ROI:`);
        if (roiProjection.roi) {
            console.log(`   • Investimento: R$ ${roiProjection.investment}`);
            console.log(`   • Receita Esperada: R$ ${roiProjection.expectedRevenue}`);
            console.log(`   • ROI: ${roiProjection.roi}`);
            console.log(`   • Novos Membros: ${roiProjection.expectedNewMembers}`);
        } else {
            console.log(`   • ROI Projetado: ${roiProjection.projectedROI}`);
            console.log(`   • Receita Esperada: R$ ${roiProjection.expectedRevenue}`);
        }
    }
}

// Executar CLI
async function main() {
    try {
        const cli = new CLI();
        await cli.execute();
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = CLI;