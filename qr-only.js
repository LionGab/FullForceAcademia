const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "22.04.4"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log('\n='.repeat(60));
            console.log('🔥 ACADEMIA FULL FORCE - QR WHATSAPP');
            console.log('='.repeat(60));
            console.log('\n📱 ESCANEIE ESTE QR CODE:\n');

            qrcode.generate(qr, { small: true });

            console.log('\n📱 INSTRUÇÕES:');
            console.log('1. Abra WhatsApp no celular');
            console.log('2. Menu → Dispositivos conectados');
            console.log('3. Conectar um dispositivo');
            console.log('4. Escaneie o código acima');
            console.log('\n' + '='.repeat(60) + '\n');
        }

        if (connection === 'open') {
            console.log('\n🎉 WHATSAPP CONECTADO COM SUCESSO! 🎉\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                setTimeout(() => connectWhatsApp(), 5000);
            }
        }
    });
}

connectWhatsApp();