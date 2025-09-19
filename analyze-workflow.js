const fs = require('fs');

try {
    const workflow = JSON.parse(fs.readFileSync('n8n-workflow-650-inactive-users.json', 'utf8'));

    console.log('🔍 ANALISANDO WORKFLOW N8N');
    console.log('='.repeat(40));

    // Verificar estrutura básica
    console.log('Nome:', workflow.name);
    console.log('Nodes:', workflow.nodes?.length || 0);
    console.log('Connections:', Object.keys(workflow.connections || {}).length);
    console.log('Active:', workflow.active);
    console.log();

    // Verificar nodes problemáticos
    console.log('📋 NODES DETALHADOS:');
    workflow.nodes?.forEach((node, index) => {
        console.log(`${index + 1}. ${node.name} (${node.type})`);

        // Verificar se há credentials
        if (node.credentials) {
            console.log('   Credentials:', Object.keys(node.credentials));
        }

        // Verificar parameters problemáticos
        if (node.parameters) {
            Object.keys(node.parameters).forEach(param => {
                const value = node.parameters[param];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    console.log(`   - ${param}: [object with keys: ${Object.keys(value).join(', ')}]`);
                } else if (Array.isArray(value)) {
                    console.log(`   - ${param}: [array with ${value.length} items]`);
                } else if (typeof value === 'string' && value.length > 100) {
                    console.log(`   - ${param}: [long string - ${value.length} chars]`);
                } else {
                    console.log(`   - ${param}: ${value}`);
                }
            });
        }

        // Verificar typeVersion
        if (node.typeVersion) {
            console.log(`   TypeVersion: ${node.typeVersion}`);
        }

        console.log();
    });

    // Verificar se há settings globais
    if (workflow.settings) {
        console.log('⚙️ SETTINGS:', JSON.stringify(workflow.settings, null, 2));
    }

    // Verificar pinData
    if (workflow.pinData) {
        console.log('📌 PIN DATA:', Object.keys(workflow.pinData));
    }

} catch (error) {
    console.error('❌ Erro ao analisar workflow:', error.message);
}