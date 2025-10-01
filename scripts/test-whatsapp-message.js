const axios = require('axios');
const readline = require('readline');

class WhatsAppTester {
  constructor() {
    this.wahaBaseUrl = 'https://waha.lionalpha.app/api';
    this.wahaToken = process.env.WAHA_TOKEN || 'YOUR_WAHA_TOKEN';
    this.session = 'default';
  }

  async sendTestMessage(phoneNumber, customMessage = null) {
    try {
      // Formatar número brasileiro
      let formattedPhone = phoneNumber.replace(/\D/g, '');

      // Adicionar código do país se necessário
      if (formattedPhone.length === 11 && formattedPhone.startsWith('11')) {
        formattedPhone = '55' + formattedPhone;
      } else if (formattedPhone.length === 10) {
        formattedPhone = '5511' + formattedPhone;
      } else if (formattedPhone.length === 11 && !formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const chatId = `${formattedPhone}@c.us`;

      const message = customMessage || `🤖 Teste FullForce Academia!

Olá! Este é um teste do sistema de automação da FullForce Academia.

✅ Sistema funcionando perfeitamente!
🎯 Pronto para processar 650 usuários inativos
💰 Meta: R$ 11.700 em ROI

🚀 Campanha de reativação configurada com sucesso!

--
Enviado automaticamente pelo sistema de automação
${new Date().toLocaleString('pt-BR')}`;

      console.log('📱 Enviando mensagem de teste...');
      console.log(`📞 Para: ${chatId}`);
      console.log(`💬 Mensagem: ${message.substring(0, 100)}...`);

      const response = await axios.post(
        `${this.wahaBaseUrl}/sendText`,
        {
          chatId: chatId,
          text: message,
          session: this.session
        },
        {
          headers: {
            'Authorization': `Bearer ${this.wahaToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.sent !== false) {
        console.log('✅ Mensagem enviada com sucesso!');
        console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
        return {
          success: true,
          data: response.data,
          phone: formattedPhone,
          chatId: chatId
        };
      } else {
        console.log('❌ Falha no envio da mensagem');
        console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
        return {
          success: false,
          error: 'Mensagem não foi enviada',
          data: response.data
        };
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      if (error.response) {
        console.error('📊 Resposta do servidor:', JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async checkWAHAStatus() {
    try {
      console.log('🔍 Verificando status do WAHA...');

      const response = await axios.get(`${this.wahaBaseUrl}/sessions`, {
        headers: {
          'Authorization': `Bearer ${this.wahaToken}`
        },
        timeout: 10000
      });

      console.log('✅ WAHA está respondendo!');
      console.log('📊 Sessões disponíveis:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        sessions: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao verificar WAHA:', error.message);
      if (error.response) {
        console.error('📊 Resposta:', JSON.stringify(error.response.data, null, 2));
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runInteractiveTest() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🧪 FullForce Academia - Teste WhatsApp');
    console.log('=====================================');
    console.log('Este script enviará uma mensagem de teste via WAHA');
    console.log('');

    // Verificar status do WAHA primeiro
    const wahaStatus = await this.checkWAHAStatus();
    if (!wahaStatus.success) {
      console.log('❌ WAHA não está disponível. Verifique:');
      console.log('1. Se o WAHA está rodando em https://waha.lionalpha.app');
      console.log('2. Se o token está correto');
      console.log('3. Se há conexão com a internet');
      rl.close();
      return;
    }

    return new Promise((resolve) => {
      rl.question('📱 Digite seu número de WhatsApp (com DDD): ', async (phone) => {
        if (!phone || phone.trim() === '') {
          console.log('❌ Número inválido');
          rl.close();
          resolve(false);
          return;
        }

        rl.question('💬 Mensagem customizada (Enter para usar padrão): ', async (customMessage) => {
          const message = customMessage.trim() || null;

          console.log('');
          console.log('🚀 Enviando mensagem de teste...');

          const result = await this.sendTestMessage(phone, message);

          if (result.success) {
            console.log('');
            console.log('🎉 TESTE BEM-SUCEDIDO!');
            console.log('✅ Sistema WAHA funcionando');
            console.log('✅ Mensagem entregue');
            console.log('✅ Pronto para campanha real');
            console.log('');
            console.log('🎯 Próximo passo: Deploy completo do workflow N8N');
          } else {
            console.log('');
            console.log('❌ TESTE FALHOU');
            console.log('🔧 Verifique a configuração do WAHA');
            console.log('💡 Dica: Confirme se o WhatsApp está conectado no WAHA');
          }

          rl.close();
          resolve(result.success);
        });
      });
    });
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  const tester = new WhatsAppTester();

  // Verificar se tem argumentos de linha de comando
  const args = process.argv.slice(2);
  if (args.length > 0) {
    // Modo não-interativo
    const phone = args[0];
    const message = args[1] || null;

    tester.sendTestMessage(phone, message).then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else {
    // Modo interativo
    tester.runInteractiveTest().then(success => {
      process.exit(success ? 0 : 1);
    });
  }
}

module.exports = WhatsAppTester;