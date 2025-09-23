const pino = require('pino');
const moment = require('moment');
const cron = require('node-cron');

/**
 * Sistema de Follow-up Automatizado
 * Full Force Academia - Nutrição e Reativação Inteligente
 */
class FollowUpAutomation {
    constructor(databaseService, wahaService, templatesService, lgpdService) {
        this.databaseService = databaseService;
        this.wahaService = wahaService;
        this.templatesService = templatesService;
        this.lgpdService = lgpdService;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Configurações de follow-up
        this.followUpConfig = {
            // Sequências por segmento
            sequences: {
                criticos: {
                    steps: [
                        { day: 1, type: 'reinforcement', urgency: 'HIGH' },
                        { day: 3, type: 'social_proof', urgency: 'HIGH' },
                        { day: 7, type: 'value_proposition', urgency: 'MEDIUM' },
                        { day: 14, type: 'final_attempt', urgency: 'LOW' },
                        { day: 30, type: 'long_term_nurture', urgency: 'LOW' }
                    ],
                    maxAttempts: 5,
                    stopOnResponse: true
                },
                moderados: {
                    steps: [
                        { day: 2, type: 'gentle_reminder', urgency: 'MEDIUM' },
                        { day: 5, type: 'value_focus', urgency: 'MEDIUM' },
                        { day: 10, type: 'community_angle', urgency: 'LOW' },
                        { day: 21, type: 'final_offer', urgency: 'LOW' }
                    ],
                    maxAttempts: 4,
                    stopOnResponse: true
                },
                recentes: {
                    steps: [
                        { day: 3, type: 'motivation_boost', urgency: 'LOW' },
                        { day: 7, type: 'progress_reminder', urgency: 'LOW' },
                        { day: 15, type: 'support_offer', urgency: 'LOW' }
                    ],
                    maxAttempts: 3,
                    stopOnResponse: true
                },
                prospects: {
                    steps: [
                        { day: 5, type: 'education', urgency: 'LOW' },
                        { day: 15, type: 'success_stories', urgency: 'LOW' },
                        { day: 30, type: 'special_offer', urgency: 'LOW' },
                        { day: 60, type: 'final_invitation', urgency: 'LOW' }
                    ],
                    maxAttempts: 4,
                    stopOnResponse: false // Prospects podem receber nutrição contínua
                }
            },

            // Horários otimizados por segmento
            optimalTimes: {
                criticos: ['09:00', '14:00', '19:00'],
                moderados: ['10:00', '15:00', '20:00'],
                recentes: ['11:00', '16:00', '18:00'],
                prospects: ['12:00', '17:00']
            },

            // Intervalos entre mensagens
            intervals: {
                minInterval: 24 * 60 * 60 * 1000,    // 24 horas mínimo
                maxInterval: 30 * 24 * 60 * 60 * 1000 // 30 dias máximo
            },

            // Condições de parada
            stopConditions: {
                conversion: true,
                optOut: true,
                hardBounce: true,
                maxAttempts: true,
                longInactivity: 90 // 90 dias sem resposta
            }
        };

        // Estado do sistema
        this.activeFollowUps = new Map();
        this.scheduledTasks = new Map();
        this.stats = {
            totalScheduled: 0,
            totalSent: 0,
            totalResponses: 0,
            conversionsBySequence: {},
            performance: {}
        };

        // Jobs agendados
        this.cronJobs = [];
    }

    /**
     * Inicializa sistema de follow-up
     */
    async initialize() {
        try {
            this.logger.info('🔄 Inicializando Sistema de Follow-up Automatizado...');

            // Carregar follow-ups pendentes do banco
            await this.loadPendingFollowUps();

            // Configurar cron jobs
            this.setupCronJobs();

            // Configurar listeners de eventos
            this.setupEventListeners();

            this.logger.info('✅ Sistema de Follow-up inicializado com sucesso');

            return true;

        } catch (error) {
            this.logger.error('❌ Erro ao inicializar follow-up automation:', error);
            throw error;
        }
    }

