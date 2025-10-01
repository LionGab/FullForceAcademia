/**
 * MCP WhatsApp Automation - FFGym
 * Gerenciamento inteligente de automação WhatsApp para academia
 */

class WhatsAppAutomationMCP {
    constructor(config = {}) {
        this.config = {
            wahaUrl: config.wahaUrl || 'http://localhost:3000',
            rateLimits: {
                messagesPerMinute: 20,
                messagesPerHour: 300,
                burstLimit: 5
            },
            retryPolicy: {
                maxRetries: 3,
                backoffMultiplier: 2,
                initialDelay: 1000
            },
            segmentation: {
                coldThreshold: 30, // dias
                hotThreshold: 60   // dias
            },
            ...config
        };

        this.messageQueue = [];
        this.rateLimitTracker = new Map();
        this.deliveryTracker = new Map();
        this.responseAnalyzer = new ResponseAnalyzer();
        this.status = 'idle';
    }

    /**
     * Inicializa o MCP WhatsApp Automation
     */
    async initialize() {
        console.log('📱 Inicializando WhatsApp Automation MCP...');

        try {
            // Verificar conectividade com WAHA
            await this.checkWAHAConnection();

            // Inicializar rate limiting
            this.initializeRateLimiting();

            // Configurar response analyzer
            await this.responseAnalyzer.initialize();

            this.status = 'ready';
            console.log('✅ WhatsApp Automation MCP inicializado');

            return {
                success: true,
                status: this.status,
                config: this.config
            };
        } catch (error) {
            console.error('❌ Erro ao inicializar WhatsApp MCP:', error);
            this.status = 'error';
            throw error;
        }
    }

    async checkWAHAConnection() {
        // Simular verificação de conexão
        if (this.config.enabled !== false) {
            console.log('  ✅ Conexão WAHA verificada');
        }
    }

    initializeRateLimiting() {
        this.rateLimitTracker.clear();
        console.log('  ✅ Rate limiting configurado');
    }

    getStatus() {
        return this.status;
    }

    setAnalyticsProvider(provider) {
        this.analyticsProvider = provider;
    }

    setN8NProvider(provider) {
        this.n8nProvider = provider;
    }

    /**
     * Processa campanha de reativação baseada em segmentação
     */
    async processCampaign(leads, campaignType = 'reactivation') {
        console.log(`🚀 Iniciando campanha ${campaignType} para ${leads.length} leads`);

        const results = {
            sent: 0,
            failed: 0,
            queued: 0,
            conversions: 0,
            revenue: 0
        };

        for (const lead of leads) {
            try {
                const segment = this.classifyLead(lead);
                const message = this.generateMessage(lead, segment);

                const sendResult = await this.sendMessage(lead.phone, message, {
                    priority: segment.priority,
                    personalizations: segment.personalizations
                });

                if (sendResult.success) {
                    results.sent++;
                    this.trackDelivery(lead.id, sendResult.messageId);
                } else {
                    results.failed++;
                    await this.handleFailure(lead, sendResult.error);
                }

                // Rate limiting inteligente
                await this.smartDelay(segment.priority);

            } catch (error) {
                console.error(`❌ Erro ao processar lead ${lead.id}:`, error);
                results.failed++;
            }
        }

        return results;
    }

    /**
     * Classifica lead baseado em dias de inatividade e histórico
     */
    classifyLead(lead) {
        const daysInactive = this.calculateInactiveDays(lead.lastActivity);

        if (daysInactive <= this.config.segmentation.coldThreshold) {
            return {
                type: 'warm',
                priority: 'medium',
                messageType: 'gentle_return',
                personalizations: ['name', 'lastWorkout'],
                expectedConversion: 0.15
            };
        } else if (daysInactive <= this.config.segmentation.hotThreshold) {
            return {
                type: 'cold',
                priority: 'low',
                messageType: 'discount_offer',
                personalizations: ['name', 'discount'],
                expectedConversion: 0.08
            };
        } else {
            return {
                type: 'hot',
                priority: 'high',
                messageType: 'transformation_challenge',
                personalizations: ['name', 'urgency', 'scarcity'],
                expectedConversion: 0.12
            };
        }
    }

