/**
 * MCP Gym Analytics - FFGym
 * Análise avançada de dados de academia e predição de comportamento
 */

class GymAnalyticsMCP {
    constructor(config = {}) {
        this.config = {
            conversionTargets: {
                primary: 0.10,      // 10% taxa de conversão
                minimum: 0.05,      // 5% mínimo aceitável
                excellent: 0.15     // 15% excelente
            },
            revenueTargets: {
                membershipValue: 447,  // R$ 447 por reativação
                totalTarget: 29055,    // R$ 29.055 meta total
                costPerLead: 10        // R$ 10 custo por lead
            },
            segmentationRules: {
                hotLeads: { minDays: 90, maxDays: 999, expectedConversion: 0.12 },
                warmLeads: { minDays: 30, maxDays: 89, expectedConversion: 0.08 },
                coldLeads: { minDays: 0, maxDays: 29, expectedConversion: 0.06 }
            },
            ...config
        };

        this.analytics = {
            membershipAnalyzer: new MembershipAnalyzer(),
            behaviorPredictor: new BehaviorPredictor(),
            conversionOptimizer: new ConversionOptimizer(),
            revenueCalculator: new RevenueCalculator()
        };

        this.metrics = new MetricsCollector();
        this.insights = new InsightEngine();
        this.status = 'idle';
    }