    /**
     * Inicia sequência de follow-up para um lead
     */
    async startFollowUpSequence(lead, campaignId, segment = null) {
        try {
            const leadSegment = segment || lead.segment || 'prospects';
            const sequence = this.followUpConfig.sequences[leadSegment];

            if (!sequence) {
                this.logger.warn(`⚠️ Sequência não encontrada para segmento: ${leadSegment}`);
                return false;
            }

            // Verificar se já existe follow-up ativo
            const existingFollowUp = await this.getActiveFollowUp(lead.telefone);
            if (existingFollowUp) {
                this.logger.info(`🔄 Follow-up já ativo para ${lead.telefone}`);
                return false;
            }

            // Criar registro de follow-up
            const followUpId = await this.createFollowUpRecord({
                leadPhone: lead.telefone,
                leadName: lead.nome,
                campaignId: campaignId,
                segment: leadSegment,
                sequence: sequence,
                currentStep: 0,
                status: 'ACTIVE',
                startDate: moment().format('YYYY-MM-DD HH:mm:ss')
            });

            // Agendar todas as etapas da sequência
            await this.scheduleSequenceSteps(followUpId, lead, sequence);

            this.activeFollowUps.set(lead.telefone, followUpId);
            this.stats.totalScheduled++;

            this.logger.info(`🎯 Sequência de follow-up iniciada para ${lead.nome} (${leadSegment})`);

            return followUpId;

        } catch (error) {
            this.logger.error(`❌ Erro ao iniciar follow-up para ${lead.nome}:`, error);
            throw error;
        }
    }

    /**
     * Agenda todas as etapas de uma sequência
     */
    async scheduleSequenceSteps(followUpId, lead, sequence) {
        try {
            for (const [stepIndex, step] of sequence.steps.entries()) {
                const executeAt = moment().add(step.day, 'days');

                // Ajustar para horário otimizado
                const optimalTime = this.getOptimalTime(lead.segment || 'prospects');
                executeAt.hour(parseInt(optimalTime.split(':')[0]));
                executeAt.minute(parseInt(optimalTime.split(':')[1]));

                // Criar agendamento
                const scheduleId = await this.scheduleFollowUpStep({
                    followUpId: followUpId,
                    stepIndex: stepIndex,
                    stepType: step.type,
                    urgency: step.urgency,
                    executeAt: executeAt.format('YYYY-MM-DD HH:mm:ss'),
                    leadPhone: lead.telefone,
                    leadData: lead
                });

                this.logger.debug(`📅 Agendado step ${stepIndex + 1} para ${lead.nome} em ${executeAt.format('DD/MM/YYYY HH:mm')}`);
            }

        } catch (error) {
            this.logger.error(`❌ Erro ao agendar steps da sequência:`, error);
            throw error;
        }
    }

    /**
     * Executa step específico do follow-up
     */
    async executeFollowUpStep(scheduleId) {
        try {
            // Carregar dados do agendamento
            const schedule = await this.getScheduleData(scheduleId);
            if (!schedule || schedule.status !== 'PENDING') {
                return false;
            }

            const { followUpId, stepType, leadPhone, leadData, urgency } = schedule;

            // Verificar condições de parada
            const shouldStop = await this.checkStopConditions(followUpId, leadPhone);
            if (shouldStop.stop) {
                await this.stopFollowUpSequence(followUpId, shouldStop.reason);
                return false;
            }

            // Verificar LGPD
            const lgpdCheck = await this.lgpdService.canSendMessage({ telefone: leadPhone });
            if (!lgpdCheck.canSend) {
                this.logger.warn(`🛡️ Follow-up bloqueado por LGPD: ${leadPhone}`);
                await this.markScheduleCompleted(scheduleId, 'LGPD_BLOCKED');
                return false;
            }

            // Selecionar template adequado
            const template = await this.selectFollowUpTemplate(stepType, leadData, urgency);

            // Personalizar mensagem
            const personalizedMessage = this.templatesService.personalizeTemplate(template, leadData);

            // Enviar mensagem
            const sendResult = await this.wahaService.sendMessage(
                leadPhone,
                personalizedMessage.message,
                {
                    campaignId: schedule.campaignId,
                    followUpId: followUpId,
                    stepType: stepType
                }
            );

            if (sendResult.success) {
                // Marcar como enviado
                await this.markScheduleCompleted(scheduleId, 'SENT', {
                    messageId: sendResult.messageId,
                    template: template.type,
                    sentAt: moment().format('YYYY-MM-DD HH:mm:ss')
                });

                // Atualizar estatísticas
                this.stats.totalSent++;

                // Agendar verificação de resposta
                this.scheduleResponseCheck(followUpId, leadPhone, 24); // 24 horas

                this.logger.info(`✅ Follow-up enviado para ${leadPhone}: ${stepType}`);

                return true;
            } else {
                await this.markScheduleCompleted(scheduleId, 'FAILED', {
                    error: sendResult.error
                });
                return false;
            }

        } catch (error) {
            this.logger.error(`❌ Erro ao executar follow-up step:`, error);
            return false;
        }
    }

