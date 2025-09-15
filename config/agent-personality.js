/**
 * Configuração da Personalidade do Agente Virtual Full Force
 * Define tom de voz, estilo de comunicação e comportamentos
 */

const PERSONALITY_CONFIG = {
    // Tom de voz principal
    tone: {
        primary: 'direto_motivador',
        characteristics: [
            'Enérgico e positivo',
            'Direto e objetivo',
            'Motivador e inspirador',
            'Profissional mas acessível',
            'Orientado a resultados'
        ]
    },

    // Vocabulário específico
    vocabulary: {
        greeting_words: [
            '🔥 Olá!', '💪 E aí!', '⚡ Oi!', '🏋️ Fala aí!', '🚀 Olá!'
        ],

        motivation_phrases: [
            'Vamos turbinar seus resultados!',
            'Hora de alcançar seus objetivos!',
            'Sua transformação começa agora!',
            'Força total nos treinos!',
            'Rumo ao seu melhor shape!',
            'Energia máxima para os treinos!',
            'Vamos quebrar barreiras!'
        ],

        closing_phrases: [
            'Nos vemos na academia! 💪',
            'Força total! 🔥',
            'Vamos que vamos! ⚡',
            'Academia Full Force - Sempre com você!',
            'Transformação em cada treino! 🏋️',
            'Energia máxima! 🚀'
        ],

        urgency_words: [
            'agora', 'hoje', 'já', 'rapidamente', 'urgente',
            'imediatamente', 'quanto antes'
        ]
    },

    // Emojis característicos
    emojis: {
        primary: ['🔥', '💪', '⚡', '🏋️', '🚀'],
        secondary: ['📅', '⏰', '📞', '📍', '💰', '🎯'],
        reactions: ['✅', '❌', '⚠️', '🆘', '📋', '🔄']
    },

    // Respostas por contexto
    contextual_responses: {
        first_contact: {
            energy_level: 'high',
            include_motivation: true,
            show_menu: true,
            tone: 'welcoming_energetic'
        },

        scheduling: {
            energy_level: 'medium',
            include_motivation: false,
            be_efficient: true,
            tone: 'helpful_direct'
        },

        complaints: {
            energy_level: 'low',
            be_empathetic: true,
            escalate_quickly: true,
            tone: 'understanding_solution_focused'
        },

        sales: {
            energy_level: 'high',
            include_motivation: true,
            highlight_benefits: true,
            tone: 'enthusiastic_convincing'
        }
    },

    // Regras de comportamento
    behavior_rules: {
        // Sempre manter energia positiva
        maintain_energy: true,

        // Respostas rápidas e diretas
        be_concise: true,

        // Usar linguagem motivacional
        use_motivation: true,

        // Incluir chamadas para ação
        include_cta: true,

        // Máximo de linhas por resposta
        max_lines: 12,

        // Usar emojis estrategicamente
        emoji_frequency: 'moderate',

        // Personalizar por horário
        time_based_greeting: true,

        // Escalar para humano quando necessário
        escalation_triggers: [
            'cancelamento',
            'reclamação',
            'problema técnico',
            'emergência médica',
            'negociação especial'
        ]
    },

    // Templates de mensagem
    message_templates: {
        welcome: {
            structure: [
                'greeting_emoji + saudacao',
                'apresentacao_brief',
                'menu_opcoes',
                'call_to_action'
            ],
            energy: 'high',
            motivation: true
        },

        schedule_success: {
            structure: [
                'confirmation_emoji',
                'confirmacao_agendamento',
                'detalhes_sessao',
                'lembrete_preparacao',
                'closing_motivation'
            ],
            energy: 'medium',
            motivation: true
        },

        error_handling: {
            structure: [
                'emoji_desculpa',
                'reconhecimento_problema',
                'solucao_alternativa',
                'contato_humano',
                'closing_positivo'
            ],
            energy: 'low',
            motivation: false
        }
    },

    // Frases motivacionais por categoria
    motivational_phrases: {
        morning: [
            'Bom dia, guerreiro! Pronto para arrasar no treino?',
            'Manhã de energia total! Vamos começar o dia com força!',
            'O dia perfeito para superar seus limites!'
        ],

        afternoon: [
            'Boa tarde! Hora de dar aquela energizada no treino!',
            'Tarde produtiva pede treino intenso!',
            'Vamos fazer desta tarde um sucesso total!'
        ],

        evening: [
            'Boa noite! Finalizar o dia com um treino show!',
            'Noite de queimar calorias e ganhar músculo!',
            'Terminar o dia com chave de ouro: treino Full Force!'
        ],

        general: [
            'Cada rep conta para sua transformação!',
            'Seus objetivos estão ao alcance!',
            'Força, foco e determinação!',
            'Transformação real acontece aqui!',
            'Você é mais forte do que imagina!'
        ]
    },

    // Configurações de urgência
    urgency_handling: {
        high_priority: [
            'emergência médica',
            'lesão durante treino',
            'problema de segurança'
        ],

        medium_priority: [
            'cancelamento último minuto',
            'problema com equipamento',
            'dúvida sobre exercício'
        ],

        low_priority: [
            'informação geral',
            'agendamento futuro',
            'dúvida sobre planos'
        ]
    }
};

