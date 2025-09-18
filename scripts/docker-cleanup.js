#!/usr/bin/env node
/**
 * Docker Cleanup Script
 * Cleans up orphaned containers and handles port conflicts
 */

const { execSync } = require('child_process');
const readline = require('readline');

class DockerCleanup {
    constructor() {
        this.orphanedContainers = [];
        this.conflictingPorts = [];
        this.volumesToClean = [];
    }

    async runCleanup() {
        console.log('🧹 Full Force Academia - Docker Cleanup');
        console.log('=' .repeat(50));
        console.log(`Started at: ${new Date().toISOString()}`);
        console.log('');

        await this.analyzeCurrentState();
        await this.identifyOrphanedContainers();
        await this.identifyPortConflicts();
        await this.identifyUnusedVolumes();
        await this.generateCleanupPlan();
        await this.executeCleanup();
    }

    async analyzeCurrentState() {
        console.log('📊 Analyzing Current Docker State...');

        try {
            // Get running containers
            const runningContainers = execSync('docker ps --format "{{.Names}}: {{.Ports}}"', { encoding: 'utf8' });
            console.log('Running containers:');
            if (runningContainers.trim()) {
                console.log(runningContainers);
            } else {
                console.log('   No running containers');
            }

            // Get all containers
            const allContainers = execSync('docker ps -a --format "{{.Names}}: {{.Status}}"', { encoding: 'utf8' });
            console.log('\nAll containers:');
            if (allContainers.trim()) {
                console.log(allContainers);
            } else {
                console.log('   No containers found');
            }

            console.log('');
        } catch (error) {
            console.log('⚠️  Could not analyze Docker state:', error.message);
        }
    }

    async identifyOrphanedContainers() {
        console.log('🔍 Identifying Orphaned Containers...');

        try {
            // Find containers not managed by our compose file
            const allContainers = execSync('docker ps -a --format "{{.Names}}"', { encoding: 'utf8' })
                .split('\n')
                .filter(name => name.trim());

            const academiaContainers = [
                'academia-waha',
                'academia-n8n',
                'academia-postgres',
                'academia-redis',
                'academia-adminer',
                'academia-whatsapp-bot'
            ];

            // Find potentially orphaned containers
            const potentialOrphans = allContainers.filter(name => {
                const nameLower = name.toLowerCase();
                return (nameLower.includes('postgres') ||
                        nameLower.includes('redis') ||
                        nameLower.includes('n8n') ||
                        nameLower.includes('waha') ||
                        nameLower.includes('adminer')) &&
                       !academiaContainers.includes(name);
            });

            this.orphanedContainers = potentialOrphans;

            if (this.orphanedContainers.length > 0) {
                console.log('Found potentially orphaned containers:');
                this.orphanedContainers.forEach(container => {
                    console.log(`   - ${container}`);
                });
            } else {
                console.log('✅ No orphaned containers found');
            }

            console.log('');
        } catch (error) {
            console.log('⚠️  Could not identify orphaned containers:', error.message);
        }
    }

    async identifyPortConflicts() {
        console.log('🚪 Identifying Port Conflicts...');

        const requiredPorts = [
            { port: 3000, service: 'WAHA API' },
            { port: 3001, service: 'Academia App' },
            { port: 5434, service: 'PostgreSQL' },
            { port: 5678, service: 'n8n' },
            { port: 6381, service: 'Redis' },
            { port: 8080, service: 'Adminer' }
        ];

        for (const { port, service } of requiredPorts) {
            try {
                const result = execSync(`netstat -an | grep :${port} || echo "available"`, { encoding: 'utf8' });

                if (result.includes('LISTENING') || result.includes('ESTABLISHED')) {
                    // Try to identify which process is using the port
                    try {
                        const processInfo = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
                        this.conflictingPorts.push({ port, service, processInfo: processInfo.trim() });
                        console.log(`❌ Port ${port} (${service}): IN USE`);
                        console.log(`   Process info: ${processInfo.trim().split('\n')[0]}`);
                    } catch {
                        this.conflictingPorts.push({ port, service, processInfo: 'Unknown process' });
                        console.log(`❌ Port ${port} (${service}): IN USE (unknown process)`);
                    }
                } else {
                    console.log(`✅ Port ${port} (${service}): Available`);
                }
            } catch (error) {
                console.log(`⚠️  Could not check port ${port}: ${error.message}`);
            }
        }

        console.log('');
    }

