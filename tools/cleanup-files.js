#!/usr/bin/env node

/**
 * LIMPEZA DE ARQUIVOS DESNECESSÁRIOS - FULLFORCE ACADEMIA
 *
 * Remove arquivos de desenvolvimento, testes e documentação desnecessária
 * mantendo apenas os arquivos essenciais para produção
 */

const fs = require('fs');
const path = require('path');

class FileCleanup {
    constructor() {
        this.filesToRemove = [];
        this.foldersToRemove = [];
        this.backupFolder = './cleanup-backup';
        this.dryRun = false;
    }

    // Arquivos específicos para remoção
    getFilesToRemove() {
        return [
            // HTML de desenvolvimento
            'qr-display.html',
            'whatsapp-qr.html',
            'whatsapp-production-dashboard.html',

            // Documentação desnecessária
            'WAHA_CLOUD_INTEGRATION_GUIDE.md',
            'DEPLOY_NUVEM_SIMPLES.md',
            'DEPLOYMENT_GUIDE.md',
            'DOCKER_SETUP.md',
            'SETUP_BAILEYS_WAHA.md',
            'SETUP_N8N_GOOGLE_WORKSPACE.md',
            'SETUP_OUTRO_COMPUTADOR.md',

            // Scripts de setup antigos
            'connect-whatsapp.js',
            'setup-complete-system.js',

            // Arquivos de configuração duplicados
            'docker-compose-academia-waha.yml',
            'docker-compose-waha-railway.yml',
            'Dockerfile.railway',
            'Dockerfile.waha',

            // Scripts de desenvolvimento
            'whatsapp-baileys-waha-simple.js',
            'whatsapp-waha-production.js',

            // Workflows antigos
            'academia-whatsapp-n8n-workflow.json',
            'workflow-manual-csv.json',
            'n8n-workflow-MINIMAL-TEST.json',

            // Guias antigos
            'GUIA_CSV_MANUAL.md',
            'GUIA_RAPIDO_CLIENTE.md',
            'TROUBLESHOOT_N8N.md',
            'SOLUCAO_N8N_IMPORT.md',
            'UPDATE_GOOGLE_SHEETS_ID.md',

            // Scripts de inicialização antigos
            'INICIAR_SISTEMA_PRODUCAO.bat',
            'RUN_ACADEMIA_COMPLETE.bat',
            'RUN_ACADEMIA_FINAL.bat',
            'START_ACADEMIA_AUTOMATION.bat',

            // Template antigo
            'academia-google-sheets-template.md'
        ];
    }

    // Pastas para remoção
    getFoldersToRemove() {
        return [
            'baileys_auth_info',
            'docs' // pasta antiga de documentação
        ];
    }

    async scanFiles() {
        console.log('🔍 ESCANEANDO ARQUIVOS PARA LIMPEZA...');
        console.log('═'.repeat(60));

        const allFiles = this.getFilesToRemove();
        const existingFiles = [];
        const missingFiles = [];

        for (const file of allFiles) {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                existingFiles.push({
                    name: file,
                    size: (stats.size / 1024).toFixed(2) + ' KB',
                    modified: stats.mtime.toLocaleDateString('pt-BR')
                });
            } else {
                missingFiles.push(file);
            }
        }

        console.log(`✅ Encontrados ${existingFiles.length} arquivos para remoção:`);
        existingFiles.forEach(file => {
            console.log(`   📄 ${file.name} (${file.size}, ${file.modified})`);
        });

        if (missingFiles.length > 0) {
            console.log(`\n⚠️ ${missingFiles.length} arquivos já não existem:`);
            missingFiles.slice(0, 5).forEach(file => {
                console.log(`   🚫 ${file}`);
            });
            if (missingFiles.length > 5) {
                console.log(`   ... e mais ${missingFiles.length - 5} arquivos`);
            }
        }

        // Verificar pastas
        const folders = this.getFoldersToRemove();
        const existingFolders = [];

        for (const folder of folders) {
            if (fs.existsSync(folder) && fs.statSync(folder).isDirectory()) {
                existingFolders.push(folder);
            }
        }

