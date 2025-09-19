const moment = require('moment');
const axios = require('axios');

class ReactivationCampaigns {
    constructor(sheetsService, whatsappService) {
        this.sheetsService = sheetsService;
        this.whatsappService = whatsappService;
        this.campaigns = new Map();
        this.analytics = new Map();

        // Configurações de campanha
        this.config = {
            avgMonthlyValue: 129.90,
            conversionRates: {
                criticos: 0.35,    // 35% conversão críticos
                moderados: 0.25,   // 25% conversão moderados
                baixaFreq: 0.15,   // 15% conversão baixa freq
                prospects: 0.08    // 8% conversão prospects
            },
            followUpDelays: {
                'CRITICA': [0.25, 1, 3],    // 6h, 1 dia, 3 dias (em dias)
                'ALTA': [0.5, 2, 7],        // 12h, 2 dias, 1 semana
                'MEDIA': [1, 7],            // 1 dia, 1 semana
                'BAIXA': [3, 14]            // 3 dias, 2 semanas
            }
        };
    }

    async load650InactiveMembers() {
        try {
            console.log('📊 Carregando 650 alunos inativos...');

            const data = await this.sheetsService.getRange('Alunos_Inativos!A:L');

            if (!data || data.length <= 1) {
                throw new Error('Nenhum aluno inativo encontrado na planilha');
            }

            const headers = data[0];
            const members = data.slice(1).map((row, index) => ({
                index: index + 1,
                nome: row[0] || `Aluno_${index + 1}`,
                telefone: (row[1] || '').replace(/\\D/g, ''),
                email: row[2] || '',
                plano: row[3] || 'Básico',
                valorPlano: parseFloat(row[4]) || this.config.avgMonthlyValue,
                ultimaAtividade: row[5] || '',
                frequenciaMensal: parseInt(row[6]) || 0,
                motivoInatividade: row[7] || 'Não informado',
                dataCadastro: row[8] || '',
                status: row[9] || 'Inativo',
                observacoes: row[10] || '',
                campanhaAnterior: row[11] || 'Nunca'
            }));

            console.log(`✅ ${members.length} alunos carregados com sucesso`);
            return members;

        } catch (error) {
            console.error('❌ Erro ao carregar alunos inativos:', error);
            throw error;
        }
    }

