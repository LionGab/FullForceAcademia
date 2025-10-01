#!/usr/bin/env node

// CONEXÃO URGENTE WHATSAPP CLIENTE - WAHA API
// Script para conectar o WhatsApp do cliente imediatamente

const axios = require('axios');
const QRCode = require('qrcode');
const open = require('open');

class ConectarWhatsAppCliente {
    constructor() {
        this.wahaUrl = process.env.WAHA_URL || 'https://waha.lionalpha.app';
        this.sessionName = process.env.CLIENT_SESSION || 'cliente-session';
        this.apiKey = process.env.WAHA_API_KEY || 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';

        console.log('🚀 CONECTANDO WHATSAPP DO CLIENTE');
        console.log('================================');
        console.log(`📡 WAHA URL: ${this.wahaUrl}`);
        console.log(`📱 Sessão: ${this.sessionName}`);
    }

    async conectarCliente() {
        try {
            console.log('\n⚡ PASSO 1: Verificando WAHA API...');
            await this.verificarWAHA();

            console.log('\n⚡ PASSO 2: Criando sessão do cliente...');
            await this.criarSessao();

            console.log('\n⚡ PASSO 3: Iniciando sessão...');
            await this.iniciarSessao();

            console.log('\n⚡ PASSO 4: Gerando QR Code...');
            const qrData = await this.obterQRCode();

            console.log('\n⚡ PASSO 5: Exibindo QR Code...');
            await this.exibirQRCode(qrData);

            console.log('\n⚡ PASSO 6: Monitorando conexão...');
            await this.monitorarConexao();

            return true;

        } catch (error) {
            console.error('❌ ERRO NA CONEXÃO:', error.message);
            return false;
        }
    }

    async verificarWAHA() {
        try {
            const response = await axios.get(`${this.wahaUrl}/api/health`, {
                timeout: 10000
            });

            console.log('✅ WAHA API conectada');
            return response.data;
        } catch (error) {
            throw new Error(`WAHA API não disponível: ${error.message}`);
        }
    }

    async criarSessao() {
        try {
            const payload = {
                name: this.sessionName,
                config: {
                    webhooks: [
                        {
                            url: `${this.wahaUrl}/webhook/cliente`,
                            events: ['message', 'session.status'],
                            retries: 3
                        }
                    ]
                }
            };

            const response = await axios.post(`${this.wahaUrl}/api/sessions`, payload, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Sessão criada para o cliente');
            return response.data;
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️ Sessão já existe, continuando...');
                return { message: 'Session already exists' };
            }
            throw error;
        }
    }

    async iniciarSessao() {
        try {
            const response = await axios.post(`${this.wahaUrl}/api/sessions/${this.sessionName}/start`, {}, {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });

            console.log('✅ Sessão iniciada');
            return response.data;
        } catch (error) {
            console.log('ℹ️ Sessão já estava iniciada ou erro esperado');
            return { message: 'Session start attempted' };
        }
    }

    async obterQRCode() {
        try {
            // Aguardar um pouco para sessão inicializar
            await this.sleep(3000);

            const response = await axios.get(`${this.wahaUrl}/api/sessions/${this.sessionName}/auth/qr`, {
                headers: {
                    'X-Api-Key': this.apiKey
                }
            });

            console.log('✅ QR Code obtido');
            return response.data;
        } catch (error) {
            throw new Error(`Erro ao obter QR Code: ${error.message}`);
        }
    }

    async exibirQRCode(qrData) {
        try {
            const qrText = qrData.qr || qrData.url || qrData;

            console.log('\n🔲 QR CODE PARA CONECTAR WHATSAPP:');
            console.log('=================================');

            // Gerar QR Code no terminal
            const qrTerminal = await QRCode.toString(qrText, { type: 'terminal' });
            console.log(qrTerminal);

            console.log('\n📱 INSTRUÇÕES PARA O CLIENTE:');
            console.log('1. Abra o WhatsApp no celular');
            console.log('2. Vá em Configurações > WhatsApp Web');
            console.log('3. Escaneie o QR Code acima');
            console.log('4. Aguarde a confirmação de conexão');

            // Salvar QR Code como imagem também
            try {
                await QRCode.toFile('./qr-code-cliente.png', qrText);
                console.log('\n💾 QR Code salvo como: qr-code-cliente.png');

                // Tentar abrir a imagem automaticamente
                setTimeout(() => {
                    open('./qr-code-cliente.png').catch(() => {
                        console.log('ℹ️ Não foi possível abrir a imagem automaticamente');
                    });
                }, 1000);
            } catch (err) {
                console.log('ℹ️ QR Code não pôde ser salvo como imagem');
            }

        } catch (error) {
            console.error('❌ Erro ao exibir QR Code:', error.message);
            console.log('\n🔧 QR Code manual:');
            console.log(JSON.stringify(qrData, null, 2));
        }
    }

