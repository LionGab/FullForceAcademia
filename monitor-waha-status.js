/**
 * Monitor WAHA WhatsApp Status - FFGym
 * Script para monitorar status do WAHA e conexão WhatsApp
 */

require('dotenv').config();
const axios = require('axios');

class WAHAMonitor {
    constructor() {
        this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        this.apiKey = process.env.WAHA_API_KEY || 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.headers = {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    async checkStatus() {
        try {
            console.log('🔍 Verificando status do WAHA...');

            // Verificar sessões
            const sessions = await this.getSessions();

            if (sessions.length === 0) {
                console.log('⚠️  Nenhuma sessão encontrada');
                return false;
            }

            const defaultSession = sessions.find(s => s.name === 'default');

            if (!defaultSession) {
                console.log('⚠️  Sessão default não encontrada');
                return false;
            }

            // Exibir status detalhado
            console.log('\n📱 Status da Sessão WhatsApp:');
            console.log(`   📊 Status: ${defaultSession.status}`);
            console.log(`   👤 Nome: ${defaultSession.me?.pushName || 'N/A'}`);
            console.log(`   📞 Número: ${defaultSession.me?.id?.replace('@c.us', '') || 'N/A'}`);

            // Verificar webhooks
            if (defaultSession.config?.webhooks?.length > 0) {
                console.log('\n🔗 Webhooks Configurados:');
                defaultSession.config.webhooks.forEach((webhook, index) => {
                    console.log(`   ${index + 1}. ${webhook.url}`);
                    console.log(`      Eventos: ${webhook.events.join(', ')}`);
                });
            }

            // Status final
            const isWorking = defaultSession.status === 'WORKING';
            console.log(`\n${isWorking ? '✅' : '❌'} WhatsApp da Academia: ${isWorking ? 'ATIVO' : 'INATIVO'}`);

            return isWorking;

        } catch (error) {
            console.error('❌ Erro ao verificar status:', error.message);
            return false;
        }
    }

    async getSessions() {
        try {
            const response = await axios.get(`${this.wahaUrl}/api/sessions`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            throw new Error(`Falha ao obter sessões: ${error.response?.status || error.message}`);
        }
    }

    async sendTestMessage(phone, message) {
        try {
            console.log(`📤 Enviando mensagem teste para ${phone}...`);

            const response = await axios.post(`${this.wahaUrl}/api/sendText`, {
                session: 'default',
                chatId: `${phone}@c.us`,
                text: message
            }, {
                headers: this.headers
            });

            console.log('✅ Mensagem enviada com sucesso!');
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
            throw error;
        }
    }

    async restartSession() {
        try {
            console.log('🔄 Reiniciando sessão WhatsApp...');

            const response = await axios.post(`${this.wahaUrl}/api/sessions/default/restart`, {}, {
                headers: this.headers
            });

            console.log('✅ Sessão reiniciada com sucesso!');
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao reiniciar sessão:', error.response?.data || error.message);
            throw error;
        }
    }

    async getQRCode() {
        try {
            console.log('📱 Obtendo QR Code...');

            const response = await axios.get(`${this.wahaUrl}/api/sessions/default/auth/qr`, {
                headers: this.headers
            });

            console.log('✅ QR Code obtido:', response.data);
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao obter QR Code:', error.response?.data || error.message);
            throw error;
        }
    }
}

// Executar monitor
async function main() {
    console.log('🏋️‍♂️ Monitor WAHA - Academia Full Force');
    console.log('=====================================\n');

    const monitor = new WAHAMonitor();

    // Verificar argumentos da linha de comando
    const command = process.argv[2];

    switch (command) {
        case 'status':
            await monitor.checkStatus();
            break;

        case 'test':
            const phone = process.argv[3];
            const message = process.argv[4] || '🏋️‍♂️ Teste do sistema FFGym - Academia Full Force! Sistema funcionando perfeitamente.';

            if (!phone) {
                console.log('❌ Use: node monitor-waha-status.js test <numero> [mensagem]');
                return;
            }

            await monitor.sendTestMessage(phone, message);
            break;

        case 'restart':
            await monitor.restartSession();
            break;

        case 'qr':
            await monitor.getQRCode();
            break;

        case 'monitor':
            console.log('🔄 Monitoramento contínuo iniciado...\n');
            setInterval(async () => {
                console.log(`⏰ ${new Date().toLocaleTimeString()} - Verificando status...`);
                await monitor.checkStatus();
                console.log('---');
            }, 30000); // A cada 30 segundos
            break;

        default:
            console.log('📋 Comandos disponíveis:');
            console.log('  status   - Verificar status atual');
            console.log('  test     - Enviar mensagem teste');
            console.log('  restart  - Reiniciar sessão');
            console.log('  qr       - Obter QR Code');
            console.log('  monitor  - Monitoramento contínuo');
            console.log('\n💡 Exemplo: node monitor-waha-status.js status');
            await monitor.checkStatus();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WAHAMonitor;