    segmentMembers(members) {
        console.log('🎯 Iniciando segmentação inteligente...');

        const today = new Date();
        const thirtyDays = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDays = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
        const ninetyDays = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

        const segments = {
            criticos: [],      // +90 dias sem atividade
            moderados: [],     // 60-90 dias sem atividade
            baixaFreq: [],     // 30-60 dias ou baixa frequência
            prospects: [],     // Leads frios
            excluded: []       // Números inválidos
        };

        let totalPotentialRevenue = 0;

        members.forEach(member => {
            // Validação de telefone
            if (!member.telefone || member.telefone.length < 10) {
                segments.excluded.push({
                    ...member,
                    motivo: 'Telefone inválido'
                });
                return;
            }

            // Calcular dias de inatividade
            const ultimaAtividade = new Date(member.ultimaAtividade || member.dataCadastro);
            const diasInativo = Math.floor((today - ultimaAtividade) / (1000 * 60 * 60 * 24));

            const baseData = {
                ...member,
                telefone: member.telefone.startsWith('55') ? member.telefone : `55${member.telefone}`,
                diasInativo,
                ultimaAtividadeDate: ultimaAtividade
            };

            // Segmentação estratégica
            if (diasInativo >= 90) {
                const expectedRevenue = member.valorPlano * this.config.conversionRates.criticos * 6;
                totalPotentialRevenue += expectedRevenue;

                segments.criticos.push({
                    ...baseData,
                    urgencia: 'CRITICA',
                    prioridade: 1,
                    oferta: `VOLTA POR R$ ${(member.valorPlano * 0.4).toFixed(2)} - 60% OFF!`,
                    desconto: 60,
                    mensagemTipo: 'critica_urgente',
                    followUpDias: this.config.followUpDelays.CRITICA,
                    expectedRevenue,
                    conversionRate: this.config.conversionRates.criticos
                });
            } else if (diasInativo >= 60) {
                const expectedRevenue = member.valorPlano * this.config.conversionRates.moderados * 6;
                totalPotentialRevenue += expectedRevenue;

                segments.moderados.push({
                    ...baseData,
                    urgencia: 'ALTA',
                    prioridade: 2,
                    oferta: `${member.nome.split(' ')[0]}, volta com 50% OFF!`,
                    desconto: 50,
                    mensagemTipo: 'moderada_alta',
                    followUpDias: this.config.followUpDelays.ALTA,
                    expectedRevenue,
                    conversionRate: this.config.conversionRates.moderados
                });
            } else if (diasInativo >= 30 || member.frequenciaMensal < 8) {
                const expectedRevenue = member.valorPlano * this.config.conversionRates.baixaFreq * 6;
                totalPotentialRevenue += expectedRevenue;

                segments.baixaFreq.push({
                    ...baseData,
                    urgencia: 'MEDIA',
                    prioridade: 3,
                    oferta: 'Personal Trainer GRÁTIS + Reavaliação',
                    desconto: 0,
                    mensagemTipo: 'retencao_engajamento',
                    followUpDias: this.config.followUpDelays.MEDIA,
                    expectedRevenue,
                    conversionRate: this.config.conversionRates.baixaFreq
                });
            } else {
                const expectedRevenue = member.valorPlano * this.config.conversionRates.prospects * 3;
                totalPotentialRevenue += expectedRevenue;

                segments.prospects.push({
                    ...baseData,
                    urgencia: 'BAIXA',
                    prioridade: 4,
                    oferta: '7 dias GRÁTIS + Avaliação Física',
                    desconto: 0,
                    mensagemTipo: 'prospect_conversao',
                    followUpDias: this.config.followUpDelays.BAIXA,
                    expectedRevenue,
                    conversionRate: this.config.conversionRates.prospects
                });
            }
        });

        // Calcular métricas ROI
        const totalInvestment = 1500;
        const projectedROI = ((totalPotentialRevenue - totalInvestment) / totalInvestment) * 100;
        const expectedNewMembers = Math.floor(
            (segments.criticos.length * this.config.conversionRates.criticos) +
            (segments.moderados.length * this.config.conversionRates.moderados) +
            (segments.baixaFreq.length * this.config.conversionRates.baixaFreq) +
            (segments.prospects.length * this.config.conversionRates.prospects)
        );

        const summary = {
            totalProcessados: members.length,
            criticos: segments.criticos.length,
            moderados: segments.moderados.length,
            baixaFreq: segments.baixaFreq.length,
            prospects: segments.prospects.length,
            excluidos: segments.excluded.length,
            potentialRevenue: totalPotentialRevenue.toFixed(2),
            investment: totalInvestment,
            projectedROI: projectedROI.toFixed(0),
            expectedNewMembers,
            timestamp: moment().toISOString()
        };

        console.log('✅ Segmentação concluída:', summary);

        return { segments, summary };
    }

