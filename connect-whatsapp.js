#!/usr/bin/env node

/**
 * Script Simples para Conectar WhatsApp via QR Code
 */

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function connectWhatsApp() {
    try {
        console.log('📱 Inicializando conexão WhatsApp...\n');

        const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            // Removido printQRInTerminal para implementar manualmente
        });

        // Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        // Handler para conexão
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Mostrar QR Code quando disponível
            if (qr) {
                console.log('\n🔲 QR CODE PARA CONECTAR:\n');
                qrcode.generate(qr, { small: true });
                console.log('\n📱 Escaneie o QR code acima com seu WhatsApp:');
                console.log('1. Abra o WhatsApp no seu celular');
                console.log('2. Vá em Menu > Dispositivos conectados');
                console.log('3. Toque em "Conectar um dispositivo"');
                console.log('4. Escaneie o QR code acima\n');
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('📱 Conexão fechada, reconectando:', shouldReconnect);

                if (shouldReconnect) {
                    console.log('🔄 Tentando reconectar em 5 segundos...');
                    setTimeout(() => connectWhatsApp(), 5000);
                }
            } else if (connection === 'open') {
                console.log('\n✅ WhatsApp conectado com sucesso!');
                console.log('🎉 O cliente agora pode usar o WhatsApp Business!\n');
            }
        });

        // Handler para mensagens
        sock.ev.on('messages.upsert', (m) => {
            const message = m.messages[0];
            if (message && !message.key.fromMe) {
                console.log('📨 Mensagem recebida de:', message.key.remoteJid);
            }
        });

        console.log('⏳ Aguardando QR code...\n');

    } catch (error) {
        console.error('❌ Erro ao conectar WhatsApp:', error);
    }
}

// Iniciar conexão
connectWhatsApp();

// Handler para encerramento
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando conexão WhatsApp...');
    process.exit(0);
});