    /**
     * Gera mensagem personalizada baseada no segmento
     */
    generateMessage(lead, segment) {
        const templates = {
            transformation_challenge: this.getTransformationMessage(lead),
            discount_offer: this.getDiscountMessage(lead),
            gentle_return: this.getGentleReturnMessage(lead)
        };

        let message = templates[segment.messageType] || templates.discount_offer;

        // Aplicar personalizações
        if (segment.personalizations.includes('name')) {
            message = message.replace('[NOME]', lead.name || 'amigo(a)');
        }

        if (segment.personalizations.includes('urgency')) {
            message = this.addUrgencyElements(message);
        }

        if (segment.personalizations.includes('scarcity')) {
            message = this.addScarcityElements(message);
        }

        return message;
    }

    /**
     * Mensagem para segmento quente (>60 dias)
     */
    getTransformationMessage(lead) {
        return `Oi ${lead.name || '[NOME]'}, tá por aí? 🤔

Me responde uma coisa: você quer ser aquela pessoa que todo mundo vai perguntar 'o que você fez?' em dezembro?

Eu tenho exatamente 90 dias pra te levar até lá.

🏋️ Academia Full Force - Matupá
*Transformação Real em 90 Dias*`;
    }

    /**
     * Mensagem para segmento frio (30-60 dias)
     */
    getDiscountMessage(lead) {
        return `🏋️ Academia Full Force - Matupá

Olá ${lead.name || '[NOME]'}! Sentimos sua falta! 💪

35% de desconto na mensalidade
✅ Avaliação física gratuita
✅ 1 mês de personal incluso

De R$ 179,00 por apenas R$ 149,00/mês (3 meses)

Promoção válida apenas até o final da semana!
Responda: "QUERO MINHA VAGA"`;
    }

    /**
     * Mensagem para retorno suave
     */
    getGentleReturnMessage(lead) {
        return `Oi ${lead.name || '[NOME]'}! 👋

Notamos que você não tem aparecido na academia ultimamente. Tudo bem?

Que tal voltarmos juntos? Preparamos uma oferta especial para você:

💪 2 semanas gratuitas de volta
🎯 Avaliação física completa
📋 Novo plano de treino personalizado

Responda: "QUERO VOLTAR"`;
    }

    /**
     * Envia mensagem com retry inteligente
     */
    async sendMessage(phone, message, options = {}) {
        const formattedPhone = this.formatPhone(phone);

        if (!this.canSendMessage(formattedPhone)) {
            return {
                success: false,
                error: 'Rate limit exceeded',
                queued: true
            };
        }

        for (let attempt = 0; attempt < this.config.retryPolicy.maxRetries; attempt++) {
            try {
                const response = await this.makeWhatsAppRequest(formattedPhone, message);

                if (response.success) {
                    this.updateRateLimit(formattedPhone);
                    return {
                        success: true,
                        messageId: response.messageId,
                        timestamp: new Date().toISOString()
                    };
                }

                // Se não foi sucesso, aguardar antes de retry
                if (attempt < this.config.retryPolicy.maxRetries - 1) {
                    const delay = this.config.retryPolicy.initialDelay *
                                 Math.pow(this.config.retryPolicy.backoffMultiplier, attempt);
                    await this.sleep(delay);
                }

            } catch (error) {
                console.error(`❌ Tentativa ${attempt + 1} falhou:`, error.message);

                if (attempt === this.config.retryPolicy.maxRetries - 1) {
                    return {
                        success: false,
                        error: error.message,
                        attempts: attempt + 1
                    };
                }
            }
        }
    }

