/**
 * WhatsApp Academia - Integração com WAHA (Produção)
 * Sistema completo para WhatsApp Business usando container WAHA
 */

const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Configurações
const CONFIG = {
    WAHA_URL: 'http://localhost:3000',
    SESSION_NAME: 'default',
    PORT: 4001,
    ACADEMIA: {
        name: 'FullForce Academia - Matupá',
        phone: '+55 65 99999-9999',
        email: 'contato@fullforceacademia.com',
        endereco: 'Rua da Academia, 123 - Matupá, MT',
        horarios: 'Segunda a Sexta: 05:00 às 22:00\nSábado: 06:00 às 18:00\nDomingo: 08:00 às 16:00'
    }
};

// Mensagens automáticas da academia
const RESPONSES = {
    menu: `🏋️‍♀️ *FullForce Academia - Matupá*

📋 *MENU PRINCIPAL:*
1️⃣ Planos e Valores
2️⃣ Horários de Funcionamento
3️⃣ Modalidades Disponíveis
4️⃣ Localização
5️⃣ Falar com Atendente

Digite o número da opção desejada!`,

    planos: `💪 *PLANOS DA ACADEMIA*

🥉 *PLANO BÁSICO* - R$ 89,90/mês
✅ Musculação
✅ Acesso durante funcionamento

🥈 *PLANO INTERMEDIÁRIO* - R$ 129,90/mês
✅ Musculação
✅ Aulas coletivas
✅ Avaliação física

🥇 *PLANO COMPLETO* - R$ 179,90/mês
✅ Musculação
✅ Todas as modalidades
✅ Personal trainer 2x/semana
✅ Nutricionista

📞 Quer mais detalhes? Digite *ATENDENTE*`,

    horarios: `🕐 *HORÁRIOS DE FUNCIONAMENTO*

📅 *Segunda a Sexta:* 05:00 às 22:00
📅 *Sábado:* 06:00 às 18:00
📅 *Domingo:* 08:00 às 16:00

⏰ *Horários de Pico:*
• Manhã: 06:00 às 09:00
• Tarde: 17:00 às 20:00

💡 *Dica:* Venha nos horários alternativos para treinar com mais tranquilidade!`,

    modalidades: `🏃‍♂️ *MODALIDADES DISPONÍVEIS*

💪 *Musculação:* Equipamentos modernos e completos
🤸‍♀️ *Funcional:* Treinos dinâmicos e eficazes
🧘‍♀️ *Pilates:* Fortalecimento e flexibilidade
🥊 *Muay Thai:* Arte marcial e condicionamento
🚴‍♀️ *Spinning:* Aulas energizantes de bike
🏊‍♀️ *Hidroginástica:* Exercícios na piscina
🤸‍♂️ *Crossfit:* Treinos de alta intensidade

📋 Todas incluídas no *PLANO COMPLETO*!`,

    localizacao: `📍 *NOSSA LOCALIZAÇÃO*

🏢 ${CONFIG.ACADEMIA.endereco}

🚗 *Como chegar:*
• Próximo ao centro da cidade
• Estacionamento próprio gratuito
• Fácil acesso por transporte público

📞 *Contato:*
• WhatsApp: ${CONFIG.ACADEMIA.phone}
• Email: ${CONFIG.ACADEMIA.email}

🗺️ Quer o endereço no GPS? Digite *GPS*`,

    default: `👋 Olá! Bem-vindo à *FullForce Academia - Matupá*!

Como posso ajudar você hoje?

Digite *MENU* para ver todas as opções disponíveis.

💪 Vamos juntos alcançar seus objetivos! 🎯`
};

// Estado da aplicação
let isConnected = false;
let connectionStatus = 'disconnected';
let lastActivity = new Date();

// Função para fazer requisições à API WAHA
async function wahaRequest(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${CONFIG.WAHA_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`❌ Erro na requisição WAHA:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

// Verificar se sessão existe
async function checkSession() {
    console.log('🔍 Verificando sessão...');

    const result = await wahaRequest('GET', `/api/sessions`);
    if (result.success) {
        const sessions = result.data;
        const session = sessions.find(s => s.name === CONFIG.SESSION_NAME);

        if (session) {
            console.log(`✅ Sessão encontrada: ${session.status}`);
            isConnected = session.status === 'WORKING';
            connectionStatus = session.status;
            return true;
        }
    }

    console.log('❌ Sessão não encontrada');
    return false;
}

// Criar nova sessão
async function createSession() {
    console.log('🔄 Criando nova sessão...');

    const result = await wahaRequest('POST', '/api/sessions', {
        name: CONFIG.SESSION_NAME,
        config: {
            proxy: null,
            webhooks: [
                {
                    url: `http://localhost:${CONFIG.PORT}/webhook`,
                    events: ['message']
                }
            ]
        }
    });

    if (result.success) {
        console.log(`✅ Sessão criada: ${CONFIG.SESSION_NAME}`);
        return true;
    }

    console.log('❌ Erro ao criar sessão');
    return false;
}

