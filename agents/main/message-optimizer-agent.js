/**
 * Message Optimizer Agent - FFGym
 * Responsável pela otimização de mensagens e timing de envio
 */

class MessageOptimizerAgent {
    constructor(config = {}) {
        this.config = {
            agentId: 'message-optimizer',
            name: 'Message Optimizer',
            version: '1.0.0',
            capabilities: [
                'message_personalization',
                'timing_optimization',
                'ab_testing',
                'sentiment_analysis',
                'cta_optimization',
                'engagement_tracking'
            ],
            algorithms: {
                personalización: 'dynamic_template_engine',
                timing: 'predictive_delivery_optimization',
                testing: 'multivariate_continuous_testing',
                sentiment: 'nlp_emotion_detection'
            },
            templates: {
                segments: {
                    VIP: {
                        tone: 'exclusive',
                        urgency: 'high',
                        personalization: 'maximum',
                        cta: 'QUERO MINHA VAGA VIP'
                    },
                    HOT: {
                        tone: 'motivational',
                        urgency: 'medium',
                        personalization: 'high',
                        cta: 'QUERO PARTICIPAR'
                    },
                    WARM: {
                        tone: 'friendly',
                        urgency: 'low',
                        personalization: 'medium',
                        cta: 'QUERO SABER MAIS'
                    },
                    COLD: {
                        tone: 'informative',
                        urgency: 'none',
                        personalization: 'basic',
                        cta: 'QUERO INFORMAÇÕES'
                    },
                    CHAMPION: {
                        tone: 'celebratory',
                        urgency: 'medium',
                        personalization: 'maximum',
                        cta: 'QUERO VOLTAR'
                    },
                    'AT-RISK': {
                        tone: 'supportive',
                        urgency: 'high',
                        personalization: 'high',
                        cta: 'PRECISO DE AJUDA'
                    }
                }
            },
            ...config
        };

        this.state = {
            status: 'idle',
            activeTests: [],
            performance: {},
            learnings: [],
            optimizations: []
        };

        this.personalizationEngine = new PersonalizationEngine();
        this.timingOptimizer = new TimingOptimizer();
        this.abTester = new ABTester();
        this.sentimentAnalyzer = new SentimentAnalyzer();
    }

