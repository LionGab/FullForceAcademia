const MessageHandler = require('../handlers/message-handler');
const { isBusinessHours, formatTime } = require('../utils/time-utils');

class WhatsAppBot {
    constructor(client, calendarService, sheetsService) {
        this.client = client;
        this.calendarService = calendarService;
        this.sheetsService = sheetsService;
        this.messageHandler = new MessageHandler(calendarService, sheetsService);

        // Cache para evitar spam
        this.lastMessage = new Map();
        this.messageDelay = 5000; // 5 segundos
    }

    async handleMessage(message) {
        try {
            // Ignorar mensagens do próprio bot
            if (message.fromMe) return;

            // Ignorar mensagens de grupos (opcional)
            const chat = await message.getChat();
            if (chat.isGroup) return;

            const contact = await message.getContact();
            const contactNumber = contact.number;
            const messageText = message.body.toLowerCase().trim();

            // Anti-spam: verificar último tempo de mensagem
            if (this.isSpam(contactNumber)) {
                console.log(`🚫 Spam detectado de ${contactNumber}`);
                return;
            }

            // Registrar última mensagem
            this.lastMessage.set(contactNumber, Date.now());

            console.log(`📩 Mensagem recebida de ${contact.pushname || contactNumber}: ${message.body}`);

            // Verificar horário de funcionamento
            if (!isBusinessHours() && !this.isUrgentMessage(messageText)) {
                await this.sendOutOfHoursMessage(message);
                return;
            }

            // Processar mensagem
            const response = await this.messageHandler.processMessage(messageText, contactNumber, contact);

            if (response) {
                await this.sendResponse(message, response);
            }

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            await this.sendErrorMessage(message);
        }
    }

    isSpam(contactNumber) {
        const lastTime = this.lastMessage.get(contactNumber);
        if (!lastTime) return false;
        return (Date.now() - lastTime) < this.messageDelay;
    }

    isUrgentMessage(messageText) {
        const urgentKeywords = [
            'emergência', 'emergencia', 'urgente', 'socorro',
            'acidente', 'lesão', 'lesao', 'dor', 'problema grave'
        ];
        return urgentKeywords.some(keyword => messageText.includes(keyword));
    }

    async sendOutOfHoursMessage(message) {
        const outOfHoursMessage = `⏰ *Fora do horário de atendimento*

${process.env.MENSAGEM_FORA_HORARIO}

🆘 *Em caso de emergência médica, procure atendimento hospitalar imediatamente.*

💪 Obrigado por escolher a Academia Full Force!`;

        await message.reply(outOfHoursMessage);
    }

    async sendResponse(message, response) {
        // Simular digitação para parecer mais natural
        const chat = await message.getChat();
        await chat.sendStateTyping();

        // Pequeno delay para parecer mais humano
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        await message.reply(response);
    }

    async sendErrorMessage(message) {
        const errorMessage = `❌ *Ops! Algo deu errado*

Desculpe, tivemos um problema técnico. Nossa equipe foi notificada.

Por favor, tente novamente em alguns minutos ou entre em contato diretamente:
📞 ${process.env.ACADEMIA_TELEFONE}

💪 Academia Full Force - Sempre aqui para você!`;

        await message.reply(errorMessage);
    }

    // Método para enviar mensagens promocionais (uso futuro)
    async sendBroadcastMessage(numbers, message) {
        for (const number of numbers) {
            try {
                const chatId = `${number}@c.us`;
                await this.client.sendMessage(chatId, message);
                console.log(`📤 Mensagem enviada para ${number}`);

                // Delay entre mensagens para evitar bloqueio
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`❌ Erro ao enviar para ${number}:`, error);
            }
        }
    }
}

module.exports = WhatsAppBot;