    async monitorarConexao() {
        console.log('\n⏳ Aguardando conexão do cliente...');
        console.log('(Pressione Ctrl+C para cancelar)');

        let tentativas = 0;
        const maxTentativas = 60; // 5 minutos

        while (tentativas < maxTentativas) {
            try {
                const status = await this.verificarStatusSessao();

                if (status.status === 'WORKING' || status.status === 'AUTHENTICATED') {
                    console.log('\n🎉 WHATSAPP CONECTADO COM SUCESSO!');
                    console.log('✅ Cliente autenticado');
                    console.log('\n📊 Status da sessão:');
                    console.log(JSON.stringify(status, null, 2));

                    await this.testarEnvioMensagem();
                    return true;
                }

                console.log(`⏳ Status: ${status.status || 'AGUARDANDO'} (${tentativas + 1}/${maxTentativas})`);

            } catch (error) {
                console.log(`⚠️ Erro ao verificar status: ${error.message}`);
            }

            await this.sleep(5000); // 5 segundos
            tentativas++;
        }

        console.log('\n⏰ Timeout: Cliente não conectou em 5 minutos');
        console.log('🔄 Execute novamente ou verifique o QR Code');
        return false;
    }

    async verificarStatusSessao() {
        const response = await axios.get(`${this.wahaUrl}/api/sessions/${this.sessionName}`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });

        return response.data;
    }

    async testarEnvioMensagem() {
        try {
            console.log('\n🧪 Testando envio de mensagem...');

            // Pegar informações da sessão para obter o número do cliente
            const status = await this.verificarStatusSessao();
            const numeroCliente = status.me?.id || status.phone;

            if (numeroCliente) {
                const mensagemTeste = `🎉 WhatsApp conectado com sucesso!

✅ Sistema WAHA configurado
🤖 Automação ativada
🎯 Pronto para campanhas

🕐 Conectado em: ${new Date().toLocaleString('pt-BR')}

Seu WhatsApp Business está pronto para o sistema de automação da academia!`;

                const resultado = await this.enviarMensagem(numeroCliente, mensagemTeste);

                if (resultado.success) {
                    console.log('✅ Mensagem de teste enviada!');
                } else {
                    console.log('⚠️ Mensagem de teste não enviada');
                }
            }

        } catch (error) {
            console.log('ℹ️ Teste de mensagem não realizado:', error.message);
        }
    }

    async enviarMensagem(numero, mensagem) {
        try {
            const chatId = `${numero.replace(/\D/g, '')}@c.us`;

            const response = await axios.post(`${this.wahaUrl}/api/sessions/${this.sessionName}/chats/${chatId}/messages/text`, {
                text: mensagem
            }, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async executarConexaoCompleta() {
        console.log('🚀 INICIANDO CONEXÃO WHATSAPP CLIENTE');
        console.log('====================================');
        console.log('⚡ Conectando em modo EXPRESS...');

        const sucesso = await this.conectarCliente();

        if (sucesso) {
            console.log('\n🎯 PRÓXIMOS PASSOS:');
            console.log('1. ✅ WhatsApp conectado');
            console.log('2. 🔧 Configure campanhas');
            console.log('3. 🚀 Inicie automação');
            console.log('\n💡 Sistema pronto para uso!');
        } else {
            console.log('\n❌ CONEXÃO FALHOU');
            console.log('🔧 Verifique:');
            console.log('  - WAHA API está rodando');
            console.log('  - Internet estável');
            console.log('  - QR Code válido');
        }

        return sucesso;
    }
}

// Função principal
async function main() {
    const connector = new ConectarWhatsAppCliente();

    try {
        await connector.executarConexaoCompleta();
    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = ConectarWhatsAppCliente;