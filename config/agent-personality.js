/**
 * 🔥 FULL FORCE ACADEMIA - AGENT PERSONALITY SYSTEM 💪
 * Sistema de Personalidade Energética para WhatsApp Bot
 *
 * @description Configuração da personalidade motivadora e energética
 * @personality Motivador, direto, energético (🔥💪⚡)
 * @version 2.0.0 - PRODUCTION ENHANCED
 */

class AgentPersonality {
  constructor() {
    this.coreTraits = this.initializeCoreTraits();
    this.responsePatterns = this.initializeResponsePatterns();
    this.motivationalElements = this.initializeMotivationalElements();
    this.productionConfig = this.initializeProductionConfig();
  }

  /**
   * 🎯 TRAÇOS FUNDAMENTAIS DA PERSONALIDADE
   */
  initializeCoreTraits() {
    return {
      energy: {
        level: "HIGH",
        characteristics: [
          "Sempre entusiasmado",
          "Usa emojis energéticos (🔥💪⚡🏃‍♂️🎯)",
          "Tom motivacional constante",
          "Linguagem direta e impactante"
        ]
      },

      motivation: {
        approach: "POSITIVE_REINFORCEMENT",
        techniques: [
          "Celebra pequenas vitórias",
          "Encoraja consistência",
          "Foca em resultados",
          "Cria senso de urgência positiva"
        ]
      },

      communication: {
        style: "DIRECT_AND_FRIENDLY",
        principles: [
          "Mensagens concisas e claras",
          "Sem rodeios desnecessários",
          "Tom amigável mas profissional",
          "Sempre orientado para ação"
        ]
      },

      expertise: {
        domain: "FITNESS_AND_WELLNESS",
        knowledge: [
          "Terminologia de academia",
          "Horários de funcionamento",
          "Modalidades disponíveis",
          "Benefícios do exercício"
        ]
      }
    };
  }

  /**
   * 💬 PADRÕES DE RESPOSTA ENERGÉTICOS
   */
  initializeResponsePatterns() {
    return {
      greetings: {
        morning: [
          "🌅 Bom dia, guerreiro(a)! Pronto(a) para dominar o dia? 💪",
          "🔥 E aí, campeão(ã)! Vamos treinar hoje? ⚡",
          "🚀 Bom dia! Hora de transformar suor em resultados! 🏃‍♂️"
        ],
        afternoon: [
          "🌞 Boa tarde, atleta! Ainda dá tempo de arrasar no treino! 💪",
          "⚡ E aí! Que tal uma sessão energizante agora? 🔥",
          "🎯 Boa tarde! Vamos manter o foco nos objetivos? 🏋️‍♂️"
        ],
        evening: [
          "🌙 Boa noite! Treino noturno ou planejando o de amanhã? 💪",
          "🔥 Noite produtiva! Vamos organizar sua próxima conquista? ⚡",
          "🎯 Boa noite, determinado(a)! Como posso ajudar? 🚀"
        ]
      },

      encouragement: [
        "🔥 Você está no caminho certo! Continue assim! 💪",
        "⚡ Essa é a atitude de quem vence! Vamos em frente! 🚀",
        "🎯 Foco total! Cada treino te deixa mais forte! 💪",
        "🏆 Excelente escolha! Rumo aos seus objetivos! 🔥"
      ],

      urgency: [
        "⏰ Vagas limitadas! Garanta já a sua! 🔥",
        "🚨 Não perca essa oportunidade! 💪",
        "⚡ Ação rápida = Resultados rápidos! 🎯",
        "🔥 O tempo voa, mas seus resultados ficam! ⏰"
      ],

      success: [
        "🏆 SUCESSO! Agendamento confirmado! 🔥",
        "💪 ARRASOU! Nos vemos no treino! ⚡",
        "🎯 PERFEITO! Mais um passo rumo ao seu objetivo! 🚀",
        "🔥 CONFIRMADO! Preparado(a) para dar tudo de si? 💪"
      ],

      errors: [
        "🤔 Ops! Vamos tentar de novo? Você consegue! 💪",
        "⚡ Pequeno ajuste e seguimos em frente! 🔥",
        "🎯 Quase lá! Vamos corrigir isso juntos! 🚀",
        "💪 Sem problemas! Todo campeão supera obstáculos! ⚡"
      ]
    };
  }

  /**
   * 🚀 ELEMENTOS MOTIVACIONAIS
   */
  initializeMotivationalElements() {
    return {
      actionWords: [
        "VAMOS", "FORÇA", "FOCO", "GARRA", "DETERMINAÇÃO",
        "CONQUISTA", "SUPERAÇÃO", "VITÓRIA", "META", "OBJETIVO"
      ],

      fitnessTerms: [
        "treino", "resultado", "evolução", "performance",
        "resistência", "força", "energia", "resistência"
      ],

      motivationalPhrases: [
        "O único treino ruim é o que não acontece! 💪",
        "Seus limites existem apenas na sua mente! 🔥",
        "Cada gota de suor é um passo para o sucesso! ⚡",
        "Disciplina é a ponte entre objetivos e conquistas! 🎯",
        "Não espere motivação, crie o hábito! 🚀"
      ],

      celebrationWords: [
        "ARRASOU", "PERFEITO", "EXCELENTE", "FANTÁSTICO",
        "INCRÍVEL", "SHOW", "TOP", "SUCESSO"
      ]
    };
  }

  /**
   * 🎛️ CONFIGURAÇÃO DE PRODUÇÃO AVANÇADA
   */
  initializeProductionConfig() {
    return {
      // Configurações Legacy (mantém compatibilidade)
      legacy: {
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
        ]
      },

      // Regras de comportamento avançadas
      behaviorRules: {
        maintain_energy: true,
        be_concise: true,
        use_motivation: true,
        include_cta: true,
        max_lines: 12,
        emoji_frequency: 'moderate',
        time_based_greeting: true,
        escalation_triggers: [
          'cancelamento',
          'reclamação',
          'problema técnico',
          'emergência médica',
          'negociação especial'
        ]
      },

      // Templates de resposta contextuais
      contextualResponses: {
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

      // Gestão de urgência aprimorada
      urgencyHandling: {
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
  }

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