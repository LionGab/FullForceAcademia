// N8N Cloud Campaign Executor for FFMATUPA Fitness Academy
// Integrates local WAHA API with n8n cloud workflows

const axios = require('axios');
const N8nCloudIntegration = require('./n8n-cloud-integration');

class CampanhaN8nCloud {
    constructor() {
        this.n8nIntegration = new N8nCloudIntegration();
        this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        this.wahaApiKey = process.env.WAHA_API_KEY || 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';
        this.bridgeUrl = process.env.BRIDGE_URL || 'http://localhost:3001';

        this.startTime = new Date();
        this.stats = {
            enviadas: 0,
            respostas: 0,
            conversoes: 0,
            receita: 0,
            erros: 0
        };

        this.config = {
            precoPromocional: 149,
            duracaoMeses: 3,
            vagasLimitadas: 3,
            respostaEsperada: 'QUERO MINHA VAGA'
        };
    }

    async verificarServicos() {
        console.log('🔍 Verificando serviços...');

        const services = {
            waha: false,
            n8nCloud: false,
            bridge: false
        };

        try {
            // Verificar WAHA
            const wahaResponse = await axios.get(`${this.wahaUrl}/api/status`, { timeout: 5000 });
            services.waha = true;
            console.log('✅ WAHA service disponível');
        } catch (error) {
            console.log('⚠️ WAHA service indisponível');
        }

        try {
            // Verificar N8N Cloud via teste de conectividade
            await this.n8nIntegration.testN8nCloudConnectivity();
            services.n8nCloud = true;
            console.log('✅ N8N Cloud disponível');
        } catch (error) {
            console.log('⚠️ N8N Cloud indisponível');
        }

        try {
            // Verificar Bridge
            const bridgeResponse = await axios.get(`${this.bridgeUrl}/health`, { timeout: 5000 });
            services.bridge = true;
            console.log('✅ WAHA-N8N Bridge disponível');
        } catch (error) {
            console.log('⚠️ WAHA-N8N Bridge indisponível');
        }

        return services;
    }

    async enviarLeadParaN8n(leadData) {
        try {
            console.log(`📤 Enviando lead ${leadData.phone} para n8n cloud...`);

            const result = await this.n8nIntegration.sendLeadToN8nCloud(leadData);

            if (result.success) {
                this.stats.enviadas++;
                console.log(`✅ Lead ${leadData.phone} enviado com sucesso`);
                return { success: true, leadId: result.leadId };
            } else {
                throw new Error('N8N cloud returned error');
            }

        } catch (error) {
            console.log(`❌ Erro enviando lead ${leadData.phone}: ${error.message}`);
            this.stats.erros++;
            return { success: false, error: error.message };
        }
    }

    async enviarViaBridge(leadData) {
        try {
            console.log(`📤 Enviando lead ${leadData.phone} via bridge...`);

            const response = await axios.post(`${this.bridgeUrl}/api/inject-lead`, leadData, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            this.stats.enviadas++;
            console.log(`✅ Lead ${leadData.phone} enviado via bridge`);
            return { success: true, data: response.data };

        } catch (error) {
            console.log(`❌ Erro enviando via bridge ${leadData.phone}: ${error.message}`);
            this.stats.erros++;
            return { success: false, error: error.message };
        }
    }

    gerarMembrosParaTeste(quantidade = 20) {
        const nomes = [
            'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Ferreira',
            'Lucia Costa', 'Pedro Almeida', 'Fernanda Lima', 'Roberto Souza',
            'Patricia Rocha', 'André Martins', 'Camila Barbosa', 'Ricardo Pereira'
        ];

        const membros = [];

        for (let i = 0; i < quantidade; i++) {
            const nome = nomes[Math.floor(Math.random() * nomes.length)];
            const sobrenome = `${Math.floor(Math.random() * 999) + 1}`;
            const diasInativo = Math.floor(Math.random() * 150) + 30;

            const dataInatividade = new Date();
            dataInatividade.setDate(dataInatividade.getDate() - diasInativo);

            membros.push({
                source: 'inactive_members',
                name: `${nome} ${sobrenome}`,
                phone: `5566${(999000000 + i).toString()}`,
                email: `${nome.toLowerCase().replace(' ', '')}${i}@email.com`,
                last_activity: dataInatividade.toISOString().split('T')[0],
                diasInativo,
                segment: diasInativo > 60 ? 'hot' : 'cold',
                message: 'Membro inativo da academia',
                interest: 'reativacao'
            });
        }

        return membros;
    }

    async processarLoteN8n(lote, numeroLote, totalLotes, metodo = 'direto') {
        console.log(`\n📦 Processando lote ${numeroLote}/${totalLotes} (${lote.length} membros) - Método: ${metodo}`);

        const resultados = await Promise.allSettled(
            lote.map(async (membro) => {
                if (metodo === 'bridge') {
                    return await this.enviarViaBridge(membro);
                } else {
                    return await this.enviarLeadParaN8n(membro);
                }
            })
        );

        const sucessos = resultados.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`📊 Lote ${numeroLote}: ${sucessos}/${lote.length} enviadas para n8n cloud`);

        return resultados;
    }

