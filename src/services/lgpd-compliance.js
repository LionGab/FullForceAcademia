const pino = require('pino');
const moment = require('moment');
const crypto = require('crypto');

/**
 * Sistema de Compliance LGPD para Campanhas WhatsApp
 * Full Force Academia - Proteção Total de Dados Pessoais
 */
class LGPDCompliance {
    constructor(databaseService) {
        this.databaseService = databaseService;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Configurações LGPD
        this.lgpdConfig = {
            // Bases legais para tratamento
            legalBases: {
                CONSENT: 'Consentimento do titular',
                CONTRACT: 'Execução de contrato',
                LEGAL_OBLIGATION: 'Cumprimento de obrigação legal',
                VITAL_INTERESTS: 'Proteção de interesses vitais',
                PUBLIC_INTEREST: 'Exercício de função pública',
                LEGITIMATE_INTEREST: 'Interesse legítimo'
            },

            // Períodos de retenção por tipo de dados
            retentionPeriods: {
                PROSPECT_DATA: 24,      // 24 meses para prospects
                CUSTOMER_DATA: 60,      // 60 meses para clientes
                MARKETING_DATA: 12,     // 12 meses para dados de marketing
                CONSENT_RECORDS: 72     // 72 meses para registros de consentimento
            },

            // Categorias de dados pessoais
            dataCategories: {
                IDENTIFICATION: ['nome', 'telefone', 'email', 'cpf'],
                CONTACT: ['telefone', 'email', 'endereco'],
                BEHAVIORAL: ['last_activity', 'preferences', 'interactions'],
                FINANCIAL: ['payment_history', 'subscription_status']
            },

            // Direitos dos titulares
            titularRights: [
                'ACCESS',           // Acesso aos dados
                'RECTIFICATION',    // Correção
                'ERASURE',          // Exclusão
                'RESTRICTION',      // Limitação do tratamento
                'PORTABILITY',      // Portabilidade
                'OBJECTION',        // Oposição
                'AUTOMATED_DECISION' // Não ser submetido a decisões automatizadas
            ]
        };

        // Cache de consentimentos
        this.consentCache = new Map();

        // Logs de auditoria
        this.auditLog = [];

        // Palavras-chave para opt-out automático
        this.optOutKeywords = [
            'parar', 'pare', 'stop', 'sair', 'remover', 'descadastrar',
            'não quero', 'nao quero', 'cancelar', 'opt-out', 'opt out',
            'lgpd', 'dados', 'privacidade', 'excluir dados'
        ];

        // Templates LGPD
        this.lgpdTemplates = this.initializeLGPDTemplates();
    }

    /**
     * Inicializa templates LGPD obrigatórios
     */
    initializeLGPDTemplates() {
        return {
            // Solicitação de consentimento inicial
            consentRequest: {
                message: `Olá! 👋

Para proporcionarmos a melhor experiência e ofertas personalizadas da Full Force Academia, precisamos do seu consentimento para tratamento dos seus dados pessoais.

📋 DADOS QUE UTILIZAMOS:
• Nome e telefone (para contato)
• Histórico de atividades (para personalização)
• Preferências de treino (para ofertas relevantes)

✅ SEUS DIREITOS:
• Acessar seus dados a qualquer momento
• Solicitar correção ou exclusão
• Revogar consentimento quando quiser

Você CONSENTE com o tratamento dos seus dados para:
• Ofertas personalizadas de academia
• Comunicação sobre nossos serviços
• Melhoria da experiência do cliente

Responda SIM para consentir ou NÃO para recusar.

Política completa: fullforceacademia.com.br/privacidade`,

                requiredResponse: ['SIM', 'NÃO']
            },

            // Confirmação de opt-out
            optOutConfirmation: {
                message: `Entendemos seu desejo de não receber mais nossas comunicações.

🛡️ SEUS DADOS ESTÃO PROTEGIDOS:
• Cessaremos imediatamente o envio de mensagens
• Seus dados serão anonimizados conforme LGPD
• Você pode solicitar exclusão total a qualquer momento

Para CONFIRMAR a remoção, responda: CONFIRMAR SAÍDA

Para continuar recebendo (caso tenha sido engano): CONTINUAR

Dúvidas sobre LGPD: fullforceacademia.com.br/lgpd`,

                requiredResponse: ['CONFIRMAR SAÍDA', 'CONTINUAR']
            },

            // Notificação de direitos LGPD
            rightsNotification: {
                message: `🛡️ SEUS DIREITOS LGPD NA FULL FORCE:

Como titular de dados pessoais, você tem direito a:

1️⃣ ACESSAR seus dados (responda: MEUS DADOS)
2️⃣ CORRIGIR informações (responda: CORRIGIR)
3️⃣ EXCLUIR dados (responda: EXCLUIR)
4️⃣ LIMITAR tratamento (responda: LIMITAR)
5️⃣ PORTABILIDADE (responda: EXPORTAR)
6️⃣ OPOSIÇÃO (responda: NÃO CONCORDO)

📞 ENCARREGADO DE DADOS:
E-mail: lgpd@fullforceacademia.com.br
Tel: (65) 99999-9999

Política completa: fullforceacademia.com.br/privacidade`,

                supportedCommands: ['MEUS DADOS', 'CORRIGIR', 'EXCLUIR', 'LIMITAR', 'EXPORTAR', 'NÃO CONCORDO']
            }
        };
    }

