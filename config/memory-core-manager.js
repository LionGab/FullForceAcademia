/**
 * 🧠 FULL FORCE ACADEMIA - MEMORY CORE MANAGEMENT SYSTEM 💾
 * Sistema Inteligente de Gestão de Contexto e Memória
 *
 * @description Gerenciamento avançado de contexto e memória para o bot
 * @features Token management, Context preservation, Memory optimization
 * @version 1.0.0
 */

class MemoryCoreManager {
  constructor() {
    this.tokenThreshold = 55000;
    this.currentTokenUsage = 0;
    this.memoryCore = this.initializeMemoryCore();
    this.contextCache = new Map();
    this.sessionData = new Map();
    this.compressionHistory = [];
  }

  /**
   * 💾 INICIALIZAÇÃO DO MEMORY CORE
   */
  initializeMemoryCore() {
    return {
      projectIdentity: {
        name: "Academia Full Force - Assistente Virtual WhatsApp",
        purpose: "Bot energético para agendamentos e atendimento de academia",
        personality: "Motivador, direto, energético (🔥💪⚡)",
        coreStack: "Node.js + WhatsApp-Web.js + Google APIs",
        lastUpdated: new Date().toISOString()
      },

      architecture: {
        structure: "Modular: /handlers, /services, /utils, /config",
        mainFiles: {
          entry: "src/index.js",
          messageHandler: "src/handlers/message-handler.js",
          calendar: "src/services/google-calendar.js",
          sheets: "src/services/google-sheets.js",
          personality: "config/agent-personality.js",
          memoryCore: "config/memory-core-manager.js"
        },
        patterns: "Separation of concerns, Service-oriented, Event-driven"
      },

      coreFeatures: [
        "Reconhecimento de intenções via regex",
        "Agendamento Google Calendar integrado",
        "Persistência em Google Sheets",
        "Sistema anti-spam (5s delay)",
        "Horários de funcionamento automáticos",
        "Personalidade energética configurable",
        "Memory Core Management System",
        "Token usage optimization"
      ],

      technicalDebt: [
        "Sem testes automatizados",
        "Logging básico (console.log)",
        "Validação de entrada limitada",
        "Cache inexistente para APIs",
        "Rate limiting ausente",
        "Monitoramento básico"
      ],

      productionEnhancements: {
        phase1_foundation: [
          "Testing Framework (Jest + Supertest)",
          "Structured Logging (Winston)",
          "Input Validation (Joi/Yup)",
          "Error Handling Enhancement"
        ],
        phase2_performance: [
          "Intelligent Cache System",
          "Rate Limiting Implementation",
          "API Optimization",
          "Memory Management"
        ],
        phase3_production: [
          "Monitoring & Metrics",
          "Security & Deploy",
          "Admin Dashboard",
          "Backup & Recovery"
        ]
      }
    };
  }

  /**
   * 📊 TOKEN USAGE MONITORING
   */
  estimateTokenUsage(text) {
    // Estimativa aproximada: 1 token ≈ 4 caracteres
    return Math.ceil(text.length / 4);
  }

  updateTokenUsage(additionalTokens) {
    this.currentTokenUsage += additionalTokens;

    return {
      current: this.currentTokenUsage,
      threshold: this.tokenThreshold,
      percentage: (this.currentTokenUsage / this.tokenThreshold) * 100,
      needsCompression: this.currentTokenUsage > (this.tokenThreshold * 0.8)
    };
  }

  /**
   * 🔄 CONTEXT COMPRESSION SYSTEM
   */
  compressContext(conversationHistory, preserveMemoryCore = true) {
    const compressionResult = {
      timestamp: new Date().toISOString(),
      originalTokens: this.currentTokenUsage,
      compressedTokens: 0,
      preservedMemory: null,
      summary: null
    };

    if (preserveMemoryCore) {
      compressionResult.preservedMemory = this.memoryCore;
    }

    // Extrair informações essenciais das últimas interações
    const recentChanges = this.extractRecentChanges(conversationHistory);
    const progressStatus = this.extractProgressStatus(conversationHistory);
    const pendingTasks = this.extractPendingTasks(conversationHistory);

    // Criar resumo contextual
    compressionResult.summary = this.createContextSummary(
      recentChanges,
      progressStatus,
      pendingTasks
    );

    // Estimar tokens do contexto comprimido
    compressionResult.compressedTokens = this.estimateTokenUsage(
      JSON.stringify(compressionResult)
    );

    // Salvar no histórico de compressão
    this.compressionHistory.push(compressionResult);

    // Reset do contador de tokens
    this.currentTokenUsage = compressionResult.compressedTokens;

    return compressionResult;
  }

