#!/usr/bin/env node

/**
 * Configuration Validation Script for Full Force Academia
 */

const fs = require('fs');
const path = require('path');

class ConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.requiredEnvVars = [
            'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
            'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD',
            'WAHA_API_URL', 'WAHA_API_KEY',
            'ACADEMIA_NOME', 'ACADEMIA_TELEFONE'
        ];
    }

    validateEnvironmentVariables() {
        console.log('🔍 Validating environment variables...\n');

        for (const envVar of this.requiredEnvVars) {
            const value = process.env[envVar];
            if (!value || value.trim() === '') {
                this.errors.push(`Missing required environment variable: ${envVar}`);
            } else {
                console.log(`✅ ${envVar}: ${this.maskSensitiveValue(envVar, value)}`);
            }
        }
    }

    maskSensitiveValue(key, value) {
        const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
        const isSensitive = sensitiveKeys.some(sensitive => key.includes(sensitive));

        if (isSensitive) {
            return value.length > 8 ? `${value.substring(0, 4)}***${value.substring(value.length - 2)}` : '***';
        }
        return value;
    }

    validateFileStructure() {
        console.log('\n📁 Validating file structure...\n');

        const requiredFiles = [
            'src/index-baileys.js',
            'src/services/database.js',
            'src/services/waha-service.js',
            'src/bot/hybrid-whatsapp-bot.js',
            'package.json',
            'Dockerfile'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ File exists: ${file}`);
            } else {
                this.errors.push(`Missing required file: ${file}`);
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 CONFIGURATION VALIDATION REPORT');
        console.log('='.repeat(60));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All validation checks passed!');
            return true;
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning}`);
            });
        }

        return this.errors.length === 0;
    }

    async run() {
        console.log('🔧 Full Force Academia - Configuration Validator');
        console.log('='.repeat(60));

        try {
            // Load .env file if it exists
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                require('dotenv').config({ path: envPath });
                console.log('✅ Loaded .env file');
            }

            this.validateEnvironmentVariables();
            this.validateFileStructure();

            const isValid = this.generateReport();
            process.exit(isValid ? 0 : 1);

        } catch (error) {
            console.error('❌ Configuration validation failed:', error.message);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    const validator = new ConfigValidator();
    validator.run().catch(error => {
        console.error('❌ Failed to run configuration validator:', error.message);
        process.exit(1);
    });
}

module.exports = ConfigValidator;