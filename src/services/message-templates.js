const pino = require('pino');
const moment = require('moment');

/**
 * Sistema de Templates de Mensagens Personalizadas
 * Full Force Academia - Otimizado para Máxima Conversão
 */
class MessageTemplates {
    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Templates otimizados por segmento baseados em dados reais
        this.templates = {
            criticos: this.getCriticosTemplates(),
            moderados: this.getModeradosTemplates(),
            recentes: this.getRecentesTemplates(),
            prospects: this.getProspectsTemplates()
        };

        // Templates de follow-up
        this.followUpTemplates = {
            day1: this.getDay1Templates(),
            day3: this.getDay3Templates(),
            day7: this.getDay7Templates(),
            day14: this.getDay14Templates(),
            day30: this.getDay30Templates()
        };

        // Templates para diferentes horários
        this.timeBasedTemplates = {
            morning: this.getMorningTemplates(),
            afternoon: this.getAfternoonTemplates(),
            evening: this.getEveningTemplates()
        };

        // Emojis estratégicos para engajamento
        this.emojis = {
            fire: '🔥',
            muscle: '💪',
            star: '⭐',
            heart: '❤️',
            trophy: '🏆',
            timer: '⏰',
            money: '💰',
            gift: '🎁',
            warning: '⚠️',
            success: '✅',
            rocket: '🚀',
            target: '🎯'
        };
    }

    /**
     * Templates para CRÍTICOS (Inativos há 6+ meses) - 50% desconto
     */
    getCriticosTemplates() {
        return {
            // Template A - Urgência + Nostalgia
            urgencia_nostalgia: {
                subject: "Sua vaga está sendo reservada por mais 24h...",
                message: `Oi {{firstName}}! ${this.emojis.warning}

Sou da Full Force Academia e tenho uma notícia URGENTE para você!

Descobri que você já foi nosso aluno e decidimos fazer algo especial: ${this.emojis.gift}

${this.emojis.fire} OFERTA EXCLUSIVA - APENAS 24 HORAS:
- 50% OFF na mensalidade (de R$ 129,90 por R$ 64,95)
- Sem taxa de matrícula
- Acesso a TODAS as modalidades

${this.emojis.muscle} Lembra dos seus objetivos? Este é o momento perfeito para retomar!

Posso reservar sua vaga agora? Só tenho 3 vagas com esse desconto.`,

                cta: "Quero minha vaga com 50% OFF!",
                discount: 50,
                urgency: "24 horas",
                personalizedElements: ["firstName", "academiaHistory"]
            },

            // Template B - Social Proof + Transformação
            social_proof: {
                subject: "Paulo e Marina já voltaram... e você?",
                message: `{{firstName}}, uma pergunta rápida: ${this.emojis.target}

Você lembra quando treinava conosco na Full Force?

Tenho uma novidade incrível: Paulo e Marina (você deve lembrar deles) voltaram para a academia no mês passado e já estão com resultados INCRÍVEIS! ${this.emojis.trophy}

${this.emojis.fire} E criamos uma condição especial para ex-alunos como você:

✅ 50% OFF na primeira mensalidade
✅ Plano personalizado para retomada
✅ Acompanhamento individual nas primeiras semanas

Que tal retomar onde você parou? Só precisa me confirmar e hoje mesmo organizamos tudo!`,

                cta: "Sim, quero voltar a treinar!",
                discount: 50,
                socialProof: true,
                personalizedElements: ["firstName", "formerClassmates"]
            },

            // Template C - Problema + Solução Urgente
            problema_solucao: {
                subject: "{{firstName}}, precisamos conversar sobre sua saúde...",
                message: `{{firstName}}, descobri algo preocupante... ${this.emojis.warning}

Você sabia que ficar mais de 6 meses sem exercícios pode:
- Reduzir sua expectativa de vida em até 3 anos
- Aumentar risco de doenças cardíacas em 40%
- Diminuir sua disposição e energia no dia a dia

${this.emojis.heart} MAS TENHO A SOLUÇÃO:

Criamos um programa especial de RETOMADA para ex-alunos:
${this.emojis.rocket} 50% OFF no primeiro mês (R$ 64,95)
${this.emojis.muscle} Treino adaptado para recomeço
${this.emojis.star} Suporte total da nossa equipe

Não deixe sua saúde para depois. Posso agendar sua avaliação hoje?`,

                cta: "Sim, quero cuidar da minha saúde!",
                discount: 50,
                healthFocus: true,
                personalizedElements: ["firstName", "healthConcerns"]
            }
        };
    }

    /**
     * Templates para MODERADOS (Inativos há 3-6 meses) - 30% desconto
     */
    getModeradosTemplates() {
        return {
            // Template A - Retomada + Incentivo
            retomada_incentivo: {
                subject: "Hora de retomar, {{firstName}}!",
                message: `E aí {{firstName}}! ${this.emojis.muscle}

Notei que você parou de treinar há alguns meses... acontece com todo mundo! ${this.emojis.heart}

Mas tenho uma proposta irresistível para você voltar aos treinos:

${this.emojis.gift} VOLTA POR CIMA - OFERTA ESPECIAL:
- 30% OFF na mensalidade (de R$ 129,90 por R$ 90,93)
- Plano de retomada personalizado
- 1 semana grátis para readaptação

${this.emojis.fire} Seus músculos estão pedindo movimento e eu sei que você sente falta!

Que tal recomeçar esta semana? Tenho horários perfeitos para sua rotina!`,

                cta: "Vamos retomar os treinos!",
                discount: 30,
                motivational: true,
                personalizedElements: ["firstName", "lastWorkoutDate"]
            },

            // Template B - Comunidade + Pertencimento
            comunidade: {
                subject: "A turma está sentindo sua falta...",
                message: `{{firstName}}, confesso que a galera da Full Force está sentindo sua falta! ${this.emojis.heart}

Ontem mesmo o pessoal perguntou sobre você... ${this.emojis.muscle}

Que tal uma volta triunfal? Preparei uma condição especial:

${this.emojis.star} REENCONTRO FULL FORCE:
✅ 30% de desconto na mensalidade
✅ Volta com os amigos que você já conhece
✅ Modalidades novas que você vai amar

${this.emojis.trophy} Imagina a sensação de conquista quando você voltar mais forte!

Posso contar com você para esta semana?`,

                cta: "Sim, quero rever a galera!",
                discount: 30,
                community: true,
                personalizedElements: ["firstName", "workoutBuddies"]
            }
        };
    }

    /**
     * Templates para RECENTES (Inativos há menos de 3 meses) - Sem desconto
     */
    getRecentesTemplates() {
        return {
            // Template A - Continuidade + Motivação
            continuidade: {
                subject: "{{firstName}}, não pare agora que estava indo tão bem!",
                message: `{{firstName}}, tudo bem? ${this.emojis.muscle}

Percebi que você parou de treinar há algumas semanas... ${this.emojis.timer}

Cara, você estava EVOLUINDO MUITO! Seria uma pena perder todo o progresso que conquistou, não acha?

${this.emojis.fire} VAMOS RETOMAR JUNTOS:
- Seus treinos já estão programados
- Mesmo horário que você gostava
- Acompanhamento para não perder o ritmo

${this.emojis.target} Lembra do seu objetivo? Estamos quase lá!

Que tal voltar amanhã mesmo? Te espero no horário de sempre!`,

                cta: "Sim, vou voltar amanhã!",
                discount: 0,
                continuity: true,
                personalizedElements: ["firstName", "lastGoals", "preferredTime"]
            },

            // Template B - Progresso Perdido + Urgência Suave
            progresso: {
                subject: "Seus ganhos estão esperando você...",
                message: `Oi {{firstName}}! ${this.emojis.star}

Sabe aquela evolução que você estava tendo? Ela está te esperando para continuar! ${this.emojis.trophy}

${this.emojis.warning} Estudos mostram que após 3 semanas parado, você pode perder até 25% dos ganhos...

MAS a boa notícia é que com você foi só uma pausa! ${this.emojis.rocket}

${this.emojis.muscle} VOLTA CHAMPIONS:
- Retoma exatamente onde parou
- Treino adaptado para reativação
- Acompanhamento especial primeira semana

Não deixa os ganhos irem embora... Volta comigo?`,

                cta: "Não vou perder meus ganhos!",
                discount: 0,
                progressFocus: true,
                personalizedElements: ["firstName", "previousGains"]
            }
        };
    }

    /**
     * Templates para PROSPECTS (Novos contatos) - 15% desconto
     */
    getProspectsTemplates() {
        return {
            // Template A - Primeira Impressão + Valor
            primeira_impressao: {
                subject: "{{firstName}}, que tal conhecer a Full Force?",
                message: `Oi {{firstName}}! ${this.emojis.star}

Meu nome é [NOME], sou da Full Force Academia aqui em Matupá!

Soube que você tem interesse em cuidar da saúde e forma física... ${this.emojis.muscle}

${this.emojis.gift} OFERTA DE BOAS-VINDAS:
- 15% OFF no primeiro mês
- Avaliação física gratuita
- 3 dias experimentais sem compromisso

${this.emojis.fire} O que faz a Full Force ser especial?
✅ Equipamentos modernos
✅ Professores qualificados
✅ Ambiente motivador e acolhedor

Que tal conhecer nossa estrutura? Posso agendar uma visita para você hoje?`,

                cta: "Quero conhecer a academia!",
                discount: 15,
                introduction: true,
                personalizedElements: ["firstName"]
            },

            // Template B - Transformação + Sonhos
            transformacao: {
                subject: "Seus objetivos de forma física são possíveis!",
                message: `{{firstName}}, posso fazer uma pergunta? ${this.emojis.target}

Qual é o seu maior sonho relacionado à sua forma física?

${this.emojis.muscle} Perder peso?
${this.emojis.trophy} Ganhar massa muscular?
${this.emojis.heart} Melhorar a saúde?
${this.emojis.rocket} Aumentar a disposição?

QUALQUER QUE SEJA, posso te ajudar a conquistar na Full Force! ${this.emojis.fire}

${this.emojis.gift} OFERTA ESPECIAL PARA NOVOS ALUNOS:
- 15% de desconto no primeiro mês
- Plano personalizado para SEU objetivo
- Acompanhamento semanal de resultados

Vamos transformar seus sonhos em realidade? Quando posso te mostrar como?`,

                cta: "Quero realizar meus objetivos!",
                discount: 15,
                dreamFocus: true,
                personalizedElements: ["firstName", "fitnessGoals"]
            }
        };
    }

    /**
     * Templates de Follow-up por dias
     */
    getDay1Templates() {
        return {
            nao_respondeu: {
                message: `{{firstName}}, vi que você não conseguiu responder minha mensagem... ${this.emojis.timer}

Sem problemas! Sei que a vida é corrida! ${this.emojis.muscle}

Mas não queria que você perdesse essa oportunidade única...

A vaga com desconto ainda está reservada para você até amanhã!

Posso ligar rapidinho para explicar melhor? Só 2 minutinhos! ${this.emojis.star}`,
                cta: "Sim, pode ligar!"
            }
        };
    }

    getDay3Templates() {
        return {
            ultima_chance: {
                message: `{{firstName}}, esta é realmente a ÚLTIMA CHANCE! ${this.emojis.warning}

Amanhã as vagas com desconto vão para a lista de espera...

${this.emojis.fire} Você ainda quer garantir a sua?

Basta confirmar e hoje mesmo organizamos tudo para você!

Não deixe essa oportunidade passar... ${this.emojis.heart}`,
                cta: "SIM! Quero minha vaga!"
            }
        };
    }

    getDay7Templates() {
        return {
            valor_diferente: {
                message: `{{firstName}}, entendo que talvez o momento não seja ideal... ${this.emojis.heart}

Mas e se eu conseguisse uma condição AINDA MELHOR para você?

${this.emojis.gift} Que tal conversarmos sobre um plano que caiba no seu orçamento?

Na Full Force, acreditamos que TODOS merecem cuidar da saúde!

Posso ligar para conversarmos? Tenho certeza que encontramos uma solução! ${this.emojis.star}`,
                cta: "Vamos conversar!"
            }
        };
    }

    getDay14Templates() {
        return {
            amizade_longa: {
                message: `{{firstName}}, queria ser honesto com você... ${this.emojis.heart}

Não estou mais te chamando só para vender um plano.

Estou genuinamente preocupado com sua saúde e bem-estar.

${this.emojis.muscle} Sedentarismo é um dos maiores inimigos da nossa geração...

Se não for conosco, pelo menos comece a se movimentar em algum lugar, ok?

${this.emojis.star} Mas se quiser nossa ajuda, estaremos sempre aqui para você!`,
                cta: "Obrigado pela preocupação!"
            }
        };
    }

    getDay30Templates() {
        return {
            porta_aberta: {
                message: `{{firstName}}, última mensagem minha (prometo!)... ${this.emojis.heart}

Só queria que soubesse que a porta da Full Force estará SEMPRE aberta para você!

${this.emojis.muscle} Quando decidir cuidar da sua saúde e forma física, estaremos aqui!

Obrigado pela paciência com minhas mensagens.

Desejo muito sucesso e saúde para você! ${this.emojis.star}

Até mais! ${this.emojis.rocket}`,
                cta: "Muito obrigado!"
            }
        };
    }

    /**
     * Templates por horário do dia
     */
    getMorningTemplates() {
        return {
            energia_manha: {
                greeting: `Bom dia, {{firstName}}! ${this.emojis.rocket}`,
                context: "Que tal começar o dia com energia total?",
                timeReference: "manhã"
            }
        };
    }

    getAfternoonTemplates() {
        return {
            pausa_tarde: {
                greeting: `Boa tarde, {{firstName}}! ${this.emojis.star}`,
                context: "Hora perfeita para uma pausa ativa!",
                timeReference: "tarde"
            }
        };
    }

    getEveningTemplates() {
        return {
            relaxamento: {
                greeting: `Boa noite, {{firstName}}! ${this.emojis.muscle}`,
                context: "Momento ideal para relaxar e planejar amanhã!",
                timeReference: "noite"
            }
        };
    }

    /**
     * Seleciona template baseado no perfil do lead
     */
    selectTemplate(lead, context = {}) {
        try {
            const segment = lead.segment || 'prospects';
            const timeOfDay = this.getTimeOfDay();
            const followUpDay = context.followUpDay;

            let template;

            // Se é follow-up, usar template específico
            if (followUpDay && this.followUpTemplates[`day${followUpDay}`]) {
                template = this.followUpTemplates[`day${followUpDay}`];
            } else {
                // Usar template do segmento (rotação A/B)
                const segmentTemplates = this.templates[segment];
                const templateKeys = Object.keys(segmentTemplates);
                const selectedKey = templateKeys[Math.floor(Math.random() * templateKeys.length)];
                template = segmentTemplates[selectedKey];
            }

            // Personalizar template
            const personalizedTemplate = this.personalizeTemplate(template, lead, context);

            this.logger.debug(`Template selecionado: ${segment} - ${timeOfDay}`, {
                leadName: lead.primeiroNome,
                templateType: personalizedTemplate.type || 'standard'
            });

            return personalizedTemplate;

        } catch (error) {
            this.logger.error('Erro ao selecionar template:', error);
            return this.getDefaultTemplate(lead);
        }
    }

    /**
     * Personaliza template com dados do lead
     */
    personalizeTemplate(template, lead, context = {}) {
        try {
            let message = template.message || template;

            // Substituições básicas
            message = message.replace(/{{firstName}}/g, lead.primeiroNome || lead.nome?.split(' ')[0] || 'Amigo(a)');
            message = message.replace(/{{fullName}}/g, lead.nome || 'Amigo(a)');

            // Adicionar saudação baseada no horário
            const timeOfDay = this.getTimeOfDay();
            const timeTemplate = this.timeBasedTemplates[timeOfDay];
            if (timeTemplate && !message.includes('Bom dia') && !message.includes('Boa tarde') && !message.includes('Boa noite')) {
                message = timeTemplate.energia_manha?.greeting || timeTemplate.pausa_tarde?.greeting || timeTemplate.relaxamento?.greeting + '\n\n' + message;
            }

            // Personalização específica por segmento
            if (lead.segment === 'criticos' && lead.dataCadastro) {
                const monthsInactive = moment().diff(moment(lead.dataCadastro, 'DD/MM/YYYY'), 'months');
                message = message.replace(/{{monthsInactive}}/g, monthsInactive.toString());
            }

            // Adicionar informações de desconto se aplicável
            if (template.discount && template.discount > 0) {
                const discountInfo = `\n\n${this.emojis.gift} DESCONTO EXCLUSIVO: ${template.discount}% OFF!`;
                if (!message.includes('OFF')) {
                    message += discountInfo;
                }
            }

            return {
                ...template,
                message: message,
                personalizedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
                leadId: lead.telefone,
                segment: lead.segment
            };

        } catch (error) {
            this.logger.error('Erro ao personalizar template:', error);
            return this.getDefaultTemplate(lead);
        }
    }

    /**
     * Determina horário do dia
     */
    getTimeOfDay() {
        const hour = moment().hour();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    }

    /**
     * Template padrão de segurança
     */
    getDefaultTemplate(lead) {
        return {
            message: `Oi ${lead.primeiroNome || 'amigo(a)'}! ${this.emojis.muscle}

Sou da Full Force Academia e tenho uma oportunidade especial para você!

${this.emojis.star} Que tal conhecer nossa academia e descobrir como podemos te ajudar a alcançar seus objetivos?

Posso agendar uma visita para você?`,
            cta: "Quero conhecer a academia!",
            discount: 0,
            type: 'default'
        };
    }

    /**
     * Gera variações A/B de um template
     */
    generateABVariants(baseTemplate, variantType = 'standard') {
        const variants = {
            A: { ...baseTemplate },
            B: { ...baseTemplate }
        };

        switch (variantType) {
            case 'emoji_test':
                // Versão A: Com emojis (atual)
                // Versão B: Sem emojis
                variants.B.message = variants.B.message.replace(/[^\w\s\-\.,\!\?\:\(\)]/g, '');
                break;

            case 'urgency_test':
                // Versão A: Com urgência
                // Versão B: Sem urgência
                variants.B.message = variants.B.message
                    .replace(/URGENTE/g, 'ESPECIAL')
                    .replace(/24 horas/g, 'por tempo limitado')
                    .replace(/ÚLTIMA CHANCE/g, 'OFERTA ESPECIAL');
                break;

            case 'length_test':
                // Versão A: Versão completa
                // Versão B: Versão resumida (50% do tamanho)
                const sentences = variants.B.message.split('.');
                variants.B.message = sentences.slice(0, Math.ceil(sentences.length / 2)).join('.') + '.';
                break;
        }

        return variants;
    }

    /**
     * Valida template antes do envio
     */
    validateTemplate(template) {
        const validations = {
            hasMessage: !!template.message,
            hasCTA: !!template.cta,
            isNotTooLong: template.message?.length <= 1000,
            hasPersonalization: template.message?.includes('{{') || template.message?.includes(this.emojis.star),
            isValid: true
        };

        validations.isValid = Object.values(validations).every(v => v === true);

        if (!validations.isValid) {
            this.logger.warn('Template falhou na validação:', validations);
        }

        return validations;
    }

    /**
     * Relatório de performance de templates
     */
    async getTemplatePerformanceReport() {
        // Implementar análise de performance
        return {
            topPerformingTemplates: [],
            conversionRatesBySegment: {},
            recommendedOptimizations: []
        };
    }
}

module.exports = MessageTemplates;