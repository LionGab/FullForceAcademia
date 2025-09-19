/**
 * 🎯 FULLFORCE ACADEMIA - SCRIPT IMPORTAÇÃO CSV MANUAL
 * Sistema simplificado SEM API do Google Sheets
 * Processa arquivos CSV exportados manualmente da planilha
 */

const fs = require('fs');
const path = require('path');

class CSVImporter {
    constructor() {
        this.config = {
            csvDirectory: './csv-data',
            outputDirectory: './processed-data',
            arquivos: {
                entrada: {
                    todosAlunos: 'todos_alunos.csv',
                    alunosAtivos: 'alunos_ativos.csv',
                    alunosInativos: 'alunos_inativos.csv' // Opcional
                },
                saida: {
                    segmentacao: 'segmentacao_610_inativos.json',
                    campanha: 'campanha_dados.json',
                    relatorio: 'relatorio_importacao.json'
                }
            },
            segmentacao: {
                criticos: { periodo: [2, 3], msgsPerDay: 83, desconto: 50, conversao: 0.15 }, // Fev-Mar
                moderados: { periodo: [4, 6], msgsPerDay: 67, desconto: 30, conversao: 0.25 }, // Abr-Jun
                recentes: { periodo: [7, 9], msgsPerDay: 54, desconto: 0, conversao: 0.35 }    // Jul-Set
            }
        };

        this.criarDiretorios();
    }

