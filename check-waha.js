/**
 * Check WAHA Status - FFGym
 * Verificação rápida do status do WhatsApp
 */

const axios = require('axios');

const WAHA_URL = 'http://localhost:3000';
const API_KEY = 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';

async function checkWAHA() {
    try {
        console.log('🏋️‍♂️ Academia Full Force - Status WhatsApp');
        console.log('==========================================\n');

        const response = await axios.get(`${WAHA_URL}/api/sessions`, {
            headers: { 'X-Api-Key': API_KEY }
        });

        const sessions = response.data;
        const defaultSession = sessions.find(s => s.name === 'default');

        if (!defaultSession) {
            console.log('❌ Sessão WhatsApp não encontrada');
            return;
        }

        console.log('📱 Status do WhatsApp:');
        console.log(`   🟢 Status: ${defaultSession.status}`);
        console.log(`   👤 Nome: ${defaultSession.me?.pushName || 'N/A'}`);
        console.log(`   📞 Número: ${defaultSession.me?.id?.replace('@c.us', '') || 'N/A'}`);

        if (defaultSession.config?.webhooks?.length > 0) {
            console.log('\n🔗 Webhooks Configurados:');
            defaultSession.config.webhooks.forEach((webhook, index) => {
                console.log(`   ${index + 1}. ${webhook.url}`);
                console.log(`      📨 Eventos: ${webhook.events.join(', ')}`);
            });
        }

        const isWorking = defaultSession.status === 'WORKING';
        console.log(`\n${isWorking ? '✅' : '❌'} WhatsApp da Academia: ${isWorking ? 'ATIVO E FUNCIONANDO' : 'INATIVO'}`);

        if (isWorking) {
            console.log('\n🎉 Sistema pronto para receber e enviar mensagens!');
            console.log('💡 Para enviar mensagem teste: node check-waha.js test +5566999301589');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar WAHA:', error.response?.data || error.message);
    }
}

async function sendTestMessage() {
    const phone = process.argv[3];
    const message = process.argv[4] || '🏋️‍♂️ Teste do sistema FFGym - Academia Full Force!\n\nSeu WhatsApp está conectado e funcionando perfeitamente! 💪\n\n*Sistema automatizado ativo.*';

    if (!phone) {
        console.log('❌ Use: node check-waha.js test +5566999301589 "mensagem"');
        return;
    }

    try {
        console.log(`📤 Enviando mensagem teste para ${phone}...`);

        const response = await axios.post(`${WAHA_URL}/api/sendText`, {
            session: 'default',
            chatId: `${phone.replace('+', '')}@c.us`,
            text: message
        }, {
            headers: { 'X-Api-Key': API_KEY }
        });

        console.log('✅ Mensagem enviada com sucesso!');
        console.log('📊 ID da mensagem:', response.data.id);

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    }
}

// Executar
const command = process.argv[2];

if (command === 'test') {
    sendTestMessage();
} else {
    checkWAHA();
}