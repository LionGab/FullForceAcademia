#!/usr/bin/env node

// CONEXÃO IMEDIATA WHATSAPP CLIENTE - WAHA FUNCIONANDO
const axios = require('axios');
const QRCode = require('qrcode');

class ConexaoImediataWhatsApp {
    constructor() {
        this.wahaUrl = 'http://localhost:3000';
        this.apiKey = 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.sessionName = 'cliente-academia';

        console.log('🚀 CONEXÃO IMEDIATA WHATSAPP');
        console.log('===========================');
        console.log(`📡 WAHA URL: ${this.wahaUrl}`);
        console.log(`📱 Sessão: ${this.sessionName}`);
    }

    async conectarAgora() {
        try {
            console.log('\n⚡ INICIANDO CONEXÃO...');

            console.log('\n1️⃣ Criando sessão...');
            await this.criarSessao();

            console.log('\n2️⃣ Iniciando sessão...');
            await this.iniciarSessao();

            console.log('\n3️⃣ Obtendo QR Code...');
            await this.sleep(5000); // Aguardar inicialização
            const qrData = await this.obterQRCode();

            console.log('\n4️⃣ Exibindo QR Code...');
            await this.exibirQRCode(qrData);

            console.log('\n5️⃣ Monitorando conexão...');
            const conectado = await this.monitorarConexao();

            if (conectado) {
                console.log('\n🎉 WHATSAPP CONECTADO COM SUCESSO!');
                await this.testarEnvio();
                return true;
            } else {
                console.log('\n⏰ Timeout na conexão');
                return false;
            }

        } catch (error) {
            console.error('\n❌ ERRO:', error.message);
            console.log('\n🔧 Dicas:');
            console.log('1. Verifique se WAHA está rodando');
            console.log('2. Escaneie o QR Code rapidamente');
            console.log('3. Mantenha WhatsApp aberto no celular');
            return false;
        }
    }