  /**
   * 📝 EXTRAÇÃO DE MUDANÇAS RECENTES
   */
  extractRecentChanges(conversationHistory) {
    const changes = [];
    const recentMessages = conversationHistory.slice(-10); // Últimas 10 mensagens

    for (const message of recentMessages) {
      if (message.type === 'file_modification') {
        changes.push(`Modificado: ${message.file}`);
      } else if (message.type === 'implementation') {
        changes.push(`Implementado: ${message.feature}`);
      } else if (message.type === 'configuration') {
        changes.push(`Configurado: ${message.setting}`);
      }
    }

    return changes.slice(-5); // Últimas 5 mudanças
  }

  /**
   * 📈 EXTRAÇÃO DE STATUS DE PROGRESSO
   */
  extractProgressStatus(conversationHistory) {
    const status = {
      currentPhase: "FOUNDATION",
      completedTasks: [],
      inProgressTasks: [],
      nextPriority: null
    };

    // Análise das mensagens para determinar progresso
    const recentMessages = conversationHistory.slice(-20);

    for (const message of recentMessages) {
      if (message.content && message.content.includes('FASE')) {
        if (message.content.includes('FOUNDATION')) status.currentPhase = 'FOUNDATION';
        if (message.content.includes('PERFORMANCE')) status.currentPhase = 'PERFORMANCE';
        if (message.content.includes('PRODUCTION')) status.currentPhase = 'PRODUCTION';
      }

      if (message.content && message.content.includes('✅')) {
        const completedTask = this.extractTaskFromMessage(message.content);
        if (completedTask) status.completedTasks.push(completedTask);
      }

      if (message.content && message.content.includes('🔄')) {
        const inProgressTask = this.extractTaskFromMessage(message.content);
        if (inProgressTask) status.inProgressTasks.push(inProgressTask);
      }
    }

    return status;
  }

  /**
   * 📋 EXTRAÇÃO DE TAREFAS PENDENTES
   */
  extractPendingTasks(conversationHistory) {
    const tasks = [];
    const recentMessages = conversationHistory.slice(-15);

    for (const message of recentMessages) {
      if (message.content && message.content.includes('TODO')) {
        const task = this.extractTaskFromMessage(message.content);
        if (task) tasks.push(task);
      }
    }

    return tasks.slice(-3); // Últimas 3 tarefas
  }

  /**
   * 🎯 EXTRAÇÃO DE TAREFA DE MENSAGEM
   */
  extractTaskFromMessage(content) {
    const taskPatterns = [
      /(?:TODO|TAREFA|IMPLEMENTAR|CRIAR):\s*(.+)/i,
      /(?:✅|🔄|❌)\s*(.+)/i,
      /(?:Próximo|Next):\s*(.+)/i
    ];

    for (const pattern of taskPatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }

    return null;
  }

  /**
   * 📄 CRIAÇÃO DE RESUMO CONTEXTUAL
   */
  createContextSummary(recentChanges, progressStatus, pendingTasks) {
    return `
CONTEXT RESET - MEMORIA PRESERVADA
Projeto: Academia Full Force Bot
Progresso: ${recentChanges.join(', ') || 'Configuração inicial'}
Fase Atual: ${progressStatus.currentPhase}
Tarefas Completas: ${progressStatus.completedTasks.length}
Em Progresso: ${progressStatus.inProgressTasks.join(', ') || 'Nenhuma'}
Próximo: ${pendingTasks[0] || 'Continuar roadmap de produção'}
Padrões: Energético 🔥💪⚡, Modular, Production-ready
    `.trim();
  }

  /**
   * 💾 SESSÃO DE USUÁRIO MANAGEMENT
   */
  createUserSession(userId, initialContext = {}) {
    const session = {
      id: userId,
      startTime: new Date().toISOString(),
      context: {
        userName: initialContext.userName || null,
        preferences: initialContext.preferences || {},
        conversationHistory: [],
        lastActivity: new Date().toISOString()
      },
      metrics: {
        messageCount: 0,
        avgResponseTime: 0,
        totalTokensUsed: 0
      }
    };

    this.sessionData.set(userId, session);
    return session;
  }