        if (existingFolders.length > 0) {
            console.log(`\n📁 Pastas para remoção: ${existingFolders.length}`);
            existingFolders.forEach(folder => {
                console.log(`   📂 ${folder}/`);
            });
        }

        return { existingFiles, existingFolders };
    }

    async createBackup(files, folders) {
        if (!fs.existsSync(this.backupFolder)) {
            fs.mkdirSync(this.backupFolder, { recursive: true });
        }

        console.log('\n💾 CRIANDO BACKUP DOS ARQUIVOS...');

        for (const file of files) {
            try {
                const backupPath = path.join(this.backupFolder, file.name);
                fs.copyFileSync(file.name, backupPath);
                console.log(`   ✅ ${file.name} → backup/`);
            } catch (error) {
                console.log(`   ❌ Erro no backup de ${file.name}: ${error.message}`);
            }
        }

        console.log(`✅ Backup criado em: ${this.backupFolder}`);
    }

    async removeFiles(files, folders) {
        console.log('\n🗑️ REMOVENDO ARQUIVOS...');

        let removedCount = 0;
        let errorCount = 0;

        // Remover arquivos
        for (const file of files) {
            try {
                if (!this.dryRun) {
                    fs.unlinkSync(file.name);
                }
                console.log(`   ✅ Removido: ${file.name}`);
                removedCount++;
            } catch (error) {
                console.log(`   ❌ Erro ao remover ${file.name}: ${error.message}`);
                errorCount++;
            }
        }

        // Remover pastas
        for (const folder of folders) {
            try {
                if (!this.dryRun) {
                    fs.rmSync(folder, { recursive: true, force: true });
                }
                console.log(`   ✅ Pasta removida: ${folder}/`);
                removedCount++;
            } catch (error) {
                console.log(`   ❌ Erro ao remover pasta ${folder}: ${error.message}`);
                errorCount++;
            }
        }

        return { removedCount, errorCount };
    }

    async calculateSpaceSaved(files) {
        let totalSize = 0;
        for (const file of files) {
            try {
                const stats = fs.statSync(file.name);
                totalSize += stats.size;
            } catch (error) {
                // Arquivo não existe, ignorar
            }
        }
        return (totalSize / 1024 / 1024).toFixed(2); // MB
    }

    async execute(dryRun = false) {
        this.dryRun = dryRun;

        console.log('🧹 FULLFORCE ACADEMIA - LIMPEZA DE ARQUIVOS');
        console.log('═'.repeat(60));
        console.log(`🎯 Modo: ${dryRun ? 'SIMULAÇÃO' : 'EXECUÇÃO REAL'}`);
        console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
        console.log('═'.repeat(60));

        try {
            const { existingFiles, existingFolders } = await this.scanFiles();

            if (existingFiles.length === 0 && existingFolders.length === 0) {
                console.log('\n✨ PROJETO JÁ ESTÁ LIMPO!');
                console.log('Nenhum arquivo desnecessário encontrado.');
                return;
            }

            const spaceSaved = await this.calculateSpaceSaved(existingFiles);
            console.log(`\n💾 Espaço a ser liberado: ${spaceSaved} MB`);

            if (!dryRun) {
                await this.createBackup(existingFiles, existingFolders);
            }

            const { removedCount, errorCount } = await this.removeFiles(existingFiles, existingFolders);

            console.log('\n' + '═'.repeat(60));
            console.log('🎉 LIMPEZA CONCLUÍDA!');
            console.log('═'.repeat(60));
            console.log(`✅ Arquivos removidos: ${removedCount}`);
            console.log(`❌ Erros: ${errorCount}`);
            console.log(`💾 Espaço liberado: ${spaceSaved} MB`);

            if (!dryRun) {
                console.log(`📦 Backup salvo em: ${this.backupFolder}`);
            }

            console.log('\n🚀 PROJETO OTIMIZADO PARA PRODUÇÃO!');

        } catch (error) {
            console.error('\n❌ ERRO NA LIMPEZA:', error.message);
            throw error;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const dryRun = process.argv.includes('--dry-run');

    const cleanup = new FileCleanup();
    cleanup.execute(dryRun)
        .then(() => {
            console.log('\n✅ Limpeza executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Falha na limpeza:', error.message);
            process.exit(1);
        });
}

module.exports = FileCleanup;