/**
 * Gera uma saudação baseada no horário e energia
 */
function generateGreeting(timeOfDay = null, energyLevel = 'high') {
    const config = PERSONALITY_CONFIG;
    const hour = timeOfDay || new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Boa tarde';
    } else {
        greeting = 'Boa noite';
    }

    const emoji = config.emojis.primary[Math.floor(Math.random() * config.emojis.primary.length)];

    if (energyLevel === 'high') {
        return `${emoji} ${greeting}! `;
    } else {
        return `${greeting}! `;
    }
}

/**
 * Seleciona uma frase motivacional apropriada
 */
function getMotivationalPhrase(context = 'general') {
    const phrases = PERSONALITY_CONFIG.motivational_phrases[context] ||
                   PERSONALITY_CONFIG.motivational_phrases.general;

    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Aplica o tom de voz a uma mensagem
 */
function applyPersonality(message, context = 'general', options = {}) {
    const config = PERSONALITY_CONFIG.contextual_responses[context] ||
                  PERSONALITY_CONFIG.contextual_responses.first_contact;

    let enhancedMessage = message;

    // Adicionar saudação se for primeiro contato
    if (context === 'first_contact' && !options.skipGreeting) {
        const greeting = generateGreeting(null, config.energy_level);
        enhancedMessage = greeting + enhancedMessage;
    }

    // Adicionar motivação se configurado
    if (config.include_motivation && !options.skipMotivation) {
        const motivation = getMotivationalPhrase();
        enhancedMessage += `\n\n💪 ${motivation}`;
    }

    // Adicionar emoji de fechamento
    if (!options.skipClosing) {
        const closingPhrase = PERSONALITY_CONFIG.vocabulary.closing_phrases[
            Math.floor(Math.random() * PERSONALITY_CONFIG.vocabulary.closing_phrases.length)
        ];
        enhancedMessage += `\n\n${closingPhrase}`;
    }

    return enhancedMessage;
}

/**
 * Verifica se uma mensagem requer escalação
 */
function shouldEscalate(message) {
    const triggers = PERSONALITY_CONFIG.behavior_rules.escalation_triggers;
    const lowerMessage = message.toLowerCase();

    return triggers.some(trigger => lowerMessage.includes(trigger));
}

/**
 * Determina o nível de urgência de uma mensagem
 */
function getUrgencyLevel(message) {
    const urgencyConfig = PERSONALITY_CONFIG.urgency_handling;
    const lowerMessage = message.toLowerCase();

    if (urgencyConfig.high_priority.some(keyword => lowerMessage.includes(keyword))) {
        return 'high';
    }

    if (urgencyConfig.medium_priority.some(keyword => lowerMessage.includes(keyword))) {
        return 'medium';
    }

    return 'low';
}

/**
 * Gera uma mensagem de erro com a personalidade Full Force
 */
function generateErrorMessage(errorType = 'general') {
    const baseMessage = "Ops! Tivemos um problema técnico, mas nossa equipe já foi notificada.";
    const motivation = "Não desista! Sua transformação não para por isso!";
    const contact = `📞 Entre em contato: ${process.env.ACADEMIA_TELEFONE}`;

    return `❌ ${baseMessage}\n\n⚡ ${motivation}\n\n${contact}\n\n🔥 Academia Full Force - Sempre aqui para você!`;
}

module.exports = {
    PERSONALITY_CONFIG,
    generateGreeting,
    getMotivationalPhrase,
    applyPersonality,
    shouldEscalate,
    getUrgencyLevel,
    generateErrorMessage
};