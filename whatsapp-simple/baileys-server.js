const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let sock;
let isReady = false;
let qrCode = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./baileys-sessions');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        syncFullHistory: false,
        getMessage: async (key) => ({
            conversation: 'Mensagem não encontrada'
        })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrCode = qr;
            console.log('🔗 QR Code Baileys gerado! Escaneie com seu WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            isReady = true;
            console.log('✅ Baileys conectado!');
        } else if (connection === 'close') {
            isReady = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startSock();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        console.log('📨 Mensagem recebida:', from, body);
        // Enviar para webhook do n8n
        try {
            const webhookData = {
                from,
                body,
                timestamp: new Date().toISOString(),
                messageId: msg.key.id
            };
            // Descomente e ajuste a URL do webhook do n8n
            // await fetch('http://localhost:5678/webhook/whatsapp-response', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(webhookData)
            // });
        } catch (e) {
            console.error('❌ Erro ao enviar para webhook:', e);
        }
    });
}

startSock();

app.get('/status', (req, res) => {
    res.json({
        status: isReady ? 'connected' : 'disconnected',
        qr: qrCode ? true : false,
        timestamp: new Date().toISOString()
    });
});

app.get('/qr', (req, res) => {
    res.json({
        qr: qrCode,
        isReady
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
        const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true, to: jid, message, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Baileys rodando na porta ${PORT}`);
    console.log(`📱 Status: http://localhost:${PORT}/status`);
    console.log(`🔗 QR Code: http://localhost:${PORT}/qr`);
});
