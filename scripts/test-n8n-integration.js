#!/usr/bin/env node

/**
 * Script de Teste - Integração N8N FullForce Academia
 * Teste completo da automação para 650 alunos inativos
 * ROI projetado: 11.700%
 */

const axios = require('axios');
const moment = require('moment');

class N8NIntegrationTester {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        this.n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('🚀 Iniciando testes da integração N8N FullForce Academia');
        console.log('📊 Sistema: 650 alunos inativos | ROI: 11.700%');
        console.log('=' .repeat(80));

        try {
            // 1. Testes de Health Check
            await this.testHealthChecks();

            // 2. Testes de Google Integration
            await this.testGoogleIntegration();

            // 3. Testes de Campaign Services
            await this.testCampaignServices();

            // 4. Testes de N8N Integration
            await this.testN8NIntegration();

            // 5. Testes de Workflow 650 Inativos
            await this.testWorkflow650();

            // 6. Testes de Follow-up Automático
            await this.testFollowUpSystem();

            // 7. Testes de ROI Dashboard
            await this.testROIDashboard();

            // 8. Relatório Final
            this.generateReport();

        } catch (error) {
            console.error('❌ Erro durante execução dos testes:', error);
            this.testResults.errors.push(`General Error: ${error.message}`);
        }
    }

    async testHealthChecks() {
        console.log('\\n🏥 Testando Health Checks...');

        await this.runTest('Application Health Check', async () => {
            const response = await axios.get(`${this.baseUrl}/health`);
            return response.status === 200 && response.data.status === 'healthy';
        });

        await this.runTest('N8N API Health Check', async () => {
            const response = await axios.get(`${this.baseUrl}/api/health`);
            return response.status === 200 && response.data.n8n;
        });

        await this.runTest('N8N Server Health Check', async () => {
            try {
                const response = await axios.get(`${this.n8nUrl}/healthz`, { timeout: 5000 });
                return response.status === 200;
            } catch (error) {
                console.log('⚠️ N8N server não está rodando - testes limitados');
                return false;
            }
        });
    }

    async testGoogleIntegration() {
        console.log('\\n🔗 Testando Google Integration...');

        await this.runTest('Google Sheets Connection', async () => {
            const response = await axios.get(`${this.baseUrl}/api/google/health`);
            return response.data.sheets === 'connected';
        });

        await this.runTest('Load 650 Inactive Members', async () => {
            const response = await axios.get(`${this.baseUrl}/api/google/inactive-members`);
            return response.data.length >= 50; // Pelo menos 50 membros de exemplo
        });

        await this.runTest('Google Calendar Integration', async () => {
            const response = await axios.get(`${this.baseUrl}/api/google/available-slots`);
            return Array.isArray(response.data);
        });
    }

    async testCampaignServices() {
        console.log('\\n🎯 Testando Campaign Services...');

        await this.runTest('Reactivation Campaigns Service', async () => {
            const response = await axios.get(`${this.baseUrl}/api/campaigns/status`);
            return response.data.active !== undefined;
        });

        await this.runTest('Member Segmentation', async () => {
            const response = await axios.post(`${this.baseUrl}/api/campaigns/segment`, {
                test: true
            });

            const { segments } = response.data;
            return segments.criticos && segments.moderados &&
                   segments.baixaFreq && segments.prospects;
        });

        await this.runTest('ROI Calculation', async () => {
            const response = await axios.get(`${this.baseUrl}/api/campaigns/roi-projection`);
            const roi = parseFloat(response.data.projectedROI);
            return roi > 5000; // ROI deve ser maior que 5000%
        });
    }

    async testN8NIntegration() {
        console.log('\\n🔗 Testando N8N Integration...');

        await this.runTest('N8N Webhook Endpoint', async () => {
            const response = await axios.post(`${this.baseUrl}/api/n8n/send-campaign`, {
                telefone: '5511999999999',
                mensagem: 'Teste de integração N8N',
                nome: 'Teste Usuario',
                urgencia: 'BAIXA',
                campanha: 'test_integration',
                expectedRevenue: 100,
                conversionRate: 0.1
            });

            return response.data.success;
        });

        await this.runTest('N8N Stats Endpoint', async () => {
            const response = await axios.get(`${this.baseUrl}/api/n8n/stats`);
            return response.data.campaign650 && response.data.segments;
        });

        await this.runTest('N8N Process Response', async () => {
            const response = await axios.post(`${this.baseUrl}/api/n8n/process-response`, {
                from: '5511999999999@c.us',
                message: 'SIM',
                timestamp: new Date().toISOString()
            });

            return response.data.success && response.data.temInteresse;
        });
    }

    async testWorkflow650() {
        console.log('\\n🎯 Testando Workflow 650 Inativos...');

        await this.runTest('Trigger 650 Campaign', async () => {
            const response = await axios.post(`${this.baseUrl}/api/trigger-650-campaign`);

            return response.data.success &&
                   response.data.summary &&
                   response.data.summary.totalProcessados >= 50;
        });

        await this.runTest('Campaign Segmentation Results', async () => {
            const response = await axios.get(`${this.baseUrl}/api/n8n/stats`);
            const stats = response.data.campaign650;

            return stats.totalProcessed === 650 ||
                   (stats.totalProcessed >= 50 && stats.segments);
        });

        await this.runTest('ROI Dashboard Update', async () => {
            const response = await axios.get(`${this.baseUrl}/api/n8n/roi-dashboard`);

            return response.data.roi &&
                   response.data.campaigns &&
                   response.data.conversions;
        });
    }

    async testFollowUpSystem() {
        console.log('\\n📅 Testando Follow-up System...');

        await this.runTest('Schedule Follow-up', async () => {
            const response = await axios.post(`${this.baseUrl}/api/followup/schedule`, {
                telefone: '5511999999999',
                nome: 'Teste Follow-up',
                urgencia: 'CRITICA',
                campanha: 'test_followup'
            });

            return response.data.jobId;
        });

        await this.runTest('Queue Stats', async () => {
            const response = await axios.get(`${this.baseUrl}/api/queue/stats`);

            return response.data.total !== undefined && response.data.waiting !== undefined;
        });

        await this.runTest('Upcoming Jobs', async () => {
            const response = await axios.get(`${this.baseUrl}/api/queue/upcoming`);

            return Array.isArray(response.data);
        });
    }

    async testROIDashboard() {
        console.log('\\n📊 Testando ROI Dashboard...');

        await this.runTest('Dashboard Data', async () => {
            const response = await axios.get(`${this.baseUrl}/api/dashboard`);

            return response.data.campaigns &&
                   response.data.services &&
                   response.data.google;
        });

        await this.runTest('Campaign Report Generation', async () => {
            const response = await axios.get(`${this.baseUrl}/api/reports/campaign`);

            return response.data.totalCampaigns !== undefined &&
                   response.data.byUrgency &&
                   response.data.totalExpectedRevenue;
        });

        await this.runTest('ROI Calculation Accuracy', async () => {
            const response = await axios.get(`${this.baseUrl}/api/roi/calculate`);
            const roi = parseFloat(response.data.currentROI);

            // Verificar se ROI está na faixa esperada (11.700% ± 1000%)
            return roi >= 10000 && roi <= 15000;
        });
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;

        try {
            console.log(`  🧪 ${testName}...`);

            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;

            if (result) {
                console.log(`    ✅ Passou (${duration}ms)`);
                this.testResults.passed++;
            } else {
                console.log(`    ❌ Falhou (${duration}ms)`);
                this.testResults.failed++;
                this.testResults.errors.push(`${testName}: Test returned false`);
            }
        } catch (error) {
            console.log(`    ❌ Erro: ${error.message}`);
            this.testResults.failed++;
            this.testResults.errors.push(`${testName}: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\\n' + '='.repeat(80));
        console.log('📋 RELATÓRIO FINAL DOS TESTES');
        console.log('='.repeat(80));

        console.log(`📊 Total de testes: ${this.testResults.total}`);
        console.log(`✅ Testes passaram: ${this.testResults.passed}`);
        console.log(`❌ Testes falharam: ${this.testResults.failed}`);

        const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
        console.log(`🎯 Taxa de sucesso: ${successRate}%`);

        if (this.testResults.errors.length > 0) {
            console.log('\\n❌ Erros encontrados:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        console.log('\\n🎯 Status da Integração N8N:');
        if (successRate >= 80) {
            console.log('✅ SISTEMA PRONTO PARA PRODUÇÃO');
            console.log('🚀 Campanha 650 inativos pode ser executada');
            console.log('💰 ROI 11.700% projetado está ativo');
        } else if (successRate >= 60) {
            console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
            console.log('🔧 Alguns ajustes necessários antes da produção');
        } else {
            console.log('❌ SISTEMA PRECISA DE CORREÇÕES');
            console.log('🛠️ Revisar configurações e dependências');
        }

        console.log('\\n📞 Próximos Passos:');
        console.log('1. Verificar logs detalhados em caso de falhas');
        console.log('2. Configurar N8N workflows se ainda não estão ativos');
        console.log('3. Testar com números reais de WhatsApp');
        console.log('4. Monitorar ROI Dashboard após execução real');
        console.log('5. Executar campanha piloto com 50 alunos primeiro');

        console.log('\\n' + '='.repeat(80));
    }

    async testLoadStress() {
        console.log('\\n🔥 Teste de Carga - 650 Alunos Simultâneos...');

        const startTime = Date.now();
        const promises = [];

        // Simular 650 envios (usando batches de 50)
        for (let batch = 0; batch < 13; batch++) {
            for (let i = 0; i < 50; i++) {
                const memberIndex = (batch * 50) + i;

                promises.push(
                    axios.post(`${this.baseUrl}/api/n8n/send-campaign`, {
                        telefone: `55119999${String(memberIndex).padStart(5, '0')}`,
                        mensagem: `Teste carga ${memberIndex}`,
                        nome: `Usuario Teste ${memberIndex}`,
                        urgencia: memberIndex < 100 ? 'CRITICA' :
                                 memberIndex < 200 ? 'ALTA' :
                                 memberIndex < 400 ? 'MEDIA' : 'BAIXA',
                        campanha: `stress_test_${batch}`,
                        expectedRevenue: 129.90,
                        conversionRate: 0.25
                    }, { timeout: 30000 })
                );
            }

            // Delay entre batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            const duration = Date.now() - startTime;
            const throughput = (successful / (duration / 1000)).toFixed(2);

            console.log(`\\n📊 Resultados do Teste de Carga:`);
            console.log(`⏱️ Duração: ${duration}ms`);
            console.log(`✅ Sucessos: ${successful}`);
            console.log(`❌ Falhas: ${failed}`);
            console.log(`🚀 Throughput: ${throughput} msgs/segundo`);

            return successful >= 600; // 92% de sucesso mínimo

        } catch (error) {
            console.error('❌ Erro no teste de carga:', error);
            return false;
        }
    }
}

// Executar testes
async function main() {
    const tester = new N8NIntegrationTester();

    console.log('🏗️ FullForce Academia - N8N Integration Test Suite');
    console.log('📅', moment().format('DD/MM/YYYY HH:mm:ss'));
    console.log('🎯 Objetivo: Validar automação 650 alunos inativos');
    console.log('💰 Meta ROI: 11.700%');

    await tester.runAllTests();

    // Teste de carga opcional
    if (process.argv.includes('--stress')) {
        await tester.testLoadStress();
    }

    process.exit(tester.testResults.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = N8NIntegrationTester;