    async executarCampanhaN8nCloud() {
        console.log('🚀 CAMPANHA FFMATUPA - INTEGRAÇÃO N8N CLOUD');
        console.log('============================================');
        console.log(`📅 Iniciado em: ${this.startTime.toLocaleString('pt-BR')}`);

        try {
            // 1. Verificar serviços
            const services = await this.verificarServicos();

            if (!services.n8nCloud) {
                throw new Error('N8N Cloud não está acessível');
            }

            // Decidir método de envio
            const metodo = services.bridge ? 'bridge' : 'direto';
            console.log(`📡 Método de envio: ${metodo}`);

            // 2. Gerar dados dos membros para teste
            console.log('\n📊 Gerando dados de membros para teste...');
            const membros = this.gerarMembrosParaTeste(50); // Menor quantidade para teste

            const segmentacao = membros.reduce((acc, m) => {
                acc[m.segment]++;
                return acc;
            }, { hot: 0, cold: 0 });

            console.log(`✅ ${membros.length} membros gerados`);
            console.log(`🔥 Segmento quente: ${segmentacao.hot} (>60 dias)`);
            console.log(`❄️ Segmento frio: ${segmentacao.cold} (30-60 dias)`);

            // 3. Processar em lotes menores para n8n cloud
            const tamanhoLote = 5; // Lotes menores para não sobrecarregar n8n cloud
            const totalLotes = Math.ceil(membros.length / tamanhoLote);

            console.log(`\n📦 Processando em ${totalLotes} lotes de ${tamanhoLote} membros`);

            for (let i = 0; i < membros.length; i += tamanhoLote) {
                const lote = membros.slice(i, i + tamanhoLote);
                const numeroLote = Math.floor(i / tamanhoLote) + 1;

                await this.processarLoteN8n(lote, numeroLote, totalLotes, metodo);

                // Pausa maior entre lotes para n8n cloud
                if (numeroLote < totalLotes) {
                    console.log('⏳ Pausa de 10 segundos...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }

            // 4. Monitorar respostas via n8n cloud
            console.log('\n👀 Iniciando monitoramento de respostas via n8n cloud...');
            await this.iniciarMonitoramentoN8n();

            // 5. Simular algumas respostas para demonstração
            setTimeout(() => {
                this.simularRespostasN8n(membros.slice(0, 10));
            }, 30000);

            // 6. Relatório final
            setTimeout(() => {
                this.gerarRelatorioFinal();
            }, 120000); // 2 minutos

            return {
                status: 'executando',
                metodo,
                stats: this.stats,
                services
            };

        } catch (error) {
            console.error('\n❌ ERRO NA CAMPANHA N8N CLOUD:', error.message);
            throw error;
        }
    }

    async iniciarMonitoramentoN8n() {
        console.log('👀 Monitoramento via n8n cloud iniciado');

        // Simular monitoramento (na implementação real seria via webhooks n8n)
        setInterval(() => {
            console.log(`📊 Stats: ${this.stats.enviadas} enviadas, ${this.stats.respostas} respostas, ${this.stats.conversoes} conversões`);
        }, 60000);
    }

    async simularRespostasN8n(membros) {
        console.log('\n🤖 Simulando respostas via n8n cloud...');

        const respostas = [
            'QUERO MINHA VAGA',
            'Quero minha vaga!',
            'Tenho interesse',
            'Me conta mais',
            'Quanto custa?'
        ];

        for (let i = 0; i < Math.min(5, membros.length); i++) {
            const membro = membros[i];
            const resposta = respostas[Math.floor(Math.random() * respostas.length)];

            try {
                // Simular resposta via n8n cloud
                const messageData = {
                    phone: membro.phone,
                    name: membro.name,
                    message: resposta,
                    messageId: `msg_sim_${Date.now()}_${i}`
                };

                await this.n8nIntegration.sendWhatsAppResponseToN8n(messageData);

                this.stats.respostas++;

                if (resposta.toLowerCase().includes('quero minha vaga')) {
                    this.stats.conversoes++;
                    this.stats.receita += this.config.precoPromocional * this.config.duracaoMeses;
                }

                console.log(`📱 Resposta simulada: ${membro.phone} - "${resposta}"`);

                await new Promise(resolve => setTimeout(resolve, 5000));

            } catch (error) {
                console.error(`❌ Erro simulando resposta de ${membro.phone}:`, error.message);
            }
        }
    }

    async gerarRelatorioFinal() {
        const endTime = new Date();
        const tempoExecucao = Math.floor((endTime - this.startTime) / 1000 / 60);

        console.log('\n📊 RELATÓRIO FINAL - CAMPANHA N8N CLOUD');
        console.log('========================================');
        console.log(`📅 Finalizada em: ${endTime.toLocaleString('pt-BR')}`);
        console.log(`⏱️ Tempo total: ${tempoExecucao} minutos`);

        console.log('\n📈 RESULTADOS N8N CLOUD:');
        console.log(`📤 Leads enviados para n8n: ${this.stats.enviadas}`);
        console.log(`📨 Respostas processadas: ${this.stats.respostas}`);
        console.log(`🎯 Conversões obtidas: ${this.stats.conversoes}`);
        console.log(`💰 Receita gerada: R$ ${this.stats.receita.toLocaleString('pt-BR')}`);
        console.log(`❌ Erros: ${this.stats.erros}`);

        // Calcular métricas
        const taxaResposta = this.stats.enviadas > 0 ? (this.stats.respostas / this.stats.enviadas * 100).toFixed(2) : 0;
        const taxaConversao = this.stats.enviadas > 0 ? (this.stats.conversoes / this.stats.enviadas * 100).toFixed(2) : 0;

        console.log('\n📊 MÉTRICAS N8N CLOUD:');
        console.log(`📈 Taxa de resposta: ${taxaResposta}%`);
        console.log(`🎯 Taxa de conversão: ${taxaConversao}%`);

        console.log('\n🎯 VANTAGENS N8N CLOUD:');
        console.log('✅ Processamento em cloud escalável');
        console.log('✅ Workflows visuais e editáveis');
        console.log('✅ Integração nativa com APIs');
        console.log('✅ Monitoramento em tempo real');
        console.log('✅ Análise avançada com IA');

        return {
            taxaResposta,
            taxaConversao,
            stats: this.stats,
            platform: 'n8n_cloud'
        };
    }

    async testarConectividadeCompleta() {
        console.log('\n🧪 TESTE COMPLETO DE CONECTIVIDADE');
        console.log('===================================');

        try {
            // 1. Teste N8N Cloud direto
            console.log('\n1. Testando n8n cloud direto...');
            await this.n8nIntegration.testN8nCloudConnectivity();

            // 2. Teste via Bridge (se disponível)
            try {
                console.log('\n2. Testando via bridge...');
                const bridgeTest = await axios.post(`${this.bridgeUrl}/api/test-n8n`, {}, { timeout: 10000 });
                console.log('✅ Bridge test passed:', bridgeTest.data.status);
            } catch (error) {
                console.log('⚠️ Bridge test failed:', error.message);
            }

            // 3. Teste WAHA
            try {
                console.log('\n3. Testando WAHA...');
                const wahaStatus = await axios.get(`${this.wahaUrl}/api/status`, { timeout: 5000 });
                console.log('✅ WAHA conectado');
            } catch (error) {
                console.log('⚠️ WAHA desconectado:', error.message);
            }

            console.log('\n✅ Teste de conectividade concluído');

        } catch (error) {
            console.error('\n❌ Teste de conectividade falhou:', error.message);
            throw error;
        }
    }
}

// Execução principal
async function main() {
    const campanha = new CampanhaN8nCloud();

    try {
        const modo = process.argv[2] || 'teste';

        console.log('🎯 CAMPANHA FFMATUPA ACADEMY - N8N CLOUD');
        console.log('=========================================');
        console.log('💪 Integração: WAHA local + N8N Cloud');
        console.log('📊 Objetivo: Automatização escalável');

        switch (modo) {
            case 'conectividade':
                await campanha.testarConectividadeCompleta();
                break;

            case 'producao':
                console.log('\n🚀 Modo: Produção com n8n cloud');
                await campanha.executarCampanhaN8nCloud();
                break;

            case 'teste':
            default:
                console.log('\n🧪 Modo: Teste de conectividade');
                await campanha.testarConectividadeCompleta();
                await campanha.executarCampanhaN8nCloud();
                break;
        }

        console.log('\n✅ Campanha N8N Cloud executada com sucesso!');

    } catch (error) {
        console.error('\n❌ ERRO NA CAMPANHA N8N CLOUD:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = CampanhaN8nCloud;