const { formatTime, getNextAvailableSlot } = require('../utils/time-utils');
const moment = require('moment');

class MessageHandler {
    constructor(calendarService, sheetsService) {
        this.calendarService = calendarService;
        this.sheetsService = sheetsService;

        // Estados da conversa por usuário
        this.userStates = new Map();

        // Patterns para reconhecimento de intenções
        this.patterns = {
            greeting: /^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hello)/i,
            scheduleClass: /(agendar|marcar|reservar).*(aula|treino|horário|horario)/i,
            cancelClass: /(cancelar|desmarcar).*(aula|treino|agendamento)/i,
            classSchedule: /(horário|horario|agenda).*(aula|treino)/i,
            plans: /(plano|planos|mensalidade|valor|preço|preco)/i,
            location: /(endereço|endereco|localização|localizacao|onde fica)/i,
            hours: /(horário|horario).*(funcionamento|academia|aberto)/i,
            help: /(ajuda|help|menu|opções|opcoes)/i,
            contact: /(contato|telefone|whatsapp|falar)/i,
            enrollment: /(matrícula|matricula|inscrição|inscricao|cadastro)/i,
            evaluation: /(avaliação|avaliacao|física|fisica|teste)/i
        };

        // Mensagens pré-definidas
        this.messages = {
            welcome: `🔥 *Bem-vindo à Academia Full Force!*

Olá! Sou seu assistente virtual e estou aqui para ajudá-lo com:

📅 *Agendamentos* - Marcar/cancelar aulas
📋 *Informações* - Planos, horários, endereço
💪 *Avaliação Física* - Agendar sua avaliação
📞 *Contato* - Falar com nossa equipe

*Como posso ajudá-lo hoje?*

_Digite "menu" para ver todas as opções._`,

            menu: `📋 *MENU PRINCIPAL*

Escolha uma opção:

1️⃣ *Agendar Aula/Treino*
2️⃣ *Cancelar Agendamento*
3️⃣ *Ver Horários Disponíveis*
4️⃣ *Planos e Valores*
5️⃣ *Endereço e Localização*
6️⃣ *Horário de Funcionamento*
7️⃣ *Avaliação Física*
8️⃣ *Falar com Atendente*

*Digite o número da opção desejada ou descreva o que precisa.*`,

            hours: `⏰ *HORÁRIO DE FUNCIONAMENTO*

${process.env.ACADEMIA_HORARIO_FUNCIONAMENTO}

🔥 *Academia Full Force* - Sua transformação não para!

_Precisa de mais alguma coisa?_`,

            location: `📍 *LOCALIZAÇÃO*

**${process.env.ACADEMIA_NOME}**
📌 ${process.env.ACADEMIA_ENDERECO}

🚗 *Como chegar:*
• Próximo ao metrô/estação [nome]
• Estacionamento gratuito disponível
• Acesso fácil por transporte público

📞 *Contato:* ${process.env.ACADEMIA_TELEFONE}

_Nos vemos em breve! 💪_`,

            contact: `📞 *FALE CONOSCO*

*WhatsApp:* ${process.env.ACADEMIA_TELEFONE}
*Endereço:* ${process.env.ACADEMIA_ENDERECO}

⏰ *Horário de Atendimento:*
${process.env.ACADEMIA_HORARIO_FUNCIONAMENTO}

🔥 *Academia Full Force* - Estamos aqui para você!

_Em que mais posso ajudar?_`
        };
    }

    async processMessage(messageText, contactNumber, contact) {
        try {
            const userState = this.getUserState(contactNumber);

            // Primeiro contato - mensagem de boas-vindas
            if (!userState.hasInteracted) {
                userState.hasInteracted = true;
                this.updateUserState(contactNumber, userState);

                // Registrar novo contato no Google Sheets
                await this.registerNewContact(contact, contactNumber);

                return this.messages.welcome;
            }

            // Processar baseado no padrão da mensagem
            return await this.handleIntent(messageText, contactNumber, contact, userState);

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            return this.getErrorMessage();
        }
    }

    async handleIntent(messageText, contactNumber, contact, userState) {
        // Verificar padrões de intenção
        if (this.patterns.greeting.test(messageText)) {
            return this.handleGreeting();
        }

        if (this.patterns.help.test(messageText) || /^(menu|opções|opcoes|\d)$/i.test(messageText)) {
            return this.messages.menu;
        }

        if (this.patterns.scheduleClass.test(messageText) || messageText === '1') {
            return await this.handleScheduleRequest(contactNumber);
        }

        if (this.patterns.cancelClass.test(messageText) || messageText === '2') {
            return await this.handleCancelRequest(contactNumber);
        }

        if (this.patterns.classSchedule.test(messageText) || messageText === '3') {
            return await this.handleScheduleInfo();
        }

        if (this.patterns.plans.test(messageText) || messageText === '4') {
            return await this.handlePlansInfo();
        }

        if (this.patterns.location.test(messageText) || messageText === '5') {
            return this.messages.location;
        }

        if (this.patterns.hours.test(messageText) || messageText === '6') {
            return this.messages.hours;
        }

        if (this.patterns.evaluation.test(messageText) || messageText === '7') {
            return await this.handleEvaluationRequest(contactNumber);
        }

        if (this.patterns.contact.test(messageText) || messageText === '8') {
            return this.handleContactRequest();
        }

        // Estados especiais (aguardando resposta específica)
        if (userState.state === 'awaiting_schedule_confirmation') {
            return await this.handleScheduleConfirmation(messageText, contactNumber, userState);
        }

        // Mensagem não reconhecida
        return this.handleUnknownMessage();
    }

    handleGreeting() {
        const greetings = [
            "🔥 Olá! Como posso ajudá-lo hoje na Academia Full Force?",
            "💪 Oi! Pronto para turbinar seu treino? Como posso ajudar?",
            "⚡ Olá! Vamos potencializar seus resultados? Em que posso ajudar?"
        ];

        return greetings[Math.floor(Math.random() * greetings.length)] +
               "\n\n_Digite 'menu' para ver todas as opções._";
    }

    async handleScheduleRequest(contactNumber) {
        try {
            const availableSlots = await this.calendarService.getAvailableSlots();

            if (availableSlots.length === 0) {
                return `📅 *Agendamento de Aulas*

Ops! No momento não há horários disponíveis para hoje.

🔄 *Próximos horários:*
${await this.getNextAvailableSlots()}

📞 Para outros horários: ${process.env.ACADEMIA_TELEFONE}

_Digite 'menu' para outras opções._`;
            }

            // Atualizar estado do usuário
            this.updateUserState(contactNumber, {
                state: 'selecting_schedule',
                availableSlots: availableSlots
            });

            return `📅 *Agendamento de Aulas*

Horários disponíveis para hoje:

${this.formatAvailableSlots(availableSlots)}

*Digite o número do horário desejado ou 'voltar' para o menu.*`;

        } catch (error) {
            console.error('Erro ao buscar horários:', error);
            return this.getScheduleErrorMessage();
        }
    }

    async handlePlansInfo() {
        try {
            const plans = await this.sheetsService.getPlansData();

            if (!plans || plans.length === 0) {
                return this.getDefaultPlansMessage();
            }

            let plansMessage = `💳 *PLANOS E VALORES*\n\n`;

            plans.forEach((plan, index) => {
                plansMessage += `${index + 1}️⃣ *${plan.nome}*\n`;
                plansMessage += `💰 R$ ${plan.valor}/mês\n`;
                plansMessage += `📋 ${plan.descricao}\n\n`;
            });

            plansMessage += `🎯 *Promoções ativas* - Consulte nossa equipe!\n`;
            plansMessage += `📞 *Contato:* ${process.env.ACADEMIA_TELEFONE}\n\n`;
            plansMessage += `_Digite 'menu' para outras opções._`;

            return plansMessage;

        } catch (error) {
            console.error('Erro ao buscar planos:', error);
            return this.getDefaultPlansMessage();
        }
    }

    async handleEvaluationRequest(contactNumber) {
        // Atualizar estado do usuário
        this.updateUserState(contactNumber, { state: 'scheduling_evaluation' });

        return `🏋️ *Avaliação Física Gratuita*

Nossa avaliação inclui:
• 📊 Composição corporal
• 💪 Teste de força
• 🎯 Definição de objetivos
• 📋 Plano de treino personalizado

⏰ *Duração:* 45 minutos
💰 *Valor:* GRATUITA para novos alunos

📅 *Horários disponíveis:*
${await this.getEvaluationSlots()}

*Digite o número do horário ou 'agendar' para falar com nossa equipe.*`;
    }

    handleContactRequest() {
        return `📞 *Transferindo para Atendimento Humano*

Nossa equipe será notificada e entrará em contato em breve!

⏰ *Tempo médio de resposta:* 5-10 minutos
💬 *Horário:* ${process.env.ACADEMIA_HORARIO_FUNCIONAMENTO}

📲 *Contato direto:* ${process.env.ACADEMIA_TELEFONE}

🔥 *Academia Full Force* - Atendimento que faz a diferença!`;
    }

    handleUnknownMessage() {
        const responses = [
            "🤔 Não entendi sua solicitação. Digite 'menu' para ver as opções disponíveis.",
            "❓ Desculpe, não compreendi. Digite 'ajuda' para ver como posso ajudá-lo.",
            "🔄 Pode reformular sua pergunta? Digite 'menu' para ver todas as opções."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    async registerNewContact(contact, contactNumber) {
        try {
            const contactData = {
                nome: contact.pushname || 'Não informado',
                telefone: contactNumber,
                dataContato: moment().format('DD/MM/YYYY HH:mm'),
                status: 'Novo contato'
            };

            await this.sheetsService.addContact(contactData);
            console.log(`✅ Novo contato registrado: ${contactNumber}`);

        } catch (error) {
            console.error('Erro ao registrar contato:', error);
        }
    }

    getUserState(contactNumber) {
        return this.userStates.get(contactNumber) || { hasInteracted: false };
    }

    updateUserState(contactNumber, newState) {
        const currentState = this.getUserState(contactNumber);
        this.userStates.set(contactNumber, { ...currentState, ...newState });
    }

    formatAvailableSlots(slots) {
        return slots.map((slot, index) =>
            `${index + 1}️⃣ ${slot.time} - ${slot.activity || 'Treino Livre'}`
        ).join('\n');
    }

    async getNextAvailableSlots() {
        // Implementar lógica para próximos horários
        return "Segunda: 7h, 9h, 19h\nTerça: 8h, 10h, 20h";
    }

    async getEvaluationSlots() {
        // Implementar lógica para horários de avaliação
        return "1️⃣ Segunda 14h\n2️⃣ Terça 16h\n3️⃣ Quarta 15h";
    }

    getDefaultPlansMessage() {
        return `💳 *PLANOS E VALORES*

1️⃣ *Plano Básico*
💰 R$ 89,90/mês
📋 Musculação + Cardio

2️⃣ *Plano Completo*
💰 R$ 129,90/mês
📋 Todas as modalidades

3️⃣ *Plano Premium*
💰 R$ 179,90/mês
📋 Tudo + Personal Trainer

📞 *Mais informações:* ${process.env.ACADEMIA_TELEFONE}

_Digite 'menu' para outras opções._`;
    }

    getScheduleErrorMessage() {
        return `❌ *Erro temporário*

Não conseguimos acessar os horários agora.

📞 *Entre em contato:* ${process.env.ACADEMIA_TELEFONE}
⏰ *Horário:* ${process.env.ACADEMIA_HORARIO_FUNCIONAMENTO}

_Ou digite 'menu' para outras opções._`;
    }

    getErrorMessage() {
        return `❌ *Ops! Algo deu errado*

Nossa equipe foi notificada. Tente novamente em alguns minutos.

📞 *Contato direto:* ${process.env.ACADEMIA_TELEFONE}

💪 *Academia Full Force* - Sempre aqui para você!`;
    }
}

module.exports = MessageHandler;