  updateUserSession(userId, update) {
    const session = this.sessionData.get(userId);
    if (!session) return null;

    session.context = { ...session.context, ...update };
    session.context.lastActivity = new Date().toISOString();
    session.metrics.messageCount++;

    this.sessionData.set(userId, session);
    return session;
  }

  getUserSession(userId) {
    return this.sessionData.get(userId) || null;
  }

  /**
   * 🗄️ CONTEXT CACHE MANAGEMENT
   */
  cacheContext(key, data, ttl = 300000) { // 5 minutos default
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      expires: Date.now() + ttl
    };

    this.contextCache.set(key, cacheEntry);
    return cacheEntry;
  }

  getCachedContext(key) {
    const entry = this.contextCache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.contextCache.delete(key);
      return null;
    }

    return entry.data;
  }

  clearExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.contextCache.entries()) {
      if (now > entry.expires) {
        this.contextCache.delete(key);
      }
    }
  }

  /**
   * 🔍 MEMORY ANALYTICS
   */
  getMemoryAnalytics() {
    return {
      currentTokenUsage: this.currentTokenUsage,
      tokenThreshold: this.tokenThreshold,
      utilizationPercentage: (this.currentTokenUsage / this.tokenThreshold) * 100,

      memoryCore: {
        size: this.estimateTokenUsage(JSON.stringify(this.memoryCore)),
        lastUpdated: this.memoryCore.projectIdentity.lastUpdated
      },

      cache: {
        entries: this.contextCache.size,
        totalSize: this.estimateTokenUsage(JSON.stringify([...this.contextCache.values()]))
      },

      sessions: {
        active: this.sessionData.size,
        totalMessages: Array.from(this.sessionData.values())
          .reduce((sum, session) => sum + session.metrics.messageCount, 0)
      },

      compressionHistory: {
        count: this.compressionHistory.length,
        lastCompression: this.compressionHistory[this.compressionHistory.length - 1]
      }
    };
  }

  /**
   * 🛠️ MEMORY OPTIMIZATION
   */
  optimizeMemory() {
    const optimizations = [];

    // Limpar cache expirado
    this.clearExpiredCache();
    optimizations.push("Cache expirado limpo");

    // Limpar sessões inativas (>1 hora)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [userId, session] of this.sessionData.entries()) {
      if (new Date(session.context.lastActivity).getTime() < oneHourAgo) {
        this.sessionData.delete(userId);
        optimizations.push(`Sessão inativa removida: ${userId}`);
      }
    }

    // Manter apenas as últimas 5 compressões
    if (this.compressionHistory.length > 5) {
      this.compressionHistory = this.compressionHistory.slice(-5);
      optimizations.push("Histórico de compressão otimizado");
    }

    return {
      optimizations,
      newAnalytics: this.getMemoryAnalytics()
    };
  }

  /**
   * 💿 BACKUP & RESTORE
   */
  createBackup() {
    return {
      timestamp: new Date().toISOString(),
      memoryCore: this.memoryCore,
      tokenUsage: this.currentTokenUsage,
      compressionHistory: this.compressionHistory,
      cacheEntries: this.contextCache.size,
      activeSessions: this.sessionData.size
    };
  }

  restoreFromBackup(backup) {
    if (backup.memoryCore) {
      this.memoryCore = backup.memoryCore;
    }
    if (backup.tokenUsage) {
      this.currentTokenUsage = backup.tokenUsage;
    }
    if (backup.compressionHistory) {
      this.compressionHistory = backup.compressionHistory;
    }

    return {
      status: "RESTORED",
      timestamp: backup.timestamp,
      restoredComponents: Object.keys(backup)
    };
  }

  /**
   * 🚀 INICIALIZADOR
   */
  initialize() {
    console.log(`
🧠 MEMORY CORE MANAGEMENT SYSTEM INITIALIZED! 💾

📊 Token Management: ✅ Active (${this.tokenThreshold} limit)
💾 Memory Core: ✅ Loaded
🗄️ Context Cache: ✅ Ready
👥 Session Management: ✅ Online
🔄 Compression System: ✅ Standby
📈 Analytics: ✅ Tracking

MEMORY SYSTEM READY FOR PRODUCTION! 🔥💪⚡
    `);

    return {
      status: "MEMORY_CORE_ACTIVE",
      analytics: this.getMemoryAnalytics(),
      ready: true
    };
  }
}

module.exports = MemoryCoreManager;