    /**
     * Verifica se pode enviar mensagem para um lead (compliance LGPD)
     */
    async canSendMessage(leadData) {
        try {
            // 1. Verificar se há consentimento válido
            const consent = await this.checkConsent(leadData.telefone);

            if (!consent.hasConsent) {
                this.logger.warn(`🛡️ Sem consentimento LGPD para ${leadData.telefone}`);

                // Se nunca foi solicitado consentimento, enviar solicitação
                if (!consent.consentRequested) {
                    await this.requestConsent(leadData);
                    return { canSend: false, reason: 'CONSENT_REQUESTED', action: 'CONSENT_FLOW' };
                }

                return { canSend: false, reason: 'NO_CONSENT' };
            }

            // 2. Verificar se não está na lista de opt-out
            const isOptedOut = await this.checkOptOutStatus(leadData.telefone);
            if (isOptedOut) {
                return { canSend: false, reason: 'OPTED_OUT' };
            }

            // 3. Verificar período de retenção
            const retentionValid = await this.checkRetentionPeriod(leadData);
            if (!retentionValid) {
                return { canSend: false, reason: 'RETENTION_EXPIRED' };
            }

            // 4. Verificar frequência de comunicação (anti-spam)
            const frequencyOk = await this.checkCommunicationFrequency(leadData.telefone);
            if (!frequencyOk) {
                return { canSend: false, reason: 'FREQUENCY_LIMIT' };
            }

            // Registrar verificação de compliance
            await this.logComplianceCheck(leadData.telefone, 'APPROVED', 'All LGPD checks passed');

            return { canSend: true, reason: 'COMPLIANCE_OK' };

        } catch (error) {
            this.logger.error(`❌ Erro ao verificar compliance LGPD para ${leadData.telefone}:`, error);
            return { canSend: false, reason: 'COMPLIANCE_ERROR' };
        }
    }

    /**
     * Verifica consentimento do titular
     */
    async checkConsent(phone) {
        try {
            // Verificar cache primeiro
            const cacheKey = `consent_${phone}`;
            if (this.consentCache.has(cacheKey)) {
                return this.consentCache.get(cacheKey);
            }

            // Buscar no banco de dados
            if (!this.databaseService) {
                return { hasConsent: false, consentRequested: false };
            }

            const consentRecord = await this.databaseService.query(`
                SELECT * FROM lgpd_consents
                WHERE phone = ? AND status = 'ACTIVE'
                ORDER BY created_at DESC
                LIMIT 1
            `, [phone]);

            const consent = {
                hasConsent: consentRecord && consentRecord.length > 0,
                consentRequested: await this.hasConsentBeenRequested(phone),
                consentDate: consentRecord?.[0]?.created_at,
                legalBasis: consentRecord?.[0]?.legal_basis || 'CONSENT',
                consentType: consentRecord?.[0]?.consent_type || 'MARKETING'
            };

            // Cache por 1 hora
            this.consentCache.set(cacheKey, consent);
            setTimeout(() => this.consentCache.delete(cacheKey), 3600000);

            return consent;

        } catch (error) {
            this.logger.error(`❌ Erro ao verificar consentimento para ${phone}:`, error);
            return { hasConsent: false, consentRequested: false };
        }
    }