    /**
     * Inicializa o MCP Gym Analytics
     */
    async initialize() {
        console.log('📊 Inicializando Gym Analytics MCP...');

        try {
            // Verificar configurações básicas
            if (!this.config.conversionTargets) {
                throw new Error('Configurações de conversão não encontradas');
            }

            // Verificar métricas collector
            if (!this.metrics) {
                throw new Error('Metrics collector não inicializado');
            }

            this.status = 'ready';
            console.log('✅ Gym Analytics MCP inicializado');

            return {
                success: true,
                status: this.status
            };
        } catch (error) {
            console.error('❌ Erro ao inicializar Gym Analytics MCP:', error);
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
     * Análise completa de membros inativos
     */
    async analyzeInactiveMembers(members) {
        console.log(`📊 Analisando ${members.length} membros inativos...`);

        const analysis = {
            totalMembers: members.length,
            segmentation: await this.segmentMembers(members),
            predictionModel: await this.buildPredictionModel(members),
            recommendations: await this.generateRecommendations(members),
            expectedOutcomes: await this.calculateExpectedOutcomes(members)
        };

        return analysis;
    }

    /**
     * Segmentação inteligente de membros
     */
    async segmentMembers(members) {
        const segments = {
            hot: [],
            warm: [],
            cold: [],
            vip: [],
            risky: []
        };

        for (const member of members) {
            const memberData = await this.enrichMemberData(member);
            const segment = this.classifyMember(memberData);

            segments[segment.type].push({
                ...memberData,
                segment: segment,
                score: segment.score,
                priority: segment.priority
            });
        }

        // Ordenar por score dentro de cada segmento
        Object.keys(segments).forEach(key => {
            segments[key] = segments[key].sort((a, b) => b.score - a.score);
        });

        return {
            segments,
            summary: this.generateSegmentSummary(segments),
            insights: this.generateSegmentInsights(segments)
        };
    }

    /**
     * Classifica membro em segmento
     */
    classifyMember(member) {
        const daysInactive = this.calculateInactiveDays(member.lastActivity);
        const lifetimeValue = this.calculateLifetimeValue(member);
        const engagementScore = this.calculateEngagementScore(member);
        const conversionProbability = this.predictConversionProbability(member);

        // Lógica de classificação por regras
        let type = 'cold';
        let priority = 'low';

        if (daysInactive >= this.config.segmentationRules.hotLeads.minDays) {
            type = 'hot';
            priority = conversionProbability > 0.15 ? 'high' : 'medium';
        } else if (daysInactive >= this.config.segmentationRules.warmLeads.minDays) {
            type = 'warm';
            priority = conversionProbability > 0.12 ? 'medium' : 'low';
        }

        // Classificações especiais
        if (lifetimeValue > 1500) {
            type = 'vip';
            priority = 'high';
        }

        if (conversionProbability < 0.03) {
            type = 'risky';
            priority = 'low';
        }

        const score = this.calculateMemberScore(daysInactive, lifetimeValue, engagementScore, conversionProbability);

        return {
            type,
            priority,
            score,
            daysInactive,
            lifetimeValue,
            engagementScore,
            conversionProbability,
            reasoning: this.explainClassification(type, score, daysInactive, lifetimeValue)
        };
    }

    /**
     * Enriquece dados do membro com informações adicionais
     */
    async enrichMemberData(member) {
        return {
            ...member,
            age: this.calculateAge(member.birthDate),
            membershipDuration: this.calculateMembershipDuration(member.joinDate),
            averageMonthlyVisits: this.calculateAverageVisits(member.visitHistory),
            preferredSchedule: this.extractPreferredSchedule(member.visitHistory),
            lastPaymentDate: member.lastPaymentDate,
            totalRevenue: this.calculateTotalRevenue(member.paymentHistory),
            cancellationRisk: this.calculateCancellationRisk(member),
            socialInfluence: this.calculateSocialInfluence(member)
        };
    }

    /**
     * Constrói modelo de predição de conversão
     */
    async buildPredictionModel(members) {
        const features = members.map(member => this.extractFeatures(member));

        // Modelo simplificado baseado em regressão logística
        const model = {
            weights: await this.calculateFeatureWeights(features),
            accuracy: await this.validateModel(features),
            topFactors: await this.identifyTopFactors(features)
        };

        return model;
    }

    /**
     * Extrai features para modelo de ML
     */
    extractFeatures(member) {
        return {
            daysInactive: this.calculateInactiveDays(member.lastActivity),
            membershipDuration: this.calculateMembershipDuration(member.joinDate),
            averageMonthlyVisits: this.calculateAverageVisits(member.visitHistory),
            ageGroup: this.categorizeAge(member.birthDate),
            lifetimeValue: this.calculateLifetimeValue(member),
            seasonality: this.getSeasonalityFactor(),
            hasPersonalTrainer: member.personalTrainer ? 1 : 0,
            cancellationHistory: member.cancellationHistory?.length || 0,
            referralCount: member.referrals?.length || 0,
            lastPaymentDelay: this.calculatePaymentDelay(member.lastPaymentDate)
        };
    }

    /**
     * Prediz probabilidade de conversão
     */
    predictConversionProbability(member) {
        const features = this.extractFeatures(member);

        // Modelo baseado em pesos calculados empiricamente
        const weights = {
            daysInactive: -0.02,      // Mais dias = menor probabilidade
            membershipDuration: 0.05,  // Mais tempo = maior probabilidade
            averageMonthlyVisits: 0.15, // Mais visitas = maior probabilidade
            lifetimeValue: 0.0001,     // Maior valor = maior probabilidade
            hasPersonalTrainer: 0.2,   // Personal = maior probabilidade
            seasonality: 0.1           // Época do ano
        };

        let probability = 0.05; // Base de 5%

        // Aplicar pesos
        Object.keys(weights).forEach(feature => {
            if (features[feature] !== undefined) {
                probability += features[feature] * weights[feature];
            }
        });

        // Normalizar entre 0 e 1
        return Math.max(0, Math.min(1, probability));
    }

    /**
     * Calcula score do membro
     */
    calculateMemberScore(daysInactive, lifetimeValue, engagementScore, conversionProbability) {
        // Score composto (0-100)
        const inactivityScore = Math.max(0, 100 - (daysInactive / 3)); // Penaliza inatividade
        const valueScore = Math.min(100, lifetimeValue / 20);          // Premia valor
        const engagementWeight = engagementScore * 100;                // Engagement histórico
        const conversionWeight = conversionProbability * 100;          // Probabilidade de conversão

        const score = (
            inactivityScore * 0.3 +
            valueScore * 0.2 +
            engagementWeight * 0.25 +
            conversionWeight * 0.25
        );

        return Math.round(score);
    }

    /**
     * Gera recomendações baseadas na análise
     */
    async generateRecommendations(members) {
        const analysis = await this.segmentMembers(members);

        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            optimization: []
        };

        // Recomendações imediatas
        if (analysis.segments.vip.length > 0) {
            recommendations.immediate.push({
                type: 'vip_outreach',
                priority: 'critical',
                action: 'Contato personalizado com membros VIP',
                impact: 'high',
                effort: 'low',
                expectedROI: '300%'
            });
        }

        if (analysis.segments.hot.length > 50) {
            recommendations.immediate.push({
                type: 'hot_campaign',
                priority: 'high',
                action: 'Campanha de transformação 90 dias para leads quentes',
                impact: 'high',
                effort: 'medium',
                expectedROI: '250%'
            });
        }

        // Recomendações de curto prazo
        recommendations.shortTerm.push({
            type: 'segment_optimization',
            priority: 'medium',
            action: 'Otimizar mensagens por segmento baseado em análise de resposta',
            impact: 'medium',
            effort: 'medium',
            expectedROI: '150%'
        });

        // Recomendações de longo prazo
        recommendations.longTerm.push({
            type: 'predictive_model',
            priority: 'low',
            action: 'Implementar modelo preditivo de churn prevention',
            impact: 'high',
            effort: 'high',
            expectedROI: '400%'
        });

        return recommendations;
    }

    /**
     * Calcula resultados esperados
     */
    async calculateExpectedOutcomes(members) {
        const segmentation = await this.segmentMembers(members);

        const outcomes = {
            totalLeads: members.length,
            expectedConversions: 0,
            expectedRevenue: 0,
            costOfCampaign: 0,
            expectedROI: 0,
            bySegment: {}
        };

        // Calcular por segmento
        Object.keys(segmentation.segments).forEach(segmentType => {
            const segment = segmentation.segments[segmentType];
            const segmentConfig = this.config.segmentationRules[segmentType === 'hot' ? 'hotLeads' :
                                  segmentType === 'warm' ? 'warmLeads' : 'coldLeads'] ||
                                  { expectedConversion: 0.08 };

            const expectedConversions = Math.round(segment.length * segmentConfig.expectedConversion);
            const expectedRevenue = expectedConversions * this.config.revenueTargets.membershipValue;
            const segmentCost = segment.length * this.config.revenueTargets.costPerLead;

            outcomes.bySegment[segmentType] = {
                leads: segment.length,
                expectedConversions,
                expectedRevenue,
                cost: segmentCost,
                roi: segmentCost > 0 ? ((expectedRevenue - segmentCost) / segmentCost * 100) : 0
            };

            outcomes.expectedConversions += expectedConversions;
            outcomes.expectedRevenue += expectedRevenue;
            outcomes.costOfCampaign += segmentCost;
        });

        outcomes.expectedROI = outcomes.costOfCampaign > 0 ?
            ((outcomes.expectedRevenue - outcomes.costOfCampaign) / outcomes.costOfCampaign * 100) : 0;

        return outcomes;
    }

    /**
     * Análise de performance em tempo real
     */
    async analyzeRealTimePerformance(campaignData) {
        const performance = {
            current: {
                sent: campaignData.messagesSent || 0,
                delivered: campaignData.messagesDelivered || 0,
                responses: campaignData.responsesReceived || 0,
                conversions: campaignData.conversions || 0
            },
            rates: {},
            trends: {},
            alerts: [],
            optimization: {}
        };

        // Calcular taxas
        performance.rates = {
            delivery: performance.current.delivered / performance.current.sent,
            response: performance.current.responses / performance.current.delivered,
            conversion: performance.current.conversions / performance.current.responses
        };

        // Verificar alertas
        if (performance.rates.delivery < 0.95) {
            performance.alerts.push({
                type: 'delivery_issue',
                severity: 'high',
                message: 'Taxa de entrega abaixo de 95%',
                action: 'Verificar configurações WAHA'
            });
        }

        if (performance.rates.conversion < this.config.conversionTargets.minimum) {
            performance.alerts.push({
                type: 'low_conversion',
                severity: 'medium',
                message: 'Taxa de conversão abaixo do mínimo',
                action: 'Otimizar mensagens e segmentação'
            });
        }

        // Sugestões de otimização
        performance.optimization = await this.generateOptimizationSuggestions(performance);

        return performance;
    }

    /**
     * Gera sugestões de otimização
     */
    async generateOptimizationSuggestions(performance) {
        const suggestions = [];

        if (performance.rates.response < 0.1) {
            suggestions.push({
                area: 'messaging',
                suggestion: 'Testar mensagens mais personalizadas',
                expectedImpact: '15-25% aumento na taxa de resposta'
            });
        }

        if (performance.rates.conversion < 0.08) {
            suggestions.push({
                area: 'timing',
                suggestion: 'Ajustar horários de envio baseado na análise de engajamento',
                expectedImpact: '10-20% aumento na conversão'
            });
        }

        return suggestions;
    }

    // Métodos utilitários
    calculateInactiveDays(lastActivity) {
        if (!lastActivity) return 999;
        const now = new Date();
        const last = new Date(lastActivity);
        return Math.ceil((now - last) / (1000 * 60 * 60 * 24));
    }

    calculateLifetimeValue(member) {
        return member.paymentHistory?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    }

    calculateEngagementScore(member) {
        const visits = member.visitHistory?.length || 0;
        const duration = this.calculateMembershipDuration(member.joinDate);
        return duration > 0 ? visits / duration : 0;
    }

    calculateMembershipDuration(joinDate) {
        if (!joinDate) return 0;
        const now = new Date();
        const joined = new Date(joinDate);
        return Math.ceil((now - joined) / (1000 * 60 * 60 * 24 * 30)); // em meses
    }

    calculateAverageVisits(visitHistory) {
        if (!visitHistory || visitHistory.length === 0) return 0;

        const monthlyVisits = new Map();
        visitHistory.forEach(visit => {
            const month = new Date(visit.date).toISOString().slice(0, 7);
            monthlyVisits.set(month, (monthlyVisits.get(month) || 0) + 1);
        });

        const total = Array.from(monthlyVisits.values()).reduce((sum, count) => sum + count, 0);
        return total / monthlyVisits.size;
    }

    generateSegmentSummary(segments) {
        const total = Object.values(segments).reduce((sum, segment) => sum + segment.length, 0);

        return {
            total,
            distribution: Object.keys(segments).map(key => ({
                segment: key,
                count: segments[key].length,
                percentage: (segments[key].length / total * 100).toFixed(1)
            }))
        };
    }

    explainClassification(type, score, daysInactive, lifetimeValue) {
        const reasons = [];

        if (daysInactive > 90) reasons.push(`Inativo há ${daysInactive} dias`);
        if (lifetimeValue > 1000) reasons.push(`Alto valor (R$ ${lifetimeValue})`);
        if (score > 80) reasons.push('Alto potencial de conversão');

        return reasons.join('; ');
    }
}

/**
 * Coletor de métricas
 */
class MetricsCollector {
    constructor() {
        this.metrics = new Map();
    }

