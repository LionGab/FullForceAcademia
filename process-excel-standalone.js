#!/usr/bin/env node

/**
 * PROCESSADOR STANDALONE DE EXCEL - FULLFORCE ACADEMIA
 *
 * Processa arquivo Excel com dados reais de alunos e gera segmentação
 * sem necessidade de WAHA (ideal para análise e planejamento)
 */

const ExcelStudentParser = require('./src/services/excel-student-parser');
const ReactivationCampaigns = require('./src/services/reactivation-campaigns');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

class StandaloneProcessor {
    constructor() {
        this.excelParser = new ExcelStudentParser();
        this.reactivationCampaigns = new ReactivationCampaigns(null, null);
    }

    async processExcelFile(excelFilePath) {
        try {
            console.log('🏋️ FULLFORCE ACADEMIA - PROCESSAMENTO STANDALONE');
            console.log('═'.repeat(60));
            console.log(`📂 Arquivo: ${path.basename(excelFilePath)}`);
            console.log('═'.repeat(60));

            // ETAPA 1: Processar Excel
            console.log('\\n📊 ETAPA 1: Processando arquivo Excel...');
            const processingResults = await this.excelParser.parseExcelFile(excelFilePath);

            console.log('✅ ETAPA 1 CONCLUÍDA');
            console.log(`   • Total processado: ${processingResults.totalProcessed}`);
            console.log(`   • Alunos válidos: ${processingResults.validStudents}`);
            console.log(`   • Alunos inválidos: ${processingResults.invalidStudents}`);

            if (processingResults.validStudents === 0) {
                throw new Error('Nenhum aluno válido encontrado');
            }

            // ETAPA 2: Converter para formato de campanha
            console.log('\\n🔄 ETAPA 2: Convertendo dados...');
            const formattedStudents = this.convertToReactivationFormat(processingResults.categorization);
            console.log(`✅ ${formattedStudents.length} alunos convertidos`);

            // ETAPA 3: Segmentação inteligente
            console.log('\\n🎯 ETAPA 3: Aplicando segmentação inteligente...');
            const { segments, summary } = this.reactivationCampaigns.segmentMembers(formattedStudents);

            // ETAPA 4: Gerar relatórios
            console.log('\\n📊 ETAPA 4: Gerando relatórios...');
            const report = this.generateDetailedReport(processingResults, segments, summary);

            // Salvar resultados
            await this.saveResults(excelFilePath, {
                processing: processingResults,
                segmentation: { segments, summary },
                report
            });

            // Exibir resumo final
            this.displaySummary(report);

            return report;

        } catch (error) {
            console.error('❌ ERRO:', error.message);
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

    generateDetailedReport(processingResults, segments, summary) {
        const report = {
            executionInfo: {
                timestamp: moment().toISOString(),
                arquivo: processingResults.originalFile,
                processedAt: processingResults.processedAt
            },
            dataQuality: {
                totalLinhas: processingResults.totalProcessed,
                alunosValidos: processingResults.validStudents,
                alunosInvalidos: processingResults.invalidStudents,
                taxaSucesso: `${((processingResults.validStudents / processingResults.totalProcessed) * 100).toFixed(1)}%`
            },
            segmentacao: {
                criticos: {
                    quantidade: segments.criticos.length,
                    percentual: `${((segments.criticos.length / processingResults.validStudents) * 100).toFixed(1)}%`,
                    descricao: 'Mais de 90 dias sem atividade - URGENTE',
                    oferta: '60% OFF - Oferta crítica',
                    conversaoEsperada: '35%'
                },
                moderados: {
                    quantidade: segments.moderados.length,
                    percentual: `${((segments.moderados.length / processingResults.validStudents) * 100).toFixed(1)}%`,
                    descricao: '60-90 dias sem atividade - ALTA prioridade',
                    oferta: '50% OFF - Volta especial',
                    conversaoEsperada: '25%'
                },
                baixaFreq: {
                    quantidade: segments.baixaFreq.length,
                    percentual: `${((segments.baixaFreq.length / processingResults.validStudents) * 100).toFixed(1)}%`,
                    descricao: '30-60 dias ou baixa frequência - MÉDIA prioridade',
                    oferta: 'Personal GRÁTIS + Reavaliação',
                    conversaoEsperada: '15%'
                },
                prospects: {
                    quantidade: segments.prospects.length,
                    percentual: `${((segments.prospects.length / processingResults.validStudents) * 100).toFixed(1)}%`,
                    descricao: 'Menos de 30 dias - Engajamento',
                    oferta: '7 dias GRÁTIS + Avaliação',
                    conversaoEsperada: '8%'
                },
                excluidos: {
                    quantidade: segments.excluded?.length || 0,
                    motivos: ['Telefone inválido', 'Dados incompletos']
                }
            },
            projecaoROI: {
                investimento: `R$ ${summary.investment}`,
                receitaEsperada: `R$ ${summary.potentialRevenue}`,
                roi: `${summary.projectedROI}%`,
                novosMembrosEsperados: summary.expectedNewMembers,
                detalhamento: {
                    criticos: `${segments.criticos.length} × 35% = ${Math.floor(segments.criticos.length * 0.35)} conversões`,
                    moderados: `${segments.moderados.length} × 25% = ${Math.floor(segments.moderados.length * 0.25)} conversões`,
                    baixaFreq: `${segments.baixaFreq.length} × 15% = ${Math.floor(segments.baixaFreq.length * 0.15)} conversões`,
                    prospects: `${segments.prospects.length} × 8% = ${Math.floor(segments.prospects.length * 0.08)} conversões`
                }
            },
            campanhaRecomendada: {
                prioridadeEnvio: [
                    '1. Críticos (60% OFF) - Urgência máxima',
                    '2. Moderados (50% OFF) - Alta prioridade',
                    '3. Baixa Freq (Benefícios) - Média prioridade',
                    '4. Prospects (Ofertas) - Baixa prioridade'
                ],
                cronogramaEnvio: {
                    lote1: `Críticos: ${segments.criticos.length} mensagens`,
                    lote2: `Moderados: ${segments.moderados.length} mensagens`,
                    lote3: `Baixa Freq: ${segments.baixaFreq.length} mensagens`,
                    lote4: `Prospects: ${segments.prospects.length} mensagens`
                },
                tempoEstimado: `${Math.ceil((processingResults.validStudents / 50) * 0.5)} horas`
            }
        };

        return report;
    }

    async saveResults(originalFilePath, results) {
        try {
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const baseName = path.basename(originalFilePath, path.extname(originalFilePath));
            const outputDir = path.join(path.dirname(originalFilePath), '..', 'processed-results');

            // Criar diretório
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Salvar relatório principal
            const reportFile = path.join(outputDir, `${baseName}_analise_${timestamp}.json`);
            await fs.promises.writeFile(reportFile, JSON.stringify(results.report, null, 2));

            // Salvar dados de segmentação detalhados
            const segmentationFile = path.join(outputDir, `${baseName}_segmentacao_${timestamp}.json`);
            await fs.promises.writeFile(segmentationFile, JSON.stringify(results.segmentation, null, 2));

            // Salvar lista de contatos por categoria (para execução futura)
            const contactsFile = path.join(outputDir, `${baseName}_contatos_${timestamp}.json`);
            const contactsData = {
                criticos: results.segmentation.segments.criticos.map(s => ({
                    nome: s.nome,
                    telefone: s.telefone,
                    diasInativo: s.diasInativo,
                    oferta: s.oferta
                })),
                moderados: results.segmentation.segments.moderados.map(s => ({
                    nome: s.nome,
                    telefone: s.telefone,
                    diasInativo: s.diasInativo,
                    oferta: s.oferta
                })),
                baixaFreq: results.segmentation.segments.baixaFreq.map(s => ({
                    nome: s.nome,
                    telefone: s.telefone,
                    diasInativo: s.diasInativo,
                    oferta: s.oferta
                })),
                prospects: results.segmentation.segments.prospects.map(s => ({
                    nome: s.nome,
                    telefone: s.telefone,
                    diasInativo: s.diasInativo,
                    oferta: s.oferta
                }))
            };
            await fs.promises.writeFile(contactsFile, JSON.stringify(contactsData, null, 2));

            console.log(`💾 Resultados salvos em: ${outputDir}`);
            console.log(`📄 Arquivos gerados:`);
            console.log(`   • ${path.basename(reportFile)}`);
            console.log(`   • ${path.basename(segmentationFile)}`);
            console.log(`   • ${path.basename(contactsFile)}`);

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
        }
    }

    displaySummary(report) {
        console.log('\\n🎉 PROCESSAMENTO CONCLUÍDO!');
        console.log('═'.repeat(60));

        console.log('\\n📊 RESUMO EXECUTIVO:');
        console.log(`   📂 Arquivo: ${report.executionInfo.arquivo}`);
        console.log(`   📈 Taxa de Sucesso: ${report.dataQuality.taxaSucesso}`);
        console.log(`   👥 Alunos Válidos: ${report.dataQuality.alunosValidos}`);

        console.log('\\n🎯 SEGMENTAÇÃO:');
        console.log(`   🔴 Críticos: ${report.segmentacao.criticos.quantidade} (${report.segmentacao.criticos.percentual})`);
        console.log(`   🟡 Moderados: ${report.segmentacao.moderados.quantidade} (${report.segmentacao.moderados.percentual})`);
        console.log(`   🟢 Baixa Freq: ${report.segmentacao.baixaFreq.quantidade} (${report.segmentacao.baixaFreq.percentual})`);
        console.log(`   🔵 Prospects: ${report.segmentacao.prospects.quantidade} (${report.segmentacao.prospects.percentual})`);

        console.log('\\n💰 PROJEÇÃO DE ROI:');
        console.log(`   💵 Investimento: ${report.projecaoROI.investimento}`);
        console.log(`   📈 Receita Esperada: ${report.projecaoROI.receitaEsperada}`);
        console.log(`   🎯 ROI: ${report.projecaoROI.roi}`);
        console.log(`   👥 Novos Membros: ${report.projecaoROI.novosMembrosEsperados}`);

        console.log('\\n⏱️ CAMPANHA RECOMENDADA:');
        console.log(`   📱 Total de Mensagens: ${report.dataQuality.alunosValidos}`);
        console.log(`   ⏰ Tempo Estimado: ${report.campanhaRecomendada.tempoEstimado}`);
        console.log(`   🚀 Pronto para execução via WAHA!`);
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
🏋️ FULLFORCE ACADEMIA - PROCESSADOR STANDALONE
════════════════════════════════════════════════

📋 USO:
   node process-excel-standalone.js <arquivo-excel>

💡 EXEMPLO:
   node process-excel-standalone.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx

🎯 FUNCIONALIDADES:
   • Processa Excel com dados reais de alunos
   • Gera segmentação por inatividade
   • Calcula projeção de ROI real
   • Salva relatórios detalhados
   • Prepara dados para campanha WAHA
`);
        process.exit(1);
    }

    try {
        const processor = new StandaloneProcessor();
        await processor.processExcelFile(args[0]);
    } catch (error) {
        console.error('❌ ERRO:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = StandaloneProcessor;