    generateCampaignMessage(member, tipo = 'inicial') {
        const primeiroNome = member.nome.split(' ')[0];

        const templates = {
            critica_urgente: {
                inicial: `🚨 *${primeiroNome}*, ÚLTIMA CHANCE!\\n\\n💔 ${member.diasInativo} dias sem você... SENTIMOS MUITO SUA FALTA!\\n\\n🔥 *OFERTA EXCLUSIVA - SÓ HOJE:*\\n💰 ${member.oferta}\\n⏰ *Expira em 6 HORAS*\\n\\n💪 Sua saúde não pode esperar mais!\\n\\n📞 Responda *SIM* agora ou perca para sempre!\\n\\n🏃‍♂️ *Academia Full Force* - Sua volta é nossa vitória!`,
                followup1: `⚠️ *${primeiroNome}*, ACABOU O TEMPO!\\n\\n🚨 Sua oferta de 60% OFF expirou\\n💔 Mas... temos uma ÚLTIMA oportunidade!\\n\\n🔥 *SUPER OFERTA RELÂMPAGO:*\\n💰 50% OFF ainda hoje\\n⏰ Até 18h - SEM EXTENSÃO\\n\\n💪 Não deixe sua saúde para amanhã!\\n\\n📞 Responda *ÚLTIMA* para garantir!`,
                followup2: `💔 *${primeiroNome}*, você perdeu...\\n\\n🚨 Mas sua saúde é mais importante que qualquer oferta\\n\\n💪 *NOSSA PROMESSA:*\\n✅ Vamos te ajudar a voltar\\n✅ Plano personalizado\\n✅ Acompanhamento especial\\n\\n🔥 Uma última chance: 40% OFF\\n\\n📞 Responda *VOLTO* se ainda quer mudar de vida!`
            },
            moderada_alta: {
                inicial: `💪 *${primeiroNome}*, que saudades!\\n\\n🎯 ${member.diasInativo} dias é muito tempo sem treinar...\\n\\n🔥 *SUA OFERTA ESPECIAL:*\\n💰 ${member.oferta}\\n📅 *Válida por 48 horas*\\n\\n✨ Vamos retomar sua evolução juntos?\\n\\nSeus músculos estão esperando! 💪\\n\\n📞 Responda *SIM* e volte hoje mesmo!\\n\\n🏃‍♂️ *Academia Full Force* - Sua transformação continua aqui!`,
                followup1: `💪 *${primeiroNome}*, ainda pensando?\\n\\n⚡ Sua oferta de 50% OFF termina em 12 horas\\n🎯 Cada dia sem treinar é um passo atrás\\n\\n🔥 LEMBRE-SE DOS SEUS OBJETIVOS:\\n✅ Mais energia no dia a dia\\n✅ Corpo que você sempre quis\\n✅ Saúde em primeiro lugar\\n\\n📞 Responda *VOLTO* e retome hoje!`,
                followup2: `🎯 *${primeiroNome}*, última tentativa...\\n\\n💭 Lembra por que você começou?\\n🏆 Lembra dos seus objetivos?\\n\\n💪 *NÃO DESISTA DOS SEUS SONHOS*\\n\\n🎁 Oferta final: 30% OFF\\n📅 Válida só até amanhã\\n\\n📞 Responda *DREAMS* e realize!`
            },
            retencao_engajamento: {
                inicial: `🏆 *${primeiroNome}*, você é especial!\\n\\n📊 Notamos que sua frequência pode melhorar...\\n\\n🎁 *PRESENTE EXCLUSIVO PARA VOCÊ:*\\n💰 ${member.oferta}\\n🏋️ Vamos maximizar seus resultados?\\n\\n💪 Que tal um treino hoje mesmo?\\n\\nSua dedicação merece mais! 🔥\\n\\n📞 Responda *SIM* para agendar!\\n\\n🏃‍♂️ *Academia Full Force* - Juntos somos mais fortes!`,
                followup1: `💪 *${primeiroNome}*, vamos turbinar?\\n\\n📈 Seus resultados podem ser MUITO melhores\\n🎁 Personal + Avaliação ainda disponíveis\\n💪 Que tal marcarmos seu retorno hoje?\\n\\n🔥 Sua melhor versão está esperando!\\n\\n📞 Responda *PERSONAL* e vamos nessa!`
            },
            prospect_conversao: {
                inicial: `🌟 *${primeiroNome}*, hora da transformação!\\n\\n💪 A melhor versão de você está esperando!\\n\\n🎁 *OFERTA IMPERDÍVEL:*\\n💰 ${member.oferta}\\n🏋️ Equipamentos de última geração\\n👨‍🏫 Professores especializados\\n📊 Resultados comprovados\\n\\n🔥 Pronto para a mudança real?\\n\\n📞 Responda *SIM* e comece HOJE!\\n\\n🏃‍♂️ *Academia Full Force* - Onde sonhos viram realidade!`,
                followup1: `🌟 *${primeiroNome}*, ainda interessado?\\n\\n✨ 7 dias grátis ainda disponíveis\\n💪 Academia Full Force = Resultados REAIS\\n📊 +95% dos alunos alcançam seus objetivos\\n\\n🎯 Pronto para sua transformação?\\n\\n📞 Responda *GRATIS* e comece hoje!`
            }
        };

        const template = templates[member.mensagemTipo] || templates.prospect_conversao;
        return template[tipo] || template.inicial;
    }

    async executeCampaign(segments, options = {}) {
        console.log('🚀 Executando campanha para 650 inativos...');

        const {
            triggerN8N = true,
            directSend = false,
            batchSize = 50,
            delayBetweenBatches = 30000 // 30 segundos
        } = options;

        const results = {
            sent: 0,
            errors: 0,
            details: [],
            timestamp: moment().toISOString()
        };

        if (triggerN8N) {
            // Trigger N8N workflow
            await this.triggerN8NWorkflow(segments);
        }

        if (directSend) {
            // Envio direto (backup)
            await this.directCampaignSend(segments, batchSize, delayBetweenBatches, results);
        }

        // Log campanha no Google Sheets
        await this.logCampaignExecution(segments, results);

        console.log('✅ Campanha executada:', results);
        return results;
    }

