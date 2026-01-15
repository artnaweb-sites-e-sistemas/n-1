const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔧 Corrigindo hífens duplos (--) nos nomes de imagens...\n');

// Configuração
const WORDPRESS_URL = 'https://n-1.artnaweb.com.br';
const UPLOAD_PATH = '/wp-content/uploads/2026/01';

// Ler o CSV original
const csvContent = fs.readFileSync('./n1-woocommerce-products-final.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

console.log(`📊 Total de produtos: ${records.length}`);

// Processar cada registro
let updatedCount = 0;
let fixedCount = 0;

const fixedRecords = records.map(record => {
    const newRecord = { ...record };
    let imageName = (record.Images || '').trim();
    
    if (imageName && imageName.length > 0) {
        // Se já é uma URL completa, extrair o nome do arquivo
        let isUrl = false;
        if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
            isUrl = true;
            const urlParts = imageName.split('/');
            imageName = urlParts[urlParts.length - 1];
        }
        
        // Corrigir hífen duplo antes do número (--1.png ou --1.jpg)
        // Padrão: qualquer coisa seguida de --1. e extensão
        let correctedName = imageName;
        
        // Substituir --1. por -1.
        if (correctedName.includes('--1.')) {
            correctedName = correctedName.replace(/--1\./g, '-1.');
            fixedCount++;
            console.log(`   ✓ Corrigido: ${imageName} → ${correctedName}`);
        }
        
        // Também verificar outros padrões como --2., --3., etc.
        correctedName = correctedName.replace(/--(\d+)\./g, '-$1.');
        
        // Construir URL completa
        const imageUrl = isUrl 
            ? `${WORDPRESS_URL}${UPLOAD_PATH}/${correctedName}`
            : `${WORDPRESS_URL}${UPLOAD_PATH}/${correctedName}`;
        
        newRecord.Images = imageUrl;
        updatedCount++;
    } else {
        newRecord.Images = '';
    }
    
    return newRecord;
});

// Gerar CSV corrigido
const output = stringify(fixedRecords, {
    header: true,
    quoted: true,
    quoted_empty: true
});

fs.writeFileSync('./n1-woocommerce-products-with-urls.csv', output, 'utf-8');

console.log(`\n✅ CSV corrigido gerado!`);
console.log(`   - Produtos processados: ${updatedCount}`);
console.log(`   - Arquivos com hífen duplo corrigidos: ${fixedCount}`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);

