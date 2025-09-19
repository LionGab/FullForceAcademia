const moment = require('moment');
const Queue = require('bullmq').Queue;
const Worker = require('bullmq').Worker;

class ScheduledMessages {
    constructor(whatsappService, redisConnection) {
        this.whatsappService = whatsappService;
        this.redisConnection = redisConnection || {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD
        };

        // Inicializar filas BullMQ
        this.campaignQueue = new Queue('campaign-followups', {
            connection: this.redisConnection,
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });

        this.setupWorker();
        this.followUpTemplates = this.initializeTemplates();

        console.log('✅ ScheduledMessages service initialized');
    }

    setupWorker() {
        this.worker = new Worker('campaign-followups', async (job) => {
            const { type, data } = job.data;

            switch (type) {
                case 'followup':
                    return await this.processFollowUp(data);
                case 'reminder':
                    return await this.processReminder(data);
                case 'conversion_check':
                    return await this.processConversionCheck(data);
                default:
                    throw new Error(`Tipo de job desconhecido: ${type}`);
            }
        }, {
            connection: this.redisConnection,
            concurrency: 5, // Processar até 5 jobs simultâneos
            limiter: {
                max: 10, // Máximo 10 jobs por período
                duration: 60000 // Por minuto
            }
        });

        this.worker.on('completed', (job) => {
            console.log(`✅ Job ${job.id} (${job.data.type}) completed`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Job ${job.id} (${job.data.type}) failed:`, err);
        });

        this.worker.on('progress', (job, progress) => {
            console.log(`📊 Job ${job.id} progress: ${progress}%`);
        });
    }

    initializeTemplates() {
        return {
            followup_1: {
                'CRITICA': {
                    delay: 6, // horas
                    message: (nome, dados) => `⚠️ *${nome.split(' ')[0]}*, ACABOU O TEMPO!\\n\\n🚨 Sua oferta de 60% OFF expirou\\n💔 Mas... temos uma ÚLTIMA oportunidade!\\n\\n🔥 *SUPER OFERTA RELÂMPAGO:*\\n💰 50% OFF ainda hoje\\n⏰ Até 18h - SEM EXTENSÃO\\n\\n💪 Não deixe sua saúde para amanhã!\\n\\n📞 Responda *ÚLTIMA* para garantir!`
                },
                'ALTA': {
                    delay: 12, // horas
                    message: (nome, dados) => `💪 *${nome.split(' ')[0]}*, ainda pensando?\\n\\n⚡ Sua oferta de 50% OFF termina em 12 horas\\n🎯 Cada dia sem treinar é um passo atrás\\n\\n🔥 LEMBRE-SE DOS SEUS OBJETIVOS:\\n✅ Mais energia no dia a dia\\n✅ Corpo que você sempre quis\\n✅ Saúde em primeiro lugar\\n\\n📞 Responda *VOLTO* e retome hoje!`
                },
                'MEDIA': {
                    delay: 24, // horas
                    message: (nome, dados) => `💪 *${nome.split(' ')[0]}*, vamos turbinar?\\n\\n📈 Seus resultados podem ser MUITO melhores\\n🎁 Personal + Avaliação ainda disponíveis\\n💪 Que tal marcarmos seu retorno hoje?\\n\\n🔥 Sua melhor versão está esperando!\\n\\n📞 Responda *PERSONAL* e vamos nessa!`
                },
                'BAIXA': {
                    delay: 72, // horas
                    message: (nome, dados) => `🌟 *${nome.split(' ')[0]}*, ainda interessado?\\n\\n✨ 7 dias grátis ainda disponíveis\\n💪 Academia Full Force = Resultados REAIS\\n📊 +95% dos alunos alcançam seus objetivos\\n\\n🎯 Pronto para sua transformação?\\n\\n📞 Responda *GRATIS* e comece hoje!`
                }
            },
            followup_2: {
                'CRITICA': {
                    delay: 24, // horas após primeiro follow-up
                    message: (nome, dados) => `💔 *${nome.split(' ')[0]}*, você perdeu...\\n\\n🚨 Mas sua saúde é mais importante que qualquer oferta\\n\\n💪 *NOSSA PROMESSA:*\\n✅ Vamos te ajudar a voltar\\n✅ Plano personalizado\\n✅ Acompanhamento especial\\n\\n🔥 Uma última chance: 40% OFF\\n\\n📞 Responda *VOLTO* se ainda quer mudar de vida!`
                },
                'ALTA': {
                    delay: 48, // horas após primeiro follow-up
                    message: (nome, dados) => `🎯 *${nome.split(' ')[0]}*, última tentativa...\\n\\n💭 Lembra por que você começou?\\n🏆 Lembra dos seus objetivos?\\n\\n💪 *NÃO DESISTA DOS SEUS SONHOS*\\n\\n🎁 Oferta final: 30% OFF\\n📅 Válida só até amanhã\\n\\n📞 Responda *DREAMS* e realize!`
                },
                'MEDIA': {
                    delay: 168, // 1 semana
                    message: (nome, dados) => `🏆 *${nome.split(' ')[0]}*, semana que vem?\\n\\n📅 Uma semana se passou...\\n💪 Que tal começarmos segunda-feira?\\n\\n🎁 *OFERTA SEGUNDA-FEIRA:*\\n✅ Personal grátis na primeira semana\\n✅ Avaliação completa\\n✅ Plano personalizado\\n\\n📞 Responda *SEGUNDA* e vamos nessa!`
                },
                'BAIXA': {
                    delay: 336, // 2 semanas
                    message: (nome, dados) => `💭 *${nome.split(' ')[0]}*, ainda pensando?\\n\\n🤔 2 semanas se passaram...\\n💪 Cada dia é uma oportunidade perdida\\n\\n🌟 *ÚLTIMA OFERTA DO MÊS:*\\n✅ 15 dias grátis\\n✅ Sem compromisso\\n✅ Cancela quando quiser\\n\\n📞 Responda *15DIAS* e teste!`
                }
            },
            followup_3: {
                'CRITICA': {
                    delay: 72, // 3 dias após segundo follow-up
                    message: (nome, dados) => `🙏 *${nome.split(' ')[0]}*, nossa última mensagem...\\n\\n💔 Tentamos de tudo para te ter de volta\\n🏃‍♂️ A porta da Full Force sempre estará aberta\\n\\n💪 *SE MUDAR DE IDEIA:*\\n📞 (11) 99999-9999\\n📧 contato@fullforce.com.br\\n\\n🌟 Desejamos muito sucesso em sua jornada!\\n\\n❤️ *Academia Full Force* - Sempre torcendo por você!`
                }
            },
            reminder: {
                'new_member': {
                    delay: 24, // 1 dia após conversão
                    message: (nome, dados) => `🎉 *${nome.split(' ')[0]}*, BEM-VINDO DE VOLTA!\\n\\n🔥 Que alegria ter você conosco novamente!\\n\\n📅 *PRÓXIMOS PASSOS:*\\n✅ Agende sua reavaliação\\n✅ Defina novos objetivos\\n✅ Comece o treino personalizado\\n\\n💪 Nossa equipe está preparada para te ajudar!\\n\\n📞 Qualquer dúvida, só chamar!`
                },
                'first_week': {
                    delay: 168, // 1 semana
                    message: (nome, dados) => `💪 *${nome.split(' ')[0]}*, primeira semana!\\n\\n🏆 Como foram os primeiros treinos?\\n📊 Está sentindo diferença?\\n\\n🎯 *DICAS PARA SEGUNDA SEMANA:*\\n✅ Mantenha a consistência\\n✅ Hidrate-se bem\\n✅ Descanso é importante\\n\\n🔥 Você está no caminho certo!\\n\\n📞 Alguma dúvida? Estamos aqui!`
                }
            }
        };
    }

    async scheduleFollowUp(telefone, nome, urgencia, campanha, delayHours = 24) {
        try {
            const jobData = {
                type: 'followup',
                data: {
                    telefone,
                    nome,
                    urgencia,
                    campanha,
                    followUpLevel: 1,
                    originalDelay: delayHours
                }
            };

            const job = await this.campaignQueue.add(
                `followup-${telefone}-${Date.now()}`,
                jobData,
                {
                    delay: delayHours * 60 * 60 * 1000, // converter horas para ms
                    priority: this.getPriority(urgencia),
                    jobId: `followup-${telefone}-${urgencia}-${Date.now()}`
                }
            );

            console.log(`📅 Follow-up agendado para ${nome} em ${delayHours}h (Job ID: ${job.id})`);

            // Agendar follow-ups subsequentes
            await this.scheduleSubsequentFollowUps(telefone, nome, urgencia, campanha);

            return job.id;

        } catch (error) {
            console.error('❌ Erro ao agendar follow-up:', error);
            throw error;
        }
    }

    async scheduleSubsequentFollowUps(telefone, nome, urgencia, campanha) {
        const templates = this.followUpTemplates;

        // Follow-up 2
        if (templates.followup_2[urgencia]) {
            const delay2 = templates.followup_1[urgencia].delay + templates.followup_2[urgencia].delay;

            await this.campaignQueue.add(
                `followup2-${telefone}-${Date.now()}`,
                {
                    type: 'followup',
                    data: {
                        telefone,
                        nome,
                        urgencia,
                        campanha,
                        followUpLevel: 2,
                        originalDelay: delay2
                    }
                },
                {
                    delay: delay2 * 60 * 60 * 1000,
                    priority: this.getPriority(urgencia) - 1
                }
            );
        }

        // Follow-up 3 (apenas para críticos)
        if (templates.followup_3[urgencia]) {
            const delay3 = templates.followup_1[urgencia].delay +
                          templates.followup_2[urgencia].delay +
                          templates.followup_3[urgencia].delay;

            await this.campaignQueue.add(
                `followup3-${telefone}-${Date.now()}`,
                {
                    type: 'followup',
                    data: {
                        telefone,
                        nome,
                        urgencia,
                        campanha,
                        followUpLevel: 3,
                        originalDelay: delay3
                    }
                },
                {
                    delay: delay3 * 60 * 60 * 1000,
                    priority: this.getPriority(urgencia) - 2
                }
            );
        }
    }

    async processFollowUp(data) {
        try {
            const { telefone, nome, urgencia, campanha, followUpLevel } = data;

            console.log(`🔄 Processando follow-up ${followUpLevel} para ${nome} (${urgencia})`);

            // Verificar se já converteu
            const hasConverted = await this.checkIfConverted(telefone);
            if (hasConverted) {
                console.log(`✅ ${nome} já converteu, cancelando follow-up`);
                return { status: 'cancelled', reason: 'already_converted' };
            }

            // Gerar mensagem baseada no template
            const template = this.followUpTemplates[`followup_${followUpLevel}`][urgencia];
            if (!template) {
                throw new Error(`Template não encontrado para ${urgencia} follow-up ${followUpLevel}`);
            }

            const message = template.message(nome, data);

            // Enviar mensagem
            const result = await this.whatsappService.sendMessage(
                `${telefone}@c.us`,
                message,
                { session: 'fullforce_650_followup' }
            );

            if (result.success) {
                // Log do follow-up
                await this.logFollowUp(telefone, nome, urgencia, followUpLevel, message, 'Enviado');

                console.log(`✅ Follow-up ${followUpLevel} enviado para ${nome}`);
                return {
                    status: 'sent',
                    messageId: result.messageId,
                    telefone,
                    nome,
                    followUpLevel
                };
            } else {
                throw new Error(`Falha ao enviar: ${result.error}`);
            }

        } catch (error) {
            console.error('❌ Erro ao processar follow-up:', error);

            // Log do erro
            await this.logFollowUp(
                data.telefone,
                data.nome,
                data.urgencia,
                data.followUpLevel,
                error.message,
                'Erro'
            );

            throw error;
        }
    }

    async processReminder(data) {
        try {
            const { telefone, nome, type, customMessage } = data;

            console.log(`🔔 Processando reminder ${type} para ${nome}`);

            let message;
            if (customMessage) {
                message = customMessage;
            } else {
                const template = this.followUpTemplates.reminder[type];
                if (!template) {
                    throw new Error(`Template de reminder não encontrado: ${type}`);
                }
                message = template.message(nome, data);
            }

            const result = await this.whatsappService.sendMessage(
                `${telefone}@c.us`,
                message,
                { session: 'fullforce_reminders' }
            );

            if (result.success) {
                await this.logReminder(telefone, nome, type, message, 'Enviado');
                return { status: 'sent', messageId: result.messageId };
            } else {
                throw new Error(`Falha ao enviar reminder: ${result.error}`);
            }

        } catch (error) {
            console.error('❌ Erro ao processar reminder:', error);
            await this.logReminder(data.telefone, data.nome, data.type, error.message, 'Erro');
            throw error;
        }
    }

    async processConversionCheck(data) {
        try {
            const { telefone, nome, campanha } = data;

            console.log(`🔍 Verificando conversão para ${nome}`);

            const hasConverted = await this.checkIfConverted(telefone);

            if (hasConverted) {
                // Cancelar follow-ups pendentes
                await this.cancelPendingFollowUps(telefone);

                // Agendar mensagens de boas-vindas
                await this.scheduleWelcomeSequence(telefone, nome);

                console.log(`🎉 Conversão confirmada para ${nome}!`);
                return { status: 'converted', telefone, nome };
            }

            return { status: 'not_converted', telefone, nome };

        } catch (error) {
            console.error('❌ Erro ao verificar conversão:', error);
            throw error;
        }
    }

    async scheduleReminder(telefone, nome, type, delayHours = 24, customMessage = null) {
        try {
            const job = await this.campaignQueue.add(
                `reminder-${telefone}-${type}-${Date.now()}`,
                {
                    type: 'reminder',
                    data: {
                        telefone,
                        nome,
                        type,
                        customMessage
                    }
                },
                {
                    delay: delayHours * 60 * 60 * 1000,
                    priority: 3 // Prioridade baixa para reminders
                }
            );

            console.log(`🔔 Reminder ${type} agendado para ${nome} em ${delayHours}h`);
            return job.id;

        } catch (error) {
            console.error('❌ Erro ao agendar reminder:', error);
            throw error;
        }
    }

    async scheduleWelcomeSequence(telefone, nome) {
        // Boas-vindas imediatas
        await this.scheduleReminder(telefone, nome, 'new_member', 1); // 1 hora

        // Check-in primeira semana
        await this.scheduleReminder(telefone, nome, 'first_week', 168); // 1 semana

        console.log(`👋 Sequência de boas-vindas agendada para ${nome}`);
    }

    async cancelPendingFollowUps(telefone) {
        try {
            const jobs = await this.campaignQueue.getJobs(['delayed', 'waiting']);

            let cancelled = 0;
            for (const job of jobs) {
                if (job.data?.data?.telefone === telefone && job.data?.type === 'followup') {
                    await job.remove();
                    cancelled++;
                }
            }

            console.log(`🚫 ${cancelled} follow-ups cancelados para ${telefone}`);
            return cancelled;

        } catch (error) {
            console.error('❌ Erro ao cancelar follow-ups:', error);
            return 0;
        }
    }

    async checkIfConverted(telefone) {
        try {
            // Verificar no Google Sheets se o cliente converteu
            // Implementar lógica específica baseada na estrutura da planilha

            // Por enquanto, retorna false (implementar conforme necessidade)
            return false;

        } catch (error) {
            console.error('❌ Erro ao verificar conversão:', error);
            return false;
        }
    }

    async logFollowUp(telefone, nome, urgencia, level, message, status) {
        try {
            const logData = [
                moment().format('DD/MM/YYYY HH:mm:ss'),
                telefone,
                nome,
                `Follow-up ${level}`,
                urgencia,
                message.substring(0, 100) + '...',
                status,
                'Scheduled Messages Service'
            ];

            // Implementar log no Google Sheets
            console.log(`📝 Follow-up logged: ${nome} - Level ${level} - ${status}`);

        } catch (error) {
            console.error('❌ Erro ao logar follow-up:', error);
        }
    }

    async logReminder(telefone, nome, type, message, status) {
        try {
            const logData = [
                moment().format('DD/MM/YYYY HH:mm:ss'),
                telefone,
                nome,
                `Reminder ${type}`,
                'INFO',
                message.substring(0, 100) + '...',
                status,
                'Reminder Service'
            ];

            console.log(`📝 Reminder logged: ${nome} - ${type} - ${status}`);

        } catch (error) {
            console.error('❌ Erro ao logar reminder:', error);
        }
    }

    getPriority(urgencia) {
        const priorities = {
            'CRITICA': 10,
            'ALTA': 7,
            'MEDIA': 5,
            'BAIXA': 3
        };
        return priorities[urgencia] || 1;
    }

    async getQueueStats() {
        try {
            const waiting = await this.campaignQueue.getWaiting();
            const active = await this.campaignQueue.getActive();
            const completed = await this.campaignQueue.getCompleted();
            const failed = await this.campaignQueue.getFailed();
            const delayed = await this.campaignQueue.getDelayed();

            return {
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                delayed: delayed.length,
                total: waiting.length + active.length + delayed.length
            };

        } catch (error) {
            console.error('❌ Erro ao obter stats da fila:', error);
            return null;
        }
    }

    async getUpcomingJobs(limit = 10) {
        try {
            const jobs = await this.campaignQueue.getJobs(['delayed', 'waiting'], 0, limit - 1);

            return jobs.map(job => ({
                id: job.id,
                name: job.name,
                type: job.data?.type,
                telefone: job.data?.data?.telefone,
                nome: job.data?.data?.nome,
                scheduledFor: new Date(job.processedOn + job.opts.delay),
                priority: job.opts.priority
            }));

        } catch (error) {
            console.error('❌ Erro ao obter jobs agendados:', error);
            return [];
        }
    }

    async pauseQueue() {
        await this.campaignQueue.pause();
        console.log('⏸️ Fila pausada');
    }

    async resumeQueue() {
        await this.campaignQueue.resume();
        console.log('▶️ Fila retomada');
    }

    async clearQueue() {
        await this.campaignQueue.obliterate({ force: true });
        console.log('🗑️ Fila limpa');
    }

    async close() {
        await this.worker.close();
        await this.campaignQueue.close();
        console.log('🔒 ScheduledMessages service fechado');
    }
}

module.exports = ScheduledMessages;