/**
 * MCP Lead Segmentation - FFGym
 * Segmentação inteligente e dinâmica de leads para otimização de campanhas
 */

class LeadSegmentationMCP {
    constructor(config = {}) {
        this.config = {
            segmentationRules: {
                vip: {
                    criteria: { lifetimeValue: { min: 2000 }, membershipDuration: { min: 12 } },
                    priority: 'critical',
                    conversionRate: 0.25,
                    messageType: 'personal_vip'
                },
                hot: {
                    criteria: { daysInactive: { min: 90 }, engagementScore: { min: 0.7 } },
                    priority: 'high',
                    conversionRate: 0.15,
                    messageType: 'transformation_challenge'
                },
                warm: {
                    criteria: { daysInactive: { min: 30, max: 89 }, engagementScore: { min: 0.3 } },
                    priority: 'medium',
                    conversionRate: 0.10,
                    messageType: 'gentle_return'
                },
                cold: {
                    criteria: { daysInactive: { max: 30 }, engagementScore: { max: 0.3 } },
                    priority: 'low',
                    conversionRate: 0.05,
                    messageType: 'discount_offer'
                },
                champion: {
                    criteria: { referralCount: { min: 3 }, rating: { min: 4.5 } },
                    priority: 'high',
                    conversionRate: 0.20,
                    messageType: 'referral_incentive'
                },
                atrisk: {
                    criteria: { cancellationAttempts: { min: 1 }, paymentDelays: { min: 2 } },
                    priority: 'urgent',
                    conversionRate: 0.08,
                    messageType: 'retention_focused'
                }
            },
            dynamicFactors: {
                seasonality: true,
                timeOfDay: true,
                dayOfWeek: true,
                weatherImpact: true,
                competitorActivity: false
            },
            ...config
        };

        this.segmentEngine = new SegmentationEngine(this.config);
        this.behaviorAnalyzer = new BehaviorAnalyzer();
        this.dynamicOptimizer = new DynamicOptimizer();
        this.performanceTracker = new PerformanceTracker();
        this.status = 'idle';
    }

    /**
     * Inicializa o MCP Lead Segmentation
     */
    async initialize() {
        console.log('🎯 Inicializando Lead Segmentation MCP...');

        try {
            // Verificar configurações de segmentação
            if (!this.config.segmentationRules || Object.keys(this.config.segmentationRules).length === 0) {
                throw new Error('Regras de segmentação não configuradas');
            }

            // Verificar engines
            if (!this.segmentEngine) {
                throw new Error('Segmentation engine não inicializado');
            }

            // Inicializar behavior analyzer
            if (this.behaviorAnalyzer && typeof this.behaviorAnalyzer.initialize === 'function') {
                await this.behaviorAnalyzer.initialize();
            }

            this.status = 'ready';
            console.log('✅ Lead Segmentation MCP inicializado');

            return {
                success: true,
                status: this.status
            };
        } catch (error) {
            console.error('❌ Erro ao inicializar Lead Segmentation MCP:', error);
            this.status = 'error';
            throw error;
        }
    }

    /**
     * Retorna o status atual do MCP
     */
    getStatus() {
        return this.status;
    }

    /**
     * Define o provedor de analytics
     */
    setAnalyticsProvider(provider) {
        this.analyticsProvider = provider;
    }

    /**
     * Define o provedor de conversão
     */
    setConversionProvider(provider) {
        this.conversionProvider = provider;
    }

    /**
     * Define o provedor N8N
     */
    setN8NProvider(provider) {
        this.n8nProvider = provider;
    }

