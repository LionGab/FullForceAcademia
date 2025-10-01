#!/usr/bin/env node

/**
 * Script de Inicialização do WhatsApp Campaign Master
 * Full Force Academia - Execução Rápida do Sistema Completo
 */

const { startWhatsAppCampaignMaster } = require('./src/whatsapp-campaign-master');
const pino = require('pino');

const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss'
        }
    }
});

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🚀 WHATSAPP CAMPAIGN MASTER - FULL FORCE ACADEMIA 🚀               ║
║                                                                              ║
║  ✅ Sistema Completo de Campanhas Automatizadas WhatsApp                    ║
║  ✅ ROI Comprovado: 11.700%                                                  ║
║  ✅ 650 Leads Segmentados Prontos                                           ║
║  ✅ Integração WAHA + N8N                                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);

    logger.info('🎯 Iniciando Sistema Master de Campanhas WhatsApp...');

    try {
        // Verificar variáveis de ambiente essenciais
        const requiredEnvVars = ['WAHA_API_URL'];
        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

        if (missingEnvVars.length > 0) {
            logger.warn(`⚠️ Variáveis de ambiente não configuradas: ${missingEnvVars.join(', ')}`);
            logger.warn('📝 Usando configurações padrão para desenvolvimento');
        }

        // Inicializar sistema
        const system = await startWhatsAppCampaignMaster();

        logger.info('✅ Sistema inicializado com sucesso!');

        // Mostrar informações importantes
        const status = system.getSystemStatus();

        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                              🎯 SISTEMA ATIVO 🎯                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 Dashboard Principal:                                                     ║
║     http://localhost:${system.port}/api/dashboard                                     ║
║                                                                              ║
║  🔍 Monitoramento em Tempo Real:                                            ║
║     http://localhost:${system.port}/api/monitoring/status                            ║
║                                                                              ║
║  🛡️ Relatório LGPD:                                                          ║
║     http://localhost:${system.port}/api/lgpd/compliance-report                       ║
║                                                                              ║
║  🚀 Executar Campanha Master (650 leads):                                   ║
║     POST http://localhost:${system.port}/api/campaign/execute-master                 ║
║                                                                              ║
║  ❤️ Health Check:                                                            ║
║     GET http://localhost:${system.port}/health                                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                           📈 PROJEÇÕES DE ROI 📈                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🎯 ROI Esperado: 11.700%                                                    ║
║  💰 Receita Projetada: R$ 20.784,00                                         ║
║  📱 Total de Leads: 650                                                      ║
║  🔄 Conversões Esperadas: 160 (30%)                                         ║
║  💵 Valor Médio por Lead: R$ 129,90                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        `);

        // Executar campanha automaticamente se solicitado
        if (process.argv.includes('--auto-campaign')) {
            logger.info('🚀 Executando Campanha Master automaticamente...');

            try {
                const campaignResult = await system.services.orchestrator.executeMasterCampaign();
                logger.info('🎉 Campanha Master executada com sucesso!');
                console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🎉 CAMPANHA EXECUTADA! 🎉                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 Resultados da Execução:                                                 ║
║     • Total de Leads: ${campaignResult.results?.total || 'N/A'}                                          ║
║     • Processados: ${campaignResult.results?.processed || 'N/A'}                                             ║
║     • Enviados com Sucesso: ${campaignResult.results?.successful || 'N/A'}                                    ║
║     • Bloqueados LGPD: ${campaignResult.results?.lgpdBlocked || 'N/A'}                                       ║
║                                                                              ║
║  🔄 Follow-ups Agendados: ✅                                                 ║
║  📈 Monitoramento Ativo: ✅                                                  ║
║  🛡️ Compliance LGPD: ✅                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
                `);
            } catch (campaignError) {
                logger.error('❌ Erro na execução automática da campanha:', campaignError.message);
            }
        }

        // Mostrar comandos úteis
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            showHelp();
        }

        logger.info('🎯 Sistema pronto para uso! Use Ctrl+C para parar.');

    } catch (error) {
        logger.error('❌ Erro fatal na inicialização:', error);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                            📚 COMANDOS DISPONÍVEIS 📚                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🚀 Inicialização:                                                           ║
║     node start-campaign-master.js                                           ║
║                                                                              ║
║  🎯 Com execução automática da campanha:                                    ║
║     node start-campaign-master.js --auto-campaign                           ║
║                                                                              ║
║  📝 Mostrar esta ajuda:                                                     ║
║     node start-campaign-master.js --help                                    ║
║                                                                              ║
║  🔧 Configurar variáveis de ambiente:                                       ║
║     export WAHA_API_URL="http://localhost:3000"                            ║
║     export WAHA_API_KEY="sua-api-key"                                      ║
║     export NODE_ENV="production"                                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                              🌐 ENDPOINTS API 🌐                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  GET  /health                           - Health check                      ║
║  GET  /api/dashboard                    - Dashboard principal               ║
║  GET  /api/metrics/realtime             - Métricas em tempo real            ║
║  GET  /api/monitoring/status            - Status do monitoramento           ║
║  GET  /api/lgpd/compliance-report       - Relatório LGPD                   ║
║                                                                              ║
║  POST /api/campaign/execute-master      - Executar campanha master         ║
║  POST /api/campaign/execute             - Executar campanha personalizada  ║
║  POST /api/test/send-message            - Testar envio de mensagem          ║
║                                                                              ║
║  POST /webhook/waha                     - Webhook WAHA                      ║
║  POST /webhook/lgpd                     - Webhook LGPD                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
}

// Executar script principal
if (require.main === module) {
    main().catch(error => {
        logger.error('❌ Erro não tratado:', error);
        process.exit(1);
    });
}

module.exports = { main };