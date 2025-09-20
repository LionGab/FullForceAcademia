const XLSX = require('xlsx');
const path = require('path');

function inspectExcelFile(filePath) {
    try {
        console.log('🔍 INSPEÇÃO DO ARQUIVO EXCEL');
        console.log('═'.repeat(50));
        console.log(`📂 Arquivo: ${path.basename(filePath)}`);

        // Ler o arquivo
        const workbook = XLSX.readFile(filePath);

        console.log(`📋 Planilhas encontradas: ${workbook.SheetNames.length}`);
        workbook.SheetNames.forEach((name, index) => {
            console.log(`   ${index + 1}. ${name}`);
        });

        // Examinar cada planilha
        workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            console.log(`\\n📊 PLANILHA ${sheetIndex + 1}: ${sheetName}`);
            console.log('-'.repeat(30));

            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            console.log(`📏 Total de linhas: ${jsonData.length}`);

            if (jsonData.length > 0) {
                const headers = jsonData[0];
                console.log(`📋 Colunas (${headers.length}):`);
                headers.forEach((header, index) => {
                    console.log(`   ${index + 1}. "${header}"`);
                });

                // Mostrar algumas linhas de amostra
                console.log(`\\n📝 Primeiras 3 linhas de dados:`);
                for (let i = 0; i < Math.min(4, jsonData.length); i++) {
                    const row = jsonData[i];
                    console.log(`   Linha ${i + 1}: [${row.map(cell =>
                        typeof cell === 'string' && cell.length > 20
                            ? `"${cell.substring(0, 20)}..."`
                            : `"${cell}"`
                    ).join(', ')}]`);
                }

                // Analisar tipos de dados
                if (jsonData.length > 1) {
                    console.log(`\\n🔍 Análise de dados:`);
                    const dataRow = jsonData[1];
                    dataRow.forEach((cell, index) => {
                        const header = headers[index] || `Coluna${index + 1}`;
                        const type = typeof cell;
                        const sample = typeof cell === 'string' && cell.length > 30
                            ? cell.substring(0, 30) + '...'
                            : cell;
                        console.log(`   ${header}: ${type} - "${sample}"`);
                    });
                }

                // Verificar se há dados que parecem com telefones
                console.log(`\\n📱 Busca por telefones nas primeiras 10 linhas:`);
                for (let i = 1; i < Math.min(11, jsonData.length); i++) {
                    const row = jsonData[i];
                    row.forEach((cell, colIndex) => {
                        if (cell && typeof cell === 'string') {
                            const cleanCell = cell.replace(/\\D/g, '');
                            if (cleanCell.length >= 10 && cleanCell.length <= 15) {
                                console.log(`   Linha ${i + 1}, Coluna ${colIndex + 1} (${headers[colIndex]}): "${cell}" → ${cleanCell}`);
                            }
                        } else if (cell && typeof cell === 'number' && cell.toString().length >= 10) {
                            console.log(`   Linha ${i + 1}, Coluna ${colIndex + 1} (${headers[colIndex]}): ${cell} (número)`);
                        }
                    });
                }

                // Verificar se há dados que parecem com nomes
                console.log(`\\n👤 Busca por nomes nas primeiras 10 linhas:`);
                for (let i = 1; i < Math.min(11, jsonData.length); i++) {
                    const row = jsonData[i];
                    row.forEach((cell, colIndex) => {
                        if (cell && typeof cell === 'string' && cell.length > 2 && cell.length < 50) {
                            const hasNumbers = /\\d/.test(cell);
                            const hasLetters = /[a-zA-ZÀ-ÿ]/.test(cell);
                            const hasSpaces = /\\s/.test(cell);

                            if (hasLetters && !hasNumbers && (hasSpaces || cell.length > 4)) {
                                console.log(`   Linha ${i + 1}, Coluna ${colIndex + 1} (${headers[colIndex]}): "${cell}"`);
                            }
                        }
                    });
                }
            }
        });

        console.log(`\\n✅ Inspeção concluída!`);

    } catch (error) {
        console.error('❌ Erro ao inspecionar arquivo:', error.message);
    }
}

// CLI
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('📋 Uso: node inspect-excel.js <arquivo-excel>');
    console.log('💡 Exemplo: node inspect-excel.js C:\\\\Users\\\\User\\\\Downloads\\\\Alunos.xlsx');
    process.exit(1);
}

inspectExcelFile(args[0]);