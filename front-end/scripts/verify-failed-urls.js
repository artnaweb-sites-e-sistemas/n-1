const fs = require('fs');
const { parse } = require('csv-parse/sync');

const csvContent = fs.readFileSync('./n1-woocommerce-products-with-urls.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

const failedSKUs = ['N1-4', 'N1-20', 'N1-22', 'N1-30', 'N1-40', 'N1-149'];

console.log('🔍 Verificando URLs dos produtos que falharam:\n');

failedSKUs.forEach(sku => {
    const product = records.find(r => r.SKU === sku);
    if (product) {
        const url = product.Images || 'SEM IMAGEM';
        console.log(`${sku} - ${product.Name}`);
        console.log(`   URL: ${url}`);
        console.log(`   ✅ Hífen duplo corrigido: ${!url.includes('--1.')}`);
        console.log(`   ✅ Extensão .png: ${url.endsWith('.png')}`);
        console.log('');
    } else {
        console.log(`${sku} - PRODUTO NÃO ENCONTRADO\n`);
    }
});