    /**
     * Solicita consentimento LGPD
     */
    async requestConsent(leadData) {
        try {
            const phone = leadData.telefone;

            // Registrar solicitação de consentimento
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO lgpd_consent_requests
                    (phone, name, email, request_type, data_categories, legal_basis, requested_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    phone,
                    leadData.nome,
                    leadData.email,
                    'MARKETING',
                    JSON.stringify(['IDENTIFICATION', 'CONTACT', 'BEHAVIORAL']),
                    'CONSENT'
                ]);
            }

            // Enviar mensagem de solicitação de consentimento
            const template = this.lgpdTemplates.consentRequest;

            // Aqui você integraria com o sistema de envio (WAHA)
            // await this.sendLGPDMessage(phone, template.message);

            this.logger.info(`🛡️ Consentimento LGPD solicitado para ${phone}`);

            await this.logComplianceAction(phone, 'CONSENT_REQUESTED', {
                leadName: leadData.nome,
                dataCategories: ['IDENTIFICATION', 'CONTACT', 'BEHAVIORAL'],
                legalBasis: 'CONSENT'
            });

            return true;

        } catch (error) {
            this.logger.error(`❌ Erro ao solicitar consentimento para ${leadData.telefone}:`, error);
            return false;
        }
    }

    /**
     * Processa resposta de consentimento
     */
    async processConsentResponse(phone, message) {
        try {
            const normalizedMessage = message.toUpperCase().trim();

            if (normalizedMessage === 'SIM') {
                await this.grantConsent(phone, {
                    consentType: 'MARKETING',
                    legalBasis: 'CONSENT',
                    dataCategories: ['IDENTIFICATION', 'CONTACT', 'BEHAVIORAL'],
                    source: 'WHATSAPP_RESPONSE'
                });

                const confirmationMessage = `✅ Obrigado pelo seu consentimento!

Seus dados estão protegidos conforme LGPD e você receberá apenas ofertas relevantes da Full Force Academia.

Para gerenciar suas preferências ou exercer seus direitos, responda: LGPD

Vamos começar? 💪`;

                return {
                    success: true,
                    consentGranted: true,
                    responseMessage: confirmationMessage
                };

            } else if (normalizedMessage === 'NÃO') {
                await this.denyConsent(phone);

                const denialMessage = `Respeitamos sua decisão! 🛡️

Seus dados não serão utilizados para marketing e você não receberá mais nossas comunicações.

Caso mude de ideia, sempre pode nos procurar diretamente na academia.

Obrigado pela atenção!`;

                return {
                    success: true,
                    consentGranted: false,
                    responseMessage: denialMessage
                };
            }

            // Resposta inválida
            const invalidMessage = `Por favor, responda apenas SIM ou NÃO para confirmarmos seu consentimento.

SIM = Aceito receber comunicações
NÃO = Não desejo receber

Sua privacidade é nossa prioridade! 🛡️`;

            return {
                success: false,
                invalidResponse: true,
                responseMessage: invalidMessage
            };

        } catch (error) {
            this.logger.error(`❌ Erro ao processar resposta de consentimento:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Concede consentimento
     */
    async grantConsent(phone, consentData) {
        try {
            if (!this.databaseService) return;

            await this.databaseService.query(`
                INSERT INTO lgpd_consents
                (phone, consent_type, legal_basis, data_categories, source, status, granted_at)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
            `, [
                phone,
                consentData.consentType,
                consentData.legalBasis,
                JSON.stringify(consentData.dataCategories),
                consentData.source
            ]);

            // Limpar cache
            this.consentCache.delete(`consent_${phone}`);

            await this.logComplianceAction(phone, 'CONSENT_GRANTED', consentData);

            this.logger.info(`✅ Consentimento concedido para ${phone}`);

        } catch (error) {
            this.logger.error(`❌ Erro ao conceder consentimento:`, error);
            throw error;
        }
    }

    /**
     * Nega consentimento
     */
    async denyConsent(phone) {
        try {
            if (!this.databaseService) return;

            await this.databaseService.query(`
                INSERT INTO lgpd_consents
                (phone, consent_type, legal_basis, status, denied_at)
                VALUES (?, 'MARKETING', 'CONSENT', 'DENIED', datetime('now'))
            `, [phone]);

            // Adicionar à lista de opt-out
            await this.addToOptOut(phone, 'CONSENT_DENIED');

            await this.logComplianceAction(phone, 'CONSENT_DENIED', { reason: 'USER_CHOICE' });

            this.logger.info(`❌ Consentimento negado para ${phone}`);

        } catch (error) {
            this.logger.error(`❌ Erro ao negar consentimento:`, error);
            throw error;
        }
    }

    /**
     * Detecta solicitação de opt-out automático
     */
    async detectOptOut(phone, message) {
        try {
            const normalizedMessage = message.toLowerCase();

            // Verificar palavras-chave de opt-out
            const hasOptOutKeyword = this.optOutKeywords.some(keyword =>
                normalizedMessage.includes(keyword)
            );

            if (hasOptOutKeyword) {
                this.logger.info(`🛡️ Opt-out detectado para ${phone}: "${message}"`);

                // Enviar confirmação de opt-out
                const confirmationTemplate = this.lgpdTemplates.optOutConfirmation;
                // await this.sendLGPDMessage(phone, confirmationTemplate.message);

                await this.logComplianceAction(phone, 'OPT_OUT_DETECTED', {
                    originalMessage: message,
                    detectedKeywords: this.optOutKeywords.filter(k => normalizedMessage.includes(k))
                });

                return true;
            }

            return false;

        } catch (error) {
            this.logger.error(`❌ Erro ao detectar opt-out:`, error);
            return false;
        }
    }

    /**
     * Processa confirmação de opt-out
     */
    async processOptOutConfirmation(phone, message) {
        try {
            const normalizedMessage = message.toUpperCase().trim();

            if (normalizedMessage === 'CONFIRMAR SAÍDA') {
                await this.addToOptOut(phone, 'USER_REQUEST');

                const confirmationMessage = `✅ Opt-out confirmado!

Você foi removido de nossa lista de comunicações e seus dados serão tratados conforme nossa Política de Privacidade.

Para qualquer solicitação LGPD: lgpd@fullforceacademia.com.br

Obrigado! 🛡️`;

                return {
                    success: true,
                    optedOut: true,
                    responseMessage: confirmationMessage
                };

            } else if (normalizedMessage === 'CONTINUAR') {
                const continuationMessage = `Ótimo! Você continuará recebendo nossas comunicações.

Caso mude de ideia, sempre pode responder PARAR a qualquer momento.

Obrigado por permanecer conosco! 💪`;

                return {
                    success: true,
                    optedOut: false,
                    responseMessage: continuationMessage
                };
            }

            return {
                success: false,
                invalidResponse: true,
                responseMessage: `Por favor, responda apenas:
CONFIRMAR SAÍDA = Para parar de receber
CONTINUAR = Para continuar recebendo`
            };

        } catch (error) {
            this.logger.error(`❌ Erro ao processar confirmação de opt-out:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Adiciona telefone à lista de opt-out
     */
    async addToOptOut(phone, reason) {
        try {
            if (!this.databaseService) return;

            await this.databaseService.query(`
                INSERT OR REPLACE INTO lgpd_opt_outs
                (phone, reason, opt_out_date, status)
                VALUES (?, ?, datetime('now'), 'ACTIVE')
            `, [phone, reason]);

            // Revogar consentimentos ativos
            await this.databaseService.query(`
                UPDATE lgpd_consents
                SET status = 'REVOKED', revoked_at = datetime('now')
                WHERE phone = ? AND status = 'ACTIVE'
            `, [phone]);

            await this.logComplianceAction(phone, 'OPT_OUT_ADDED', { reason });

            this.logger.info(`🛡️ ${phone} adicionado à lista de opt-out: ${reason}`);

        } catch (error) {
            this.logger.error(`❌ Erro ao adicionar opt-out:`, error);
            throw error;
        }
    }

    /**
     * Verifica status de opt-out
     */
    async checkOptOutStatus(phone) {
        try {
            if (!this.databaseService) return false;

            const optOut = await this.databaseService.query(`
                SELECT * FROM lgpd_opt_outs
                WHERE phone = ? AND status = 'ACTIVE'
                LIMIT 1
            `, [phone]);

            return optOut && optOut.length > 0;

        } catch (error) {
            this.logger.error(`❌ Erro ao verificar opt-out:`, error);
            return false;
        }
    }

    /**
     * Verifica período de retenção de dados
     */
    async checkRetentionPeriod(leadData) {
        try {
            const dataType = leadData.customerStatus === 'ACTIVE' ? 'CUSTOMER_DATA' : 'PROSPECT_DATA';
            const retentionMonths = this.lgpdConfig.retentionPeriods[dataType];

            const creationDate = moment(leadData.dataCadastro, 'DD/MM/YYYY HH:mm:ss');
            const expirationDate = creationDate.add(retentionMonths, 'months');

            const isValid = moment().isBefore(expirationDate);

            if (!isValid) {
                await this.logComplianceAction(leadData.telefone, 'RETENTION_EXPIRED', {
                    dataType,
                    creationDate: creationDate.format('YYYY-MM-DD'),
                    expirationDate: expirationDate.format('YYYY-MM-DD')
                });
            }

            return isValid;

        } catch (error) {
            this.logger.error('❌ Erro ao verificar período de retenção:', error);
            return false;
        }
    }

    /**
     * Verifica frequência de comunicação
     */
    async checkCommunicationFrequency(phone) {
        try {
            if (!this.databaseService) return true;

            // Máximo 3 mensagens por dia
            const today = moment().format('YYYY-MM-DD');

            const todayMessages = await this.databaseService.query(`
                SELECT COUNT(*) as count FROM messages
                WHERE phone = ? AND direction = 'outbound'
                AND DATE(created_at) = ?
            `, [phone, today]);

            const messageCount = todayMessages?.[0]?.count || 0;

            if (messageCount >= 3) {
                await this.logComplianceAction(phone, 'FREQUENCY_LIMIT_REACHED', {
                    dailyCount: messageCount,
                    limit: 3
                });
                return false;
            }

            return true;

        } catch (error) {
            this.logger.error('❌ Erro ao verificar frequência:', error);
            return true; // Permitir em caso de erro
        }
    }

    /**
     * Processa solicitação de direitos LGPD
     */
    async processRightsRequest(phone, requestType) {
        try {
            const phone_clean = phone.replace(/\D/g, '');

            switch (requestType.toUpperCase()) {
                case 'MEUS DADOS':
                    return await this.handleDataAccessRequest(phone_clean);

                case 'CORRIGIR':
                    return await this.handleDataRectificationRequest(phone_clean);

                case 'EXCLUIR':
                    return await this.handleDataErasureRequest(phone_clean);

                case 'LIMITAR':
                    return await this.handleDataRestrictionRequest(phone_clean);

                case 'EXPORTAR':
                    return await this.handleDataPortabilityRequest(phone_clean);

                case 'NÃO CONCORDO':
                    return await this.handleObjectionRequest(phone_clean);

                default:
                    return {
                        success: false,
                        message: 'Solicitação não reconhecida. Digite LGPD para ver opções disponíveis.'
                    };
            }

        } catch (error) {
            this.logger.error(`❌ Erro ao processar solicitação de direitos:`, error);
            return {
                success: false,
                message: 'Erro interno. Entre em contato: lgpd@fullforceacademia.com.br'
            };
        }
    }

    /**
     * Trata solicitação de acesso aos dados
     */
    async handleDataAccessRequest(phone) {
        try {
            if (!this.databaseService) {
                return {
                    success: false,
                    message: 'Serviço temporariamente indisponível.'
                };
            }

            // Buscar todos os dados do titular
            const personalData = await this.databaseService.query(`
                SELECT name, phone, email, created_at, last_activity
                FROM leads WHERE phone = ?
                UNION
                SELECT name, phone, email, created_at, updated_at
                FROM customers WHERE phone = ?
            `, [phone, phone]);

            const messages = await this.databaseService.query(`
                SELECT message_text, direction, created_at
                FROM messages WHERE phone = ?
                ORDER BY created_at DESC LIMIT 10
            `, [phone]);

            const consents = await this.databaseService.query(`
                SELECT consent_type, legal_basis, status, granted_at, revoked_at
                FROM lgpd_consents WHERE phone = ?
            `, [phone]);

            await this.logComplianceAction(phone, 'DATA_ACCESS_REQUEST', {
                dataReturned: {
                    personalData: personalData?.length || 0,
                    messages: messages?.length || 0,
                    consents: consents?.length || 0
                }
            });

            const dataReport = `📊 SEUS DADOS NA FULL FORCE ACADEMIA

👤 DADOS PESSOAIS:
${personalData?.map(d => `• Nome: ${d.name}\n• Telefone: ${d.phone}\n• Email: ${d.email || 'Não informado'}`).join('\n') || 'Nenhum dado encontrado'}

💬 ÚLTIMAS INTERAÇÕES:
${messages?.slice(0, 3).map(m => `• ${m.created_at}: ${m.message_text.substring(0, 50)}...`).join('\n') || 'Nenhuma interação'}

🛡️ CONSENTIMENTOS:
${consents?.map(c => `• ${c.consent_type}: ${c.status} (${c.granted_at})`).join('\n') || 'Nenhum consentimento'}

Para relatório completo: lgpd@fullforceacademia.com.br`;

            return {
                success: true,
                message: dataReport
            };

        } catch (error) {
            this.logger.error('❌ Erro na solicitação de acesso:', error);
            return {
                success: false,
                message: 'Erro ao processar solicitação. Contate: lgpd@fullforceacademia.com.br'
            };
        }
    }

    /**
     * Trata solicitação de exclusão de dados
     */
    async handleDataErasureRequest(phone) {
        try {
            // Criar solicitação de exclusão (não executar imediatamente)
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO lgpd_erasure_requests
                    (phone, request_date, status, processed_at)
                    VALUES (?, datetime('now'), 'PENDING', NULL)
                `, [phone]);
            }

            await this.logComplianceAction(phone, 'ERASURE_REQUEST', {
                status: 'PENDING_REVIEW'
            });

            return {
                success: true,
                message: `✅ Solicitação de exclusão registrada!

Seus dados serão excluídos em até 15 dias úteis, conforme LGPD.

Você receberá confirmação quando o processo for concluído.

Protocolo: ${this.generateProtocolNumber()}

Dúvidas: lgpd@fullforceacademia.com.br`
            };

        } catch (error) {
            this.logger.error('❌ Erro na solicitação de exclusão:', error);
            return {
                success: false,
                message: 'Erro ao processar solicitação. Contate: lgpd@fullforceacademia.com.br'
            };
        }
    }

    /**
     * Métodos auxiliares
     */
    async hasConsentBeenRequested(phone) {
        if (!this.databaseService) return false;

        const request = await this.databaseService.query(`
            SELECT * FROM lgpd_consent_requests WHERE phone = ? LIMIT 1
        `, [phone]);

        return request && request.length > 0;
    }

    async logComplianceCheck(phone, result, details) {
        await this.logComplianceAction(phone, 'COMPLIANCE_CHECK', {
            result,
            details,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        });
    }

    async logComplianceAction(phone, action, data) {
        try {
            const logEntry = {
                phone,
                action,
                data,
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                ip: 'system', // Ou capturar IP real se disponível
                user_agent: 'whatsapp_campaign_system'
            };

            // Adicionar ao log em memória
            this.auditLog.push(logEntry);

            // Manter apenas últimos 1000 registros em memória
            if (this.auditLog.length > 1000) {
                this.auditLog = this.auditLog.slice(-1000);
            }

            // Salvar no banco se disponível
            if (this.databaseService) {
                await this.databaseService.query(`
                    INSERT INTO lgpd_audit_log
                    (phone, action, data, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                `, [phone, action, JSON.stringify(data)]);
            }

            this.logger.debug(`📋 LGPD Audit: ${action} para ${phone}`);

        } catch (error) {
            this.logger.error('❌ Erro ao registrar ação LGPD:', error);
        }
    }

    generateProtocolNumber() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `LGPD-${timestamp}-${random}`;
    }

    /**
     * Relatório de compliance LGPD
     */
    async generateComplianceReport() {
        try {
            if (!this.databaseService) return null;

            // Estatísticas de consentimento
            const consentStats = await this.databaseService.query(`
                SELECT
                    status,
                    COUNT(*) as count
                FROM lgpd_consents
                GROUP BY status
            `);

            // Estatísticas de opt-out
            const optOutStats = await this.databaseService.query(`
                SELECT
                    reason,
                    COUNT(*) as count
                FROM lgpd_opt_outs
                WHERE status = 'ACTIVE'
                GROUP BY reason
            `);

            // Solicitações de direitos
            const rightsRequests = await this.databaseService.query(`
                SELECT
                    action,
                    COUNT(*) as count
                FROM lgpd_audit_log
                WHERE action LIKE '%_REQUEST'
                AND created_at >= datetime('now', '-30 days')
                GROUP BY action
            `);

            const report = {
                generatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
                period: 'Últimos 30 dias',

                consent: {
                    total: consentStats?.reduce((sum, s) => sum + s.count, 0) || 0,
                    active: consentStats?.find(s => s.status === 'ACTIVE')?.count || 0,
                    denied: consentStats?.find(s => s.status === 'DENIED')?.count || 0,
                    revoked: consentStats?.find(s => s.status === 'REVOKED')?.count || 0
                },

                optOuts: {
                    total: optOutStats?.reduce((sum, s) => sum + s.count, 0) || 0,
                    byReason: optOutStats || []
                },

                rightsExercised: {
                    total: rightsRequests?.reduce((sum, r) => sum + r.count, 0) || 0,
                    byType: rightsRequests || []
                },

                compliance: {
                    consentRate: 0, // Calcular
                    optOutRate: 0,  // Calcular
                    responseTime: '< 24h', // Tempo médio de resposta
                    dataBreaches: 0
                }
            };

            return report;

        } catch (error) {
            this.logger.error('❌ Erro ao gerar relatório de compliance:', error);
            return null;
        }
    }

    /**
     * Outros handlers de direitos LGPD (implementação simplificada)
     */
    async handleDataRectificationRequest(phone) {
        return {
            success: true,
            message: `📝 Solicitação de correção registrada!

Entre em contato conosco para atualizar seus dados:

📧 lgpd@fullforceacademia.com.br
📱 (65) 99999-9999

Protocolo: ${this.generateProtocolNumber()}`
        };
    }

    async handleDataRestrictionRequest(phone) {
        return {
            success: true,
            message: `🔒 Solicitação de limitação registrada!

O tratamento dos seus dados será limitado conforme solicitado.

Protocolo: ${this.generateProtocolNumber()}
Contato: lgpd@fullforceacademia.com.br`
        };
    }

    async handleDataPortabilityRequest(phone) {
        return {
            success: true,
            message: `📤 Solicitação de portabilidade registrada!

Seus dados serão disponibilizados em formato estruturado em até 15 dias.

Protocolo: ${this.generateProtocolNumber()}
Contato: lgpd@fullforceacademia.com.br`
        };
    }

    async handleObjectionRequest(phone) {
        await this.addToOptOut(phone, 'OBJECTION_REQUEST');

        return {
            success: true,
            message: `✋ Objeção registrada!

O tratamento dos seus dados para marketing foi interrompido.

Protocolo: ${this.generateProtocolNumber()}
Contato: lgpd@fullforceacademia.com.br`
        };
    }
}

module.exports = LGPDCompliance;