    /**
     * Verifica condições de parada da sequência
     */
    async checkStopConditions(followUpId, leadPhone) {
        try {
            // 1. Verificar conversão
            const hasConverted = await this.checkConversion(leadPhone);
            if (hasConverted) {
                return { stop: true, reason: 'CONVERSION' };
            }

            // 2. Verificar opt-out
            const isOptedOut = await this.lgpdService.checkOptOutStatus(leadPhone);
            if (isOptedOut) {
                return { stop: true, reason: 'OPT_OUT' };
            }

            // 3. Verificar resposta recente
            const hasRecentResponse = await this.checkRecentResponse(leadPhone, 7); // 7 dias
            if (hasRecentResponse) {
                const followUp = await this.getFollowUpRecord(followUpId);
                if (followUp.sequence.stopOnResponse) {
                    return { stop: true, reason: 'RESPONSE_RECEIVED' };
                }
            }

            // 4. Verificar máximo de tentativas
            const attemptCount = await this.getAttemptCount(followUpId);
            const followUp = await this.getFollowUpRecord(followUpId);
            if (attemptCount >= followUp.sequence.maxAttempts) {
                return { stop: true, reason: 'MAX_ATTEMPTS' };
            }

            // 5. Verificar inatividade longa
            const daysSinceStart = await this.getDaysSinceStart(followUpId);
            if (daysSinceStart > this.followUpConfig.stopConditions.longInactivity) {
                return { stop: true, reason: 'LONG_INACTIVITY' };
            }

            return { stop: false };

        } catch (error) {
            this.logger.error('❌ Erro ao verificar condições de parada:', error);
            return { stop: false };
        }
    }

    /**
     * Para sequência de follow-up
     */
    async stopFollowUpSequence(followUpId, reason) {
        try {
            // Atualizar status do follow-up
            if (this.databaseService) {
                await this.databaseService.query(`
                    UPDATE follow_ups
                    SET status = 'STOPPED', stop_reason = ?, stopped_at = datetime('now')
                    WHERE id = ?
                `, [reason, followUpId]);

                // Cancelar agendamentos pendentes
                await this.databaseService.query(`
                    UPDATE follow_up_schedules
                    SET status = 'CANCELLED'
                    WHERE follow_up_id = ? AND status = 'PENDING'
                `, [followUpId]);
            }

            // Remover da lista ativa
            const followUp = await this.getFollowUpRecord(followUpId);
            if (followUp) {
                this.activeFollowUps.delete(followUp.leadPhone);
            }

            this.logger.info(`⏹️ Sequência de follow-up parada: ${followUpId} (${reason})`);

        } catch (error) {
            this.logger.error(`❌ Erro ao parar sequência:`, error);
        }
    }

