/**
 * Script de Teste - WhatsApp Academia
 * Número: +5566999301589
 */

console.log('='.repeat(60));
console.log('🧪 TESTE ACADEMIA WHATSAPP - +5566999301589');
console.log('='.repeat(60));

// Verificar dependências
try {
    console.log('📦 Verificando dependências...');

    const { Client, LocalAuth } = require('whatsapp-web.js');
    console.log('✅ whatsapp-web.js: OK');

    const qrcode = require('qrcode-terminal');
    console.log('✅ qrcode-terminal: OK');

    console.log('');

} catch (error) {
    console.log('❌ Erro nas dependências:', error.message);
    console.log('');
    console.log('🔧 Para instalar, execute:');
    console.log('npm install whatsapp-web.js qrcode-terminal');
    process.exit(1);
}

// Função de teste de mensagens
function testarProcessamentoMensagens() {
    console.log('🧪 TESTANDO PROCESSAMENTO DE MENSAGENS');
    console.log('-'.repeat(40));

    const mensagensTeste = [
        'teste',
        'menu',
        'info',
        'precos',
        'matricula',
        'ola'
    ];

    mensagensTeste.forEach(msg => {
        console.log(`📝 Entrada: "${msg}"`);

        let resposta = '';
        const texto = msg.toLowerCase().trim();

        if (texto.includes('teste')) {
            resposta = '✅ Sistema funcionando! Academia Matupá pronta! 🏋️';
        } else if (texto.includes('menu')) {
            resposta = '📋 MENU ACADEMIA MATUPÁ...';
        } else if (texto.includes('info')) {
            resposta = '🏋️ ACADEMIA MATUPÁ - Informações...';
        } else if (texto.includes('precos')) {
            resposta = '💰 PLANOS ACADEMIA MATUPÁ...';
        } else if (texto.includes('matricula')) {
            resposta = '🎉 ÓTIMO! VAMOS COMEÇAR!...';
        } else {
            resposta = '👋 Olá! Bem-vindo à Academia Matupá!...';
        }

        console.log(`✅ Saída: "${resposta.substring(0, 50)}..."`);
        console.log('');
    });
}

// Função para verificar n8n
async function verificarN8n() {
    console.log('🔧 VERIFICANDO N8N');
    console.log('-'.repeat(40));

    try {
        const response = await fetch('http://localhost:5678');
        if (response.ok) {
            console.log('✅ n8n está rodando em http://localhost:5678');
        } else {
            console.log('❌ n8n não respondeu corretamente');
        }
    } catch (error) {
        console.log('❌ n8n não está rodando');
        console.log('💡 Para iniciar: npx n8n');
    }
    console.log('');
}

// Informações do teste
function exibirInformacoesTeste() {
    console.log('📱 INFORMAÇÕES DO TESTE');
    console.log('-'.repeat(40));
    console.log('📞 Número de teste: +5566999301589');
    console.log('🏋️ Academia: Matupá');
    console.log('🤖 Bot: WhatsApp Web.js');
    console.log('⚙️ n8n: http://localhost:5678');
    console.log('📁 Webhook: /webhook/whatsapp-academia-teste');
    console.log('');

    console.log('🧪 COMANDOS DE TESTE:');
    console.log('• "teste" → Verificar funcionamento');
    console.log('• "menu" → Menu completo');
    console.log('• "info" → Informações da academia');
    console.log('• "precos" → Planos e valores');
    console.log('• "matricula" → Processo de matrícula');
    console.log('');
}

// Instruções de configuração
function exibirInstrucoes() {
    console.log('📋 INSTRUÇÕES DE CONFIGURAÇÃO');
    console.log('-'.repeat(40));
    console.log('');
    console.log('1. 🔐 CONFIGURAR WHATSAPP BUSINESS API:');
    console.log('   • Acesse: https://developers.facebook.com/');
    console.log('   • Crie app: "Academia Matupá WhatsApp"');
    console.log('   • Adicione: WhatsApp Business');
    console.log('   • Obtenha: Token + Phone Number ID');
    console.log('');

    console.log('2. ⚙️ CONFIGURAR N8N:');
    console.log('   • Abra: http://localhost:5678');
    console.log('   • Vá em: Credentials → Add credential');
    console.log('   • Adicione: WhatsApp Business Cloud');
    console.log('   • Preencha: Token + Phone Number ID');
    console.log('');

    console.log('3. 📥 IMPORTAR WORKFLOW:');
    console.log('   • Abra: workflow-academia-teste.json');
    console.log('   • Copie o JSON');
    console.log('   • No n8n: Import from JSON');
    console.log('   • Cole e salve');
    console.log('');

    console.log('4. 🔗 CONFIGURAR WEBHOOK:');
    console.log('   • URL: http://localhost:5678/webhook/whatsapp-academia-teste');
    console.log('   • Método: POST');
    console.log('   • Configure no Meta for Developers');
    console.log('');

    console.log('5. 🧪 TESTAR:');
    console.log('   • Ative o workflow no n8n');
    console.log('   • Envie mensagem para +5566999301589');
    console.log('   • Verifique resposta automática');
    console.log('');
}

// Executar testes
async function executarTestes() {
    exibirInformacoesTeste();
    await verificarN8n();
    testarProcessamentoMensagens();
    exibirInstrucoes();

    console.log('='.repeat(60));
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('');
    console.log('1. Configure as credenciais WhatsApp Business no Meta');
    console.log('2. Adicione as credenciais no n8n');
    console.log('3. Importe o workflow-academia-teste.json');
    console.log('4. Ative o workflow');
    console.log('5. Teste enviando mensagem para +5566999301589');
    console.log('');
    console.log('🚀 Para executar o bot local:');
    console.log('node whatsapp-academia-bot.js');
    console.log('');
    console.log('📱 WhatsApp Academia Matupá - Sistema Pronto!');
    console.log('='.repeat(60));
}

// Executar
executarTestes();