// Obter QR Code
async function getQRCode() {
    const result = await wahaRequest('GET', `/api/sessions/${CONFIG.SESSION_NAME}/auth/qr`);

    if (result.success) {
        return result.data;
    }

    return null;
}

// Enviar mensagem
async function sendMessage(chatId, text) {
    const result = await wahaRequest('POST', `/api/sendText`, {
        session: CONFIG.SESSION_NAME,
        chatId: chatId,
        text: text
    });

    return result.success;
}

// Processar mensagem recebida
function processMessage(message) {
    if (!message.body || message.fromMe) return;

    const text = message.body.toLowerCase().trim();
    const chatId = message.from;

    console.log(`📨 Mensagem recebida de ${chatId}: ${text}`);

    let response = '';

    // Identificar tipo de resposta baseado na mensagem
    if (text.includes('menu') || text === '0') {
        response = RESPONSES.menu;
    } else if (text.includes('plano') || text === '1') {
        response = RESPONSES.planos;
    } else if (text.includes('horario') || text === '2') {
        response = RESPONSES.horarios;
    } else if (text.includes('modalidade') || text === '3') {
        response = RESPONSES.modalidades;
    } else if (text.includes('localiza') || text.includes('endere') || text === '4') {
        response = RESPONSES.localizacao;
    } else if (text.includes('atendente') || text === '5') {
        response = `👨‍💼 *Você será atendido por um de nossos consultores em breve!*

⏰ Horário de atendimento:
${CONFIG.ACADEMIA.horarios}

📞 Ou ligue: ${CONFIG.ACADEMIA.phone}

Obrigado pela preferência! 💪`;
    } else if (text.includes('gps')) {
        response = `📍 *Localização GPS*\n\n${CONFIG.ACADEMIA.endereco}\n\n🗺️ Abra no Google Maps para navegar até nós!`;
    } else if (text.includes('oi') || text.includes('olá') || text.includes('bom dia') || text.includes('boa tarde') || text.includes('boa noite')) {
        response = RESPONSES.default;
    } else {
        response = `🤔 Não entendi sua mensagem. ${RESPONSES.default}`;
    }

    // Enviar resposta
    setTimeout(() => {
        sendMessage(chatId, response);
    }, 1000);

    lastActivity = new Date();
}

// ===== ROTAS API =====

// Status da aplicação
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        whatsapp: connectionStatus,
        connected: isConnected,
        lastActivity: lastActivity,
        session: CONFIG.SESSION_NAME,
        waha: CONFIG.WAHA_URL
    });
});

// Webhook para receber mensagens
app.post('/webhook', (req, res) => {
    try {
        const { event, payload } = req.body;

        if (event === 'message' && payload) {
            processMessage(payload);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Error');
    }
});

// QR Code
app.get('/qr', async (req, res) => {
    try {
        const qrData = await getQRCode();
        if (qrData) {
            res.json(qrData);
        } else {
            res.status(404).json({ error: 'QR Code não disponível' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enviar mensagem manual
app.post('/send-message', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Parâmetros "to" e "message" são obrigatórios' });
        }

        const success = await sendMessage(to, message);

        if (success) {
            res.json({ success: true, message: 'Mensagem enviada' });
        } else {
            res.status(500).json({ error: 'Erro ao enviar mensagem' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'whatsapp-qr.html'));
});

// ===== INICIALIZAÇÃO =====

async function initializeWhatsApp() {
    console.log('🚀 Iniciando WhatsApp Academia com WAHA...');

    // Verificar se WAHA está disponível
    try {
        await axios.get(CONFIG.WAHA_URL);
        console.log('✅ WAHA está disponível');
    } catch (error) {
        console.log('❌ WAHA não está disponível. Verifique se o container está rodando.');
        return;
    }

    // Verificar/criar sessão
    const sessionExists = await checkSession();

    if (!sessionExists) {
        await createSession();
    }

    // Monitorar status da conexão
    setInterval(async () => {
        await checkSession();
    }, 10000); // Verificar a cada 10 segundos

    console.log(`✅ Sistema iniciado na porta ${CONFIG.PORT}`);
    console.log(`📱 Dashboard: http://localhost:${CONFIG.PORT}`);
    console.log(`🔗 WAHA Dashboard: ${CONFIG.WAHA_URL}`);
}

// Iniciar servidor
app.listen(CONFIG.PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${CONFIG.PORT}`);
    initializeWhatsApp();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});

module.exports = app;