    async initialize() {
        console.log(`🎯 Inicializando ${this.config.name}...`);

        try {
            await this.loadHistoricalData();
            await this.initializePersonalizationEngine();
            await this.setupTimingOptimization();
            await this.loadActiveTests();

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

    async optimizeMessage(messageData) {
        const { content, segment, leadData, context } = messageData;

        try {
            // 1. Aplicar personalização baseada no segmento
            const personalizedContent = await this.personalizationEngine.personalize({
                content,
                segment,
                leadData,
                template: this.config.templates.segments[segment]
            });

            // 2. Otimizar timing de envio
            const optimalTiming = await this.timingOptimizer.calculateOptimalTime({
                leadData,
                segment,
                historicalData: this.state.performance
            });

            // 3. Aplicar A/B testing se ativo
            const testVariant = await this.abTester.selectVariant({
                segment,
                leadData,
                activeTests: this.state.activeTests
            });

            // 4. Análise de sentiment
            const sentimentScore = await this.sentimentAnalyzer.analyze(personalizedContent);

            const optimizedMessage = {
                content: personalizedContent,
                timing: optimalTiming,
                variant: testVariant,
                sentiment: sentimentScore,
                metadata: {
                    segment,
                    personalizationLevel: this.config.templates.segments[segment].personalization,
                    expectedEngagement: this.calculateEngagementPrediction(segment, sentimentScore)
                }
            };

            // Registrar para aprendizado
            this.recordOptimization(optimizedMessage, context);

            return optimizedMessage;

        } catch (error) {
            console.error('❌ Erro na otimização da mensagem:', error);
            throw error;
        }
    }

    async analyzeResponse(responseData) {
        const { response, originalMessage, leadData, segment } = responseData;

        try {
            // Classificar tipo de resposta
            const responseType = await this.classifyResponse(response);

            // Análise de sentiment da resposta
            const responseSentiment = await this.sentimentAnalyzer.analyze(response);

            // Calcular engagement score
            const engagementScore = this.calculateEngagementScore(responseType, responseSentiment);

            // Identificar insights para otimização
            const insights = await this.extractInsights({
                response,
                responseType,
                sentiment: responseSentiment,
                engagement: engagementScore,
                segment,
                originalMessage
            });

            const analysis = {
                type: responseType,
                sentiment: responseSentiment,
                engagement: engagementScore,
                insights,
                recommendations: await this.generateRecommendations(insights, segment)
            };

            // Alimentar sistema de aprendizado
            await this.updateLearningModel(analysis, leadData);

            return analysis;

        } catch (error) {
            console.error('❌ Erro na análise de resposta:', error);
            throw error;
        }
    }

    async classifyResponse(response) {
        const text = response.toLowerCase();

        // Target responses (conversão imediata)
        if (text.includes('quero minha vaga') ||
            text.includes('quero participar') ||
            text.includes('aceito') ||
            text.includes('sim, quero')) {
            return 'TARGET';
        }

        // Interest (demonstra interesse)
        if (text.includes('interessado') ||
            text.includes('gostaria') ||
            text.includes('talvez') ||
            text.includes('mais informações')) {
            return 'INTEREST';
        }

        // Questions (dúvidas específicas)
        if (text.includes('?') ||
            text.includes('como') ||
            text.includes('quando') ||
            text.includes('onde') ||
            text.includes('quanto')) {
            return 'QUESTION';
        }

        // Objections (objeções sobre preço/tempo)
        if (text.includes('caro') ||
            text.includes('não tenho tempo') ||
            text.includes('não posso') ||
            text.includes('muito dinheiro')) {
            return 'OBJECTION';
        }

        // Negative (recusa clara)
        if (text.includes('não quero') ||
            text.includes('não me interessa') ||
            text.includes('pare') ||
            text.includes('não envie mais')) {
            return 'NEGATIVE';
        }

        return 'GENERIC';
    }

    calculateEngagementScore(responseType, sentiment) {
        const baseScores = {
            'TARGET': 100,
            'INTEREST': 75,
            'QUESTION': 60,
            'OBJECTION': 40,
            'GENERIC': 30,
            'NEGATIVE': 0
        };

        const sentimentMultiplier = Math.max(0.5, (sentiment.score + 1) / 2);
        return Math.round(baseScores[responseType] * sentimentMultiplier);
    }

    async extractInsights(analysisData) {
        const { responseType, sentiment, segment, originalMessage } = analysisData;

        const insights = [];

        // Insights baseados no tipo de resposta
        if (responseType === 'OBJECTION') {
            insights.push({
                type: 'objection_pattern',
                message: 'Lead demonstrou objeção - ajustar abordagem',
                priority: 'high',
                action: 'customize_objection_handling'
            });
        }

        if (responseType === 'QUESTION') {
            insights.push({
                type: 'information_need',
                message: 'Lead precisa de mais informações',
                priority: 'medium',
                action: 'provide_detailed_info'
            });
        }

        // Insights de sentiment
        if (sentiment.score < -0.3) {
            insights.push({
                type: 'negative_sentiment',
                message: 'Resposta com sentiment negativo - revisar tom',
                priority: 'high',
                action: 'adjust_tone'
            });
        }

        return insights;
    }

    async generateRecommendations(insights, segment) {
        const recommendations = [];

        for (const insight of insights) {
            switch (insight.action) {
                case 'customize_objection_handling':
                    recommendations.push({
                        type: 'message_adjustment',
                        content: 'Enviar mensagem específica para tratar objeção',
                        template: 'objection_handler',
                        priority: insight.priority
                    });
                    break;

                case 'provide_detailed_info':
                    recommendations.push({
                        type: 'information_provision',
                        content: 'Fornecer informações detalhadas solicitadas',
                        template: 'detailed_info',
                        priority: insight.priority
                    });
                    break;

                case 'adjust_tone':
                    recommendations.push({
                        type: 'tone_adjustment',
                        content: 'Ajustar tom da próxima mensagem',
                        adjustment: 'more_empathetic',
                        priority: insight.priority
                    });
                    break;
            }
        }

        return recommendations;
    }

    calculateEngagementPrediction(segment, sentimentScore) {
        const baseEngagement = {
            'VIP': 0.85,
            'HOT': 0.70,
            'WARM': 0.55,
            'COLD': 0.30,
            'CHAMPION': 0.80,
            'AT-RISK': 0.60
        };

        const sentimentMultiplier = Math.max(0.3, (sentimentScore.score + 1) / 2);
        return Math.round(baseEngagement[segment] * sentimentMultiplier * 100);
    }

    async loadHistoricalData() {
        // Carregar dados históricos de performance
        this.state.performance = {
            messagesBySegment: {},
            responseRates: {},
            conversionRates: {},
            timingAnalysis: {}
        };
    }

    async initializePersonalizationEngine() {
        this.personalizationEngine = {
            personalize: async (data) => {
                const { content, segment, leadData, template } = data;

                // Personalização básica baseada no template do segmento
                let personalizedContent = content
                    .replace(/\{NOME\}/g, leadData.name || 'amigo(a)')
                    .replace(/\{SEGMENTO\}/g, segment)
                    .replace(/\{CTA\}/g, template.cta);

                // Aplicar tom específico do segmento
                if (template.tone === 'exclusive') {
                    personalizedContent = `🏆 EXCLUSIVO: ${personalizedContent}`;
                } else if (template.tone === 'motivational') {
                    personalizedContent = `💪 ${personalizedContent}`;
                } else if (template.tone === 'friendly') {
                    personalizedContent = `😊 ${personalizedContent}`;
                }

                return personalizedContent;
            }
        };
    }

    async setupTimingOptimization() {
        this.timingOptimizer = {
            calculateOptimalTime: async (data) => {
                const { leadData, segment } = data;

                // Lógica de timing baseada no segmento
                const optimalHours = {
                    'VIP': [9, 14, 19],      // Horários executivos
                    'HOT': [8, 12, 18],      // Horários ativos
                    'WARM': [10, 15, 20],    // Horários relaxados
                    'COLD': [11, 16, 21],    // Horários de descoberta
                    'CHAMPION': [7, 13, 19], // Horários de treino
                    'AT-RISK': [9, 15, 20]   // Horários de suporte
                };

                const now = new Date();
                const currentHour = now.getHours();
                const segmentHours = optimalHours[segment] || [9, 14, 19];

                // Encontrar próximo horário ótimo
                let nextOptimalHour = segmentHours.find(hour => hour > currentHour);
                if (!nextOptimalHour) {
                    nextOptimalHour = segmentHours[0]; // Próximo dia
                }

                const optimalTime = new Date();
                optimalTime.setHours(nextOptimalHour, 0, 0, 0);

                if (nextOptimalHour <= currentHour) {
                    optimalTime.setDate(optimalTime.getDate() + 1);
                }

                return {
                    timestamp: optimalTime,
                    confidence: 0.8,
                    reason: `Horário otimizado para segmento ${segment}`
                };
            }
        };
    }

    async loadActiveTests() {
        this.abTester = {
            selectVariant: async (data) => {
                // Sistema básico de A/B testing
                return {
                    variant: 'A', // Por enquanto sempre variante A
                    testId: null,
                    confidence: 1.0
                };
            }
        };
    }

    recordOptimization(optimizedMessage, context) {
        this.state.optimizations.push({
            timestamp: new Date(),
            message: optimizedMessage,
            context,
            performance: null // Será preenchido depois da resposta
        });
    }

    async updateLearningModel(analysis, leadData) {
        this.state.learnings.push({
            timestamp: new Date(),
            analysis,
            leadData,
            improvements: analysis.recommendations
        });

        // Aqui seria implementado o machine learning para melhorar as otimizações
        console.log(`📈 Aprendizado registrado para segmento ${leadData.segment}`);
    }

    getPerformanceMetrics() {
        return {
            optimizationsCount: this.state.optimizations.length,
            learningsCount: this.state.learnings.length,
            activeTestsCount: this.state.activeTests.length,
            status: this.state.status
        };
    }
}

// Classes auxiliares simuladas
class PersonalizationEngine {
    async personalize(data) {
        return data.content; // Implementação básica
    }
}

class TimingOptimizer {
    async calculateOptimalTime(data) {
        return { timestamp: new Date(), confidence: 0.8 };
    }
}

class ABTester {
    async selectVariant(data) {
        return { variant: 'A', testId: null };
    }
}

class SentimentAnalyzer {
    async analyze(text) {
        // Análise básica de sentiment
        const positiveWords = ['quero', 'gostaria', 'interessado', 'sim', 'ótimo', 'perfeito'];
        const negativeWords = ['não', 'caro', 'impossível', 'difícil', 'problema'];

        const words = text.toLowerCase().split(' ');
        let score = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) score += 0.1;
            if (negativeWords.includes(word)) score -= 0.1;
        });

        return {
            score: Math.max(-1, Math.min(1, score)),
            magnitude: Math.abs(score),
            label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral'
        };
    }
}

module.exports = MessageOptimizerAgent;