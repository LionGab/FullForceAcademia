/**
 * 🎯 FULLFORCE ACADEMIA - INTEGRAÇÃO DADOS VALIDADOS
 * Sistema de integração entre dados Excel, N8N workflows e base PostgreSQL
 * Processamento de 1259 alunos com segmentação automática
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

class DataIntegration {
    constructor() {
        this.config = {
            database: {
                connectionString: process.env.DATABASE_URL,
                pool: new Pool({
                    connectionString: process.env.DATABASE_URL,
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 2000,
                })
            },
            n8n: {
                baseUrl: process.env.N8N_URL || 'http://localhost:5678',
                apiKey: process.env.N8N_API_TOKEN,
                workflows: {
                    dataImport: process.env.N8N_WORKFLOW_ID_DATA_IMPORT || 'data-import-workflow',
                    conversion: process.env.N8N_WORKFLOW_ID_CONVERSION || 'conversion-tracking-workflow',
                    campaign: process.env.N8N_WORKFLOW_ID_650_CAMPAIGN
                }
            },
            arquivos: {
                todosAlunos: 'C:/Users/User/todos_alunos_processado.csv',
                alunosAtivos: 'C:/Users/User/alunos_ativos_processado.csv',
                analiseFrequencia: 'C:/Users/User/Downloads/analise_frequencia_otimizada.md'
            },
            segmentacao: {
                criticos: {
                    periodo: ['2025-02-01', '2025-03-31'],
                    size: 250,
                    conversaoTarget: 0.15,
                    desconto: 50
                },
                moderados: {
                    periodo: ['2025-04-01', '2025-06-30'],
                    size: 200,
                    conversaoTarget: 0.25,
                    desconto: 30
                },
                recentes: {
                    periodo: ['2025-07-01', '2025-09-30'],
                    size: 160,
                    conversaoTarget: 0.35,
                    desconto: 0
                }
            }
        };
    }

    /**
     * Processar e integrar todos os dados da campanha
     */
    async integrarDadosCompletos() {
        console.log('🚀 Iniciando integração completa de dados FullForce Academia');

        try {
            // 1. Validar arquivos de entrada
            await this.validarArquivosEntrada();

            // 2. Processar dados dos alunos
            const dadosProcessados = await this.processarDadosAlunos();

            // 3. Criar estrutura do banco de dados
            await this.criarEstruturaBanco();

            // 4. Importar dados para PostgreSQL
            await this.importarDadosParaBanco(dadosProcessados);

            // 5. Segmentar alunos por grupos
            const segmentacao = await this.segmentarAlunosPorGrupos();

            // 6. Configurar workflows N8N
            await this.configurarWorkflowsN8N(segmentacao);

            // 7. Validar integração completa
            const validacao = await this.validarIntegracaoCompleta();

            console.log('✅ Integração de dados concluída com sucesso!');
            return {
                status: 'sucesso',
                dadosProcessados,
                segmentacao,
                validacao,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erro na integração de dados:', error);
            throw error;
        }
    }

    /**
     * Validar se todos os arquivos necessários existem
     */
    async validarArquivosEntrada() {
        console.log('📋 Validando arquivos de entrada...');

        const arquivos = Object.values(this.config.arquivos);
        for (const arquivo of arquivos) {
            if (!fs.existsSync(arquivo)) {
                throw new Error(`Arquivo não encontrado: ${arquivo}`);
            }
        }

        console.log('✓ Todos os arquivos validados');
    }

    /**
     * Processar dados dos arquivos CSV gerados
     */
    async processarDadosAlunos() {
        console.log('🔄 Processando dados dos alunos...');

        // Carregar dados de todos os alunos
        const todosDados = await this.carregarCSV(this.config.arquivos.todosAlunos);
        const ativosDados = await this.carregarCSV(this.config.arquivos.alunosAtivos);

        // Calcular alunos inativos
        const ativosIds = new Set(ativosDados.map(a => a['E-mail']));
        const inativos = todosDados.filter(aluno => !ativosIds.has(aluno['E-mail']));

        console.log(`📊 Processamento concluído:`);
        console.log(`- Total alunos: ${todosDados.length}`);
        console.log(`- Alunos ativos: ${ativosDados.length}`);
        console.log(`- Alunos inativos: ${inativos.length}`);

        return {
            todos: todosDados,
            ativos: ativosDados,
            inativos: inativos,
            estatisticas: {
                total: todosDados.length,
                ativos: ativosDados.length,
                inativos: inativos.length,
                taxaRetencao: (ativosDados.length / todosDados.length * 100).toFixed(1)
            }
        };
    }

    /**
     * Carregar dados de arquivo CSV
     */
    async carregarCSV(caminhoArquivo) {
        return new Promise((resolve, reject) => {
            const csv = require('csv-parser');
            const dados = [];

            fs.createReadStream(caminhoArquivo)
                .pipe(csv())
                .on('data', (row) => dados.push(row))
                .on('end', () => resolve(dados))
                .on('error', reject);
        });
    }

    /**
     * Criar estrutura completa do banco de dados
     */
    async criarEstruturaBanco() {
        console.log('🗄️ Criando estrutura do banco de dados...');

        const schema = `
        -- Tabela principal de alunos
        CREATE TABLE IF NOT EXISTS alunos (
            id SERIAL PRIMARY KEY,
            nome_completo VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE,
            telefone_1 VARCHAR(20),
            telefone_2 VARCHAR(20),
            celular VARCHAR(20),
            idade INTEGER,
            primeiro_nome VARCHAR(100),
            data_cadastro TIMESTAMP,
            sexo VARCHAR(20),
            status VARCHAR(20) DEFAULT 'ativo',
            grupo_campanha VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_alunos_status ON alunos(status);
        CREATE INDEX IF NOT EXISTS idx_alunos_grupo ON alunos(grupo_campanha);
        CREATE INDEX IF NOT EXISTS idx_alunos_data_cadastro ON alunos(data_cadastro);
        CREATE INDEX IF NOT EXISTS idx_alunos_email ON alunos(email);

        -- Tabela de tracking de conversão
        CREATE TABLE IF NOT EXISTS conversion_tracking (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER REFERENCES alunos(id),
            grupo VARCHAR(20) NOT NULL,
            telefone VARCHAR(20),
            mensagem_recebida TEXT,
            score_conversao INTEGER DEFAULT 0,
            status_conversao VARCHAR(50),
            timestamp_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            webhook_data JSONB,
            alerta_enviado BOOLEAN DEFAULT FALSE,
            followup_status VARCHAR(50) DEFAULT 'pendente'
        );

        -- Tabela de log de campanhas
        CREATE TABLE IF NOT EXISTS campaign_logs (
            id SERIAL PRIMARY KEY,
            grupo VARCHAR(20),
            aluno_id INTEGER REFERENCES alunos(id),
            aluno_nome VARCHAR(255),
            telefone VARCHAR(20),
            template_usado TEXT,
            status VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_data JSONB,
            retry_count INTEGER DEFAULT 0
        );

        -- Tabela de métricas real-time
        CREATE TABLE IF NOT EXISTS metricas_realtime (
            id SERIAL PRIMARY KEY,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            grupo VARCHAR(20),
            total_enviados INTEGER DEFAULT 0,
            total_respostas INTEGER DEFAULT 0,
            total_conversoes INTEGER DEFAULT 0,
            receita_gerada DECIMAL(10,2) DEFAULT 0,
            taxa_conversao DECIMAL(5,2) DEFAULT 0
        );

        -- Tabela de alertas enviados
        CREATE TABLE IF NOT EXISTS alertas_enviados (
            id SERIAL PRIMARY KEY,
            conversion_id INTEGER REFERENCES conversion_tracking(id),
            tipo_alerta VARCHAR(50),
            destinatario VARCHAR(100),
            status VARCHAR(20) DEFAULT 'enviado',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Views para relatórios
        CREATE OR REPLACE VIEW view_dashboard_metricas AS
        SELECT
            grupo,
            COUNT(*) as total_alunos,
            COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
            COUNT(CASE WHEN status = 'inativo' THEN 1 END) as inativos,
            ROUND(COUNT(CASE WHEN status = 'ativo' THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_retencao
        FROM alunos
        GROUP BY grupo;

        CREATE OR REPLACE VIEW view_conversoes_resumo AS
        SELECT
            c.grupo,
            COUNT(*) as total_respostas,
            COUNT(CASE WHEN c.score_conversao >= 80 THEN 1 END) as conversoes_altas,
            COUNT(CASE WHEN c.score_conversao BETWEEN 50 AND 79 THEN 1 END) as conversoes_medias,
            COUNT(CASE WHEN c.score_conversao < 50 THEN 1 END) as conversoes_baixas,
            ROUND(AVG(c.score_conversao), 2) as score_medio
        FROM conversion_tracking c
        GROUP BY c.grupo;
        `;

        await this.config.database.pool.query(schema);
        console.log('✓ Estrutura do banco criada com sucesso');
    }

    /**
     * Importar dados processados para o banco PostgreSQL
     */
    async importarDadosParaBanco(dadosProcessados) {
        console.log('📥 Importando dados para PostgreSQL...');

        const { todos, ativos } = dadosProcessados;
        let importados = 0;

        // Criar set de emails ativos para classificação
        const emailsAtivos = new Set(ativos.map(a => a['E-mail']));

        for (const aluno of todos) {
            try {
                const status = emailsAtivos.has(aluno['E-mail']) ? 'ativo' : 'inativo';
                const dataCadastro = this.parseDate(aluno['Data-de-Cadastro']);
                const grupo = this.determinarGrupo(dataCadastro);

                await this.config.database.pool.query(`
                    INSERT INTO alunos (
                        nome_completo, email, telefone_1, telefone_2,
                        celular, idade, primeiro_nome, data_cadastro,
                        sexo, status, grupo_campanha
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (email) DO UPDATE SET
                        status = EXCLUDED.status,
                        grupo_campanha = EXCLUDED.grupo_campanha,
                        updated_at = CURRENT_TIMESTAMP
                `, [
                    aluno['Nome-Completo'],
                    aluno['E-mail'],
                    aluno['Telefone-1'],
                    aluno['Telefone-2'],
                    aluno['Celular'],
                    parseInt(aluno['Idade']) || null,
                    aluno['Primeiro-Nome'],
                    dataCadastro,
                    aluno['Sexo'],
                    status,
                    grupo
                ]);

                importados++;
            } catch (error) {
                console.error(`Erro ao importar aluno ${aluno['E-mail']}:`, error.message);
            }
        }

        console.log(`✓ ${importados} alunos importados para o banco`);
    }

    /**
     * Segmentar alunos por grupos baseado na análise de frequência
     */
    async segmentarAlunosPorGrupos() {
        console.log('🎯 Segmentando alunos por grupos...');

        const query = `
            SELECT
                grupo_campanha as grupo,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'inativo' THEN 1 END) as inativos,
                COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos
            FROM alunos
            GROUP BY grupo_campanha
            ORDER BY grupo_campanha
        `;

        const result = await this.config.database.pool.query(query);
        const segmentacao = result.rows;

        console.log('📊 Segmentação por grupos:');
        segmentacao.forEach(grupo => {
            console.log(`- ${grupo.grupo}: ${grupo.total} total (${grupo.inativos} inativos, ${grupo.ativos} ativos)`);
        });

        return segmentacao;
    }

    /**
     * Configurar workflows N8N com dados da segmentação
     */
    async configurarWorkflowsN8N(segmentacao) {
        console.log('⚙️ Configurando workflows N8N...');

        try {
            // Preparar dados para webhook de configuração
            const configData = {
                segmentacao: segmentacao,
                config: this.config.segmentacao,
                webhooks: {
                    criticos: `${this.config.n8n.baseUrl}/webhook/conversao/criticos`,
                    moderados: `${this.config.n8n.baseUrl}/webhook/conversao/moderados`,
                    recentes: `${this.config.n8n.baseUrl}/webhook/conversao/recentes`
                },
                database: {
                    url: process.env.DATABASE_URL
                }
            };

            // Enviar configuração para N8N via webhook
            const response = await axios.post(
                `${this.config.n8n.baseUrl}/webhook/config-campaign`,
                configData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.n8n.apiKey}`
                    }
                }
            );

            console.log('✓ Workflows N8N configurados:', response.status);
        } catch (error) {
            console.warn('⚠️ N8N não disponível - configuração manual necessária');
        }
    }

    /**
     * Validar integração completa do sistema
     */
    async validarIntegracaoCompleta() {
        console.log('🔍 Validando integração completa...');

        const validacoes = {};

        // 1. Validar dados no banco
        const totalAlunos = await this.config.database.pool.query('SELECT COUNT(*) FROM alunos');
        const totalInativos = await this.config.database.pool.query("SELECT COUNT(*) FROM alunos WHERE status = 'inativo'");

        validacoes.database = {
            totalAlunos: parseInt(totalAlunos.rows[0].count),
            totalInativos: parseInt(totalInativos.rows[0].count),
            status: 'ok'
        };

        // 2. Validar segmentação
        const grupos = await this.config.database.pool.query(`
            SELECT grupo_campanha, COUNT(*) as count
            FROM alunos
            WHERE status = 'inativo'
            GROUP BY grupo_campanha
        `);

        validacoes.segmentacao = {
            grupos: grupos.rows,
            status: grupos.rows.length === 3 ? 'ok' : 'warning'
        };

        // 3. Validar conectividade N8N
        try {
            const n8nHealth = await axios.get(`${this.config.n8n.baseUrl}/healthz`);
            validacoes.n8n = {
                status: 'ok',
                response: n8nHealth.status
            };
        } catch (error) {
            validacoes.n8n = {
                status: 'error',
                error: error.message
            };
        }

        // 4. Validar estrutura de tabelas
        const tabelas = await this.config.database.pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('alunos', 'conversion_tracking', 'campaign_logs', 'metricas_realtime')
        `);

        validacoes.tabelas = {
            encontradas: tabelas.rows.map(t => t.table_name),
            status: tabelas.rows.length === 4 ? 'ok' : 'error'
        };

        console.log('✅ Validação concluída:', JSON.stringify(validacoes, null, 2));
        return validacoes;
    }

    /**
     * Utilitários auxiliares
     */
    parseDate(dateString) {
        // Parse "13/02/2025 19:01:35" format
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        return new Date(`${year}-${month}-${day} ${timePart}`);
    }

    determinarGrupo(dataCadastro) {
        const data = new Date(dataCadastro);
        const ano = data.getFullYear();
        const mes = data.getMonth() + 1; // JavaScript months are 0-indexed

        if (ano === 2025) {
            if (mes >= 2 && mes <= 3) return 'criticos';
            if (mes >= 4 && mes <= 6) return 'moderados';
            if (mes >= 7 && mes <= 9) return 'recentes';
        }

        return 'outros'; // Fallback
    }

    /**
     * Gerar relatório final da integração
     */
    async gerarRelatorioIntegracao() {
        const stats = await this.config.database.pool.query(`
            SELECT
                'Total Alunos' as metrica, COUNT(*) as valor
            FROM alunos
            UNION ALL
            SELECT
                'Alunos Ativos', COUNT(*)
            FROM alunos WHERE status = 'ativo'
            UNION ALL
            SELECT
                'Alunos Inativos', COUNT(*)
            FROM alunos WHERE status = 'inativo'
            UNION ALL
            SELECT
                'Grupo Críticos', COUNT(*)
            FROM alunos WHERE grupo_campanha = 'criticos'
            UNION ALL
            SELECT
                'Grupo Moderados', COUNT(*)
            FROM alunos WHERE grupo_campanha = 'moderados'
            UNION ALL
            SELECT
                'Grupo Recentes', COUNT(*)
            FROM alunos WHERE grupo_campanha = 'recentes'
        `);

        return {
            timestamp: new Date().toISOString(),
            sistema: 'FullForce Academia - Integração de Dados',
            status: 'completo',
            metricas: stats.rows,
            proximos_passos: [
                'Iniciar campanha scheduler',
                'Ativar webhooks de conversão',
                'Monitorar dashboard real-time',
                'Acompanhar métricas de performance'
            ]
        };
    }
}

module.exports = DataIntegration;

// Executar se chamado diretamente
if (require.main === module) {
    const integration = new DataIntegration();
    integration.integrarDadosCompletos()
        .then(resultado => {
            console.log('🎉 Integração finalizada:', resultado);
            return integration.gerarRelatorioIntegracao();
        })
        .then(relatorio => {
            console.log('📋 Relatório Final:', JSON.stringify(relatorio, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erro crítico:', error);
            process.exit(1);
        });
}