    /**
     * Criar diretórios necessários
     */
    criarDiretorios() {
        [this.config.csvDirectory, this.config.outputDirectory].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Diretório criado: ${dir}`);
            }
        });
    }

    /**
     * Processar importação completa
     */
    async processarImportacao() {
        console.log('🚀 INICIANDO IMPORTAÇÃO CSV MANUAL');
        console.log('='.repeat(50));

        try {
            // 1. Verificar arquivos de entrada
            const arquivosDisponiveis = this.verificarArquivosEntrada();

            // 2. Carregar dados CSV
            const dadosCarregados = await this.carregarDadosCSV(arquivosDisponiveis);

            // 3. Calcular alunos inativos
            const alunosInativos = this.calcularAlunosInativos(dadosCarregados);

            // 4. Segmentar alunos por grupos
            const segmentacao = this.segmentarAlunos(alunosInativos);

            // 5. Gerar dados para campanha
            const dadosCampanha = this.gerarDadosCampanha(segmentacao);

            // 6. Salvar resultados
            await this.salvarResultados(segmentacao, dadosCampanha);

            // 7. Gerar relatório
            const relatorio = this.gerarRelatorio(dadosCarregados, segmentacao, dadosCampanha);

            console.log('\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log(`📊 Total processados: ${alunosInativos.length} alunos inativos`);
            console.log(`🎯 Grupos criados: ${Object.keys(segmentacao.grupos).length}`);

            return relatorio;

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            throw error;
        }
    }

    /**
     * Verificar quais arquivos CSV estão disponíveis
     */
    verificarArquivosEntrada() {
        console.log('\n📋 Verificando arquivos CSV...');

        const arquivos = {};
        Object.entries(this.config.arquivos.entrada).forEach(([tipo, nomeArquivo]) => {
            const caminhoCompleto = path.join(this.config.csvDirectory, nomeArquivo);
            const existe = fs.existsSync(caminhoCompleto);

            arquivos[tipo] = {
                nome: nomeArquivo,
                caminho: caminhoCompleto,
                existe: existe,
                tamanho: existe ? fs.statSync(caminhoCompleto).size : 0
            };

            console.log(`  ${existe ? '✅' : '❌'} ${nomeArquivo} ${existe ? `(${arquivos[tipo].tamanho} bytes)` : '(não encontrado)'}`);
        });

        // Verificar se pelo menos 'todos alunos' existe
        if (!arquivos.todosAlunos.existe) {
            throw new Error('Arquivo obrigatório não encontrado: todos_alunos.csv');
        }

        return arquivos;
    }

    /**
     * Carregar dados dos arquivos CSV
     */
    async carregarDadosCSV(arquivosDisponiveis) {
        console.log('\n📂 Carregando dados CSV...');

        const dados = {};

        for (const [tipo, arquivo] of Object.entries(arquivosDisponiveis)) {
            if (arquivo.existe) {
                try {
                    const csvContent = fs.readFileSync(arquivo.caminho, 'utf8');
                    dados[tipo] = this.parseCSV(csvContent);
                    console.log(`  ✅ ${arquivo.nome}: ${dados[tipo].length} registros`);
                } catch (error) {
                    console.error(`  ❌ Erro ao carregar ${arquivo.nome}:`, error.message);
                    dados[tipo] = [];
                }
            } else {
                dados[tipo] = [];
            }
        }

        return dados;
    }

    /**
     * Parser CSV simples
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};

            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });

            return obj;
        });
    }

    /**
     * Calcular alunos inativos
     */
    calcularAlunosInativos(dadosCarregados) {
        console.log('\n🎯 Calculando alunos inativos...');

        let alunosInativos = [];

        // Se existe arquivo específico de inativos, usar
        if (dadosCarregados.alunosInativos.length > 0) {
            alunosInativos = dadosCarregados.alunosInativos;
            console.log(`  📋 Usando arquivo específico: ${alunosInativos.length} inativos`);
        }
        // Senão, calcular a partir de todos - ativos
        else if (dadosCarregados.todosAlunos.length > 0 && dadosCarregados.alunosAtivos.length > 0) {
            const emailsAtivos = new Set(
                dadosCarregados.alunosAtivos.map(a => a['E-mail'] || a.Email)
            );

            alunosInativos = dadosCarregados.todosAlunos.filter(aluno =>
                !emailsAtivos.has(aluno['E-mail'] || aluno.Email)
            );

            console.log(`  📊 Calculado: ${dadosCarregados.todosAlunos.length} total - ${dadosCarregados.alunosAtivos.length} ativos = ${alunosInativos.length} inativos`);
        }
        // Senão, usar todos os alunos como inativos
        else {
            alunosInativos = dadosCarregados.todosAlunos;
            console.log(`  ⚠️ Usando todos os alunos como inativos: ${alunosInativos.length}`);
        }

        return alunosInativos;
    }

    /**
     * Segmentar alunos por grupos
     */
    segmentarAlunos(alunosInativos) {
        console.log('\n🎯 Segmentando alunos por grupos...');

        const grupos = {
            criticos: [],
            moderados: [],
            recentes: [],
            outros: []
        };

        alunosInativos.forEach((aluno, index) => {
            const nome = aluno['Nome-Completo'] || aluno.Nome || `Aluno_${index + 1}`;
            const telefone = (aluno['Telefone-1'] || aluno.Telefone || '').replace(/\D/g, '');
            const email = aluno['E-mail'] || aluno.Email || '';
            const dataCadastro = aluno['Data-de-Cadastro'] || aluno['Data_Cadastro'] || '';

            // Validação básica
            if (!telefone || telefone.length < 10) {
                grupos.outros.push({
                    nome,
                    telefone,
                    email,
                    motivo: 'Telefone inválido',
                    dataCadastro
                });
                return;
            }

            // Determinar grupo baseado na data de cadastro
            let grupo = 'outros';
            if (dataCadastro) {
                const mes = this.extrairMesDaData(dataCadastro);

                if (mes >= 2 && mes <= 3) grupo = 'criticos';      // Fev-Mar
                else if (mes >= 4 && mes <= 6) grupo = 'moderados'; // Abr-Jun
                else if (mes >= 7 && mes <= 9) grupo = 'recentes';  // Jul-Set
            }

            const config = this.config.segmentacao[grupo] || {};

            const alunoProcessado = {
                nome: nome,
                primeiroNome: nome.split(' ')[0],
                telefone: telefone.startsWith('55') ? telefone : `55${telefone}`,
                email: email,
                dataCadastro: dataCadastro,
                grupo: grupo,
                msgsPerDay: config.msgsPerDay || 50,
                desconto: config.desconto || 0,
                conversaoEsperada: config.conversao || 0.1,
                index: index + 1
            };

            grupos[grupo].push(alunoProcessado);
        });

        // Log dos resultados
        Object.entries(grupos).forEach(([grupo, alunos]) => {
            if (alunos.length > 0) {
                console.log(`  📊 ${grupo}: ${alunos.length} alunos`);
            }
        });

        return { grupos, total: alunosInativos.length };
    }

    /**
     * Extrair mês da data (formato flexível)
     */
    extrairMesDaData(dataString) {
        try {
            // Formatos possíveis: DD/MM/YYYY, DD-MM-YYYY, etc.
            const match = dataString.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
            if (match) {
                const [day, month] = match[0].split(/[\/\-]/);
                return parseInt(month);
            }
        } catch (error) {
            console.warn(`⚠️ Erro ao extrair mês de: ${dataString}`);
        }
        return 0;
    }

    /**
     * Gerar dados estruturados para campanha
     */
    gerarDadosCampanha(segmentacao) {
        console.log('\n📱 Gerando dados para campanha...');

        const campanha = {
            timestamp: new Date().toISOString(),
            grupos: {},
            resumo: {},
            webhooks: {},
            templates: {}
        };

        // Processar cada grupo
        Object.entries(segmentacao.grupos).forEach(([nomeGrupo, alunos]) => {
            if (alunos.length === 0) return;

            const config = this.config.segmentacao[nomeGrupo];
            const conversaoEsperada = Math.round(alunos.length * config.conversao);
            const receitaEsperada = conversaoEsperada * 129.90; // Valor médio mensalidade

            campanha.grupos[nomeGrupo] = {
                alunos: alunos,
                config: {
                    msgsPerDay: config.msgsPerDay,
                    desconto: config.desconto,
                    conversaoEsperada: config.conversao,
                    diasEnvio: 3
                },
                metricas: {
                    totalAlunos: alunos.length,
                    conversaoEsperada: conversaoEsperada,
                    receitaEsperada: receitaEsperada
                }
            };

            campanha.webhooks[nomeGrupo] = `http://localhost:5678/webhook/fullforce-${nomeGrupo}`;
            campanha.templates[nomeGrupo] = this.gerarTemplate(nomeGrupo, config);
        });

        // Resumo geral
        const totalAlunos = Object.values(campanha.grupos).reduce((sum, g) => sum + g.metricas.totalAlunos, 0);
        const totalConversoes = Object.values(campanha.grupos).reduce((sum, g) => sum + g.metricas.conversaoEsperada, 0);
        const totalReceita = Object.values(campanha.grupos).reduce((sum, g) => sum + g.metricas.receitaEsperada, 0);

        campanha.resumo = {
            totalAlunos,
            totalConversoes,
            totalReceita,
            investimento: 2000,
            roi: Math.round((totalReceita / 2000 - 1) * 100),
            status: 'pronto_para_envio'
        };

        return campanha;
    }

    /**
     * Gerar template de mensagem por grupo
     */
    gerarTemplate(grupo, config) {
        const templates = {
            criticos: `🔥 Oi {nome}! Sentimos sua falta na Full Force! 💪\n\n*OFERTA ESPECIAL* para você voltar:\n✅ ${config.desconto}% OFF na mensalidade\n✅ Sem taxa de matrícula\n\nQue tal voltarmos juntos à rotina? Responda SIM!`,

            moderados: `💪 E aí {nome}! Que saudade de você!\n\nPreparei algo especial:\n✅ ${config.desconto}% OFF na mensalidade\n✅ Avaliação física grátis\n\nVamos retomar seus objetivos? Manda um OI!`,

            recentes: `Oi {nome}! 👋\n\nNotei que não apareceu nos últimos treinos...\n\n🎁 Aula experimental GRÁTIS te esperando!\n✅ Sem compromisso\n✅ Horário flexível\n\nResponde aí!`
        };

        return templates[grupo] || templates.recentes;
    }

    /**
     * Salvar todos os resultados
     */
    async salvarResultados(segmentacao, dadosCampanha) {
        console.log('\n💾 Salvando resultados...');

        const arquivos = {
            [this.config.arquivos.saida.segmentacao]: segmentacao,
            [this.config.arquivos.saida.campanha]: dadosCampanha
        };

        Object.entries(arquivos).forEach(([nomeArquivo, dados]) => {
            const caminhoCompleto = path.join(this.config.outputDirectory, nomeArquivo);
            fs.writeFileSync(caminhoCompleto, JSON.stringify(dados, null, 2));
            console.log(`  ✅ ${nomeArquivo} salvo`);
        });
    }

    /**
     * Gerar relatório final
     */
    gerarRelatorio(dadosCarregados, segmentacao, dadosCampanha) {
        const relatorio = {
            timestamp: new Date().toISOString(),
            origem: 'CSV Manual Import',
            arquivosProcessados: Object.keys(dadosCarregados).filter(k => dadosCarregados[k].length > 0),
            estatisticas: {
                totalCarregados: Object.values(dadosCarregados).reduce((sum, arr) => sum + arr.length, 0),
                totalInativos: segmentacao.total,
                grupos: Object.entries(segmentacao.grupos).map(([nome, alunos]) => ({
                    nome,
                    quantidade: alunos.length,
                    msgsPerDay: this.config.segmentacao[nome]?.msgsPerDay || 0
                }))
            },
            campanha: {
                totalAlunos: dadosCampanha.resumo.totalAlunos,
                conversaoEsperada: dadosCampanha.resumo.totalConversoes,
                receitaEsperada: dadosCampanha.resumo.totalReceita,
                roi: dadosCampanha.resumo.roi
            },
            proximosPassos: [
                'Importar workflow-manual-csv.json no N8N',
                'Copiar arquivos CSV para /csv-data/',
                'Testar webhook: http://localhost:5678/webhook/fullforce-650-manual',
                'Executar campanha por grupos',
                'Monitorar resultados'
            ]
        };

        // Salvar relatório
        const caminhoRelatorio = path.join(this.config.outputDirectory, this.config.arquivos.saida.relatorio);
        fs.writeFileSync(caminhoRelatorio, JSON.stringify(relatorio, null, 2));

        return relatorio;
    }
}

// Função principal
async function executarImportacao() {
    try {
        const importer = new CSVImporter();
        const relatorio = await importer.processarImportacao();

        console.log('\n' + '='.repeat(50));
        console.log('🎉 IMPORTAÇÃO CSV CONCLUÍDA!');
        console.log('📊 Estatísticas:');
        console.log(`   - Arquivos processados: ${relatorio.arquivosProcessados.length}`);
        console.log(`   - Total alunos inativos: ${relatorio.estatisticas.totalInativos}`);
        console.log(`   - Grupos criados: ${relatorio.estatisticas.grupos.length}`);
        console.log(`   - ROI esperado: ${relatorio.campanha.roi}%`);
        console.log('\n🚀 Próximo passo: Importar workflow-manual-csv.json no N8N');

        return relatorio;

    } catch (error) {
        console.error('\n💥 Erro na importação:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarImportacao();
}

module.exports = CSVImporter;