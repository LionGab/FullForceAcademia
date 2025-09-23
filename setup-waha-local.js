#!/usr/bin/env node

// SETUP WAHA LOCAL URGENTE - CONEXÃO WHATSAPP
// Configuração rápida do WAHA local para conectar WhatsApp do cliente

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SetupWAHALocal {
    constructor() {
        this.dockerImage = 'devlikeapro/waha';
        this.containerName = 'waha-academia';
        this.port = 3000;
        this.apiKey = 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';

        console.log('🚀 SETUP WAHA LOCAL - CONEXÃO URGENTE');
        console.log('====================================');
    }

    async executarSetup() {
        try {
            console.log('\n⚡ PASSO 1: Verificando Docker...');
            await this.verificarDocker();

            console.log('\n⚡ PASSO 2: Parando containers antigos...');
            await this.pararContainerExistente();

            console.log('\n⚡ PASSO 3: Iniciando WAHA...');
            await this.iniciarWAHA();

            console.log('\n⚡ PASSO 4: Aguardando inicialização...');
            await this.aguardarWAHA();

            console.log('\n⚡ PASSO 5: Criando script de conexão...');
            await this.criarScriptConexao();

            console.log('\n✅ WAHA LOCAL CONFIGURADO!');
            console.log('\n🎯 PRÓXIMO PASSO: Execute o script de conexão');
            console.log('   node conectar-whatsapp-local.js');

            return true;

        } catch (error) {
            console.error('❌ ERRO NO SETUP:', error.message);
            await this.configurarAlternativo();
            return false;
        }
    }

    async verificarDocker() {
        return new Promise((resolve, reject) => {
            exec('docker --version', (error, stdout) => {
                if (error) {
                    reject(new Error('Docker não instalado. Instale Docker Desktop primeiro.'));
                } else {
                    console.log('✅ Docker disponível:', stdout.trim());
                    resolve(true);
                }
            });
        });
    }

    async pararContainerExistente() {
        return new Promise((resolve) => {
            exec(`docker stop ${this.containerName}`, () => {
                exec(`docker rm ${this.containerName}`, () => {
                    console.log('✅ Containers antigos removidos');
                    resolve(true);
                });
            });
        });
    }

    async iniciarWAHA() {
        return new Promise((resolve, reject) => {
            const dockerCmd = [
                'run', '-d',
                '--name', this.containerName,
                '-p', `${this.port}:3000`,
                '-e', `WHATSAPP_API_KEY=${this.apiKey}`,
                '-e', 'WHATSAPP_DEFAULT_ENGINE=WEBJS',
                '-e', 'WHATSAPP_SWAGGER_CONFIG_ADVANCED=true',
                '-v', 'waha_data:/app/data',
                this.dockerImage
            ];

            console.log('🚀 Iniciando container WAHA...');
            console.log(`📦 Comando: docker ${dockerCmd.join(' ')}`);

            const docker = spawn('docker', dockerCmd);

            docker.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Container WAHA iniciado');
                    resolve(true);
                } else {
                    reject(new Error(`Docker falhou com código: ${code}`));
                }
            });

            docker.stderr.on('data', (data) => {
                console.log('ℹ️ Docker:', data.toString());
            });

            // Timeout de 30 segundos
            setTimeout(() => resolve(true), 30000);
        });
    }

    async aguardarWAHA() {
        const axios = require('axios');
        let tentativas = 0;
        const maxTentativas = 20;

        while (tentativas < maxTentativas) {
            try {
                const response = await axios.get(`http://localhost:${this.port}/api/health`, {
                    timeout: 5000
                });

                if (response.status === 200) {
                    console.log('✅ WAHA respondendo');
                    return true;
                }
            } catch (error) {
                console.log(`⏳ Aguardando WAHA... (${tentativas + 1}/${maxTentativas})`);
            }

            await this.sleep(3000);
            tentativas++;
        }

        throw new Error('WAHA não iniciou em tempo hábil');
    }

    async criarScriptConexao() {
        const scriptConexao = `#!/usr/bin/env node

// CONEXÃO WHATSAPP LOCAL - SCRIPT AUTOMÁTICO
const axios = require('axios');
const QRCode = require('qrcode');

class ConexaoWhatsAppLocal {
    constructor() {
        this.wahaUrl = 'http://localhost:${this.port}';
        this.apiKey = '${this.apiKey}';
        this.sessionName = 'cliente-academia';
    }

    async conectar() {
        try {
            console.log('🚀 CONECTANDO WHATSAPP LOCAL');
            console.log('============================');

            // 1. Criar sessão
            await this.criarSessao();

            // 2. Iniciar sessão
            await this.iniciarSessao();

            // 3. Obter QR Code
            const qr = await this.obterQR();

            // 4. Exibir QR
            await this.exibirQR(qr);

            // 5. Monitorar
            await this.monitorarConexao();

        } catch (error) {
            console.error('❌ ERRO:', error.message);
        }
    }

    async criarSessao() {
        try {
            const response = await axios.post(\`\${this.wahaUrl}/api/sessions\`, {
                name: this.sessionName,
                config: {
                    webhooks: []
                }
            }, {
                headers: { 'X-Api-Key': this.apiKey }
            });
            console.log('✅ Sessão criada');
        } catch (error) {
            console.log('ℹ️ Sessão já existe');
        }
    }

    async iniciarSessao() {
        try {
            await axios.post(\`\${this.wahaUrl}/api/sessions/\${this.sessionName}/start\`, {}, {
                headers: { 'X-Api-Key': this.apiKey }
            });
            console.log('✅ Sessão iniciada');
        } catch (error) {
            console.log('ℹ️ Sessão já iniciada');
        }
    }

    async obterQR() {
        await this.sleep(5000);
        const response = await axios.get(\`\${this.wahaUrl}/api/sessions/\${this.sessionName}/auth/qr\`, {
            headers: { 'X-Api-Key': this.apiKey }
        });
        return response.data.qr;
    }

    async exibirQR(qrText) {
        console.log('\\n📱 ESCANEIE O QR CODE:');
        console.log('======================');
        const qr = await QRCode.toString(qrText, { type: 'terminal' });
        console.log(qr);
        console.log('\\n📋 INSTRUÇÕES:');
        console.log('1. Abra WhatsApp no celular');
        console.log('2. Configurações > WhatsApp Web');
        console.log('3. Escaneie o código acima');
    }

    async monitorarConexao() {
        console.log('\\n⏳ Aguardando conexão...');
        for (let i = 0; i < 60; i++) {
            try {
                const response = await axios.get(\`\${this.wahaUrl}/api/sessions/\${this.sessionName}\`, {
                    headers: { 'X-Api-Key': this.apiKey }
                });

                if (response.data.status === 'WORKING') {
                    console.log('\\n🎉 WHATSAPP CONECTADO!');
                    console.log('✅ Pronto para uso');
                    return true;
                }
                console.log(\`⏳ Status: \${response.data.status}\`);
            } catch (error) {
                console.log('⚠️ Verificando...');
            }
            await this.sleep(5000);
        }
        console.log('⏰ Timeout na conexão');
        return false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

if (require.main === module) {
    const conexao = new ConexaoWhatsAppLocal();
    conexao.conectar();
}`;

        fs.writeFileSync('./conectar-whatsapp-local.js', scriptConexao);
        console.log('✅ Script de conexão criado: conectar-whatsapp-local.js');
    }

    async configurarAlternativo() {
        console.log('\n🔧 CONFIGURAÇÃO ALTERNATIVA SEM DOCKER');
        console.log('======================================');

        const alternativo = `#!/usr/bin/env node

// SIMULADOR WHATSAPP - MODO DESENVOLVIMENTO
console.log('🎭 MODO SIMULAÇÃO WHATSAPP');
console.log('=========================');
console.log('');
console.log('📱 WhatsApp "conectado" em modo simulação');
console.log('✅ Sistema configurado para desenvolvimento');
console.log('🔧 Para produção real, configure WAHA com Docker');
console.log('');
console.log('🎯 Próximos passos:');
console.log('1. Instale Docker Desktop');
console.log('2. Execute: node setup-waha-local.js');
console.log('3. Configure WhatsApp real');
console.log('');
console.log('💡 Por enquanto, use o sistema N8N para testes');`;

        fs.writeFileSync('./simulador-whatsapp.js', alternativo);
        console.log('📝 Criado simulador: simulador-whatsapp.js');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar setup
if (require.main === module) {
    const setup = new SetupWAHALocal();
    setup.executarSetup();
}

module.exports = SetupWAHALocal;