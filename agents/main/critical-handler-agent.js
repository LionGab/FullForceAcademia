/**
 * Critical Handler Agent - FFGym
 * Responsável por tratamento de situações críticas e escalação automática
 */

class CriticalHandlerAgent {
    constructor(config = {}) {
        this.config = {
            agentId: 'critical-handler',
            name: 'Critical Handler',
            version: '1.0.0',
            capabilities: [
                'critical_detection',
                'automatic_escalation',
                'complaint_handling',
                'high_value_lead_routing',
                'emergency_response',
                'human_intervention'
            ],
            thresholds: {
                highValueLead: 80,        // Score mínimo para lead de alto valor
                negativesentiment: -0.5, // Sentiment negativo crítico
                urgencyScore: 90,         // Score de urgência para escalação
                responseTime: 120,        // Tempo máximo de resposta (segundos)
                complaintKeywords: 15     // Número de palavras-chave de reclamação
            },
            escalationRules: {
                immediate: {
                    conditions: ['high_value_lead', 'severe_complaint', 'legal_threat'],
                    contacts: ['manager', 'sales_director'],
                    channels: ['whatsapp', 'phone', 'email']
                },
                urgent: {
                    conditions: ['negative_sentiment', 'competitor_mention', 'price_objection'],
                    contacts: ['sales_team', 'customer_success'],
                    channels: ['whatsapp', 'email']
                },
                standard: {
                    conditions: ['information_request', 'technical_issue'],
                    contacts: ['support_team'],
                    channels: ['whatsapp']
                }
            },
            contacts: {
                manager: '+5566999999999',
                sales_director: '+5566888888888',
                sales_team: '556699999999-group',
                customer_success: '+5566777777777',
                support_team: '556677777777-group'
            },
            ...config
        };

        this.state = {
            status: 'idle',
            activeCriticalCases: [],
            escalatedCases: [],
            resolutionHistory: [],
            alerts: [],
            performanceMetrics: {
                totalCases: 0,
                resolvedCases: 0,
                escalatedCases: 0,
                averageResolutionTime: 0
            }
        };

        this.detectionEngine = new CriticalDetectionEngine();
        this.escalationManager = new EscalationManager();
        this.responseGenerator = new ResponseGenerator();
        this.notificationService = new NotificationService();
    }

