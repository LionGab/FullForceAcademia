const fs = require('fs');

// Carregar workflow original
const originalWorkflow = JSON.parse(fs.readFileSync('n8n-workflow-650-inactive-users.json', 'utf8'));

console.log('🔧 CORRIGINDO WORKFLOW N8N - Property Options');
console.log('='.repeat(50));

// Função para limpar options problemáticas
function cleanNodeOptions(node) {
    if (node.parameters && node.parameters.options) {
        const options = node.parameters.options;

        // Log das options encontradas
        console.log(`📝 Limpando options do node: ${node.name}`);
        console.log('   Options originais:', Object.keys(options));

        // Remover options problemáticas conhecidas
        const problematicOptions = [
            'noResponseBody',
            'headerRow',
            'raw',
            'timeout',
            'retry',
            'redirects'
        ];

        const cleanOptions = {};
        Object.keys(options).forEach(key => {
            if (!problematicOptions.includes(key)) {
                cleanOptions[key] = options[key];
            } else {
                console.log(`   ❌ Removendo option problemática: ${key}`);
            }
        });

        // Se não há options válidas, remover o campo
        if (Object.keys(cleanOptions).length === 0) {
            delete node.parameters.options;
            console.log('   ✅ Campo options removido completamente');
        } else {
            node.parameters.options = cleanOptions;
            console.log('   ✅ Options limpas:', Object.keys(cleanOptions));
        }
    }

    return node;
}

// Função para corrigir rules do Switch
function fixSwitchRules(node) {
    if (node.type === 'n8n-nodes-base.switch' && node.parameters.rules) {
        console.log(`🔀 Corrigindo rules do Switch: ${node.name}`);

        const rules = node.parameters.rules;
        if (rules.rules && Array.isArray(rules.rules)) {
            // Simplificar estrutura de rules
            node.parameters.rules = {
                values: rules.rules.map(rule => ({
                    conditions: {
                        string: [
                            {
                                value1: rule.value1 || '={{ $json.tipo }}',
                                operation: rule.operation || 'equal',
                                value2: rule.value2 || ''
                            }
                        ]
                    },
                    renameOutput: rule.renameOutput || false
                }))
            };
            console.log('   ✅ Rules corrigidas');
        }
    }
    return node;
}

// Função para simplificar columns do Google Sheets
function fixGoogleSheetsColumns(node) {
    if (node.type === 'n8n-nodes-base.googleSheets' && node.parameters.columns) {
        console.log(`📊 Corrigindo columns do Google Sheets: ${node.name}`);

        // Simplificar estrutura de columns
        if (node.parameters.columns.mappingMode) {
            node.parameters.columns = {
                mappingMode: 'autoMapInputData'
            };
            console.log('   ✅ Columns simplificadas para autoMapInputData');
        }
    }
    return node;
}

// Criar workflow corrigido
const fixedWorkflow = {
    ...originalWorkflow,
    nodes: originalWorkflow.nodes.map(node => {
        let fixedNode = { ...node };

        // Aplicar correções
        fixedNode = cleanNodeOptions(fixedNode);
        fixedNode = fixSwitchRules(fixedNode);
        fixedNode = fixGoogleSheetsColumns(fixedNode);

        // Garantir typeVersion compatível
        if (fixedNode.typeVersion > 3) {
            console.log(`📦 Reduzindo typeVersion de ${node.name}: ${fixedNode.typeVersion} → 3`);
            fixedNode.typeVersion = 3;
        }

        return fixedNode;
    })
};

// Remover campos que podem causar problemas
delete fixedWorkflow.pinData;
delete fixedWorkflow.versionId;

// Simplificar settings
fixedWorkflow.settings = {
    executionOrder: 'v1'
};

console.log('\n✅ CORREÇÕES APLICADAS:');
console.log('- Options problemáticas removidas');
console.log('- Rules do Switch simplificadas');
console.log('- Columns do Google Sheets corrigidas');
console.log('- TypeVersions reduzidas para compatibilidade');
console.log('- PinData e campos extras removidos');

// Salvar workflow corrigido
const fixedWorkflowPath = 'n8n-workflow-650-FIXED.json';
fs.writeFileSync(fixedWorkflowPath, JSON.stringify(fixedWorkflow, null, 2));

console.log(`\n🎯 WORKFLOW CORRIGIDO SALVO: ${fixedWorkflowPath}`);
console.log('📥 Use este arquivo para importar no N8N');

// Criar versão minimal para teste
const minimalWorkflow = {
    name: '🚀 FullForce Academia - MINIMAL VERSION',
    active: true,
    nodes: [
        {
            parameters: {
                mode: 'webhook',
                webhookId: 'fullforce-test'
            },
            name: 'Test Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [200, 200]
        },
        {
            parameters: {
                jsCode: 'return [{ message: "Webhook funcionando!", timestamp: new Date() }];'
            },
            name: 'Test Response',
            type: 'n8n-nodes-base.code',
            typeVersion: 1,
            position: [400, 200]
        }
    ],
    connections: {
        'Test Webhook': {
            main: [[{ node: 'Test Response', type: 'main', index: 0 }]]
        }
    },
    settings: {
        executionOrder: 'v1'
    }
};

fs.writeFileSync('n8n-workflow-MINIMAL-TEST.json', JSON.stringify(minimalWorkflow, null, 2));
console.log('🧪 WORKFLOW MINIMAL CRIADO: n8n-workflow-MINIMAL-TEST.json');
console.log('   Use para testar importação básica primeiro');

console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
console.log('Ordem de teste:');
console.log('1. n8n-workflow-MINIMAL-TEST.json (teste básico)');
console.log('2. n8n-workflow-650-FIXED.json (versão corrigida)');