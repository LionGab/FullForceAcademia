// N8N Cloud Integration for FFMATUPA Fitness Academy
// This file provides utilities to interact with n8n cloud workflows

const axios = require('axios');

class N8nCloudIntegration {
    constructor() {
        this.n8nCloudUrl = process.env.N8N_CLOUD_URL || 'https://lionalpha.app.n8n.cloud';
        this.wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        this.wahaApiKey = process.env.WAHA_API_KEY || 'ea77cb93-e6b3-4de0-977e-c6e4c3f49ca2';

        this.webhooks = {
            leadCapture: `${this.n8nCloudUrl}/webhook/fitness-academy-webhook`,
            whatsappResponses: `${this.n8nCloudUrl}/webhook/whatsapp-responses`
        };

        console.log('🚀 N8N Cloud Integration initialized');
        console.log(`📡 N8N Cloud URL: ${this.n8nCloudUrl}`);
        console.log(`📱 WAHA API URL: ${this.wahaUrl}`);
    }

    /**
     * Send lead data to n8n cloud workflow
     */
    async sendLeadToN8nCloud(leadData) {
        try {
            console.log('📤 Sending lead to n8n cloud workflow...');

            const payload = {
                source: leadData.source || 'manual',
                name: leadData.name,
                phone: leadData.phone,
                email: leadData.email || '',
                message: leadData.message || '',
                interest: leadData.interest || '',
                timestamp: new Date().toISOString(),
                campaign_id: `fitness_academy_${Date.now()}`
            };

            const response = await axios.post(this.webhooks.leadCapture, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FFMATUPA-Integration/1.0'
                },
                timeout: 10000
            });

            console.log('✅ Lead sent successfully to n8n cloud');
            console.log('📊 Response:', response.data);

