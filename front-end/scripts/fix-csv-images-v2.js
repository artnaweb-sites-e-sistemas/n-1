/**
 * Script para ajustar o CSV e manter apenas a primeira imagem de cada produto
 * Usa biblioteca csv-parse para lidar corretamente com campos complexos
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const INPUT_CSV = 'n1-woocommerce-products.csv';
const OUTPUT_CSV = 'n1-woocommerce-products-final.csv';

// Ler e parsear o CSV
const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
});

console.log(`📖 Lidos ${records.length} produtos do CSV`);

// Processar cada registro
const processedRecords = records.map((record, index) => {
    // Pegar apenas a primeira imagem
    if (record.Images) {
        const images = record.Images.split(',').map(s => s.trim());
        const firstImage = images[0] || '';
        record.Images = firstImage;
    }
    
    // Limpar descrição (remover "ADICIONAR" se presente)
    if (record.Description) {
        record.Description = record.Description
            .replace(/\s*ADICIONAR\s*$/gi, '')
            .replace(/R\$\s*[\d.,]+\s*$/g, '')
            .trim();
    }
    
    if (record['Short description']) {
        record['Short description'] = record['Short description']
            .replace(/\s*ADICIONAR\s*$/gi, '')
            .replace(/R\$\s*[\d.,]+\s*$/g, '')
            .trim();
    }
    
    return record;
});

// Gerar novo CSV
const output = stringify(processedRecords, {
    header: true,
    quoted: true,
});

fs.writeFileSync(OUTPUT_CSV, output, 'utf-8');

console.log(`✅ CSV final salvo em: ${OUTPUT_CSV}`);
console.log(`   Total de produtos: ${processedRecords.length}`);