    async criarSessao() {
        try {
            const response = await axios.post(`${this.wahaUrl}/api/sessions`, {
                name: this.sessionName,
                config: {
                    webhooks: []
                }
            }, {
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('✅ Sessão criada');
            return response.data;
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️ Sessão já existe');
                return { message: 'Session exists' };
            }

            // Tentar formato alternativo
            try {
                const response = await axios.post(`${this.wahaUrl}/api/session/start`, {
                    session: this.sessionName,
                    webhookUrl: ''
                });
                console.log('✅ Sessão criada (formato alternativo)');
                return response.data;
            } catch (altError) {
                console.log('⚠️ Erro ao criar sessão, continuando...');
                return {};
            }
        }
    }

    async iniciarSessao() {
        try {
            const response = await axios.post(`${this.wahaUrl}/api/sessions/${this.sessionName}/start`, {}, {
                headers: {
                    'X-Api-Key': this.apiKey
                },
                timeout: 10000
            });

            console.log('✅ Sessão iniciada');
            return response.data;
        } catch (error) {
            console.log('ℹ️ Sessão já iniciada ou erro esperado');
            return {};
        }
    }

    async obterQRCode() {
        try {
            console.log('   Obtendo screenshot com QR Code...');
            const response = await axios.get(`${this.wahaUrl}/api/screenshot`, {
                headers: {
                    'X-Api-Key': this.apiKey
                },
                params: {
                    session: this.sessionName
                },
                timeout: 15000
            });

            if (response.data) {
                console.log('✅ QR Code obtido via screenshot');
                // O screenshot retorna uma imagem base64 ou URL
                return response.data;
            }

            throw new Error('Screenshot vazio');
        } catch (error) {
            console.log(`   ❌ Screenshot falhou: ${error.response?.status || error.message}`);

            // Fallback: tentar outros endpoints conhecidos
            const tentativasFallback = [
                `/api/sessions/${this.sessionName}/auth/qr`,
                `/api/${this.sessionName}/qr`
            ];

            for (const endpoint of tentativasFallback) {
                try {
                    console.log(`   Tentando fallback: ${endpoint}`);
                    const response = await axios.get(`${this.wahaUrl}${endpoint}`, {
                        headers: {
                            'X-Api-Key': this.apiKey
                        },
                        timeout: 10000
                    });

                    if (response.data) {
                        console.log('✅ QR Code obtido via fallback');
                        return response.data.qr || response.data.url || response.data;
                    }
                } catch (fallbackError) {
                    console.log(`   ❌ Fallback falhou: ${fallbackError.response?.status || fallbackError.message}`);
                }
            }

            throw new Error('Não foi possível obter QR Code');
        }
    }

    async exibirQRCode(qrData) {
        try {
            console.log('\n📱 QR CODE PARA CONECTAR:');
            console.log('========================');

            // Verificar se é uma imagem base64 (screenshot)
            if (typeof qrData === 'string' && qrData.startsWith('data:image')) {
                console.log('📸 Screenshot do QR Code detectado');

                // Salvar a imagem diretamente
                const base64Data = qrData.replace(/^data:image\/\w+;base64,/, '');
                const fs = require('fs');
                fs.writeFileSync('./qr-screenshot.png', base64Data, 'base64');
                console.log('💾 Screenshot salvo: qr-screenshot.png');

                console.log('\n📋 ABRA O ARQUIVO: qr-screenshot.png');
                console.log('📷 Escaneie o QR Code da imagem com o WhatsApp');

                // Tentar abrir automaticamente
                try {
                    const open = require('open');
                    await open('./qr-screenshot.png');
                    console.log('🖼️ Imagem aberta automaticamente');
                } catch (openError) {
                    console.log('ℹ️ Abra manualmente: qr-screenshot.png');
                }

            } else if (typeof qrData === 'string' && qrData.length > 20) {
                // É um QR code string normal
                console.log('📱 QR Code texto detectado');

                // Gerar QR no terminal
                const qrTerminal = await QRCode.toString(qrData, {
                    type: 'terminal',
                    small: true,
                    width: 60
                });
                console.log(qrTerminal);

                // Salvar como arquivo também
                await QRCode.toFile('./qr-whatsapp-cliente.png', qrData);
                console.log('\n💾 QR Code salvo: qr-whatsapp-cliente.png');

            } else {
                console.log('🔧 Dados QR não reconhecidos:');
                console.log(JSON.stringify(qrData, null, 2));
            }

            console.log('\n📋 INSTRUÇÕES PARA O CLIENTE:');
            console.log('1. 📱 Abra o WhatsApp no celular');
            console.log('2. ⚙️ Vá em Configurações');
            console.log('3. 🌐 Toque em "WhatsApp Web"');
            console.log('4. 📷 Escaneie o QR Code acima/imagem');
            console.log('5. ⏳ Aguarde a confirmação');

        } catch (error) {
            console.error('❌ Erro ao exibir QR:', error.message);
            console.log('\n🔧 Dados QR brutos:');
            console.log(JSON.stringify(qrData, null, 2));
        }
    }

    async monitorarConexao() {
        console.log('\n⏳ Aguardando escaneamento...');
        console.log('(Cliente tem 5 minutos para conectar)');

        let tentativas = 0;
        const maxTentativas = 60; // 5 minutos

        while (tentativas < maxTentativas) {
            try {
                const status = await this.verificarStatus();

                console.log(`📊 Status: ${status.status || 'UNKNOWN'} (${tentativas + 1}/${maxTentativas})`);

                if (status.status === 'WORKING' ||
                    status.status === 'AUTHENTICATED' ||
                    status.status === 'CONNECTED') {
                    return true;
                }

                if (status.status === 'FAILED' || status.status === 'STOPPED') {
                    console.log('❌ Sessão falhou, reiniciando...');
                    await this.iniciarSessao();
                }

            } catch (error) {
                console.log(`⚠️ Erro ao verificar: ${error.message}`);
            }

            await this.sleep(5000);
            tentativas++;
        }

        return false;
    }

    async verificarStatus() {
        const endpoints = [
            `/api/sessions/${this.sessionName}`,
            `/api/session/${this.sessionName}/status`,
            `/api/session/${this.sessionName}/state`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${this.wahaUrl}${endpoint}`, {
                    headers: {
                        'X-Api-Key': this.apiKey
                    }
                });
                return response.data;
            } catch (error) {
                continue;
            }
        }

        throw new Error('Não foi possível verificar status');
    }

    async testarEnvio() {
        try {
            console.log('\n🧪 Testando envio de mensagem...');

            const status = await this.verificarStatus();
            const numeroTeste = status.me?.id || '5566999999999';

            const mensagem = `🎉 WhatsApp conectado com sucesso!

✅ Sistema WAHA configurado
🤖 Automação ativada
🎯 Pronto para campanhas

🕐 Conectado: ${new Date().toLocaleString('pt-BR')}

Sistema da academia pronto para uso!`;

            const resultado = await this.enviarMensagem(numeroTeste, mensagem);

            if (resultado.success) {
                console.log('✅ Mensagem de teste enviada!');
                console.log(`📱 Para: ${numeroTeste}`);
            } else {
                console.log('⚠️ Teste de envio não realizado');
            }

        } catch (error) {
            console.log('ℹ️ Teste de envio ignorado:', error.message);
        }
    }

    async enviarMensagem(numero, texto) {
        try {
            const chatId = `${numero.replace(/\D/g, '')}@c.us`;

            const endpoints = [
                {
                    url: `/api/sendText`,
                    data: {
                        session: this.sessionName,
                        chatId: chatId,
                        text: texto
                    }
                },
                {
                    url: `/api/sessions/${this.sessionName}/chats/${chatId}/messages/text`,
                    data: { text: texto }
                }
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await axios.post(`${this.wahaUrl}${endpoint.url}`, endpoint.data, {
                        headers: {
                            'X-Api-Key': this.apiKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    return { success: true, data: response.data };
                } catch (error) {
                    continue;
                }
            }

            return { success: false, error: 'Nenhum endpoint funcionou' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Função principal
async function main() {
    console.log('🔥 CONECTANDO WHATSAPP DO CLIENTE');
    console.log('=================================');

    const conexao = new ConexaoImediataWhatsApp();
    const sucesso = await conexao.conectarAgora();

    if (sucesso) {
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('✅ WhatsApp conectado');
        console.log('🔧 Configure campanhas');
        console.log('🚀 Inicie automação N8N');
        console.log('\n💡 Sistema 100% operacional!');
    } else {
        console.log('\n❌ CONEXÃO NÃO CONCLUÍDA');
        console.log('🔄 Execute novamente se necessário');
        console.log('🆘 Suporte: Verifique WAHA e QR Code');
    }

    return sucesso;
}

// Executar se chamado diretamente
if (require.main === module) {
    main().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = ConexaoImediataWhatsApp;