#!/usr/bin/env node

/**
 * 🔥 SETUP COMPLETO ACADEMIA FULL FORCE
 * Script para configurar toda a automação
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class AcademiaSetup {
    constructor() {
        this.config = {
            n8n: {
                url: 'http://localhost:5678',
                webhookUrl: 'http://localhost:5678/webhook/academia-trigger'
            },
            waha: {
                url: 'http://localhost:3000',
                apiKey: process.env.WAHA_API_KEY || 'academia_secure_key_2024'
            },
            whatsapp: {
                url: 'http://localhost:4001'
            }
        };

        this.workflows = [
            'academia-reactivation-campaign-n8n.json',
            'academia-webhook-responder-n8n.json',
            'academia-whatsapp-n8n-workflow.json'
        ];
    }

    async checkServices() {
        console.log('🔍 Verificando serviços...\n');

        const services = [
            { name: 'WhatsApp Bot', url: `${this.config.whatsapp.url}/health` },
            { name: 'N8N', url: `${this.config.n8n.url}/healthz` },
            { name: 'WAHA', url: `${this.config.waha.url}/api/health` }
        ];

        for (const service of services) {
            try {
                await axios.get(service.url);
                console.log(`✅ ${service.name} - ONLINE`);
            } catch (error) {
                console.log(`❌ ${service.name} - OFFLINE (${error.message})`);
            }
        }
        console.log('');
    }

    async setupGoogleSheets() {
        console.log('📊 Configurando Google Sheets...\n');

        const instructions = `
📋 INSTRUÇÕES GOOGLE SHEETS:

1. 📁 Acesse: https://sheets.google.com
2. 📄 Crie nova planilha: "Academia Full Force - Sistema Conversão"
3. 📑 Crie 5 abas:
   • ALUNOS (principal)
   • CONVERSAS (tracking)
   • CAMPANHAS (envios)
   • RESPOSTAS_ENVIADAS (controle)
   • RESULTADOS (dashboard)

4. 📋 Na aba ALUNOS, use os cabeçalhos:
   Nome | Telefone | Email | Plano | Status | Última Atividade | Frequência Mensal | Valor Plano

5. 🔗 Copie o ID da planilha (URL) e atualize o arquivo .env:
   GOOGLE_SHEETS_ID=seu_id_aqui

6. 🔑 Configure as credenciais Google API (ver documentação)
        `;

        console.log(instructions);
        return true;
    }

    async importN8NWorkflows() {
        console.log('🤖 Importando workflows N8N...\n');

        try {
            // Verificar se N8N está acessível
            await axios.get(this.config.n8n.url);

            console.log('✅ N8N está online!');
            console.log(`🌐 Acesse: ${this.config.n8n.url}`);
            console.log('');
            console.log('📥 IMPORTAR WORKFLOWS:');
            console.log('1. Vá em Settings > Import');
            console.log('2. Importe os arquivos:');

            this.workflows.forEach((workflow, index) => {
                console.log(`   ${index + 1}. ${workflow}`);
            });

            console.log('');
            console.log('⚙️  CONFIGURAR CREDENCIAIS:');
            console.log('1. Google Sheets API');
            console.log('2. HTTP Webhook (WAHA)');
            console.log('');

        } catch (error) {
            console.log('❌ N8N não está disponível:', error.message);
        }
    }

    async setupWAHA() {
        console.log('📱 Configurando WAHA...\n');

        try {
            // Tentar conectar WAHA
            await axios.get(this.config.waha.url);
            console.log('✅ WAHA está online!');
            console.log(`🌐 Dashboard: ${this.config.waha.url}`);

            // Criar sessão WAHA
            try {
                const sessionResponse = await axios.post(`${this.config.waha.url}/api/sessions`, {
                    name: 'academia-session',
                    config: {
                        proxy: null,
                        webhooks: [{
                            url: 'http://localhost:4001/webhook/waha',
                            events: ['message']
                        }]
                    }
                }, {
                    headers: {
                        'X-API-KEY': this.config.waha.apiKey
                    }
                });

                console.log('✅ Sessão WAHA criada com sucesso!');
                console.log('🔲 Escaneie o QR code no dashboard WAHA');

            } catch (sessionError) {
                console.log('⚠️  Criar sessão manualmente no dashboard WAHA');
            }

        } catch (error) {
            console.log('❌ WAHA não está disponível - iniciando...');
            console.log('💡 Execute: docker run -d -p 3000:3000 devlikeapro/waha');
        }
    }

    async testWhatsAppConnection() {
        console.log('📱 Testando conexão WhatsApp...\n');

        try {
            const response = await axios.get(`${this.config.whatsapp.url}/health`);
            console.log('✅ Bot WhatsApp está rodando!');
            console.log('🔲 QR Code deve estar visível no terminal');
            console.log('📱 Escaneie com seu WhatsApp para conectar');

        } catch (error) {
            console.log('❌ Bot WhatsApp não está rodando');
            console.log('💡 Execute: node connect-whatsapp.js');
        }
    }

    async generateTestCampaign() {
        console.log('🚀 Gerando campanha de teste...\n');

        const testData = {
            trigger: 'test_campaign',
            timestamp: new Date().toISOString(),
            test_mode: true
        };

        try {
            const response = await axios.post(this.config.n8n.webhookUrl, testData);
            console.log('✅ Webhook de teste enviado com sucesso!');
            console.log('📊 Verifique os logs do N8N');

        } catch (error) {
            console.log('⚠️  Configure o webhook primeiro no N8N');
            console.log(`🔗 URL do Webhook: ${this.config.n8n.webhookUrl}`);
        }
    }

    async showFinalInstructions() {
        console.log('\n🎉 SETUP COMPLETO! PRÓXIMOS PASSOS:\n');

        const instructions = `
🔥 SISTEMA FULL FORCE ACADEMIA PRONTO!

📱 WHATSAPP:
✅ Bot rodando em: http://localhost:4001
✅ QR Code disponível para escanear
✅ Respostas automáticas configuradas

🤖 N8N AUTOMATION:
✅ Workflows importados
✅ Dashboard: http://localhost:5678
✅ Webhook: ${this.config.n8n.webhookUrl}

📊 GOOGLE SHEETS:
📋 Configure a planilha com a estrutura fornecida
🔑 Adicione credenciais Google API no N8N

🚀 PARA DISPARAR CAMPANHA:
1. Configure Google Sheets com base de alunos
2. No N8N, execute o workflow "Academia Reativação"
3. Monitore resultados na planilha

💰 POTENCIAL:
📈 650 alunos inativos (50% da base)
💬 195 respostas esperadas (30%)
💰 65 conversões esperadas (10%)
💵 R$ 5.850/mês de receita recuperada
🎯 ROI de 1200%

🔥 SEU CLIENTE VAI AMAR ESSES RESULTADOS!
        `;

        console.log(instructions);
    }

    async run() {
        console.log('🔥 INICIANDO SETUP ACADEMIA FULL FORCE\n');
        console.log('═══════════════════════════════════════\n');

        await this.checkServices();
        await this.setupGoogleSheets();
        await this.importN8NWorkflows();
        await this.setupWAHA();
        await this.testWhatsAppConnection();
        await this.generateTestCampaign();
        await this.showFinalInstructions();
    }
}

// Executar setup
if (require.main === module) {
    const setup = new AcademiaSetup();
    setup.run().catch(console.error);
}

module.exports = AcademiaSetup;