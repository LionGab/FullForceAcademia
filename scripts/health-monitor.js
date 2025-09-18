#!/usr/bin/env node

/**
 * Full Force Academia - Health Monitoring Script
 *
 * This script monitors the health of all services and provides
 * comprehensive system monitoring capabilities.
 */

const axios = require('axios');
const { Pool } = require('pg');
const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');

class HealthMonitor {
    constructor() {
        this.services = {
            app: {
                name: 'Full Force Academia App',
                url: process.env.APP_URL || 'http://localhost:3001',
                critical: true
            },
            waha: {
                name: 'WAHA WhatsApp API',
                url: process.env.WAHA_API_URL || 'http://localhost:3000',
                critical: true
            },
            n8n: {
                name: 'N8N Automation',
                url: process.env.N8N_URL || 'http://localhost:5678',
                critical: false
            },
            postgres: {
                name: 'PostgreSQL Database',
                type: 'database',
                critical: true
            },
            redis: {
                name: 'Redis Cache',
                type: 'cache',
                critical: true
            }
        };

        this.continuous = process.argv.includes('--continuous');
        this.interval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000; // 1 minute
        this.isRunning = false;

        this.setupSignalHandlers();
    }

    setupSignalHandlers() {
        process.on('SIGINT', async () => {
            console.log('\n🛑 Stopping health monitor...');
            this.isRunning = false;
            process.exit(0);
        });
    }

    async checkServiceHealth(service) {
        const startTime = Date.now();
        const result = {
            name: service.name,
            status: 'unknown',
            responseTime: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        try {
            if (service.url) {
                const response = await axios.get(`${service.url}/health`, {
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                });

                result.responseTime = Date.now() - startTime;
                result.status = response.status === 200 ? 'healthy' : 'degraded';

            } else if (service.type === 'database') {
                await this.checkPostgreSQL();
                result.status = 'healthy';
                result.responseTime = Date.now() - startTime;

            } else if (service.type === 'cache') {
                await this.checkRedis();
                result.status = 'healthy';
                result.responseTime = Date.now() - startTime;
            }

        } catch (error) {
            result.status = 'unhealthy';
            result.error = error.message;
            result.responseTime = Date.now() - startTime;
        }

        return result;
    }

    async checkPostgreSQL() {
        const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'n8n',
            user: process.env.DB_USER || 'n8n',
            password: process.env.DB_PASSWORD || 'n8n123',
            connectionTimeoutMillis: 5000,
        });

        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            await pool.end();
        } catch (error) {
            await pool.end();
            throw error;
        }
    }

    async checkRedis() {
        const client = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            connectTimeout: 5000,
        });

        try {
            await client.connect();
            await client.ping();
            await client.quit();
        } catch (error) {
            await client.quit();
            throw error;
        }
    }

    async performHealthCheck() {
        console.log(`\n🏥 Health Check - ${new Date().toISOString()}`);
        console.log('=' * 50);

        const results = {
            timestamp: new Date().toISOString(),
            services: {},
            summary: { total: 0, healthy: 0, unhealthy: 0 }
        };

        for (const [key, service] of Object.entries(this.services)) {
            console.log(`🔍 Checking ${service.name}...`);

            const serviceResult = await this.checkServiceHealth(service);
            results.services[key] = serviceResult;
            results.summary.total++;

            if (serviceResult.status === 'healthy') {
                results.summary.healthy++;
                console.log(`✅ ${service.name}: ${serviceResult.status} (${serviceResult.responseTime}ms)`);
            } else {
                results.summary.unhealthy++;
                console.log(`❌ ${service.name}: ${serviceResult.status} - ${serviceResult.error}`);
            }
        }

        console.log(`\n📊 Summary: ${results.summary.healthy}/${results.summary.total} services healthy`);
        return results;
    }

    async runContinuous() {
        this.isRunning = true;
        console.log(`🔄 Starting continuous monitoring (${this.interval}ms interval)`);

        while (this.isRunning) {
            try {
                await this.performHealthCheck();
                if (this.isRunning) {
                    await new Promise(resolve => setTimeout(resolve, this.interval));
                }
            } catch (error) {
                console.error('❌ Health check error:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async run() {
        console.log('🏥 Full Force Academia - Health Monitor\n');

        try {
            if (this.continuous) {
                await this.runContinuous();
            } else {
                await this.performHealthCheck();
            }
        } catch (error) {
            console.error('❌ Health monitor failed:', error.message);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    const monitor = new HealthMonitor();
    monitor.run().catch(error => {
        console.error('❌ Failed to start health monitor:', error.message);
        process.exit(1);
    });
}

module.exports = HealthMonitor;