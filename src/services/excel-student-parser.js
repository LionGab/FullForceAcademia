const XLSX = require('xlsx');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

class ExcelStudentParser {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
        this.defaultColumns = {
            nome: ['nome-completo', 'nome', 'name', 'aluno', 'student', 'cliente'],
            telefone: ['telefone-1', 'telefone', 'phone', 'celular', 'whatsapp', 'contato'],
            email: ['e-mail', 'email', 'mail'],
            plano: ['plano', 'plan', 'modalidade', 'tipo'],
            valorPlano: ['valor', 'mensalidade', 'price', 'payment'],
            ultimaAtividade: ['ultima_atividade', 'last_activity', 'data_atividade', 'activity_date'],
            frequenciaMensal: ['frequencia', 'frequency', 'visitas', 'checkins'],
            motivoInatividade: ['motivo', 'reason', 'observacao', 'status'],
            dataCadastro: ['data_cadastro', 'registro', 'signup_date', 'joined'],
            status: ['status', 'situacao', 'ativo', 'active'],
            observacoes: ['observacoes', 'notes', 'comments', 'remarks'],
            endereco: ['endereco', 'endereço', 'address'],
            numero: ['numero', 'number', 'num'],
            bairro: ['bairro', 'district'],
            cidade: ['cidade', 'city'],
            estado: ['estado', 'state'],
            cep: ['cep', 'zipcode'],
            cpf: ['cpf', 'document']
        };
    }

    async parseExcelFile(filePath, options = {}) {
        try {
            console.log(`📊 Processando arquivo Excel: ${path.basename(filePath)}`);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Arquivo não encontrado: ${filePath}`);
            }

            const workbook = XLSX.readFile(filePath);
            const sheetName = options.sheetName || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`Planilha "${sheetName}" não encontrada`);
            }

            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 5) {
                throw new Error('Arquivo deve conter pelo menos cabeçalho e uma linha de dados');
            }

            // Para o formato específico da FullForce Academia
            // Linha 1: "Exportação de Alunos"
            // Linha 2: "Eslayne em 19.09.2025 às 15:50"
            // Linha 3: (vazia)
            // Linha 4: Headers ["Nome-Completo", "E-mail", "Telefone-1", ...]
            // Linha 5+: Dados

            let headers = [];
            let dataStartIndex = 1;

            // Buscar pelos headers reais
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (row && row.length > 1 &&
                    (row.includes('Nome-Completo') || row.includes('nome') ||
                     row.includes('Nome') || row.includes('E-mail') ||
                     row.includes('Telefone-1'))) {
                    headers = row;
                    dataStartIndex = i + 1;
                    break;
                }
            }

            if (headers.length === 0) {
                // Fallback para formato padrão
                headers = jsonData[0];
                dataStartIndex = 1;
            }

            const dataRows = jsonData.slice(dataStartIndex);

            console.log(`✅ Encontradas ${dataRows.length} linhas de dados com ${headers.length} colunas`);

            // Mapear colunas automaticamente
            const columnMapping = this.mapColumns(headers);
            console.log('🗂️ Mapeamento de colunas:', columnMapping);

            // Processar dados dos alunos
            const students = this.processStudentData(dataRows, columnMapping, headers);

            // Categorizar por inatividade
            const categorizedStudents = this.categorizeByInactivity(students);

            const results = {
                totalProcessed: students.length,
                validStudents: students.filter(s => s.telefone && s.nome).length,
                invalidStudents: students.filter(s => !s.telefone || !s.nome).length,
                categorization: categorizedStudents,
                originalFile: path.basename(filePath),
                processedAt: moment().toISOString()
            };

            console.log('📈 Resumo do processamento:', {
                total: results.totalProcessed,
                válidos: results.validStudents,
                inválidos: results.invalidStudents
            });

            return results;

        } catch (error) {
            console.error('❌ Erro ao processar arquivo Excel:', error);
            throw error;
        }
    }

    mapColumns(headers) {
        const mapping = {};

        // Normalizar headers para comparação
        const normalizedHeaders = headers.map(h =>
            h?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );

        // Mapear cada coluna esperada
        Object.keys(this.defaultColumns).forEach(expectedCol => {
            const variants = this.defaultColumns[expectedCol];

            for (let i = 0; i < normalizedHeaders.length; i++) {
                const header = normalizedHeaders[i];

                if (variants.some(variant => header?.includes(variant))) {
                    mapping[expectedCol] = i;
                    break;
                }
            }
        });

        return mapping;
    }

    processStudentData(dataRows, columnMapping, originalHeaders) {
        const students = [];

        dataRows.forEach((row, index) => {
            try {
                // Dados básicos
                const nome = this.getColumnValue(row, columnMapping.nome)?.toString().trim();
                const telefone = this.cleanPhoneNumber(this.getColumnValue(row, columnMapping.telefone));

                if (!nome || !telefone) {
                    console.warn(`⚠️ Linha ${index + 2}: Nome ou telefone inválido`);
                    return;
                }

                // Dados adicionais com valores padrão
                const ultimaAtividade = this.parseDate(this.getColumnValue(row, columnMapping.ultimaAtividade)) ||
                                      this.parseDate(this.getColumnValue(row, columnMapping.dataCadastro)) ||
                                      new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)); // 90 dias atrás como padrão

                const student = {
                    index: students.length + 1,
                    nome: nome,
                    telefone: telefone,
                    email: this.getColumnValue(row, columnMapping.email)?.toString().trim() || '',
                    plano: this.getColumnValue(row, columnMapping.plano)?.toString().trim() || 'Básico',
                    valorPlano: this.parseFloat(this.getColumnValue(row, columnMapping.valorPlano)) || 129.90,
                    ultimaAtividade: ultimaAtividade.toISOString().split('T')[0],
                    frequenciaMensal: this.parseInt(this.getColumnValue(row, columnMapping.frequenciaMensal)) || 0,
                    motivoInatividade: this.getColumnValue(row, columnMapping.motivoInatividade)?.toString().trim() || 'Não informado',
                    dataCadastro: this.parseDate(this.getColumnValue(row, columnMapping.dataCadastro))?.toISOString().split('T')[0] || ultimaAtividade.toISOString().split('T')[0],
                    status: this.getColumnValue(row, columnMapping.status)?.toString().trim() || 'Inativo',
                    observacoes: this.getColumnValue(row, columnMapping.observacoes)?.toString().trim() || '',
                    campanhaAnterior: 'Nunca',
                    // Metadados de processamento
                    processedFrom: 'excel-import',
                    originalRowIndex: index + 2
                };

                students.push(student);

            } catch (error) {
                console.error(`❌ Erro ao processar linha ${index + 2}:`, error);
            }
        });

        return students;
    }

    categorizeByInactivity(students) {
        const today = new Date();
        const categories = {
            criticos: [],      // >90 dias inativo
            moderados: [],     // 60-90 dias inativo
            baixaFreq: [],     // 30-60 dias inativo ou baixa frequência
            prospects: [],     // <30 dias ou novos
            invalidos: []      // Dados inválidos
        };

        students.forEach(student => {
            try {
                const ultimaAtividade = new Date(student.ultimaAtividade);
                const diasInativo = Math.floor((today - ultimaAtividade) / (1000 * 60 * 60 * 24));

                // Validar dados mínimos
                if (!student.telefone || student.telefone.length < 10) {
                    categories.invalidos.push({
                        ...student,
                        motivo: 'Telefone inválido',
                        diasInativo
                    });
                    return;
                }

                const studentWithActivity = {
                    ...student,
                    diasInativo,
                    ultimaAtividadeDate: ultimaAtividade
                };

                // Categorização baseada em dias de inatividade
                if (diasInativo >= 90) {
                    categories.criticos.push({
                        ...studentWithActivity,
                        urgencia: 'CRITICA',
                        prioridade: 1,
                        desconto: 60,
                        mensagemTipo: 'critica_urgente'
                    });
                } else if (diasInativo >= 60) {
                    categories.moderados.push({
                        ...studentWithActivity,
                        urgencia: 'ALTA',
                        prioridade: 2,
                        desconto: 50,
                        mensagemTipo: 'moderada_alta'
                    });
                } else if (diasInativo >= 30 || student.frequenciaMensal < 8) {
                    categories.baixaFreq.push({
                        ...studentWithActivity,
                        urgencia: 'MEDIA',
                        prioridade: 3,
                        desconto: 0,
                        mensagemTipo: 'retencao_engajamento'
                    });
                } else {
                    categories.prospects.push({
                        ...studentWithActivity,
                        urgencia: 'BAIXA',
                        prioridade: 4,
                        desconto: 0,
                        mensagemTipo: 'prospect_conversao'
                    });
                }

            } catch (error) {
                console.error(`❌ Erro ao categorizar aluno ${student.nome}:`, error);
                categories.invalidos.push({
                    ...student,
                    motivo: `Erro de processamento: ${error.message}`
                });
            }
        });

        // Log de categorização
        console.log('🎯 Categorização por inatividade:', {
            críticos: categories.criticos.length,
            moderados: categories.moderados.length,
            baixaFreq: categories.baixaFreq.length,
            prospects: categories.prospects.length,
            inválidos: categories.invalidos.length
        });

        return categories;
    }

    // Métodos auxiliares
    getColumnValue(row, columnIndex) {
        if (columnIndex === undefined || columnIndex === null) return null;
        return row[columnIndex];
    }

    cleanPhoneNumber(phone) {
        if (!phone) return '';

        // Converter para string e remover caracteres não numéricos
        const cleaned = phone.toString().replace(/\D/g, '');

        // Validar tamanho mínimo
        if (cleaned.length < 10) return '';

        // Adicionar código do país se necessário
        if (cleaned.length === 10 || cleaned.length === 11) {
            return `55${cleaned}`;
        }

        return cleaned;
    }

    parseDate(dateValue) {
        if (!dateValue) return null;

        try {
            // Tentar diferentes formatos de data
            const formats = [
                'YYYY-MM-DD',
                'DD/MM/YYYY',
                'MM/DD/YYYY',
                'YYYY/MM/DD',
                'DD-MM-YYYY'
            ];

            for (const format of formats) {
                const parsed = moment(dateValue, format, true);
                if (parsed.isValid()) {
                    return parsed.toDate();
                }
            }

            // Tentar parsing automático
            const autoDate = new Date(dateValue);
            if (!isNaN(autoDate.getTime())) {
                return autoDate;
            }

        } catch (error) {
            console.warn(`⚠️ Data inválida: ${dateValue}`);
        }

        return null;
    }

    parseFloat(value) {
        if (!value) return 0;

        // Converter para string e limpar
        const cleaned = value.toString()
            .replace(/[^\d,.-]/g, '')
            .replace(',', '.');

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    parseInt(value) {
        if (!value) return 0;

        const parsed = parseInt(value.toString().replace(/\D/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    }

    // Método para salvar dados processados
    async saveProcessedData(data, outputPath) {
        try {
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`💾 Dados processados salvos em: ${outputPath}`);

            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar dados processados:', error);
            throw error;
        }
    }

    // Método para gerar relatório de processamento
    generateProcessingReport(results) {
        const report = {
            resumo: {
                arquivo: results.originalFile,
                processedAt: results.processedAt,
                totalLinhas: results.totalProcessed,
                alunosValidos: results.validStudents,
                alunosInvalidos: results.invalidStudents,
                taxaSucesso: `${((results.validStudents / results.totalProcessed) * 100).toFixed(1)}%`
            },
            categorias: {
                criticos: results.categorization.criticos.length,
                moderados: results.categorization.moderados.length,
                baixaFrequencia: results.categorization.baixaFreq.length,
                prospects: results.categorization.prospects.length,
                invalidos: results.categorization.invalidos.length
            },
            projecaoROI: this.calculateROIProjection(results.categorization),
            timestamp: moment().format('DD/MM/YYYY HH:mm:ss')
        };

        return report;
    }

    calculateROIProjection(categorization) {
        const avgMonthlyValue = 129.90;
        const conversionRates = {
            criticos: 0.35,
            moderados: 0.25,
            baixaFreq: 0.15,
            prospects: 0.08
        };

        const projectedRevenue =
            (categorization.criticos.length * avgMonthlyValue * conversionRates.criticos * 6) +
            (categorization.moderados.length * avgMonthlyValue * conversionRates.moderados * 6) +
            (categorization.baixaFreq.length * avgMonthlyValue * conversionRates.baixaFreq * 6) +
            (categorization.prospects.length * avgMonthlyValue * conversionRates.prospects * 3);

        const investment = 1500;
        const roi = ((projectedRevenue - investment) / investment) * 100;

        const expectedConversions = Math.floor(
            (categorization.criticos.length * conversionRates.criticos) +
            (categorization.moderados.length * conversionRates.moderados) +
            (categorization.baixaFreq.length * conversionRates.baixaFreq) +
            (categorization.prospects.length * conversionRates.prospects)
        );

        return {
            investment: `R$ ${investment.toFixed(2)}`,
            projectedRevenue: `R$ ${projectedRevenue.toFixed(2)}`,
            roi: `${roi.toFixed(0)}%`,
            expectedConversions,
            expectedMonthlyRevenue: `R$ ${(expectedConversions * avgMonthlyValue).toFixed(2)}`
        };
    }
}

module.exports = ExcelStudentParser;