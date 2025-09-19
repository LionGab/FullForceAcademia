/**
 * 🎯 FULLFORCE ACADEMIA - CAMPAIGN SCHEDULER OTIMIZADO
 * Sistema de envio escalonado para 610 alunos inativos
 * ROI Target: 935% (144 reativações em 21 dias)
 */

const BullQueue = require('bull');
const cron = require('node-cron');

class CampaignScheduler {
    constructor() {
        this.config = {
            // Grupos segmentados por período de cadastro
            grupos: {
                criticos: {
                    size: 250,
                    msgsPerDay: 83,
                    dias: 3,
                    conversaoTarget: 0.15,
                    desconto: 50,
                    timing: 'semana1'
                },
                moderados: {
                    size: 200,
                    msgsPerDay: 67,
                    dias: 3,
                    conversaoTarget: 0.25,
                    desconto: 30,
                    timing: 'semana2'
                },
                recentes: {
                    size: 160,
                    msgsPerDay: 54,
                    dias: 3,
                    conversaoTarget: 0.35,
                    desconto: 0,
                    timing: 'semana3'
                }
            },
            rateLimiting: {
                maxMsgsPerDay: 100,
                intervalBetweenMessages: 864000, // 14.4 min entre msgs
                batchSize: 10,
                retryAttempts: 3
            },
            horarios: {
                inicio: '09:00',
                fim: '18:00',
                intervaloAlmoco: ['12:00', '13:00']
            }
        };

        // Inicializar filas Redis
        this.queues = {
            criticos: new BullQueue('campanha-criticos', process.env.REDIS_URL),
            moderados: new BullQueue('campanha-moderados', process.env.REDIS_URL),
            recentes: new BullQueue('campanha-recentes', process.env.REDIS_URL)
        };

        this.setupQueueProcessors();
        this.setupSchedulers();
    }

    /**
     * Configurar processadores de fila para cada grupo
     */
    setupQueueProcessors() {
        Object.entries(this.queues).forEach(([grupo, queue]) => {
            queue.process('envio-whatsapp', async (job) => {
                const { aluno, template, grupo: grupoNome } = job.data;

                try {
                    // Rate limiting check
                    const dailyCount = await this.getDailyMessageCount();
                    if (dailyCount >= this.config.rateLimiting.maxMsgsPerDay) {
                        throw new Error('Rate limit atingido para hoje');
                    }

                    // Enviar mensagem WhatsApp
                    const resultado = await this.enviarWhatsApp(aluno, template, grupoNome);

                    // Atualizar contadores
                    await this.updateDailyMessageCount();
                    await this.logCampaignActivity(grupo, aluno, resultado);

                    return resultado;
                } catch (error) {
                    console.error(`Erro envio ${grupo}:`, error);
                    throw error;
                }
            });

            // Event handlers
            queue.on('completed', (job, result) => {
                console.log(`✓ Enviado ${job.data.grupo}: ${job.data.aluno.nome}`);
            });

            queue.on('failed', (job, err) => {
                console.error(`✗ Falha ${job.data.grupo}: ${job.data.aluno.nome} - ${err.message}`);
            });
        });
    }

    /**
     * Configurar schedulers cronológicos para cada grupo
     */
    setupSchedulers() {
        // Grupo 1 - Críticos (Semana 1): 83 msgs/dia
        cron.schedule('0 9-18/2 * * 1-5', async () => {
            if (this.isWeek(1)) {
                await this.processarGrupo('criticos');
            }
        });

        // Grupo 2 - Moderados (Semana 2): 67 msgs/dia
        cron.schedule('0 9-18/2 * * 1-5', async () => {
            if (this.isWeek(2)) {
                await this.processarGrupo('moderados');
            }
        });

        // Grupo 3 - Recentes (Semana 3): 54 msgs/dia
        cron.schedule('0 9-18/2 * * 1-5', async () => {
            if (this.isWeek(3)) {
                await this.processarGrupo('recentes');
            }
        });

        console.log('🚀 Schedulers configurados para campanha 610 inativos');
    }

    /**
     * Processar envios de um grupo específico
     */
    async processarGrupo(grupoNome) {
        const grupo = this.config.grupos[grupoNome];
        const alunos = await this.getAlunosDoGrupo(grupoNome);

        console.log(`📤 Processando ${grupoNome}: ${alunos.length} alunos`);

        // Calcular delay entre envios para respeitar rate limit
        const msgsHoje = grupo.msgsPerDay;
        const horasTrabalho = 8; // 9h-18h, excluindo almoço
        const delayEntreMensagens = (horasTrabalho * 60 * 60 * 1000) / msgsHoje;

        for (let i = 0; i < Math.min(msgsHoje, alunos.length); i++) {
            const aluno = alunos[i];
            const template = this.getTemplateParaGrupo(grupoNome, aluno);

            // Agendar envio com delay apropriado
            await this.queues[grupoNome].add('envio-whatsapp', {
                aluno,
                template,
                grupo: grupoNome
            }, {
                delay: i * delayEntreMensagens,
                attempts: this.config.rateLimiting.retryAttempts,
                backoff: {
                    type: 'exponential',
                    delay: 60000 // 1 min
                }
            });
        }
    }