    /**
     * Seleciona template apropriado para follow-up
     */
    async selectFollowUpTemplate(stepType, leadData, urgency) {
        try {
            // Templates específicos de follow-up por tipo
            const followUpTemplates = {
                reinforcement: {
                    type: 'reinforcement',
                    message: `Olá {{firstName}}! 👋

Vi que você ainda não respondeu minha mensagem anterior...

${urgency === 'HIGH' ? '⚠️ ATENÇÃO: ' : ''}Sua vaga com desconto especial ainda está reservada!

Não perca esta oportunidade única de voltar a treinar na Full Force! 💪

Posso confirmar sua vaga agora?`,
                    urgency: urgency
                },

                social_proof: {
                    type: 'social_proof',
                    message: `{{firstName}}, uma atualização importante! 📢

Mais 3 ex-alunos voltaram para a academia esta semana e já estão vendo resultados incríveis! 🏆

${urgency === 'HIGH' ? '🔥 ÚLTIMA CHAMADA: ' : ''}Que tal se juntar a eles?

Sua vaga especial ainda está disponível... mas não por muito tempo!

Confirma comigo?`,
                    urgency: urgency
                },

                value_proposition: {
                    type: 'value_proposition',
                    message: `{{firstName}}, vou ser direto(a)... 💭

Investir na sua saúde é a MELHOR decisão que você pode tomar hoje.

✅ Mais energia no dia a dia
✅ Melhora na autoestima
✅ Redução do estresse
✅ Qualidade de vida superior

Por apenas R$ 64,95/mês você tem acesso a TUDO isso!

Vale mais que qualquer remédio, não acha?`,
                    urgency: urgency
                },

                final_attempt: {
                    type: 'final_attempt',
                    message: `{{firstName}}, esta é minha última mensagem... 😔

Sei que todos têm prioridades diferentes, e respeito totalmente sua decisão.

Só queria que soubesse que a porta da Full Force estará sempre aberta para você! 🚪

Se um dia decidir cuidar da sua saúde novamente, estaremos aqui.

Muito sucesso! 🌟`,
                    urgency: 'LOW'
                },

                gentle_reminder: {
                    type: 'gentle_reminder',
                    message: `Oi {{firstName}}! 😊

Só passando para relembrar nossa conversa sobre voltar a treinar...

Que tal darmos uma nova chance para seus objetivos de saúde? 🎯

A Full Force tem tudo que você precisa para alcançar seus sonhos!

Conversa comigo?`,
                    urgency: urgency
                },

                motivation_boost: {
                    type: 'motivation_boost',
                    message: `{{firstName}}, lembrete motivacional! 💪

Você já deu o primeiro passo ao considerar voltar a treinar...

Agora é só dar o segundo: aparecer na academia! 🏃‍♂️

Seus músculos, sua saúde e sua autoestima estão esperando por você!

Que tal começar esta semana?`,
                    urgency: urgency
                },

                education: {
                    type: 'education',
                    message: `{{firstName}}, você sabia? 🤔

Apenas 30 minutos de exercício por dia podem:
• Reduzir risco de doenças cardíacas em 40%
• Melhorar humor e reduzir ansiedade
• Aumentar expectativa de vida em até 5 anos

A Full Force está aqui para te ajudar a conquistar isso!

Quer saber mais?`,
                    urgency: urgency
                }
            };

            return followUpTemplates[stepType] || followUpTemplates.gentle_reminder;

        } catch (error) {
            this.logger.error('❌ Erro ao selecionar template de follow-up:', error);
            return this.getDefaultFollowUpTemplate();
        }
    }

    /**
     * Configura cron jobs para execução automática
     */
    setupCronJobs() {
        // Executar follow-ups pendentes a cada hora
        const followUpJob = cron.schedule('0 * * * *', async () => {
            await this.processPendingFollowUps();
        }, {
            scheduled: false
        });

        // Verificar respostas a cada 30 minutos
        const responseCheckJob = cron.schedule('*/30 * * * *', async () => {
            await this.checkPendingResponses();
        }, {
            scheduled: false
        });

        // Limpeza diária às 02:00
        const cleanupJob = cron.schedule('0 2 * * *', async () => {
            await this.dailyCleanup();
        }, {
            scheduled: false
        });

        this.cronJobs = [followUpJob, responseCheckJob, cleanupJob];

        // Iniciar jobs
        this.cronJobs.forEach(job => job.start());

        this.logger.info('⏰ Cron jobs de follow-up configurados');
    }

    /**
     * Processa follow-ups pendentes
     */
    async processPendingFollowUps() {
        try {
            if (!this.databaseService) return;

            // Buscar agendamentos que devem ser executados agora
            const pendingSchedules = await this.databaseService.query(`
                SELECT * FROM follow_up_schedules
                WHERE status = 'PENDING'
                AND execute_at <= datetime('now')
                ORDER BY execute_at ASC
                LIMIT 50
            `);

            this.logger.info(`🔄 Processando ${pendingSchedules?.length || 0} follow-ups pendentes`);

            for (const schedule of pendingSchedules || []) {
                await this.executeFollowUpStep(schedule.id);

                // Delay entre execuções
                await this.delay(2000);
            }

        } catch (error) {
            this.logger.error('❌ Erro ao processar follow-ups pendentes:', error);
        }
    }

    /**
     * Verifica respostas pendentes
     */
    async checkPendingResponses() {
        try {
            // Verificar respostas recebidas nas últimas 30 minutos
            for (const [phone, followUpId] of this.activeFollowUps) {
                const hasResponse = await this.checkRecentResponse(phone, 0.5); // 30 minutos
                if (hasResponse) {
                    await this.handleFollowUpResponse(followUpId, phone);
                }
            }

        } catch (error) {
            this.logger.error('❌ Erro ao verificar respostas:', error);
        }
    }