    async identifyUnusedVolumes() {
        console.log('💾 Identifying Unused Volumes...');

        try {
            const allVolumes = execSync('docker volume ls -q', { encoding: 'utf8' })
                .split('\n')
                .filter(vol => vol.trim());

            const academiaVolumes = [
                'academia_waha_data',
                'academia_n8n_data',
                'academia_postgres_data',
                'academia_redis_data',
                'academia_app_sessions'
            ];

            // Find volumes that might be from old deployments
            const unusedVolumes = allVolumes.filter(vol => {
                const volLower = vol.toLowerCase();
                return (volLower.includes('postgres') ||
                        volLower.includes('redis') ||
                        volLower.includes('n8n') ||
                        volLower.includes('waha')) &&
                       !academiaVolumes.includes(vol);
            });

            this.volumesToClean = unusedVolumes;

            if (this.volumesToClean.length > 0) {
                console.log('Found potentially unused volumes:');
                this.volumesToClean.forEach(volume => {
                    console.log(`   - ${volume}`);
                });
            } else {
                console.log('✅ No unused volumes found');
            }

            console.log('');
        } catch (error) {
            console.log('⚠️  Could not identify unused volumes:', error.message);
        }
    }

    async generateCleanupPlan() {
        console.log('📋 Cleanup Plan:');
        console.log('='.repeat(30));

        let hasActions = false;

        if (this.orphanedContainers.length > 0) {
            console.log('🗑️  Containers to remove:');
            this.orphanedContainers.forEach(container => {
                console.log(`   - Stop and remove: ${container}`);
            });
            hasActions = true;
        }

        if (this.conflictingPorts.length > 0) {
            console.log('\n🚪 Port conflicts to resolve:');
            this.conflictingPorts.forEach(({ port, service, processInfo }) => {
                console.log(`   - Port ${port} (${service}): ${processInfo}`);
            });
            console.log('   Note: You may need to manually stop conflicting processes');
            hasActions = true;
        }

        if (this.volumesToClean.length > 0) {
            console.log('\n💾 Volumes to clean:');
            this.volumesToClean.forEach(volume => {
                console.log(`   - Remove unused volume: ${volume}`);
            });
            hasActions = true;
        }

        if (!hasActions) {
            console.log('✅ No cleanup actions needed - Docker environment is clean');
        }

        console.log('');
    }

    async executeCleanup() {
        const hasWork = this.orphanedContainers.length > 0 || this.volumesToClean.length > 0;

        if (!hasWork) {
            console.log('🎉 No cleanup required - environment is already clean!');
            return;
        }

        const confirmed = await this.askConfirmation(
            '⚠️  Do you want to proceed with the cleanup? This action cannot be undone. (y/N): '
        );

        if (!confirmed) {
            console.log('🛑 Cleanup cancelled by user');
            return;
        }

        console.log('🧹 Executing cleanup...');

        // Remove orphaned containers
        for (const container of this.orphanedContainers) {
            try {
                console.log(`   Stopping container: ${container}`);
                execSync(`docker stop ${container}`, { stdio: 'ignore' });
            } catch (error) {
                console.log(`   ⚠️  Could not stop ${container}: ${error.message}`);
            }

            try {
                console.log(`   Removing container: ${container}`);
                execSync(`docker rm ${container}`, { stdio: 'ignore' });
                console.log(`   ✅ Removed: ${container}`);
            } catch (error) {
                console.log(`   ❌ Could not remove ${container}: ${error.message}`);
            }
        }

        // Remove unused volumes
        for (const volume of this.volumesToClean) {
            try {
                console.log(`   Removing volume: ${volume}`);
                execSync(`docker volume rm ${volume}`, { stdio: 'ignore' });
                console.log(`   ✅ Removed: ${volume}`);
            } catch (error) {
                console.log(`   ❌ Could not remove ${volume}: ${error.message}`);
            }
        }

        // Additional cleanup
        try {
            console.log('   Pruning system...');
            execSync('docker system prune -f', { stdio: 'ignore' });
            console.log('   ✅ System pruned');
        } catch (error) {
            console.log(`   ⚠️  Could not prune system: ${error.message}`);
        }

        console.log('\n🎉 Cleanup completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Run: npm run docker:up');
        console.log('   2. Check: npm run health:all');
        console.log('   3. Test: npm run test:integration');
    }

    async askConfirmation(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }
}

// Run cleanup if called directly
if (require.main === module) {
    const cleanup = new DockerCleanup();
    cleanup.runCleanup().catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
}

module.exports = DockerCleanup;