    /**
     * Segmenta lista completa de leads
     */
    async segmentLeads(leads) {
        console.log(`🎯 Segmentando ${leads.length} leads...`);

        const startTime = Date.now();
        const segmentation = {
            totalLeads: leads.length,
            segments: {},
            summary: {},
            recommendations: [],
            performance: {},
            timestamp: new Date().toISOString()
        };

        // Pré-processamento dos leads
        const enrichedLeads = await this.enrichLeadsData(leads);

        // Aplicar segmentação principal
        const primarySegments = await this.applyPrimarySegmentation(enrichedLeads);

        // Aplicar micro-segmentação
        const microSegments = await this.applyMicroSegmentation(primarySegments);

        // Otimização dinâmica
        const optimizedSegments = await this.applyDynamicOptimization(microSegments);

        segmentation.segments = optimizedSegments;
        segmentation.summary = this.generateSegmentSummary(optimizedSegments);
        segmentation.recommendations = await this.generateSegmentRecommendations(optimizedSegments);
        segmentation.performance = {
            processingTime: Date.now() - startTime,
            segmentsCreated: Object.keys(optimizedSegments).length,
            averageSegmentSize: this.calculateAverageSegmentSize(optimizedSegments)
        };

        // Salvar resultados para análise futura
        await this.saveSegmentationResults(segmentation);

        return segmentation;
    }

    /**
     * Enriquece dados dos leads com informações adicionais
     */
    async enrichLeadsData(leads) {
        console.log('📊 Enriquecendo dados dos leads...');

        const enrichedLeads = [];

        for (const lead of leads) {
            const enriched = {
                ...lead,
                // Métricas calculadas
                daysInactive: this.calculateDaysInactive(lead.lastActivity),
                lifetimeValue: this.calculateLifetimeValue(lead.paymentHistory),
                engagementScore: this.calculateEngagementScore(lead),
                membershipDuration: this.calculateMembershipDuration(lead.joinDate),

                // Análise comportamental
                visitPatterns: this.analyzeVisitPatterns(lead.visitHistory),
                paymentBehavior: this.analyzePaymentBehavior(lead.paymentHistory),
                communicationPreference: this.determineCommunicationPreference(lead),

                // Fatores contextuais
                seasonalBehavior: this.analyzeSeasonalBehavior(lead),
                socialInfluence: this.calculateSocialInfluence(lead),
                churnRisk: this.calculateChurnRisk(lead),

                // Potencial de conversão
                conversionProbability: await this.predictConversionProbability(lead),
                optimalContactTime: this.determineOptimalContactTime(lead),
                preferredOfferType: this.determinePreferredOfferType(lead)
            };

            enrichedLeads.push(enriched);
        }

        return enrichedLeads;
    }

    /**
     * Aplica segmentação primária baseada em regras
     */
    async applyPrimarySegmentation(leads) {
        console.log('🎯 Aplicando segmentação primária...');

        const segments = {};

        // Inicializar segmentos
        Object.keys(this.config.segmentationRules).forEach(segmentName => {
            segments[segmentName] = [];
        });

        for (const lead of leads) {
            const segment = this.classifyLead(lead);
            segments[segment.type].push({
                ...lead,
                segment: segment
            });
        }

        return segments;
    }

    /**
     * Classifica lead individual
     */
    classifyLead(lead) {
        // Aplicar regras em ordem de prioridade
        const ruleOrder = ['vip', 'atrisk', 'champion', 'hot', 'warm', 'cold'];

        for (const segmentType of ruleOrder) {
            const rule = this.config.segmentationRules[segmentType];

            if (this.leadMatchesRule(lead, rule.criteria)) {
                return {
                    type: segmentType,
                    priority: rule.priority,
                    conversionRate: rule.conversionRate,
                    messageType: rule.messageType,
                    confidence: this.calculateClassificationConfidence(lead, rule),
                    reasoning: this.explainClassification(lead, rule)
                };
            }
        }

        // Fallback para segmento cold
        return {
            type: 'cold',
            priority: 'low',
            conversionRate: 0.05,
            messageType: 'discount_offer',
            confidence: 0.5,
            reasoning: 'Não atendeu critérios específicos'
        };
    }

