const pino = require('pino');
const moment = require('moment');

/**
 * Sistema Avançado de A/B Testing para Campanhas WhatsApp
 * Full Force Academia - Otimização de Performance em Tempo Real
 */
class ABTestingEngine {
    constructor(databaseService) {
        this.databaseService = databaseService;
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Configurações de A/B Testing
        this.testConfig = {
            minSampleSize: 30,          // Mínimo 30 leads por variante
            confidenceLevel: 0.95,      // 95% de confiança
            maxTestDuration: 7,         // Máximo 7 dias de teste
            significanceThreshold: 0.05, // p-value < 0.05
            trafficSplit: {
                'A': 0.5,  // 50% para versão A
                'B': 0.5   // 50% para versão B
            }
        };

        // Testes ativos
        this.activeTests = new Map();

        // Métricas de acompanhamento
        this.metrics = [
            'delivery_rate',    // Taxa de entrega
            'open_rate',        // Taxa de abertura (visualização)
            'response_rate',    // Taxa de resposta
            'conversion_rate',  // Taxa de conversão
            'engagement_score', // Score de engajamento
            'roi_impact'        // Impacto no ROI
        ];
    }

    /**
     * Cria novo teste A/B para mensagens
     */
    async createABTest(testConfig) {
        try {
            const testId = this.generateTestId();

            const test = {
                id: testId,
                name: testConfig.name,
                segment: testConfig.segment,
                startDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                endDate: moment().add(this.testConfig.maxTestDuration, 'days').format('YYYY-MM-DD HH:mm:ss'),
                status: 'ACTIVE',

                // Configurações das variantes
                variants: {
                    A: {
                        id: 'A',
                        name: testConfig.variants.A.name,
                        messageTemplate: testConfig.variants.A.template,
                        trafficPercentage: this.testConfig.trafficSplit.A,
                        metrics: this.initializeMetrics()
                    },
                    B: {
                        id: 'B',
                        name: testConfig.variants.B.name,
                        messageTemplate: testConfig.variants.B.template,
                        trafficPercentage: this.testConfig.trafficSplit.B,
                        metrics: this.initializeMetrics()
                    }
                },

                // Configurações do teste
                hypothesis: testConfig.hypothesis,
                targetMetric: testConfig.targetMetric || 'conversion_rate',
                minSampleSize: testConfig.minSampleSize || this.testConfig.minSampleSize,

                // Dados estatísticos
                statistics: {
                    totalSamples: 0,
                    samplesA: 0,
                    samplesB: 0,
                    isSignificant: false,
                    pValue: null,
                    confidenceInterval: null,
                    winner: null
                }
            };

            // Salvar teste no banco
            await this.saveTestToDatabase(test);

            // Adicionar à lista de testes ativos
            this.activeTests.set(testId, test);

            this.logger.info(`🧪 Teste A/B criado: ${testId}`, {
                segment: test.segment,
                variantA: test.variants.A.name,
                variantB: test.variants.B.name,
                targetMetric: test.targetMetric
            });

            return test;

        } catch (error) {
            this.logger.error('❌ Erro ao criar teste A/B:', error);
            throw error;
        }
    }

    /**
     * Determina qual variante enviar para um lead específico
     */
    async assignVariant(testId, leadData) {
        try {
            const test = this.activeTests.get(testId) || await this.loadTestFromDatabase(testId);

            if (!test || test.status !== 'ACTIVE') {
                return null;
            }

            // Verificar se o lead já foi atribuído a uma variante
            const existingAssignment = await this.getLeadAssignment(testId, leadData.telefone);
            if (existingAssignment) {
                return existingAssignment.variant;
            }

            // Determinar variante usando hash consistente do telefone
            const variant = this.hashBasedAssignment(leadData.telefone, test.variants);

            // Salvar atribuição
            await this.saveLeadAssignment({
                testId: testId,
                phone: leadData.telefone,
                variant: variant,
                assignmentDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                leadData: {
                    name: leadData.nome,
                    segment: leadData.segment,
                    campaignId: leadData.campaignId
                }
            });

            this.logger.debug(`📊 Lead ${leadData.primeiroNome} atribuído à variante ${variant} do teste ${testId}`);

            return variant;

        } catch (error) {
            this.logger.error(`❌ Erro ao atribuir variante para ${leadData.telefone}:`, error);
            return 'A'; // Fallback para variante A
        }
    }