    /**
     * Trata resposta a follow-up
     */
    async handleFollowUpResponse(followUpId, phone) {
        try {
            // Registrar resposta
            if (this.databaseService) {
                await this.databaseService.query(`
                    UPDATE follow_ups
                    SET last_response_at = datetime('now'), total_responses = total_responses + 1
                    WHERE id = ?
                `, [followUpId]);
            }

            this.stats.totalResponses++;

            // Verificar se deve parar sequência
            const followUp = await this.getFollowUpRecord(followUpId);
            if (followUp?.sequence?.stopOnResponse) {
                await this.stopFollowUpSequence(followUpId, 'RESPONSE_RECEIVED');
            }

            this.logger.info(`📞 Resposta registrada para follow-up ${followUpId}`);

        } catch (error) {
            this.logger.error('❌ Erro ao tratar resposta de follow-up:', error);
        }
    }

    /**
     * Métodos auxiliares e utilitários
     */
    getOptimalTime(segment) {
        const times = this.followUpConfig.optimalTimes[segment] || ['12:00'];
        return times[Math.floor(Math.random() * times.length)];
    }

    async createFollowUpRecord(data) {
        try {
            if (!this.databaseService) return `FU_${Date.now()}`;

            const followUpId = `FU_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            await this.databaseService.query(`
                INSERT INTO follow_ups
                (id, lead_phone, lead_name, campaign_id, segment, sequence_config, current_step, status, start_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                followUpId,
                data.leadPhone,
                data.leadName,
                data.campaignId,
                data.segment,
                JSON.stringify(data.sequence),
                data.currentStep,
                data.status,
                data.startDate
            ]);

            return followUpId;

        } catch (error) {
            this.logger.error('❌ Erro ao criar registro de follow-up:', error);
            return null;
        }
    }

    async scheduleFollowUpStep(data) {
        try {
            if (!this.databaseService) return `SCHED_${Date.now()}`;

            const scheduleId = `SCHED_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            await this.databaseService.query(`
                INSERT INTO follow_up_schedules
                (id, follow_up_id, step_index, step_type, urgency, execute_at, lead_phone, lead_data, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            `, [
                scheduleId,
                data.followUpId,
                data.stepIndex,
                data.stepType,
                data.urgency,
                data.executeAt,
                data.leadPhone,
                JSON.stringify(data.leadData)
            ]);

            return scheduleId;

        } catch (error) {
            this.logger.error('❌ Erro ao agendar step:', error);
            return null;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupEventListeners() {
        // Implementar listeners de eventos
        this.logger.info('👂 Event listeners de follow-up configurados');
    }

    async loadPendingFollowUps() {
        // Carregar follow-ups ativos do banco
        this.logger.info('📂 Follow-ups pendentes carregados');
    }

    async dailyCleanup() {
        // Limpeza diária de dados antigos
        this.logger.info('🧹 Limpeza diária de follow-ups executada');
    }

    getDefaultFollowUpTemplate() {
        return {
            type: 'default',
            message: 'Olá! Não perca a oportunidade de cuidar da sua saúde na Full Force Academia!',
            urgency: 'LOW'
        };
    }

    // Placeholder methods para implementação futura
    async getActiveFollowUp(phone) { return null; }
    async getScheduleData(scheduleId) { return null; }
    async checkConversion(phone) { return false; }
    async checkRecentResponse(phone, hours) { return false; }
    async getFollowUpRecord(followUpId) { return null; }
    async getAttemptCount(followUpId) { return 0; }
    async getDaysSinceStart(followUpId) { return 0; }
    async markScheduleCompleted(scheduleId, status, data = {}) { }
    scheduleResponseCheck(followUpId, phone, hours) { }

    /**
     * API pública para relatórios
     */
    getFollowUpStats() {
        return {
            ...this.stats,
            activeSequences: this.activeFollowUps.size,
            scheduledJobs: this.cronJobs.length
        };
    }

    async generateFollowUpReport(period = 'weekly') {
        return {
            period: period,
            stats: this.getFollowUpStats(),
            performance: await this.calculateFollowUpPerformance(),
            recommendations: await this.generateFollowUpRecommendations()
        };
    }

    async calculateFollowUpPerformance() {
        return {
            responseRate: this.stats.totalSent > 0 ? this.stats.totalResponses / this.stats.totalSent : 0,
            conversionRate: 0, // Calcular baseado em conversões
            efficiency: 'HIGH' // Avaliar eficiência geral
        };
    }

    async generateFollowUpRecommendations() {
        return [
            'Otimizar horários de envio baseado em respostas',
            'Testar novos templates de follow-up',
            'Ajustar frequência por segmento'
        ];
    }
}

module.exports = FollowUpAutomation;