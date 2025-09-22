#!/usr/bin/env node

/**
 * 🔗 GOOGLE SHEETS N8N INTEGRATION SCRIPT
 * Manages the complete integration between Google Sheets, N8N, and WhatsApp automation
 *
 * Features:
 * - Automated Google Sheets data reading
 * - N8N workflow triggering
 * - WAHA WhatsApp integration
 * - Campaign metrics tracking
 * - Error handling and logging
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class GoogleSheetsN8NIntegration {
  constructor() {
    this.config = {
      googleSheets: {
        spreadsheetId: '1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo',
        serviceAccountPath: './config/google-service-account.json'
      },
      n8n: {
        baseUrl: 'https://lionalpha.app.n8n.cloud',
        webhooks: {
          googleSheetsManual: '/webhook/google-sheets-manual-trigger',
          campaign650: '/webhook/campaign-650-trigger',
          wahaAutomation: '/webhook/whatsapp-waha-trigger'
        }
      },
      waha: {
        baseUrl: 'http://localhost:3000',
        sessionName: 'fullforce-session'
      },
      local: {
        baseUrl: 'http://localhost:3005',
        apiToken: process.env.ACADEMIA_API_TOKEN
      }
    };

    this.logger = this.createLogger();
    this.metrics = {
      startTime: new Date(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      campaigns: {}
    };
  }

  createLogger() {
    return {
      info: (message, data = {}) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
        this.logToFile('INFO', message, data);
      },
      error: (message, data = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, data);
        this.logToFile('ERROR', message, data);
      },
      warn: (message, data = {}) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
        this.logToFile('WARN', message, data);
      }
    };
  }

  async logToFile(level, message, data) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data: JSON.stringify(data)
      };

      const logPath = './logs/google-sheets-n8n-integration.log';
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * 🚀 Start the complete integration process
   */
  async startIntegration(options = {}) {
    try {
      this.logger.info('🚀 Starting Google Sheets N8N Integration');

      // Step 1: Verify all services are available
      await this.verifyServices();

      // Step 2: Trigger Google Sheets data reading
      const sheetsResult = await this.triggerGoogleSheetsReading(options);

      // Step 3: Monitor the workflow execution
      await this.monitorWorkflowExecution(sheetsResult.sessionId);

      // Step 4: Generate final report
      const report = await this.generateIntegrationReport();

      this.logger.info('✅ Integration completed successfully', report);
      return report;

    } catch (error) {
      this.logger.error('❌ Integration failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔍 Verify all required services are available
   */
  async verifyServices() {
    this.logger.info('🔍 Verifying services availability...');

    const services = [
      {
        name: 'N8N',
        url: `${this.config.n8n.baseUrl}/healthz`,
        required: true
      },
      {
        name: 'WAHA',
        url: `${this.config.waha.baseUrl}/api/health`,
        required: true
      },
      {
        name: 'Local API',
        url: `${this.config.local.baseUrl}/health`,
        required: false
      }
    ];

    const results = [];

    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 10000 });
        results.push({
          name: service.name,
          status: 'AVAILABLE',
          responseTime: response.duration || 'N/A'
        });
        this.logger.info(`✅ ${service.name} is available`);
      } catch (error) {
        const status = service.required ? 'CRITICAL' : 'WARNING';
        results.push({
          name: service.name,
          status: 'UNAVAILABLE',
          error: error.message
        });

        if (service.required) {
          this.logger.error(`❌ ${service.name} is unavailable (CRITICAL)`, { error: error.message });
          throw new Error(`Required service ${service.name} is not available`);
        } else {
          this.logger.warn(`⚠️ ${service.name} is unavailable (NON-CRITICAL)`, { error: error.message });
        }
      }
    }

    return results;
  }

  /**
   * 📊 Trigger Google Sheets data reading workflow
   */
  async triggerGoogleSheetsReading(options = {}) {
    this.logger.info('📊 Triggering Google Sheets data reading...');

    const payload = {
      triggerSource: options.triggerSource || 'integration_script',
      requestedBy: options.requestedBy || 'automation',
      forceRefresh: options.forceRefresh || false,
      spreadsheetId: this.config.googleSheets.spreadsheetId,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post(
        `${this.config.n8n.baseUrl}${this.config.n8n.webhooks.googleSheetsManual}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Integration-Source': 'google-sheets-n8n-integration'
          },
          timeout: 30000
        }
      );

      this.metrics.totalRequests++;
      this.metrics.successfulRequests++;

      const result = {
        success: true,
        sessionId: `sheets_${Date.now()}`,
        response: response.data,
        triggeredAt: new Date().toISOString()
      };

      this.logger.info('✅ Google Sheets workflow triggered successfully', result);
      return result;

    } catch (error) {
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;

      this.logger.error('❌ Failed to trigger Google Sheets workflow', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * 👀 Monitor workflow execution progress
   */
  async monitorWorkflowExecution(sessionId, maxWaitTime = 300000) {
    this.logger.info('👀 Monitoring workflow execution...', { sessionId });

    const startTime = Date.now();
    const checkInterval = 10000; // Check every 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if campaign has been triggered (this would be from your local API)
        const status = await this.checkCampaignStatus(sessionId);

        if (status.completed) {
          this.logger.info('✅ Workflow execution completed', status);
          return status;
        }

        if (status.failed) {
          this.logger.error('❌ Workflow execution failed', status);
          throw new Error(`Workflow execution failed: ${status.error}`);
        }

        this.logger.info('⏳ Workflow still executing...', {
          sessionId,
          elapsed: Math.round((Date.now() - startTime) / 1000) + 's'
        });

        await this.sleep(checkInterval);

      } catch (error) {
        this.logger.warn('⚠️ Error checking workflow status', { error: error.message });
        await this.sleep(checkInterval);
      }
    }

    throw new Error(`Workflow execution timeout after ${maxWaitTime}ms`);
  }

  /**
   * 📈 Check campaign status from local API
   */
  async checkCampaignStatus(sessionId) {
    try {
      const response = await axios.get(
        `${this.config.local.baseUrl}/api/campaigns/status/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.local.apiToken}`
          },
          timeout: 15000
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { completed: false, failed: false, status: 'NOT_FOUND' };
      }
      throw error;
    }
  }

  /**
   * 📊 Generate integration report
   */
  async generateIntegrationReport() {
    const endTime = new Date();
    const duration = endTime - this.metrics.startTime;

    const report = {
      integration: {
        status: 'COMPLETED',
        startTime: this.metrics.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`
      },
      metrics: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        successRate: Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100) + '%'
      },
      googleSheets: {
        spreadsheetId: this.config.googleSheets.spreadsheetId,
        dataRead: true,
        lastUpdate: new Date().toISOString()
      },
      n8n: {
        baseUrl: this.config.n8n.baseUrl,
        workflowsTriggered: Object.keys(this.config.n8n.webhooks).length,
        status: 'OPERATIONAL'
      },
      nextSteps: [
        'Monitor campaign performance in dashboard',
        'Check WhatsApp message delivery rates',
        'Track conversion metrics and ROI',
        'Review and optimize segmentation rules'
      ]
    };

    // Save report to file
    try {
      const reportPath = `./logs/integration-report-${Date.now()}.json`;
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.logger.info('📋 Integration report saved', { reportPath });
    } catch (error) {
      this.logger.warn('⚠️ Failed to save report to file', { error: error.message });
    }

    return report;
  }

  /**
   * 🛠️ Test the integration with sample data
   */
  async testIntegration() {
    this.logger.info('🧪 Running integration test...');

    const testOptions = {
      triggerSource: 'test',
      requestedBy: 'integration_test',
      forceRefresh: true
    };

    try {
      const result = await this.startIntegration(testOptions);
      this.logger.info('✅ Integration test completed successfully', result);
      return result;
    } catch (error) {
      this.logger.error('❌ Integration test failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 🔧 Utility: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const integration = new GoogleSheetsN8NIntegration();

  const command = process.argv[2] || 'start';
  const options = {
    forceRefresh: process.argv.includes('--force'),
    requestedBy: process.argv.includes('--user') ?
      process.argv[process.argv.indexOf('--user') + 1] : 'cli'
  };

  switch (command) {
    case 'start':
      integration.startIntegration(options)
        .then(result => {
          console.log('\n🎉 Integration completed successfully!');
          console.log('📊 Report:', JSON.stringify(result, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Integration failed:', error.message);
          process.exit(1);
        });
      break;

    case 'test':
      integration.testIntegration()
        .then(result => {
          console.log('\n✅ Test completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Test failed:', error.message);
          process.exit(1);
        });
      break;

    case 'verify':
      integration.verifyServices()
        .then(results => {
          console.log('\n🔍 Service verification results:');
          results.forEach(service => {
            console.log(`${service.status === 'AVAILABLE' ? '✅' : '❌'} ${service.name}: ${service.status}`);
          });
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Verification failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log(`
🔗 Google Sheets N8N Integration Script

Usage:
  node google-sheets-n8n-integration.js [command] [options]

Commands:
  start     Start the complete integration process
  test      Run integration test with sample data
  verify    Verify all services are available

Options:
  --force   Force refresh of Google Sheets data
  --user    Specify user requesting the integration

Examples:
  node google-sheets-n8n-integration.js start --force
  node google-sheets-n8n-integration.js test
  node google-sheets-n8n-integration.js verify
      `);
      process.exit(0);
  }
}

module.exports = GoogleSheetsN8NIntegration;