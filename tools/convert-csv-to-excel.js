#!/usr/bin/env node

/**
 * CONVERSOR CSV PARA EXCEL - FULLFORCE ACADEMIA
 *
 * Converte os dados CSV de alunos para formato Excel compatível
 * com o sistema de processamento de campanhas
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertCsvToExcel(csvPath, outputPath = null) {
    try {
        console.log('🏋️ FULLFORCE ACADEMIA - CONVERSOR CSV → EXCEL');
        console.log('═'.repeat(60));
        console.log(`📂 Arquivo CSV: ${path.basename(csvPath)}`);

        // Ler arquivo CSV
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').filter(line => line.trim());

        console.log(`📊 Total de linhas: ${lines.length}`);

        // Processar dados
        const headers = lines[0].split(',');
        const dataRows = lines.slice(1).map(line => {
            // Processar linha respeitando vírgulas dentro de aspas
            const values = [];
            let currentValue = '';
            let insideQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim()); // Adicionar último valor

            return values;
        });

        console.log(`👥 Alunos processados: ${dataRows.length}`);

        // Criar planilha Excel com formato FullForce Academia
        const workbook = XLSX.utils.book_new();

        // LINHA 1: Título
        const title = [['Exportação de Alunos']];

        // LINHA 2: Informações de exportação
        const exportInfo = [[`Eslayne em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`]];

        // LINHA 3: Vazia
        const emptyLine = [['']];

        // LINHA 4: Headers
        const headerLine = [headers];

        // LINHAS 5+: Dados dos alunos
        const allData = [
            ...title,
            ...exportInfo,
            ...emptyLine,
            ...headerLine,
            ...dataRows
        ];

        // Criar worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(allData);

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');

        // Determinar caminho de saída
        if (!outputPath) {
            const baseName = path.basename(csvPath, path.extname(csvPath));
            outputPath = path.join(path.dirname(csvPath), `${baseName}.xlsx`);
        }

        // Salvar arquivo Excel
        XLSX.writeFile(workbook, outputPath);

        console.log('✅ CONVERSÃO CONCLUÍDA!');
        console.log(`📄 Arquivo Excel gerado: ${path.basename(outputPath)}`);
        console.log(`📍 Local: ${outputPath}`);

        return outputPath;

    } catch (error) {
        console.error('❌ ERRO NA CONVERSÃO:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const csvPath = process.argv[2];

    if (!csvPath) {
        console.error('❌ Uso: node convert-csv-to-excel.js <arquivo.csv>');
        process.exit(1);
    }

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ Arquivo não encontrado: ${csvPath}`);
        process.exit(1);
    }

    try {
        const excelPath = convertCsvToExcel(csvPath);
        console.log('\n🚀 PRONTO PARA CAMPANHA!');
        console.log(`📱 Execute: node process-excel-campaign.js "${excelPath}" --dry-run`);
    } catch (error) {
        console.error('❌ FALHA NA CONVERSÃO:', error.message);
        process.exit(1);
    }
}

module.exports = { convertCsvToExcel };