    async initialize() {
        console.log(`🚨 Inicializando ${this.config.name}...`);

        try {
            await this.loadHistoricalCases();
            await this.initializeDetectionEngine();
            await this.setupEscalationRules();
            await this.configureNotifications();

            this.state.status = 'ready';
            console.log(`✅ ${this.config.name} inicializado com sucesso`);

            return {
                success: true,
                agent: this.config.name,
                capabilities: this.config.capabilities,
                status: this.state.status
            };
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${this.config.name}:`, error);
            this.state.status = 'error';
            throw error;
        }
    }

    async handleIncomingMessage(messageData) {
        const {
            content,
            sender,
            leadData,
            context,
            timestamp
        } = messageData;

        try {
            console.log(`🔍 Analisando mensagem crítica de ${sender}`);

            // 1. Detecção de situações críticas
            const criticalAnalysis = await this.detectCriticalSituation({
                content,
                sender,
                leadData,
                context
            });

            // 2. Classificação do nível de criticidade
            const criticality = await this.classifyCriticality(criticalAnalysis);

            // 3. Determinar ação apropriada
            const actionPlan = await this.determineActionPlan(criticality, messageData);

            // 4. Executar resposta
            const response = await this.executeResponse(actionPlan, messageData);

            // 5. Registrar caso se crítico
            if (criticality.level !== 'normal') {
                await this.registerCriticalCase({
                    ...messageData,
                    analysis: criticalAnalysis,
                    criticality,
                    actionPlan,
                    response
                });
            }

            return {
                success: true,
                criticality: criticality.level,
                action: actionPlan.type,
                response,
                escalated: actionPlan.escalate || false
            };

        } catch (error) {
            console.error('❌ Erro no tratamento de mensagem crítica:', error);
            throw error;
        }
    }

    async detectCriticalSituation(data) {
        const { content, leadData, context } = data;

        const analysis = {
            highValueLead: false,
            negativeSentiment: false,
            complaintIndicators: false,
            competitorMention: false,
            legalThreat: false,
            urgencyIndicators: false,
            technicalIssue: false,
            priceObjection: false
        };

        // Detectar lead de alto valor
        if (leadData.score >= this.config.thresholds.highValueLead) {
            analysis.highValueLead = true;
        }

        // Análise de sentiment
        const sentiment = await this.analyzeSentiment(content);
        if (sentiment.score <= this.config.thresholds.negativesentiment) {
            analysis.negativeSentiment = true;
        }

        // Detectar indicadores de reclamação
        const complaintKeywords = [
            'reclamar', 'insatisfeito', 'problema', 'erro', 'falha',
            'péssimo', 'horrível', 'enganação', 'mentira', 'fraude',
            'processar', 'advogado', 'procon', 'justiça'
        ];

        const complaintMatches = this.countKeywordMatches(content, complaintKeywords);
        if (complaintMatches >= 2) {
            analysis.complaintIndicators = true;
        }

        // Detectar menções de concorrentes
        const competitorKeywords = [
            'smartfit', 'academia popular', 'bodytech', 'fórmula',
            'concorrente', 'outro lugar', 'mais barato'
        ];

        if (this.countKeywordMatches(content, competitorKeywords) > 0) {
            analysis.competitorMention = true;
        }

        // Detectar ameaças legais
        const legalKeywords = [
            'processar', 'advogado', 'justiça', 'tribunal', 'procon',
            'delegacia', 'denunciar', 'ação judicial'
        ];

        if (this.countKeywordMatches(content, legalKeywords) > 0) {
            analysis.legalThreat = true;
        }

        // Detectar urgência
        const urgencyKeywords = [
            'urgente', 'rápido', 'agora', 'imediato', 'hoje',
            'preciso já', 'emergência', 'socorro'
        ];

        if (this.countKeywordMatches(content, urgencyKeywords) > 0) {
            analysis.urgencyIndicators = true;
        }

        // Detectar objeções de preço
        const priceKeywords = [
            'caro', 'preço', 'valor', 'dinheiro', 'não posso pagar',
            'muito alto', 'desconto', 'promoção'
        ];

        if (this.countKeywordMatches(content, priceKeywords) >= 2) {
            analysis.priceObjection = true;
        }

        return analysis;
    }

    async classifyCriticality(analysis) {
        let score = 0;
        const factors = [];

        // Pontuação baseada nos indicadores
        if (analysis.highValueLead) {
            score += 30;
            factors.push('Lead de alto valor');
        }

        if (analysis.legalThreat) {
            score += 50;
            factors.push('Ameaça legal');
        }

        if (analysis.complaintIndicators) {
            score += 40;
            factors.push('Indicadores de reclamação');
        }

        if (analysis.negativeSentiment) {
            score += 25;
            factors.push('Sentiment negativo');
        }

        if (analysis.competitorMention) {
            score += 20;
            factors.push('Menção de concorrente');
        }

        if (analysis.urgencyIndicators) {
            score += 15;
            factors.push('Indicadores de urgência');
        }

        if (analysis.priceObjection) {
            score += 10;
            factors.push('Objeção de preço');
        }

        // Classificar nível
        let level = 'normal';
        let priority = 'low';

        if (score >= 70) {
            level = 'critical';
            priority = 'immediate';
        } else if (score >= 40) {
            level = 'high';
            priority = 'urgent';
        } else if (score >= 20) {
            level = 'medium';
            priority = 'standard';
        }

        return {
            score,
            level,
            priority,
            factors,
            analysis
        };
    }

    async determineActionPlan(criticality, messageData) {
        const { level, priority, factors } = criticality;
        const { leadData } = messageData;

        let actionPlan = {
            type: 'automated_response',
            escalate: false,
            contacts: [],
            channels: [],
            responseTemplate: 'standard',
            timeframe: 'normal'
        };

        switch (level) {
            case 'critical':
                actionPlan = {
                    type: 'immediate_escalation',
                    escalate: true,
                    contacts: this.config.escalationRules.immediate.contacts,
                    channels: this.config.escalationRules.immediate.channels,
                    responseTemplate: 'critical_escalation',
                    timeframe: 'immediate',
                    humanRequired: true
                };
                break;

            case 'high':
                actionPlan = {
                    type: 'urgent_response',
                    escalate: true,
                    contacts: this.config.escalationRules.urgent.contacts,
                    channels: this.config.escalationRules.urgent.channels,
                    responseTemplate: 'urgent_response',
                    timeframe: 'urgent',
                    humanRequired: false
                };
                break;

            case 'medium':
                actionPlan = {
                    type: 'priority_response',
                    escalate: false,
                    contacts: this.config.escalationRules.standard.contacts,
                    channels: ['whatsapp'],
                    responseTemplate: 'priority_response',
                    timeframe: 'standard',
                    humanRequired: false
                };
                break;

            default:
                actionPlan = {
                    type: 'standard_response',
                    escalate: false,
                    contacts: [],
                    channels: ['whatsapp'],
                    responseTemplate: 'standard',
                    timeframe: 'normal',
                    humanRequired: false
                };
        }

        // Ajustar para leads de alto valor
        if (criticality.analysis.highValueLead && actionPlan.type === 'standard_response') {
            actionPlan.type = 'vip_response';
            actionPlan.responseTemplate = 'vip_priority';
            actionPlan.escalate = true;
            actionPlan.contacts = ['sales_team'];
        }

        return actionPlan;
    }

    async executeResponse(actionPlan, messageData) {
        const { type, escalate, responseTemplate } = actionPlan;
        const responses = [];

        try {
            // 1. Gerar resposta automática apropriada
            const automaticResponse = await this.generateAutomaticResponse(
                responseTemplate,
                messageData
            );

            if (automaticResponse) {
                responses.push({
                    type: 'automatic',
                    content: automaticResponse,
                    channel: 'whatsapp',
                    timestamp: new Date()
                });
            }

            // 2. Executar escalação se necessário
            if (escalate) {
                const escalationResponse = await this.executeEscalation(actionPlan, messageData);
                responses.push(escalationResponse);
            }

            // 3. Configurar follow-up se necessário
            if (type === 'critical' || type === 'urgent_response') {
                await this.scheduleFollowUp(messageData, actionPlan);
            }

            return {
                success: true,
                responses,
                escalated: escalate,
                actionType: type
            };

        } catch (error) {
            console.error('❌ Erro na execução de resposta:', error);
            throw error;
        }
    }

    async generateAutomaticResponse(template, messageData) {
        const { leadData, content } = messageData;

        const responses = {
            critical_escalation: `🚨 *ATENÇÃO PRIORITÁRIA*

Olá ${leadData.name}, recebemos sua mensagem e entendemos a urgência da situação.

Nossa equipe especializada foi notificada e entrará em contato com você em até 30 minutos.

Enquanto isso, estou aqui para ajudar no que for necessário.

*Equipe FullForce - Atendimento Prioritário*`,

            urgent_response: `⚡ *RESPOSTA URGENTE*

Oi ${leadData.name}! Vi sua mensagem e entendo sua preocupação.

Nossa equipe está analisando sua situação e você terá um retorno personalizado em breve.

Posso adiantar alguma informação específica que você precisa?

*FullForce - Sempre aqui para você!*`,

            priority_response: `🎯 *ATENDIMENTO PRIORITÁRIO*

Olá ${leadData.name}! Sua mensagem é importante para nós.

Vou conectar você com nossa equipe especializada para dar a melhor solução.

Em que mais posso ajudar?`,

            vip_priority: `👑 *ATENDIMENTO VIP*

${leadData.name}, é um prazer falar com você!

Como membro VIP, você tem acesso direto à nossa equipe premium.

Vou encaminhar sua solicitação para atendimento imediato.

*FullForce VIP - Excelência em cada detalhe*`,

            standard: `Olá ${leadData.name}! Obrigado por entrar em contato.

Vou analisar sua mensagem e retornar com as informações que você precisa.

*FullForce - Transformando vidas!*`
        };

        return responses[template] || responses.standard;
    }

    async executeEscalation(actionPlan, messageData) {
        const { contacts, channels, timeframe } = actionPlan;
        const { leadData, content } = messageData;

        // Preparar mensagem de escalação
        const escalationMessage = `🚨 *ESCALAÇÃO AUTOMÁTICA*

*Lead:* ${leadData.name} (${leadData.phone})
*Segmento:* ${leadData.segment}
*Score:* ${leadData.score}

*Mensagem recebida:*
"${content}"

*Ação requerida:* ${timeframe === 'immediate' ? 'IMEDIATA' : 'URGENTE'}
*Tempo máximo de resposta:* ${timeframe === 'immediate' ? '30 min' : '2 horas'}

*Sistema FFGym - Critical Handler*`;

        // Enviar notificações
        const notifications = [];
        for (const contact of contacts) {
            for (const channel of channels) {
                const notification = await this.sendNotification({
                    contact: this.config.contacts[contact],
                    channel,
                    message: escalationMessage,
                    priority: actionPlan.priority || 'urgent'
                });
                notifications.push(notification);
            }
        }

        return {
            type: 'escalation',
            notifications,
            timestamp: new Date(),
            escalatedTo: contacts
        };
    }

    async registerCriticalCase(caseData) {
        const criticalCase = {
            id: `CRIT_${Date.now()}`,
            timestamp: new Date(),
            sender: caseData.sender,
            leadData: caseData.leadData,
            content: caseData.content,
            analysis: caseData.analysis,
            criticality: caseData.criticality,
            actionPlan: caseData.actionPlan,
            response: caseData.response,
            status: 'open',
            resolutionTime: null
        };

        this.state.activeCriticalCases.push(criticalCase);
        this.state.performanceMetrics.totalCases++;

        console.log(`📋 Caso crítico registrado: ${criticalCase.id}`);

        return criticalCase;
    }

    async resolveCriticalCase(caseId, resolution) {
        const caseIndex = this.state.activeCriticalCases.findIndex(c => c.id === caseId);

        if (caseIndex !== -1) {
            const resolvedCase = this.state.activeCriticalCases[caseIndex];
            resolvedCase.status = 'resolved';
            resolvedCase.resolution = resolution;
            resolvedCase.resolutionTime = new Date();

            // Mover para histórico
            this.state.resolutionHistory.push(resolvedCase);
            this.state.activeCriticalCases.splice(caseIndex, 1);

            this.state.performanceMetrics.resolvedCases++;

            console.log(`✅ Caso crítico resolvido: ${caseId}`);

            return resolvedCase;
        }

        return null;
    }

    // Métodos auxiliares
    countKeywordMatches(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.filter(keyword => lowerText.includes(keyword)).length;
    }

    async analyzeSentiment(text) {
        // Análise básica de sentiment (mesma do message-optimizer)
        const positiveWords = ['ótimo', 'excelente', 'perfeito', 'maravilhoso', 'adoro'];
        const negativeWords = ['péssimo', 'horrível', 'ruim', 'odeio', 'terrível', 'inaceitável'];

        const words = text.toLowerCase().split(' ');
        let score = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) score += 0.2;
            if (negativeWords.includes(word)) score -= 0.2;
        });

        return {
            score: Math.max(-1, Math.min(1, score)),
            label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
        };
    }

    async sendNotification(notificationData) {
        const { contact, channel, message, priority } = notificationData;

        // Simular envio de notificação
        console.log(`📢 Notificação ${priority}: ${contact} via ${channel}`);

        return {
            success: true,
            contact,
            channel,
            timestamp: new Date(),
            priority
        };
    }

    async scheduleFollowUp(messageData, actionPlan) {
        const followUpTime = actionPlan.timeframe === 'immediate' ? 30 : 120; // minutos

        console.log(`⏰ Follow-up agendado para ${followUpTime} minutos`);

        // Aqui seria implementado o agendamento real
        return {
            scheduled: true,
            time: followUpTime,
            messageData,
            actionPlan
        };
    }

    async loadHistoricalCases() {
        // Carregar casos históricos
        this.state.resolutionHistory = [];
    }

    async initializeDetectionEngine() {
        this.detectionEngine = {
            detect: async (data) => this.detectCriticalSituation(data)
        };
    }

    async setupEscalationRules() {
        console.log('📋 Regras de escalação configuradas');
    }

    async configureNotifications() {
        this.notificationService = {
            send: async (data) => this.sendNotification(data)
        };
    }

    getPerformanceMetrics() {
        const metrics = this.state.performanceMetrics;
        const activeCases = this.state.activeCriticalCases.length;

        return {
            ...metrics,
            activeCases,
            resolutionRate: metrics.totalCases > 0 ? metrics.resolvedCases / metrics.totalCases : 0,
            status: this.state.status
        };
    }

    getCriticalCasesSummary() {
        return {
            active: this.state.activeCriticalCases.length,
            resolved: this.state.resolutionHistory.length,
            escalated: this.state.escalatedCases.length,
            averageResolutionTime: this.calculateAverageResolutionTime()
        };
    }

    calculateAverageResolutionTime() {
        const resolvedCases = this.state.resolutionHistory;
        if (resolvedCases.length === 0) return 0;

        const totalTime = resolvedCases.reduce((sum, case_) => {
            if (case_.resolutionTime && case_.timestamp) {
                return sum + (case_.resolutionTime - case_.timestamp);
            }
            return sum;
        }, 0);

        return Math.round(totalTime / resolvedCases.length / 1000 / 60); // minutos
    }
}

// Classes auxiliares simuladas
class CriticalDetectionEngine {
    async detect(data) {
        return { critical: false };
    }
}

class EscalationManager {
    async escalate(data) {
        return { success: true };
    }
}

class ResponseGenerator {
    async generate(template, data) {
        return `Resposta automática baseada em ${template}`;
    }
}

class NotificationService {
    async send(data) {
        return { success: true, sent: true };
    }
}

module.exports = CriticalHandlerAgent;