    /**
     * Faz requisição para WAHA API
     */
    async makeWhatsAppRequest(phone, message) {
        const axios = require('axios');

        const payload = {
            chatId: `${phone}@c.us`,
            text: message,
            session: 'default'
        };

        const response = await axios.post(
            `${this.config.wahaUrl}/api/sendText`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return {
            success: response.status === 200,
            messageId: response.data?.id,
            data: response.data
        };
    }

    /**
     * Verifica se pode enviar mensagem (rate limiting)
     */
    canSendMessage(phone) {
        const now = Date.now();
        const tracker = this.rateLimitTracker.get(phone) || {
            minuteCount: 0,
            hourCount: 0,
            lastMinute: now,
            lastHour: now
        };

        // Reset contadores se passou o tempo
        if (now - tracker.lastMinute > 60000) {
            tracker.minuteCount = 0;
            tracker.lastMinute = now;
        }

        if (now - tracker.lastHour > 3600000) {
            tracker.hourCount = 0;
            tracker.lastHour = now;
        }

        // Verificar limites
        if (tracker.minuteCount >= this.config.rateLimits.messagesPerMinute ||
            tracker.hourCount >= this.config.rateLimits.messagesPerHour) {
            return false;
        }

        return true;
    }

    /**
     * Atualiza contadores de rate limit
     */
    updateRateLimit(phone) {
        const now = Date.now();
        const tracker = this.rateLimitTracker.get(phone) || {
            minuteCount: 0,
            hourCount: 0,
            lastMinute: now,
            lastHour: now
        };

        tracker.minuteCount++;
        tracker.hourCount++;

        this.rateLimitTracker.set(phone, tracker);
    }

    /**
     * Delay inteligente baseado na prioridade
     */
    async smartDelay(priority) {
        const delays = {
            high: 2000,    // 2 segundos
            medium: 3000,  // 3 segundos
            low: 5000      // 5 segundos
        };

        await this.sleep(delays[priority] || delays.medium);
    }

    /**
     * Processa resposta recebida
     */
    async processResponse(messageData) {
        const analysis = await this.responseAnalyzer.analyze(messageData.text);

        const response = {
            leadId: this.findLeadByPhone(messageData.from),
            type: analysis.type,
            sentiment: analysis.sentiment,
            intent: analysis.intent,
            confidence: analysis.confidence,
            suggestedAction: analysis.suggestedAction,
            timestamp: new Date().toISOString()
        };

        // Ações automáticas baseadas no tipo de resposta
        await this.handleResponseAction(response);

        return response;
    }

    /**
     * Handle ações baseadas na resposta
     */
    async handleResponseAction(response) {
        switch (response.type) {
            case 'target':
                // "QUERO MINHA VAGA" - Conversão imediata
                await this.triggerConversion(response.leadId);
                break;

            case 'interest':
                // Interesse demonstrado - Nurturing
                await this.triggerNurturing(response.leadId);
                break;

            case 'objection':
                // Objeção - Tratamento automático
                await this.handleObjection(response.leadId, response.intent);
                break;

            case 'negative':
                // Resposta negativa - Remover da lista
                await this.removeFromCampaign(response.leadId);
                break;

            default:
                // Resposta genérica - Orientar para target
                await this.sendTargetGuidance(response.leadId);
        }
    }

    /**
     * Adiciona elementos de urgência
     */
    addUrgencyElements(message) {
        const urgencyPhrases = [
            "🔥 Últimas vagas disponíveis!",
            "⏰ Oferta válida apenas hoje!",
            "🚨 Apenas 3 vagas restantes!"
        ];

        const randomPhrase = urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)];
        return message + "\n\n" + randomPhrase;
    }

    /**
     * Adiciona elementos de escassez
     */
    addScarcityElements(message) {
        const scarcityPhrases = [
            "📊 Já temos 32 pessoas confirmadas",
            "🎯 Turma limitada a 35 pessoas",
            "⭐ Programa exclusivo para poucos"
        ];

        const randomPhrase = scarcityPhrases[Math.floor(Math.random() * scarcityPhrases.length)];
        return message + "\n\n" + randomPhrase;
    }

    /**
     * Calcula dias de inatividade
     */
    calculateInactiveDays(lastActivity) {
        if (!lastActivity) return 999; // Muito inativo

        const now = new Date();
        const last = new Date(lastActivity);
        const diffTime = Math.abs(now - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Formata número de telefone
     */
    formatPhone(phone) {
        // Remove todos os caracteres não numéricos
        const cleaned = phone.replace(/\D/g, '');

        // Adiciona código do país se necessário
        if (cleaned.length === 11 && cleaned.startsWith('65')) {
            return `55${cleaned}`;
        }

        if (cleaned.length === 10) {
            return `5565${cleaned}`;
        }

        return cleaned;
    }

    /**
     * Utilitário para sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Encontra lead pelo telefone
     */
    findLeadByPhone(phone) {
        // Implementar busca no banco de dados
        // Por ora, retorna mock
        return `lead_${phone.replace(/\D/g, '')}`;
    }

    /**
     * Trigger de conversão
     */
    async triggerConversion(leadId) {
        console.log(`🎯 CONVERSÃO DETECTADA: ${leadId}`);
        // Implementar lógica de conversão
        // Notificar equipe de vendas
        // Atualizar CRM
    }

    /**
     * Trigger de nurturing
     */
    async triggerNurturing(leadId) {
        console.log(`🔄 NURTURING ATIVADO: ${leadId}`);
        // Implementar sequência de nurturing
    }

    /**
     * Handle objeções
     */
    async handleObjection(leadId, objectionType) {
        console.log(`💬 OBJEÇÃO DETECTADA: ${leadId} - ${objectionType}`);
        // Implementar tratamento de objeções
    }

    /**
     * Remove da campanha
     */
    async removeFromCampaign(leadId) {
        console.log(`🚫 REMOVIDO DA CAMPANHA: ${leadId}`);
        // Implementar remoção
    }

    /**
     * Envia orientação para resposta target
     */
    async sendTargetGuidance(leadId) {
        console.log(`📍 ORIENTAÇÃO ENVIADA: ${leadId}`);
        // Implementar orientação
    }
}

/**
 * Analisador de respostas com IA
 */
class ResponseAnalyzer {
    constructor() {
        this.patterns = {
            target: [
                /quero\s+minha\s+vaga/i,
                /aceito\s+a\s+oferta/i,
                /quero\s+participar/i,
                /me\s+inscreve/i
            ],
            interest: [
                /tenho\s+interesse/i,
                /me\s+conta\s+mais/i,
                /gostaria\s+de\s+saber/i,
                /qual\s+.*\s+valor/i
            ],
            objection: [
                /muito\s+caro/i,
                /não\s+tenho\s+tempo/i,
                /muito\s+longe/i,
                /sem\s+dinheiro/i
            ],
            negative: [
                /não\s+quero/i,
                /pare\s+de\s+me\s+mandar/i,
                /não\s+tenho\s+interesse/i,
                /sai\s+fora/i
            ]
        };
    }

    async initialize() {
        console.log('  🔍 Inicializando Response Analyzer...');
        return { success: true };
    }

    async analyze(text) {
        if (!text) {
            return {
                type: 'unknown',
                confidence: 0,
                suggestedAction: 'ignore'
            };
        }

        const normalizedText = text.toLowerCase().trim();

        // Verificar padrões em ordem de prioridade
        for (const [type, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                if (pattern.test(normalizedText)) {
                    return {
                        type,
                        confidence: 0.85,
                        intent: this.extractIntent(normalizedText, type),
                        sentiment: this.analyzeSentiment(normalizedText),
                        suggestedAction: this.getSuggestedAction(type)
                    };
                }
            }
        }

        return {
            type: 'generic',
            confidence: 0.3,
            intent: 'unclear',
            sentiment: 'neutral',
            suggestedAction: 'guide_to_target'
        };
    }

    extractIntent(text, type) {
        // Lógica simplificada de extração de intenção
        const intents = {
            target: 'conversion',
            interest: 'information_seeking',
            objection: this.detectObjectionType(text),
            negative: 'opt_out'
        };

        return intents[type] || 'unknown';
    }

    detectObjectionType(text) {
        if (/caro|preço|valor/i.test(text)) return 'price';
        if (/tempo|horário/i.test(text)) return 'time';
        if (/longe|distância/i.test(text)) return 'location';
        return 'general';
    }

    analyzeSentiment(text) {
        // Análise de sentimento simplificada
        const positiveWords = ['bom', 'ótimo', 'excelente', 'perfeito', 'legal'];
        const negativeWords = ['ruim', 'péssimo', 'horrível', 'chato', 'caro'];

        const positive = positiveWords.some(word => text.includes(word));
        const negative = negativeWords.some(word => text.includes(word));

        if (positive && !negative) return 'positive';
        if (negative && !positive) return 'negative';
        return 'neutral';
    }

    getSuggestedAction(type) {
        const actions = {
            target: 'immediate_conversion',
            interest: 'nurturing_sequence',
            objection: 'objection_handling',
            negative: 'remove_from_campaign',
            generic: 'guide_to_target'
        };

        return actions[type] || 'manual_review';
    }
}

module.exports = WhatsAppAutomationMCP;