const fs = require('fs');
const path = require('path');

/**
 * Script para importar workflows no N8N automaticamente
 * Execute este script depois de acessar o N8N no navegador
 */

// Workflows para importar
const workflows = [
  '01-campanha-reativacao-academia.json',
  '02-segmentacao-membros.json',
  '03-analytics-campanhas.json',
  '04-teste-sistema.json'
];

const N8N_URL = 'http://localhost:5678';

async function importWorkflow(workflowFile) {
  try {
    const workflowPath = path.join(__dirname, 'n8n', 'workflows', workflowFile);
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    console.log(`📥 Importando: ${workflowData.name}`);

    // Para importar via API (se autenticação estiver habilitada)
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'X-N8N-API-KEY': 'your-api-key-here' // Se necessário
      },
      body: JSON.stringify(workflowData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Importado com sucesso: ${result.name} (ID: ${result.id})`);
    } else {
      console.log(`❌ Erro ao importar ${workflowFile}: ${response.status} ${response.statusText}`);
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${workflowFile}:`, error.message);
  }
}

async function importAllWorkflows() {
  console.log('🚀 Iniciando importação dos workflows para N8N...\n');

  // Verificar se N8N está acessível
  try {
    const healthCheck = await fetch(`${N8N_URL}/healthz`);
    if (!healthCheck.ok) {
      throw new Error('N8N não está respondendo');
    }
    console.log('✅ N8N está acessível\n');
  } catch (error) {
    console.error('❌ N8N não está acessível:', error.message);
    console.log('Certifique-se de que o N8N está rodando em http://localhost:5678');
    return;
  }

  // Importar cada workflow
  for (const workflow of workflows) {
    await importWorkflow(workflow);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s entre imports
  }

  console.log('\n🎉 Importação concluída!');
  console.log('Acesse http://localhost:5678 para ver os workflows importados.');
}

// Instruções para importação manual
function showManualInstructions() {
  console.log('📋 INSTRUÇÕES PARA IMPORTAÇÃO MANUAL:\n');
  console.log('1. Abra http://localhost:5678 no navegador');
  console.log('2. Para cada arquivo na pasta n8n/workflows/:');
  console.log('   - Clique em "+" para novo workflow');
  console.log('   - Clique no menu (☰) e selecione "Import from file"');
  console.log('   - Selecione o arquivo .json');
  console.log('   - Clique "Import"');
  console.log('   - Salve o workflow (Ctrl+S)\n');

  console.log('📁 Arquivos para importar:');
  workflows.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });

  console.log('\n⚠️  LEMBRE-SE:');
  console.log('   - Configure as credenciais do Google Sheets');
  console.log('   - Verifique as URLs do WhatsApp API');
  console.log('   - Execute o workflow de teste primeiro');
}

// Executar
if (require.main === module) {
  // Primeiro mostrar instruções manuais
  showManualInstructions();

  console.log('\n' + '='.repeat(60));
  console.log('Tentando importação automática...\n');

  // Tentar importação automática
  importAllWorkflows().catch(error => {
    console.error('❌ Erro na importação automática:', error);
    console.log('\n💡 Use as instruções manuais acima se a importação automática falhar.');
  });
}

module.exports = { importAllWorkflows, showManualInstructions };