    /**
     * Enviar mensagem WhatsApp via N8N webhook
     */
    async enviarWhatsApp(aluno, template, grupo) {
        const payload = {
            to: aluno.telefone,
            message: template,
            grupo: grupo,
            alunoId: aluno.id,
            timestamp: new Date().toISOString()
        };

        // Webhook N8N para WhatsApp
        const response = await fetch(process.env.N8N_WEBHOOK_WHATSAPP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`N8N webhook falhou: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Buscar alunos de um grupo específico baseado em período de cadastro
     */
    async getAlunosDoGrupo(grupoNome) {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        let dateFilter;
        switch (grupoNome) {
            case 'criticos':
                dateFilter = "data_cadastro BETWEEN '2025-02-01' AND '2025-03-31'";
                break;
            case 'moderados':
                dateFilter = "data_cadastro BETWEEN '2025-04-01' AND '2025-06-30'";
                break;
            case 'recentes':
                dateFilter = "data_cadastro BETWEEN '2025-07-01' AND '2025-09-30'";
                break;
        }

        const query = `
            SELECT id, nome_completo as nome, telefone_1 as telefone, email,
                   primeiro_nome, data_cadastro, sexo
            FROM alunos
            WHERE status = 'inativo'
            AND ${dateFilter}
            AND telefone_1 IS NOT NULL
            ORDER BY data_cadastro DESC
            LIMIT ${this.config.grupos[grupoNome].size}
        `;

        const result = await pool.query(query);
        await pool.end();

        return result.rows;
    }

    /**
     * Gerar template personalizado por grupo
     */
    getTemplateParaGrupo(grupoNome, aluno) {
        const templates = {
            criticos: `🔥 Oi ${aluno.primeiro_nome}!

Sentimos sua falta na Full Force! 💪

*OFERTA ESPECIAL* para você voltar:
✅ 50% OFF na mensalidade
✅ Sem taxa de matrícula
✅ Aulas experimentais grátis

⏰ *Só até sexta-feira!*

Que tal voltarmos juntos à rotina de treinos?
Responda SIM e eu te conto todos os detalhes!

Academia Full Force - Matupá 🏋️‍♂️`,

            moderados: `💪 E aí ${aluno.primeiro_nome}!

Que saudade de você na Full Force! 😊

Preparei algo especial para seu retorno:
✅ 30% OFF na mensalidade
✅ Avaliação física grátis
✅ Acompanhamento personalizado

🎯 *Vamos retomar seus objetivos?*

Está esperando o que para voltar a treinar?
Manda um OI que te explico tudo!

Academia Full Force - Seu segundo lar! 🏠💪`,

            recentes: `Oi ${aluno.primeiro_nome}! 👋

Notei que não apareceu nos últimos treinos... Tudo bem?

🎁 *Aula experimental GRÁTIS* te esperando!
✅ Sem compromisso
✅ Horário flexível
✅ Personal trainer incluso

💬 Responde aí e vamos marcar seu retorno!

A Full Force não é a mesma sem você!
#TeamFullForce 💪🔥`
        };

        return templates[grupoNome];
    }

    /**
     * Controle de rate limiting diário
     */
    async getDailyMessageCount() {
        const Redis = require('redis');
        const redis = Redis.createClient(process.env.REDIS_URL);
        await redis.connect();

        const today = new Date().toISOString().split('T')[0];
        const count = await redis.get(`daily_messages:${today}`) || 0;

        await redis.disconnect();
        return parseInt(count);
    }

    async updateDailyMessageCount() {
        const Redis = require('redis');
        const redis = Redis.createClient(process.env.REDIS_URL);
        await redis.connect();

        const today = new Date().toISOString().split('T')[0];
        await redis.incr(`daily_messages:${today}`);
        await redis.expire(`daily_messages:${today}`, 86400); // 24h TTL

        await redis.disconnect();
    }

    /**
     * Log atividade da campanha
     */
    async logCampaignActivity(grupo, aluno, resultado) {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        await pool.query(`
            INSERT INTO campaign_logs (
                grupo, aluno_id, aluno_nome, telefone,
                status, timestamp, response_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            grupo, aluno.id, aluno.nome, aluno.telefone,
            resultado.status || 'enviado',
            new Date(),
            JSON.stringify(resultado)
        ]);

        await pool.end();
    }

    /**
     * Verificar se estamos na semana correta para o grupo
     */
    isWeek(weekNumber) {
        const startDate = new Date(process.env.CAMPAIGN_START_DATE || '2025-09-23');
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.ceil(diffDays / 7);

        return currentWeek === weekNumber;
    }

    /**
     * Relatório de progresso da campanha
     */
    async getProgressReport() {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        const stats = await pool.query(`
            SELECT
                grupo,
                COUNT(*) as total_enviados,
                COUNT(CASE WHEN response_data::json->>'status' = 'entregue' THEN 1 END) as entregues,
                COUNT(CASE WHEN response_data::json->>'status' = 'lido' THEN 1 END) as lidos
            FROM campaign_logs
            WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY grupo
        `);

        await pool.end();
        return stats.rows;
    }

    /**
     * Iniciar campanha manualmente
     */
    async startCampaign() {
        console.log('🚀 Iniciando Campanha 610 Inativos - FullForce Academia');
        console.log('📊 Target: 144 reativações em 21 dias (ROI 935%)');

        // Verificar configurações
        const dailyCount = await this.getDailyMessageCount();
        console.log(`📈 Mensagens hoje: ${dailyCount}/${this.config.rateLimiting.maxMsgsPerDay}`);

        // Forçar processamento imediato para teste
        await this.processarGrupo('criticos');
    }
}

module.exports = CampaignScheduler;

// Se executado diretamente, iniciar campanha
if (require.main === module) {
    const scheduler = new CampaignScheduler();
    scheduler.startCampaign();
}