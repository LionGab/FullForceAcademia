const axios = require('axios');
const fs = require('fs');
const path = require('path');

class N8NWorkflowDeployer {
  constructor() {
    this.baseURL = 'https://lionalpha.app.n8n.cloud';
    this.workflowId = 'VGhKEfrpJU47onvi';
    this.apiKey = process.env.N8N_API_KEY || 'YOUR_N8N_API_KEY';
  }

  async deployWorkflow() {
    try {
      console.log('🚀 Iniciando deploy do workflow N8N...');

      // Carregar configuração do workflow
      const workflowConfig = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, '../n8n-workflows/complete-workflow-config.json'),
          'utf8'
        )
      );

      // Atualizar workflow existente
      const response = await axios.put(
        `${this.baseURL}/api/v1/workflows/${this.workflowId}`,
        workflowConfig,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Workflow atualizado com sucesso!');
      console.log(`📊 Workflow ID: ${this.workflowId}`);
      console.log(`🔗 URL: ${this.baseURL}/workflow/${this.workflowId}`);

      // Ativar o workflow
      await this.activateWorkflow();

      return response.data;
    } catch (error) {
      console.error('❌ Erro no deploy:', error.response?.data || error.message);
      throw error;
    }
  }

  async activateWorkflow() {
    try {
      await axios.post(
        `${this.baseURL}/api/v1/workflows/${this.workflowId}/activate`,
        {},
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );
      console.log('🟢 Workflow ativado automaticamente!');
    } catch (error) {
      console.log('⚠️ Erro ao ativar workflow:', error.response?.data || error.message);
    }
  }

  async testWorkflow() {
    try {
      console.log('🧪 Testando execução do workflow...');

      const response = await axios.post(
        `${this.baseURL}/api/v1/workflows/${this.workflowId}/execute`,
        {},
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      console.log('✅ Teste executado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
  }

  async getWorkflowStatus() {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/workflows/${this.workflowId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey
          }
        }
      );

      const workflow = response.data;
      console.log(`📋 Status do Workflow: ${workflow.active ? '🟢 Ativo' : '🔴 Inativo'}`);
      console.log(`📅 Última atualização: ${workflow.updatedAt}`);
      console.log(`🏷️ Tags: ${workflow.tags?.join(', ') || 'Nenhuma'}`);

      return workflow;
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
    }
  }
}

// Executar deploy se chamado diretamente
if (require.main === module) {
  const deployer = new N8NWorkflowDeployer();

  (async () => {
    try {
      await deployer.deployWorkflow();
      await deployer.getWorkflowStatus();

      console.log('\n🎉 Deploy concluído com sucesso!');
      console.log('📱 O workflow está pronto para processar os inativos da FullForce');
      console.log('💡 Execute manualmente ou configure triggers automáticos no N8N');

    } catch (error) {
      console.error('\n💥 Falha no deploy:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = N8NWorkflowDeployer;