    /**
     * Verifica se lead atende critérios de uma regra
     */
    leadMatchesRule(lead, criteria) {
        for (const [field, conditions] of Object.entries(criteria)) {
            const value = this.getLeadFieldValue(lead, field);

            if (value === undefined || value === null) continue;

            if (conditions.min !== undefined && value < conditions.min) return false;
            if (conditions.max !== undefined && value > conditions.max) return false;
            if (conditions.equals !== undefined && value !== conditions.equals) return false;
            if (conditions.includes !== undefined && !conditions.includes.includes(value)) return false;
        }

        return true;
    }

    /**
     * Aplica micro-segmentação para refinamento
     */
    async applyMicroSegmentation(segments) {
        console.log('🔬 Aplicando micro-segmentação...');

        const microSegments = {};

        for (const [segmentType, leads] of Object.entries(segments)) {
            if (leads.length === 0) {
                microSegments[segmentType] = [];
                continue;
            }

            // Criar micro-segmentos baseados em características específicas
            const microSegmentedLeads = await this.createMicroSegments(leads, segmentType);
            microSegments[segmentType] = microSegmentedLeads;
        }

        return microSegments;
    }

    /**
     * Cria micro-segmentos dentro de um segmento principal
     */
    async createMicroSegments(leads, segmentType) {
        const microSegmentRules = {
            ageGroup: { under25: { max: 25 }, adult: { min: 25, max: 45 }, mature: { min: 45 } },
            frequency: { lowUser: { max: 5 }, regularUser: { min: 5, max: 15 }, highUser: { min: 15 } },
            timePreference: { morning: '06-12', afternoon: '12-18', evening: '18-22' },
            valueSegment: { budget: { max: 500 }, standard: { min: 500, max: 1500 }, premium: { min: 1500 } }
        };

        return leads.map(lead => {
            const microSegments = {};

            // Segmento por idade
            const age = this.calculateAge(lead.birthDate);
            microSegments.ageGroup = this.classifyByAge(age);

            // Segmento por frequência de uso
            microSegments.frequency = this.classifyByFrequency(lead.averageMonthlyVisits);

            // Segmento por horário preferido
            microSegments.timePreference = this.classifyByTimePreference(lead.visitPatterns);

            // Segmento por valor
            microSegments.valueSegment = this.classifyByValue(lead.lifetimeValue);

            return {
                ...lead,
                microSegments
            };
        });
    }

    /**
     * Aplica otimização dinâmica baseada em fatores contextuais
     */
    async applyDynamicOptimization(segments) {
        console.log('⚡ Aplicando otimização dinâmica...');

        const optimizedSegments = {};

        for (const [segmentType, leads] of Object.entries(segments)) {
            const optimizedLeads = [];

            for (const lead of leads) {
                const dynamicFactors = await this.calculateDynamicFactors(lead);
                const adjustedPriority = this.adjustPriorityByFactors(lead.segment.priority, dynamicFactors);
                const optimizedContactTime = this.optimizeContactTime(lead, dynamicFactors);

                optimizedLeads.push({
                    ...lead,
                    dynamicFactors,
                    adjustedPriority,
                    optimizedContactTime,
                    finalScore: this.calculateFinalScore(lead, dynamicFactors)
                });
            }

            // Ordenar por score final
            optimizedLeads.sort((a, b) => b.finalScore - a.finalScore);
            optimizedSegments[segmentType] = optimizedLeads;
        }

        return optimizedSegments;
    }

    /**
     * Calcula fatores dinâmicos para otimização
     */
    async calculateDynamicFactors(lead) {
        const factors = {
            seasonality: this.getSeasonalityFactor(),
            timeOfDay: this.getTimeOfDayFactor(),
            dayOfWeek: this.getDayOfWeekFactor(),
            weatherImpact: await this.getWeatherImpactFactor(),
            personalMoods: this.getPersonalMoodFactor(lead),
            competitorActivity: this.getCompetitorActivityFactor()
        };

        return factors;
    }

