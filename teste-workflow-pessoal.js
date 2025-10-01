// Workflow de Teste - Envio para Número Pessoal
// Envia mensagem diretamente via WAHA para +5566999301589

const axios = require('axios');

class WorkflowTestePessoal {
    constructor() {
        this.wahaUrl = 'http://localhost:3000';
        this.wahaApiKey = 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.numeroPessoal = '5566999301589'; // Seu número pessoal

        console.log('🧪 WORKFLOW TESTE PESSOAL INICIADO');
        console.log(`📱 Número destino: +${this.numeroPessoal}`);
        console.log(`🔗 WAHA URL: ${this.wahaUrl}`);
        console.log('==========================================');
    }

    async executarTeste() {
        try {
            console.log('\n🔍 Verificando status WAHA...');
            await this.verificarWAHA();

            console.log('\n📤 Enviando mensagem de teste...');
            const resultado = await this.enviarMensagemTeste();

            console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
            console.log('📊 Resultado:', resultado);

            return {
                success: true,
                timestamp: new Date().toISOString(),
                resultado
            };

        } catch (error) {
            console.error('\n❌ ERRO NO TESTE:', error.message);
            throw error;
        }
    }

    async verificarWAHA() {
        try {
            const response = await axios.get(`${this.wahaUrl}/api/sessions/default`, {
                headers: {
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 5000
            });

            const session = response.data;
            console.log(`✅ WAHA Status: ${session.status}`);
            console.log(`🔗 Engine: ${session.engine?.engine}`);
            console.log(`📱 Conectado como: ${session.me?.pushName}`);

            if (session.status !== 'WORKING') {
                throw new Error(`WAHA não está funcionando. Status: ${session.status}`);
            }

            return session;

        } catch (error) {
            console.error('❌ Erro verificando WAHA:', error.message);
            throw error;
        }
    }

    async enviarMensagemTeste() {
        try {
            const chatId = `${this.numeroPessoal}@c.us`;
            const mensagem = `🧪 TESTE WORKFLOW FFGym

⏰ ${new Date().toLocaleString('pt-BR')}
🎯 Sistema: Full Force Academia
🔗 Origem: Workflow de Teste Automatizado

✅ WAHA API: Funcionando
✅ Ponte N8N: Ativa
✅ Workflow: Executando

📊 Este é um teste do sistema de automação da academia.

🚀 Próximos passos:
- Ativar workflow N8N Cloud
- Conectar WhatsApp da academia
- Iniciar campanhas de reativação

#FFGym #TesteAutomacao #WhatsAppBusiness`;

            const response = await axios.post(`${this.wahaUrl}/api/sendText`, {
                session: 'default',
                chatId: chatId,
                text: mensagem
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.wahaApiKey
                },
                timeout: 10000
            });

            console.log('✅ Mensagem enviada!');
            console.log(`📨 ID da mensagem: ${response.data.id}`);
            console.log(`📱 Para: ${chatId}`);

            return {
                messageId: response.data.id,
                chatId: chatId,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

        } catch (error) {
            console.error('❌ Erro enviando mensagem:', error.message);
            throw error;
        }
    }
}

// Executar teste
if (require.main === module) {
    const teste = new WorkflowTestePessoal();

    teste.executarTeste()
        .then(resultado => {
            console.log('\n🎉 TESTE FINALIZADO!');
            console.log('📊 Resultado completo:', JSON.stringify(resultado, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 TESTE FALHOU!');
            console.error('🔍 Erro:', error.message);
            process.exit(1);
        });
}

module.exports = WorkflowTestePessoal;