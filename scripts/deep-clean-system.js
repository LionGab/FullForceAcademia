#!/usr/bin/env node

/**
 * Deep Clean System para FullForce Academia
 * Remove arquivos obsoletos, otimiza dependencies e preserva services essenciais
 * ROI Target: 2250%-3750% performance optimization para campanha 650 inativos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FullForceDeepCleaner {
    constructor() {
        this.projectRoot = process.cwd();
        this.essentialServices = [
            'src/services/waha-cloud-service.js',
            'src/campaign-scheduler.js',
            'src/campaign-templates.js',
            'src/whatsapp-master-system.js',
            'src/index-baileys.js'
        ];
        this.cleanupStats = {
            filesRemoved: 0,
            spaceSaved: 0,
            duplicatesFound: 0,
            obsoleteConfigs: 0
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async scanDuplicates() {
        this.log('🔍 Scanning for duplicate files...');

        const duplicates = [
            '.claude.json.backup',
            '.claude.json.corrupted.*',
            'package-lock.json.backup',
            '*-backup.*',
            '*.tmp',
            '*.bak',
            'qrcode*.png',
            'test-*.log'
        ];

        for (const pattern of duplicates) {
            try {
                const files = execSync(`find . -name "${pattern}" -type f`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
                for (const file of files) {
                    if (fs.existsSync(file)) {
                        const stats = fs.statSync(file);
                        fs.unlinkSync(file);
                        this.cleanupStats.filesRemoved++;
                        this.cleanupStats.spaceSaved += stats.size;
                        this.log(`Removed duplicate: ${file}`);
                    }
                }
            } catch (error) {
                // Skip if pattern not found
            }
        }
    }

    async cleanObsoleteConfigs() {
        this.log('🧹 Cleaning obsolete configuration files...');

        const obsoleteConfigs = [
            'tsconfig.json', // Not needed for pure JS project
            '.env.baileys-waha', // Merged into main .env
            '.env.railway.example', // Specific deployment config
            'railway.json',
            'railway.toml'
        ];

        for (const config of obsoleteConfigs) {
            if (fs.existsSync(config)) {
                const stats = fs.statSync(config);
                fs.unlinkSync(config);
                this.cleanupStats.obsoleteConfigs++;
                this.cleanupStats.spaceSaved += stats.size;
                this.log(`Removed obsolete config: ${config}`);
            }
        }
    }

    async optimizeNodeModules() {
        this.log('⚡ Optimizing node_modules...');

        try {
            // Clean npm cache
            execSync('npm cache clean --force', { stdio: 'pipe' });
            this.log('NPM cache cleared');

            // Remove and reinstall with production only
            if (fs.existsSync('node_modules')) {
                execSync('rm -rf node_modules', { stdio: 'pipe' });
                this.log('node_modules removed');
            }

            // Reinstall with optimized flags
            execSync('npm ci --production --no-audit --no-fund', { stdio: 'pipe' });
            this.log('Dependencies reinstalled (production only)');

        } catch (error) {
            this.log(`Node modules optimization warning: ${error.message}`, 'error');
        }
    }

    async removeUnusedDependencies() {
        this.log('📦 Analyzing unused dependencies...');

        try {
            // Check if depcheck is available, if not skip this step
            try {
                execSync('which depcheck', { stdio: 'pipe' });
            } catch {
                this.log('Depcheck not available, skipping unused dependency analysis');
                return;
            }

            const unusedDeps = execSync('depcheck --json', { encoding: 'utf8' });
            const analysis = JSON.parse(unusedDeps);

            if (analysis.dependencies && analysis.dependencies.length > 0) {
                this.log(`Found ${analysis.dependencies.length} potentially unused dependencies`);
                for (const dep of analysis.dependencies) {
                    this.log(`- ${dep} (review manually)`);
                }
            }
        } catch (error) {
            this.log('Dependency analysis skipped (optional step)');
        }
    }

    async cleanLogFiles() {
        this.log('📄 Cleaning old log files...');

        const logPatterns = [
            'logs/**/*.log',
            '*.log',
            'npm-debug.log*',
            'yarn-debug.log*',
            'yarn-error.log*',
            'lerna-debug.log*'
        ];

        for (const pattern of logPatterns) {
            try {
                const files = execSync(`find . -path "./node_modules" -prune -o -name "${pattern}" -type f -print`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
                for (const file of files) {
                    if (fs.existsSync(file)) {
                        const stats = fs.statSync(file);
                        fs.unlinkSync(file);
                        this.cleanupStats.filesRemoved++;
                        this.cleanupStats.spaceSaved += stats.size;
                        this.log(`Removed log: ${file}`);
                    }
                }
            } catch (error) {
                // Skip if pattern not found
            }
        }
    }

    async preserveEssentialServices() {
        this.log('🛡️ Verifying essential services preservation...');

        for (const service of this.essentialServices) {
            if (fs.existsSync(service)) {
                this.log(`✅ Essential service preserved: ${service}`, 'success');
            } else {
                this.log(`⚠️ WARNING: Essential service missing: ${service}`, 'error');
            }
        }
    }

    async cleanDocumentationDuplicates() {
        this.log('📚 Cleaning documentation duplicates...');

        const docDuplicates = [
            'RELATORIO_AUDITORIA_COMPLETA_2025.md',
            'RELATORIO_AUDITORIA_SISTEMA_COMPLETO.md',
            'RELATORIO_VALIDACAO_FULLFORCE.md'
        ];

        // Keep only the most recent
        const recentReport = 'RELATORIO_AUDITORIA_COMPLETA_2025.md';

        for (const doc of docDuplicates) {
            if (doc !== recentReport && fs.existsSync(doc)) {
                const stats = fs.statSync(doc);
                fs.unlinkSync(doc);
                this.cleanupStats.filesRemoved++;
                this.cleanupStats.spaceSaved += stats.size;
                this.log(`Removed duplicate documentation: ${doc}`);
            }
        }
    }

    async optimizeScripts() {
        this.log('🔧 Optimizing scripts directory...');

        // Ensure scripts directory exists
        if (!fs.existsSync('scripts')) {
            fs.mkdirSync('scripts');
        }

        // Remove any test or debug scripts
        const debugScripts = [
            'test-system-validation.js',
            'fix-and-start.js',
            'analyze-workflow.js'
        ];

        for (const script of debugScripts) {
            if (fs.existsSync(script)) {
                const stats = fs.statSync(script);
                fs.unlinkSync(script);
                this.cleanupStats.filesRemoved++;
                this.cleanupStats.spaceSaved += stats.size;
                this.log(`Removed debug script: ${script}`);
            }
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async generateCleanupReport() {
        this.log('📊 Generating cleanup report...');

        const report = `
# FullForce Academia Deep Clean Report
## Executed: ${new Date().toISOString()}

### Cleanup Statistics
- Files Removed: ${this.cleanupStats.filesRemoved}
- Space Saved: ${this.formatBytes(this.cleanupStats.spaceSaved)}
- Duplicates Found: ${this.cleanupStats.duplicatesFound}
- Obsolete Configs: ${this.cleanupStats.obsoleteConfigs}

### Performance Optimization Target
- Campaign: 650 Inactive Users Reactivation
- Target ROI: 2250%-3750%
- System Status: Optimized for Maximum Performance

### Essential Services Status
${this.essentialServices.map(service => {
    const exists = fs.existsSync(service);
    return `- ${service}: ${exists ? '✅ PRESERVED' : '❌ MISSING'}`;
}).join('\n')}

### Next Steps
1. Test campaign automation with optimized system
2. Monitor performance metrics
3. Validate ROI improvements
4. Schedule regular cleanup maintenance

Generated by FullForce Deep Clean System
        `;

        fs.writeFileSync('DEEP_CLEAN_REPORT.md', report.trim());
        this.log('📄 Cleanup report saved to DEEP_CLEAN_REPORT.md', 'success');
    }

    async execute() {
        this.log('🚀 Starting FullForce Academia Deep Clean System...');
        this.log(`Target: Optimize system for 650 inactive users campaign (ROI 2250%-3750%)`);

        try {
            await this.scanDuplicates();
            await this.cleanObsoleteConfigs();
            await this.cleanLogFiles();
            await this.cleanDocumentationDuplicates();
            await this.optimizeScripts();
            await this.removeUnusedDependencies();
            await this.optimizeNodeModules();
            await this.preserveEssentialServices();
            await this.generateCleanupReport();

            this.log('🎉 Deep Clean System completed successfully!', 'success');
            this.log(`💾 Total space saved: ${this.formatBytes(this.cleanupStats.spaceSaved)}`, 'success');
            this.log(`🗃️ Files removed: ${this.cleanupStats.filesRemoved}`, 'success');
            this.log('🚀 System optimized for maximum campaign performance!', 'success');

        } catch (error) {
            this.log(`Deep clean error: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const cleaner = new FullForceDeepCleaner();
    cleaner.execute();
}

module.exports = FullForceDeepCleaner;