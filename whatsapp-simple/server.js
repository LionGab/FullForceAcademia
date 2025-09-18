const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let isReady = false;
let qrCodeGenerated = false;

// Eventos do cliente
client.on('qr', (qr) => {
    console.log('🔗 QR Code gerado! Escaneie com seu WhatsApp:');
    qrcode.generate(qr, { small: true });
    qrCodeGenerated = true;
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    console.log('📱 Cliente pronto para enviar mensagens');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp autenticado!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('📴 WhatsApp desconectado:', reason);
    isReady = false;
});

// Receber mensagens
client.on('message', async (message) => {
    console.log('📨 Mensagem recebida:', message.from, message.body);

    // Webhook para N8N
    try {
        const webhookData = {
            from: message.from,
            body: message.body,
            message: message.body,
            nome: await message.getContact().then(contact => contact.pushname || contact.name || 'Desconhecido'),
            timestamp: new Date().toISOString(),
            messageId: message.id._serialized
        };

        console.log('🔔 Enviando para webhook N8N:', webhookData);

        // Aqui enviaria para o webhook do N8N
        // fetch('http://localhost:5678/webhook/whatsapp-response', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(webhookData)
        // });

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
    }
});

// API Routes
app.get('/status', (req, res) => {
    res.json({
        status: isReady ? 'connected' : 'disconnected',
        qrGenerated: qrCodeGenerated,
        timestamp: new Date().toISOString()
    });
});

app.post('/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!isReady) {
            return res.status(400).json({ error: 'WhatsApp não está conectado' });
        }

        if (!number || !message) {
            return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
        }

        // Formatar número
        const formattedNumber = number.includes('@') ? number : `${number}@c.us`;

        // Enviar mensagem
        const result = await client.sendMessage(formattedNumber, message);

        console.log('✅ Mensagem enviada:', formattedNumber, message);

        res.json({
            success: true,
            messageId: result.id._serialized,
            to: formattedNumber,
            message: message,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/qr', (req, res) => {
    res.json({
        qrGenerated: qrCodeGenerated,
        isReady: isReady,
        message: qrCodeGenerated ? 'QR Code gerado, verifique o console' : 'Aguardando QR Code...'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
    console.log(`📱 Status: http://localhost:${PORT}/status`);
    console.log(`🔗 QR Code: http://localhost:${PORT}/qr`);
});

// Inicializar cliente WhatsApp
console.log('🔄 Inicializando WhatsApp Web.js...');
client.initialize();