    /**
     * Gera recomendações baseadas na segmentação
     */
    async generateSegmentRecommendations(segments) {
        const recommendations = [];

        for (const [segmentType, leads] of Object.entries(segments)) {
            if (leads.length === 0) continue;

            const segmentAnalysis = this.analyzeSegment(leads, segmentType);

            // Recomendações por segmento
            if (segmentType === 'vip' && leads.length > 0) {
                recommendations.push({
                    segment: 'vip',
                    type: 'personal_approach',
                    priority: 'critical',
                    action: 'Contato pessoal imediato com gerente',
                    expectedImpact: 'Alta conversão com valor premium',
                    timeline: 'Imediato',
                    resources: ['Gerente senior', 'Ofertas exclusivas']
                });
            }

            if (segmentType === 'hot' && leads.length > 50) {
                recommendations.push({
                    segment: 'hot',
                    type: 'batch_campaign',
                    priority: 'high',
                    action: 'Campanha de transformação 90 dias',
                    expectedImpact: '15% de conversão esperada',
                    timeline: '24-48 horas',
                    resources: ['Templates de mensagem', 'Automação WhatsApp']
                });
            }

            if (segmentAnalysis.lowEngagement > 0.3) {
                recommendations.push({
                    segment: segmentType,
                    type: 'engagement_optimization',
                    priority: 'medium',
                    action: 'Revisar estratégia de engajamento',
                    expectedImpact: 'Melhoria na taxa de resposta',
                    timeline: '1 semana',
                    resources: ['Análise de mensagens', 'A/B testing']
                });
            }
        }

        return recommendations;
    }

    /**
     * Análise detalhada de um segmento
     */
    analyzeSegment(leads, segmentType) {
        const analysis = {
            count: leads.length,
            averageScore: 0,
            averageValue: 0,
            averageInactivity: 0,
            lowEngagement: 0,
            highPotential: 0,
            distributionByMicroSegment: {}
        };

        if (leads.length === 0) return analysis;

        // Calcular médias
        analysis.averageScore = leads.reduce((sum, lead) => sum + (lead.finalScore || 0), 0) / leads.length;
        analysis.averageValue = leads.reduce((sum, lead) => sum + (lead.lifetimeValue || 0), 0) / leads.length;
        analysis.averageInactivity = leads.reduce((sum, lead) => sum + (lead.daysInactive || 0), 0) / leads.length;

        // Identificar padrões
        analysis.lowEngagement = leads.filter(lead => (lead.engagementScore || 0) < 0.3).length / leads.length;
        analysis.highPotential = leads.filter(lead => (lead.conversionProbability || 0) > 0.15).length / leads.length;

        // Distribuição por micro-segmentos
        const microSegmentCounts = {};
        leads.forEach(lead => {
            if (lead.microSegments) {
                Object.entries(lead.microSegments).forEach(([type, value]) => {
                    const key = `${type}_${value}`;
                    microSegmentCounts[key] = (microSegmentCounts[key] || 0) + 1;
                });
            }
        });

        analysis.distributionByMicroSegment = microSegmentCounts;

        return analysis;
    }

    /**
     * Gera resumo da segmentação
     */
    generateSegmentSummary(segments) {
        const summary = {
            totalLeads: 0,
            segmentDistribution: {},
            priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
            expectedConversions: 0,
            expectedRevenue: 0,
            recommendedOrder: []
        };

        Object.entries(segments).forEach(([segmentType, leads]) => {
            const count = leads.length;
            summary.totalLeads += count;

            summary.segmentDistribution[segmentType] = {
                count,
                percentage: 0, // Será calculado após contagem total
                averageScore: count > 0 ? leads.reduce((sum, lead) => sum + (lead.finalScore || 0), 0) / count : 0
            };

            // Contabilizar prioridades
            leads.forEach(lead => {
                const priority = lead.adjustedPriority || lead.segment?.priority || 'low';
                summary.priorityDistribution[priority]++;
            });

            // Calcular conversões esperadas
            const segmentConfig = this.config.segmentationRules[segmentType];
            if (segmentConfig) {
                const expectedConversions = Math.round(count * segmentConfig.conversionRate);
                summary.expectedConversions += expectedConversions;
                summary.expectedRevenue += expectedConversions * 447; // Valor médio por conversão
            }
        });

        // Calcular percentuais
        Object.keys(summary.segmentDistribution).forEach(segmentType => {
            summary.segmentDistribution[segmentType].percentage =
                (summary.segmentDistribution[segmentType].count / summary.totalLeads * 100).toFixed(1);
        });

        // Ordem recomendada de execução
        summary.recommendedOrder = this.calculateRecommendedOrder(segments);

        return summary;
    }