            return {
                success: true,
                leadId: response.data.leadId,
                message: 'Lead processed successfully'
            };

        } catch (error) {
            console.error('❌ Error sending lead to n8n cloud:', error.message);
            throw error;
        }
    }

    /**
     * Send WhatsApp response to n8n cloud workflow
     */
    async sendWhatsAppResponseToN8n(messageData) {
        try {
            console.log('📤 Sending WhatsApp response to n8n cloud...');

            const payload = {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                from: messageData.phone,
                                id: messageData.messageId || `msg_${Date.now()}`,
                                timestamp: Math.floor(Date.now() / 1000),
                                type: 'text',
                                text: {
                                    body: messageData.message
                                }
                            }],
                            contacts: [{
                                profile: {
                                    name: messageData.name || 'Lead'
                                },
                                wa_id: messageData.phone
                            }]
                        }
                    }]
                }]
            };

            const response = await axios.post(this.webhooks.whatsappResponses, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FFMATUPA-Integration/1.0'
                },
                timeout: 10000
            });

            console.log('✅ WhatsApp response sent successfully to n8n cloud');

            return {
                success: true,
                intent: response.data.intent,
                responseProcessed: true
            };

        } catch (error) {
            console.error('❌ Error sending WhatsApp response to n8n cloud:', error.message);
            throw error;
        }
    }

    /**
     * Execute campaign using n8n cloud workflows
     */
    async executeCampaignViaCloud(campaignData) {
        try {
            console.log('🚀 Executing campaign via n8n cloud...');

            const results = {
                processed: 0,
                sent: 0,
                errors: 0
            };

            // Process leads in batches
            const batchSize = 10;
            const leads = campaignData.leads || [];

            for (let i = 0; i < leads.length; i += batchSize) {
                const batch = leads.slice(i, i + batchSize);
                console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)}`);

                await Promise.allSettled(
                    batch.map(async (lead) => {
                        try {
                            await this.sendLeadToN8nCloud(lead);
                            results.processed++;
                            results.sent++;
                        } catch (error) {
                            results.errors++;
                            console.error(`❌ Error processing lead ${lead.phone}:`, error.message);
                        }
                    })
                );

                // Delay between batches
                if (i + batchSize < leads.length) {
                    console.log('⏳ Waiting 5 seconds between batches...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            console.log('📊 Campaign execution completed:');
            console.log(`✅ Processed: ${results.processed}`);
            console.log(`📤 Sent: ${results.sent}`);
            console.log(`❌ Errors: ${results.errors}`);

            return results;

        } catch (error) {
            console.error('❌ Error executing campaign via cloud:', error);
            throw error;
        }
    }

    /**
     * Monitor WAHA for incoming messages and forward to n8n cloud
     */
    async startWAHAMonitoring() {
        console.log('👀 Starting WAHA monitoring for n8n cloud integration...');

        const pollInterval = 30000; // 30 seconds

        setInterval(async () => {
            try {
                // In a real implementation, you would check WAHA for new messages
                // For now, this is a placeholder for the monitoring logic
                console.log('🔍 Checking WAHA for new messages...');

                // Example: Get messages from WAHA
                // const messages = await this.getNewMessagesFromWAHA();
                //
                // if (messages.length > 0) {
                //     for (const message of messages) {
                //         await this.sendWhatsAppResponseToN8n(message);
                //     }
                // }

            } catch (error) {
                console.error('❌ Error in WAHA monitoring:', error.message);
            }
        }, pollInterval);
    }

    /**
     * Setup webhook endpoints for WAHA integration
     */
    async setupWAHAWebhooks() {
        try {
            console.log('🔧 Setting up WAHA webhooks for n8n cloud integration...');

            const webhookConfig = {
                url: this.webhooks.whatsappResponses,
                events: ['message'],
                retries: 3,
                webhookEvents: ['message', 'message.reaction']
            };

            // Configure WAHA to send webhooks to n8n cloud
            const response = await axios.post(`${this.wahaUrl}/api/sessions/default/webhooks`, webhookConfig, {
                headers: {
                    'Authorization': `Bearer ${this.wahaApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ WAHA webhooks configured successfully');
            console.log('📡 Webhook URL:', webhookConfig.url);

            return response.data;

        } catch (error) {
            console.error('❌ Error setting up WAHA webhooks:', error.message);
            throw error;
        }
    }

    /**
     * Test n8n cloud connectivity
     */
    async testN8nCloudConnectivity() {
        try {
            console.log('🧪 Testing n8n cloud connectivity...');

            const testLead = {
                source: 'test',
                name: 'Test User',
                phone: '5566999999999',
                email: 'test@fitness.com',
                message: 'Test message for n8n cloud connectivity',
                timestamp: new Date().toISOString()
            };

            const result = await this.sendLeadToN8nCloud(testLead);

            console.log('✅ N8N cloud connectivity test passed');
            return result;

        } catch (error) {
            console.error('❌ N8N cloud connectivity test failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate campaign leads data for testing
     */
    generateTestLeads(count = 10) {
        const names = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima'];
        const sources = ['website', 'facebook', 'instagram', 'referral', 'qr_code'];
        const leads = [];

        for (let i = 0; i < count; i++) {
            leads.push({
                source: sources[Math.floor(Math.random() * sources.length)],
                name: names[Math.floor(Math.random() * names.length)],
                phone: `5566${(999000000 + i).toString()}`,
                email: `test${i}@fitness.com`,
                message: 'Interessado na academia',
                interest: 'fitness'
            });
        }

        return leads;
    }
}

// Example usage and testing
async function main() {
    const integration = new N8nCloudIntegration();

    try {
        const mode = process.argv[2] || 'test';

        switch (mode) {
            case 'test':
                console.log('🧪 Running connectivity test...');
                await integration.testN8nCloudConnectivity();
                break;

            case 'campaign':
                console.log('🚀 Running test campaign...');
                const testLeads = integration.generateTestLeads(5);
                await integration.executeCampaignViaCloud({ leads: testLeads });
                break;

            case 'monitor':
                console.log('👀 Starting monitoring mode...');
                await integration.startWAHAMonitoring();
                break;

            case 'setup':
                console.log('🔧 Setting up WAHA webhooks...');
                await integration.setupWAHAWebhooks();
                break;

            default:
                console.log('ℹ️ Available modes: test, campaign, monitor, setup');
                break;
        }

    } catch (error) {
        console.error('❌ Integration failed:', error);
        process.exit(1);
    }
}

// Execute if called directly
if (require.main === module) {
    main();
}

module.exports = N8nCloudIntegration;