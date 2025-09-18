/**
 * Academia WhatsApp Bot - Teste com +5566999301589
 * Sistema de atendimento automatizado para academia
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class AcademiaWhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "academia-matupa-bot"
            }),
            puppeteer: {
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupEventHandlers();
        this.startBot();
    }

    setupEventHandlers() {
        // QR Code para autenticação
        this.client.on('qr', (qr) => {
            console.log('🔍 Escaneie o QR Code abaixo com seu WhatsApp:');
            console.log('='.repeat(50));
            qrcode.generate(qr, { small: true });
            console.log('='.repeat(50));
            console.log('📱 Abra o WhatsApp > Menu > Dispositivos conectados > Conectar dispositivo');
        });

        // Bot pronto
        this.client.on('ready', () => {
            console.log('✅ Academia Bot está online!');
            console.log('📱 Número configurado: +5566999301589');
            console.log('🏋️ Academia Matupá - Sistema automatizado ativo!');
        });

        // Processar mensagens recebidas
        this.client.on('message', async (message) => {
            await this.processMessage(message);
        });

        // Erros
        this.client.on('disconnected', (reason) => {
            console.log('❌ Bot desconectado:', reason);
        });
    }

    async processMessage(message) {
        try {
            // Ignorar mensagens próprias
            if (message.fromMe) return;

            // Log da mensagem recebida
            const contact = await message.getContact();
            const chatId = message.from;
            const messageText = message.body.toLowerCase().trim();

            console.log(`📨 Mensagem de ${contact.pushname || contact.number}: ${message.body}`);

            // Processar comandos
            let response = '';

            if (messageText.includes('teste') || messageText.includes('test')) {
                response = `✅ *TESTE REALIZADO COM SUCESSO!*

🏋️ Academia Matupá - Sistema Online!
📱 Bot funcionando perfeitamente!
⏰ ${new Date().toLocaleString('pt-BR')}

Digite *menu* para ver todas as opções! 💪`;

            } else if (messageText.includes('menu') || messageText.includes('opções') || messageText.includes('opcoes')) {
                response = `📋 *MENU ACADEMIA MATUPÁ*

🧪 *teste* → Testar sistema
ℹ️ *info* → Informações completas
💰 *precos* → Planos e valores
📍 *endereco* → Nossa localização
🕐 *horarios* → Funcionamento
💪 *modalidades* → Atividades
📝 *matricula* → Quero me matricular
📞 *contato* → Falar com consultor
🛑 *parar* → Parar mensagens

💬 Digite qualquer opção acima!`;

            } else if (messageText.includes('info') || messageText.includes('informação') || messageText.includes('informacao')) {
                response = `🏋️ *ACADEMIA MATUPÁ*

📍 *Local:* Matupá - MT
👥 *Membros ativos:* 457
📈 *Taxa de retenção:* 96%
⭐ *Avaliação:* 4.9/5.0

💪 *Diferenciais:*
• Equipamentos de última geração
• Profissionais qualificados
• Ambiente climatizado
• Estacionamento gratuito
• Aulas em grupo inclusas

🎁 *PROMOÇÃO ESPECIAL:*
• 1ª semana GRÁTIS
• Avaliação física gratuita
• Plano alimentar incluso

📱 Interessado? Digite *matricula*`;

            } else if (messageText.includes('preço') || messageText.includes('preco') || messageText.includes('valor') || messageText.includes('plano') || messageText.includes('precos')) {
                response = `💰 *PLANOS ACADEMIA MATUPÁ*

🥉 *PLANO BÁSICO - R$ 89,90/mês*
• Musculação completa
• 1 modalidade à escolha
• Horário livre

🥈 *PLANO PREMIUM - R$ 129,90/mês*
• Tudo do Básico +
• Todas as modalidades
• Acompanhamento nutricional
• App exclusivo

🥇 *PLANO VIP - R$ 179,90/mês*
• Tudo do Premium +
• Personal trainer 2x/semana
• Avaliações mensais
• Prioridade nas aulas

💎 *PLANO FAMÍLIA - R$ 299,90/mês*
• Até 4 pessoas
• Todos os benefícios VIP
• Desconto em produtos

📱 Para fechar hoje: *matricula*`;

            } else if (messageText.includes('endereço') || messageText.includes('endereco') || messageText.includes('onde') || messageText.includes('local')) {
                response = `📍 *NOSSA LOCALIZAÇÃO*

🏢 *Endereço:*
Rua das Academias, 123
Centro - Matupá/MT
CEP: 78000-000

🚗 *Como chegar:*
• Estacionamento gratuito (50 vagas)
• Próximo ao centro comercial
• Fácil acesso pela BR-163

🕐 *Referências:*
• Em frente ao Banco do Brasil
• Ao lado da Farmácia Central
• 200m da Prefeitura

📱 *Google Maps:*
https://maps.google.com/?q=academia+matupa

🚌 *Transporte público:*
Linhas: 101, 202, 305`;

            } else if (messageText.includes('horário') || messageText.includes('horario') || messageText.includes('funcionamento') || messageText.includes('abre') || messageText.includes('fecha')) {
                response = `🕐 *HORÁRIOS DE FUNCIONAMENTO*

📅 *Segunda à Sexta:*
🌅 Manhã: 06:00 às 12:00
🌆 Tarde: 14:00 às 22:00

📅 *Sábados:*
🌅 08:00 às 18:00

📅 *Domingos:*
🌅 08:00 às 16:00

📅 *Feriados:*
🌅 08:00 às 14:00

⏰ *Horários especiais:*
• Musculação: 24h (plano VIP)
• Aulas coletivas: Ver programação
• Personal trainer: Agendamento

💪 Sempre prontos para você!`;

            } else if (messageText.includes('modalidade') || messageText.includes('atividade') || messageText.includes('aula') || messageText.includes('exercicio') || messageText.includes('treino')) {
                response = `💪 *MODALIDADES DISPONÍVEIS*

🏋️ *MUSCULAÇÃO*
• Equipamentos Technogym
• Área livre pesos
• Área funcional

🧘 *AULAS COLETIVAS*
• Yoga: Seg/Qua 19h
• Pilates: Ter/Qui 18h
• Zumba: Qua/Sex 19h30
• Spinning: Ter/Qui/Sáb 7h

🥊 *LUTAS*
• Boxe: Ter/Qui 20h
• Muay Thai: Seg/Qua/Sex 19h
• Jiu-Jitsu: Ter/Qui 19h

🏃 *CARDIO*
• Esteiras inteligentes
• Bikes ergométricas
• Elípticos

🎯 *FUNCIONAL*
• CrossFit: Seg/Qua/Sex 18h
• TRX: Ter/Qui 17h

*Aula experimental GRÁTIS!*
Digite: *agendar*`;

            } else if (messageText.includes('matricula') || messageText.includes('matrícula') || messageText.includes('sim') || messageText.includes('interessado') || messageText.includes('quero')) {
                response = `🎉 *ÓTIMO! VAMOS COMEÇAR!*

📝 *Para sua matrícula precisamos:*
• RG e CPF
• Comprovante de endereço
• Atestado médico (ou fazemos aqui)

🎁 *OFERTA ESPECIAL HOJE:*
• Taxa de matrícula GRÁTIS (R$ 50,00)
• 1ª semana experimental
• Avaliação física completa
• Kit welcome (squeeze + toalha)

📞 *Próximo passo:*
Nossa consultora vai te chamar para:
• Agendar sua visita
• Conhecer a academia
• Fazer sua avaliação
• Finalizar matrícula

⏰ Qual o melhor horário para te ligar?
• Manhã (8h-12h)
• Tarde (14h-18h)
• Noite (18h-20h)

Digite o período preferido! 📱`;

            } else if (messageText.includes('contato') || messageText.includes('consultor') || messageText.includes('ligar') || messageText.includes('telefone')) {
                response = `📞 *FALE CONOSCO*

👤 *Consultores especializados:*
• WhatsApp: +55 66 99999-1234
• Telefone: (66) 3333-1234

👩‍💼 *Atendimento presencial:*
• Seg-Sex: 8h às 20h
• Sábado: 8h às 17h

💬 *Canais digitais:*
• Instagram: @academiamatupa
• Facebook: Academia Matupá
• Site: www.academiamatupa.com.br

📧 *E-mail:*
contato@academiamatupa.com.br

🏃‍♂️ *Venha nos visitar:*
Rua das Academias, 123 - Centro
Matupá/MT

*Estamos aqui para ajudar! 💪*`;

            } else if (messageText.includes('agendar') || messageText.includes('visita') || messageText.includes('experimental')) {
                response = `📅 *AGENDAR AULA EXPERIMENTAL*

🎁 *Totalmente GRÁTIS:*
• Aula experimental (1h)
• Avaliação física completa
• Orientação profissional
• Tour pela academia

📋 *Disponibilidade esta semana:*

🗓️ *Hoje:*
• 14h, 16h, 18h, 20h

🗓️ *Amanhã:*
• 8h, 10h, 14h, 16h, 18h, 20h

🗓️ *Depois de amanhã:*
• 8h, 10h, 14h, 16h, 18h

⏰ *Qual horário prefere?*
Responda com: DIA + HORÁRIO
Exemplo: "hoje 18h" ou "amanhã 10h"

📱 Confirmaremos por WhatsApp!`;

            } else if (messageText.includes('parar') || messageText.includes('stop') || messageText.includes('sair')) {
                response = `👋 *MENSAGENS PAUSADAS*

Obrigado pelo interesse na Academia Matupá! 🏋️

📱 Para reativar, envie qualquer mensagem
💪 Estaremos sempre aqui quando precisar!

*Que tal dar uma chance para sua saúde?*
A primeira semana é GRÁTIS! 🎁`;

            } else {
                response = `👋 *Olá! Bem-vindo à Academia Matupá!* 🏋️

💪 Somos a academia mais completa de Matupá!
📈 457 membros satisfeitos e você pode ser o próximo!

📋 *Digite uma das opções:*
• *menu* → Ver todas as opções
• *info* → Conhecer a academia
• *precos* → Ver planos
• *matricula* → Quero me matricular

🎁 *OFERTA ESPECIAL:*
1ª semana GRÁTIS + avaliação!

Como posso ajudar você hoje? 😊`;
            }

            // Enviar resposta
            if (response) {
                await message.reply(response);
                console.log(`✅ Resposta enviada para ${contact.pushname || contact.number}`);
            }

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    }

    async startBot() {
        try {
            console.log('🚀 Iniciando Academia WhatsApp Bot...');
            console.log('📱 Número de teste: +5566999301589');
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Erro ao iniciar bot:', error);
        }
    }
}

// Inicializar o bot
console.log('='.repeat(60));
console.log('🏋️ ACADEMIA MATUPÁ - WHATSAPP BOT');
console.log('='.repeat(60));
console.log('📱 Número de teste: +5566999301589');
console.log('🤖 Iniciando sistema automatizado...');
console.log('='.repeat(60));

new AcademiaWhatsAppBot();