    record(metric, value, timestamp = new Date()) {
        if (!this.metrics.has(metric)) {
            this.metrics.set(metric, []);
        }

        this.metrics.get(metric).push({
            value,
            timestamp
        });
    }

    getMetric(metric, timeRange = '24h') {
        const data = this.metrics.get(metric) || [];
        const now = new Date();
        const cutoff = new Date(now.getTime() - this.parseTimeRange(timeRange));

        return data.filter(point => point.timestamp >= cutoff);
    }

    parseTimeRange(range) {
        const units = {
            'm': 60 * 1000,           // minutos
            'h': 60 * 60 * 1000,      // horas
            'd': 24 * 60 * 60 * 1000  // dias
        };

        const match = range.match(/(\d+)([mhd])/);
        if (!match) return 24 * 60 * 60 * 1000; // default 24h

        const [, num, unit] = match;
        return parseInt(num) * units[unit];
    }
}

/**
 * Motor de insights
 */
class InsightEngine {
    generateInsights(analytics) {
        const insights = [];

        // Insight sobre distribuição de segmentos
        const distribution = analytics.segmentation.summary.distribution;
        const hotPercentage = distribution.find(d => d.segment === 'hot')?.percentage || 0;

        if (hotPercentage > 30) {
            insights.push({
                type: 'opportunity',
                title: 'Alto potencial de conversão',
                description: `${hotPercentage}% dos leads são "quentes" (>90 dias inativos)`,
                action: 'Priorizar campanha para este segmento',
                impact: 'high'
            });
        }

        // Insight sobre ROI esperado
        const expectedROI = analytics.expectedOutcomes.expectedROI;
        if (expectedROI > 300) {
            insights.push({
                type: 'success',
                title: 'ROI excepcional previsto',
                description: `ROI esperado de ${expectedROI.toFixed(0)}%`,
                action: 'Prosseguir com campanha completa',
                impact: 'high'
            });
        }

        return insights;
    }
}

// Classes auxiliares
class MembershipAnalyzer {}
class BehaviorPredictor {}
class ConversionOptimizer {}
class RevenueCalculator {}

module.exports = GymAnalyticsMCP;