    /**
     * Calcula ordem recomendada de execução dos segmentos
     */
    calculateRecommendedOrder(segments) {
        const segmentPriorities = {
            vip: 1,
            atrisk: 2,
            champion: 3,
            hot: 4,
            warm: 5,
            cold: 6
        };

        return Object.keys(segments)
            .filter(segmentType => segments[segmentType].length > 0)
            .sort((a, b) => (segmentPriorities[a] || 99) - (segmentPriorities[b] || 99))
            .map(segmentType => ({
                segment: segmentType,
                count: segments[segmentType].length,
                priority: segmentPriorities[segmentType],
                estimatedDuration: this.estimateExecutionDuration(segments[segmentType])
            }));
    }

    // Métodos auxiliares

    calculateDaysInactive(lastActivity) {
        if (!lastActivity) return 999;
        const now = new Date();
        const last = new Date(lastActivity);
        return Math.ceil((now - last) / (1000 * 60 * 60 * 24));
    }

    calculateLifetimeValue(paymentHistory) {
        if (!paymentHistory || !Array.isArray(paymentHistory)) return 0;
        return paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }

    calculateEngagementScore(lead) {
        const visits = lead.visitHistory?.length || 0;
        const duration = this.calculateMembershipDuration(lead.joinDate);
        const referrals = lead.referrals?.length || 0;
        const responsiveness = lead.communicationHistory?.responseRate || 0.5;

        return (visits * 0.4 + duration * 0.2 + referrals * 0.2 + responsiveness * 0.2) / 100;
    }

    calculateMembershipDuration(joinDate) {
        if (!joinDate) return 0;
        const now = new Date();
        const joined = new Date(joinDate);
        return Math.ceil((now - joined) / (1000 * 60 * 60 * 24 * 30)); // em meses
    }

    getLeadFieldValue(lead, field) {
        // Suporte para campos aninhados usando dot notation
        const fields = field.split('.');
        let value = lead;

        for (const f of fields) {
            value = value?.[f];
        }

        return value;
    }

    calculateClassificationConfidence(lead, rule) {
        // Calcular confiança baseada na aderência aos critérios
        const criteriaCount = Object.keys(rule.criteria).length;
        const matchedCriteria = Object.keys(rule.criteria).filter(field =>
            this.leadMatchesRule(lead, { [field]: rule.criteria[field] })
        ).length;

        return matchedCriteria / criteriaCount;
    }

    explainClassification(lead, rule) {
        const reasons = [];

        Object.entries(rule.criteria).forEach(([field, conditions]) => {
            const value = this.getLeadFieldValue(lead, field);
            if (value !== undefined) {
                reasons.push(`${field}: ${value}`);
            }
        });

        return reasons.join(', ');
    }

    estimateExecutionDuration(leads) {
        // Estimar duração baseada no tamanho do segmento e rate limits
        const messagesPerMinute = 20;
        const minutes = Math.ceil(leads.length / messagesPerMinute);
        return `${minutes} minutos`;
    }
}

// Classes auxiliares
class SegmentationEngine {}
class BehaviorAnalyzer {}
class DynamicOptimizer {}
class PerformanceTracker {}

module.exports = LeadSegmentationMCP;