    /**
     * Registra evento/métrica do teste A/B
     */
    async recordEvent(testId, phone, eventType, eventData = {}) {
        try {
            const assignment = await this.getLeadAssignment(testId, phone);
            if (!assignment) {
                this.logger.warn(`⚠️ Tentativa de registrar evento para lead não atribuído: ${phone}`);
                return;
            }

            const event = {
                testId: testId,
                phone: phone,
                variant: assignment.variant,
                eventType: eventType,
                eventData: eventData,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            // Salvar evento no banco
            await this.saveTestEvent(event);

            // Atualizar métricas em tempo real
            await this.updateTestMetrics(testId, assignment.variant, eventType, eventData);

            // Verificar se teste atingiu significância estatística
            await this.checkTestSignificance(testId);

            this.logger.debug(`📈 Evento registrado: ${eventType} para ${phone} (variante ${assignment.variant})`);

        } catch (error) {
            this.logger.error(`❌ Erro ao registrar evento ${eventType} para ${phone}:`, error);
        }
    }

    /**
     * Atualiza métricas do teste em tempo real
     */
    async updateTestMetrics(testId, variant, eventType, eventData) {
        try {
            const test = this.activeTests.get(testId) || await this.loadTestFromDatabase(testId);
            if (!test) return;

            const variantData = test.variants[variant];
            if (!variantData) return;

            // Incrementar contador específico do evento
            switch (eventType) {
                case 'message_sent':
                    variantData.metrics.messagesSent++;
                    break;
                case 'message_delivered':
                    variantData.metrics.messagesDelivered++;
                    break;
                case 'message_read':
                    variantData.metrics.messagesRead++;
                    break;
                case 'response_received':
                    variantData.metrics.responsesReceived++;
                    break;
                case 'conversion':
                    variantData.metrics.conversions++;
                    variantData.metrics.conversionValue += eventData.value || 0;
                    break;
                case 'opt_out':
                    variantData.metrics.optOuts++;
                    break;
            }

            // Recalcular taxas
            this.recalculateVariantRates(variantData);

            // Atualizar teste na memória e banco
            this.activeTests.set(testId, test);
            await this.updateTestInDatabase(test);

        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar métricas do teste ${testId}:`, error);
        }
    }

    /**
     * Verifica significância estatística do teste
     */
    async checkTestSignificance(testId) {
        try {
            const test = this.activeTests.get(testId) || await this.loadTestFromDatabase(testId);
            if (!test) return;

            const variantA = test.variants.A;
            const variantB = test.variants.B;

            // Verificar se há amostras suficientes
            if (variantA.metrics.messagesSent < test.minSampleSize ||
                variantB.metrics.messagesSent < test.minSampleSize) {
                return;
            }

            // Calcular significância estatística usando teste Z para proporções
            const statsResult = this.calculateStatisticalSignificance(
                variantA.metrics,
                variantB.metrics,
                test.targetMetric
            );

            test.statistics = {
                ...test.statistics,
                totalSamples: variantA.metrics.messagesSent + variantB.metrics.messagesSent,
                samplesA: variantA.metrics.messagesSent,
                samplesB: variantB.metrics.messagesSent,
                isSignificant: statsResult.isSignificant,
                pValue: statsResult.pValue,
                confidenceInterval: statsResult.confidenceInterval,
                winner: statsResult.winner,
                lastCalculated: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            // Se teste é significativo e passou tempo mínimo, finalizar
            if (statsResult.isSignificant &&
                moment().diff(moment(test.startDate), 'days') >= 2) {

                await this.finalizeTest(testId, statsResult.winner);
            }

            // Atualizar teste
            this.activeTests.set(testId, test);
            await this.updateTestInDatabase(test);

            if (statsResult.isSignificant) {
                this.logger.info(`🎯 Teste ${testId} atingiu significância estatística! Vencedor: Variante ${statsResult.winner}`);
            }

        } catch (error) {
            this.logger.error(`❌ Erro ao verificar significância do teste ${testId}:`, error);
        }
    }

    /**
     * Calcula significância estatística entre duas variantes
     */
    calculateStatisticalSignificance(metricsA, metricsB, targetMetric) {
        try {
            // Obter valores da métrica alvo
            const [valueA, totalA] = this.getMetricValues(metricsA, targetMetric);
            const [valueB, totalB] = this.getMetricValues(metricsB, targetMetric);

            if (totalA === 0 || totalB === 0) {
                return { isSignificant: false, pValue: 1, winner: null };
            }

            // Calcular proporções
            const p1 = valueA / totalA;
            const p2 = valueB / totalB;

            // Teste Z para diferença de proporções
            const pooledP = (valueA + valueB) / (totalA + totalB);
            const se = Math.sqrt(pooledP * (1 - pooledP) * (1/totalA + 1/totalB));

            if (se === 0) {
                return { isSignificant: false, pValue: 1, winner: null };
            }

            const z = (p1 - p2) / se;
            const pValue = 2 * (1 - this.normalCDF(Math.abs(z))); // Teste bicaudal

            // Intervalo de confiança para diferença de proporções
            const marginError = 1.96 * se; // 95% de confiança
            const confidenceInterval = {
                lower: (p1 - p2) - marginError,
                upper: (p1 - p2) + marginError
            };

            return {
                isSignificant: pValue < this.testConfig.significanceThreshold,
                pValue: pValue,
                confidenceInterval: confidenceInterval,
                winner: p1 > p2 ? 'A' : (p2 > p1 ? 'B' : null),
                lift: p1 > p2 ? ((p1 - p2) / p2 * 100) : ((p2 - p1) / p1 * 100)
            };

        } catch (error) {
            this.logger.error('❌ Erro no cálculo de significância:', error);
            return { isSignificant: false, pValue: 1, winner: null };
        }
    }

    /**
     * Finaliza teste A/B e implementa vencedor
     */
    async finalizeTest(testId, winner) {
        try {
            const test = this.activeTests.get(testId);
            if (!test) return;

            test.status = 'COMPLETED';
            test.endDate = moment().format('YYYY-MM-DD HH:mm:ss');
            test.statistics.winner = winner;

            // Gerar relatório final
            const report = await this.generateTestReport(test);

            // Implementar template vencedor
            if (winner && test.autoImplement !== false) {
                await this.implementWinningVariant(test, winner);
            }

            // Atualizar no banco
            await this.updateTestInDatabase(test);

            // Remover da lista de testes ativos
            this.activeTests.delete(testId);

            this.logger.info(`🏆 Teste A/B finalizado: ${testId}`, {
                winner: winner,
                improvement: report.improvement,
                confidence: `${((1 - test.statistics.pValue) * 100).toFixed(1)}%`
            });

            return report;

        } catch (error) {
            this.logger.error(`❌ Erro ao finalizar teste ${testId}:`, error);
        }
    }

    /**
     * Implementa variante vencedora como padrão
     */
    async implementWinningVariant(test, winner) {
        try {
            const winningTemplate = test.variants[winner].messageTemplate;

            // Atualizar template padrão para o segmento
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT OR REPLACE INTO message_templates
                    (segment, template_type, template_content, is_default, created_at)
                    VALUES (?, ?, ?, 1, datetime('now'))
                `, [test.segment, 'reactivation', JSON.stringify(winningTemplate)]);
            }

            this.logger.info(`✅ Template vencedor implementado para segmento ${test.segment}`);

        } catch (error) {
            this.logger.error(`❌ Erro ao implementar variante vencedora:`, error);
        }
    }

    /**
     * Gera relatório completo do teste A/B
     */
    async generateTestReport(test) {
        try {
            const variantA = test.variants.A;
            const variantB = test.variants.B;

            const report = {
                testId: test.id,
                testName: test.name,
                segment: test.segment,
                duration: moment(test.endDate).diff(moment(test.startDate), 'days'),

                results: {
                    winner: test.statistics.winner,
                    isSignificant: test.statistics.isSignificant,
                    confidence: ((1 - test.statistics.pValue) * 100).toFixed(1) + '%',

                    variantA: {
                        ...variantA.metrics,
                        sampleSize: variantA.metrics.messagesSent
                    },

                    variantB: {
                        ...variantB.metrics,
                        sampleSize: variantB.metrics.messagesSent
                    }
                },

                improvements: {
                    conversionRate: this.calculateImprovement(
                        variantA.metrics.conversionRate,
                        variantB.metrics.conversionRate
                    ),
                    responseRate: this.calculateImprovement(
                        variantA.metrics.responseRate,
                        variantB.metrics.responseRate
                    ),
                    deliveryRate: this.calculateImprovement(
                        variantA.metrics.deliveryRate,
                        variantB.metrics.deliveryRate
                    )
                },

                insights: this.generateTestInsights(test),
                recommendations: this.generateRecommendations(test)
            };

            return report;

        } catch (error) {
            this.logger.error(`❌ Erro ao gerar relatório do teste:`, error);
            return null;
        }
    }

    /**
     * Métodos auxiliares
     */

    generateTestId() {
        return `AB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    initializeMetrics() {
        return {
            messagesSent: 0,
            messagesDelivered: 0,
            messagesRead: 0,
            responsesReceived: 0,
            conversions: 0,
            conversionValue: 0,
            optOuts: 0,
            deliveryRate: 0,
            openRate: 0,
            responseRate: 0,
            conversionRate: 0,
            avgConversionValue: 0
        };
    }

    hashBasedAssignment(phone, variants) {
        // Hash consistente baseado no telefone
        const hash = this.simpleHash(phone);
        return hash % 2 === 0 ? 'A' : 'B';
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    recalculateVariantRates(variantData) {
        const metrics = variantData.metrics;

        if (metrics.messagesSent > 0) {
            metrics.deliveryRate = metrics.messagesDelivered / metrics.messagesSent;
            metrics.responseRate = metrics.responsesReceived / metrics.messagesSent;
            metrics.conversionRate = metrics.conversions / metrics.messagesSent;
        }

        if (metrics.messagesDelivered > 0) {
            metrics.openRate = metrics.messagesRead / metrics.messagesDelivered;
        }

        if (metrics.conversions > 0) {
            metrics.avgConversionValue = metrics.conversionValue / metrics.conversions;
        }
    }

    getMetricValues(metrics, targetMetric) {
        switch (targetMetric) {
            case 'conversion_rate':
                return [metrics.conversions, metrics.messagesSent];
            case 'response_rate':
                return [metrics.responsesReceived, metrics.messagesSent];
            case 'delivery_rate':
                return [metrics.messagesDelivered, metrics.messagesSent];
            case 'open_rate':
                return [metrics.messagesRead, metrics.messagesDelivered];
            default:
                return [metrics.conversions, metrics.messagesSent];
        }
    }

    normalCDF(x) {
        // Aproximação da função de distribuição normal
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Aproximação da função erro
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    calculateImprovement(valueA, valueB) {
        if (valueB === 0) return null;
        return ((valueA - valueB) / valueB * 100).toFixed(2) + '%';
    }

    // Métodos de banco de dados (placeholders)
    async saveTestToDatabase(test) {
        if (!this.databaseService) return;
        // Implementar salvamento no banco
    }

    async loadTestFromDatabase(testId) {
        if (!this.databaseService) return null;
        // Implementar carregamento do banco
    }

    async updateTestInDatabase(test) {
        if (!this.databaseService) return;
        // Implementar atualização no banco
    }

    async saveLeadAssignment(assignment) {
        if (!this.databaseService) return;
        // Implementar salvamento de atribuição
    }

    async getLeadAssignment(testId, phone) {
        if (!this.databaseService) return null;
        // Implementar busca de atribuição
    }

    async saveTestEvent(event) {
        if (!this.databaseService) return;
        // Implementar salvamento de evento
    }

    generateTestInsights(test) {
        // Implementar geração de insights
        return [];
    }

    generateRecommendations(test) {
        // Implementar geração de recomendações
        return [];
    }
}

module.exports = ABTestingEngine;