    async triggerN8NWorkflow(segments) {
        try {
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_650_URL ||
                'http://localhost:5678/webhook/fullforce-650-campaign';

            console.log('📡 Triggering N8N workflow...');

            const response = await axios.post(n8nWebhookUrl, {
                trigger: 'campaign_650',
                segments: {
                    criticos: segments.criticos.length,
                    moderados: segments.moderados.length,
                    baixaFreq: segments.baixaFreq.length,
                    prospects: segments.prospects.length
                },
                timestamp: moment().toISOString(),
                source: 'reactivation-campaigns-service'
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ N8N workflow triggered:', response.status);
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao triggerar N8N workflow:', error);
            throw error;
        }
    }

    async directCampaignSend(segments, batchSize, delayBetweenBatches, results) {
        console.log('📱 Iniciando envio direto...');

        // Processar por prioridade
        const allMembers = [
            ...segments.criticos,
            ...segments.moderados,
            ...segments.baixaFreq,
            ...segments.prospects
        ].sort((a, b) => a.prioridade - b.prioridade);

        for (let i = 0; i < allMembers.length; i += batchSize) {
            const batch = allMembers.slice(i, i + batchSize);

            console.log(`📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(allMembers.length/batchSize)}`);

            await Promise.all(batch.map(async (member, index) => {
                try {
                    const delay = index * 2000; // 2 segundos entre mensagens
                    await new Promise(resolve => setTimeout(resolve, delay));

                    const message = this.generateCampaignMessage(member, 'inicial');

                    const result = await this.whatsappService.sendMessage(
                        `${member.telefone}@c.us`,
                        message,
                        { session: 'fullforce_650' }
                    );

                    if (result.success) {
                        results.sent++;
                        results.details.push({
                            telefone: member.telefone,
                            nome: member.nome,
                            status: 'Enviado',
                            messageId: result.messageId
                        });
                    } else {
                        results.errors++;
                        results.details.push({
                            telefone: member.telefone,
                            nome: member.nome,
                            status: 'Erro',
                            error: result.error
                        });
                    }

                } catch (error) {
                    console.error(`❌ Erro ao enviar para ${member.nome}:`, error);
                    results.errors++;
                    results.details.push({
                        telefone: member.telefone,
                        nome: member.nome,
                        status: 'Erro',
                        error: error.message
                    });
                }
            }));

            // Delay entre lotes
            if (i + batchSize < allMembers.length) {
                console.log(`⏸️ Aguardando ${delayBetweenBatches/1000}s antes do próximo lote...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
    }

    async logCampaignExecution(segments, results) {
        try {
            const summary = {
                data: moment().format('DD/MM/YYYY HH:mm:ss'),
                tipo: 'Campanha 650 Inativos',
                criticos: segments.criticos.length,
                moderados: segments.moderados.length,
                baixaFreq: segments.baixaFreq.length,
                prospects: segments.prospects.length,
                totalEnviados: results.sent,
                totalErros: results.errors,
                status: 'Executado',
                observacoes: `ROI projetado: 11.700% | N8N Integration`
            };

            await this.sheetsService.appendRow('Campanhas_Historico', Object.values(summary));
            console.log('✅ Campanha logada no Google Sheets');

        } catch (error) {
            console.error('❌ Erro ao logar campanha:', error);
        }
    }

    async getSegmentAnalytics(segmentName) {
        try {
            const logs = await this.sheetsService.getRange('Campanhas_Log!A:K');
            const segmentLogs = logs.filter(log => log[3]?.includes(segmentName));

            return {
                segment: segmentName,
                totalSent: segmentLogs.length,
                lastCampaign: segmentLogs[segmentLogs.length - 1]?.[4], // data_envio
                conversionRate: await this.calculateConversionRate(segmentName),
                revenue: await this.calculateSegmentRevenue(segmentName)
            };

        } catch (error) {
            console.error(`❌ Erro ao obter analytics do segmento ${segmentName}:`, error);
            return null;
        }
    }

    async calculateConversionRate(segmentName) {
        // Implementar cálculo de conversão real
        // Por enquanto, retorna taxa projetada
        return this.config.conversionRates[segmentName] || 0;
    }

    async calculateSegmentRevenue(segmentName) {
        // Implementar cálculo de receita real
        // Por enquanto, retorna 0
        return 0;
    }

    async getCampaignStatus() {
        return {
            active: this.campaigns.size > 0,
            totalCampaigns: this.campaigns.size,
            lastExecution: await this.getLastExecutionTime(),
            nextScheduled: await this.getNextScheduledTime(),
            analytics: await this.getAllSegmentAnalytics()
        };
    }

    async getLastExecutionTime() {
        try {
            const logs = await this.sheetsService.getRange('Campanhas_Historico!A:I');
            const lastLog = logs[logs.length - 1];
            return lastLog?.[0] || null; // data
        } catch (error) {
            return null;
        }
    }

    async getNextScheduledTime() {
        // Implementar lógica de próxima execução agendada
        return null;
    }

    async getAllSegmentAnalytics() {
        const segments = ['criticos', 'moderados', 'baixaFreq', 'prospects'];
        const analytics = {};

        for (const segment of segments) {
            analytics[segment] = await this.getSegmentAnalytics(segment);
        }

        return analytics;
    }
}

module.exports = ReactivationCampaigns;