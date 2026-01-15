const fs = require('fs');
const { parse } = require('csv-parse/sync');

console.log('📋 Listando produtos do CSV...\n');

// Ler o CSV original
const csvContent = fs.readFileSync('./n1-woocommerce-products-final.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

// Lista dos produtos que falharam (baseado na imagem que você mostrou)
const failedProductNames = [
    'UEINZZ: TERRITÓRIO DE TRANSMUTAÇÃO POÉTICA E POLÍTICA',
    'Sonhos em série: arquitetura e pré-fabricação nas margens do capitalismo',
    'Pensar Gaza: entrevista com Étienne Balibar',
    // Adicione os outros 29 aqui se souber
];

console.log('🔍 Procurando produtos que falharam...\n');

const failedProducts = records.filter(record => {
    const name = record.Name || '';
    return failedProductNames.some(failed => name.includes(failed));
});

console.log(`📊 Produtos que falharam encontrados: ${failedProducts.length}\n`);

failedProducts.forEach((product, index) => {
    const imageName = product.Images || '';
    console.log(`${index + 1}. ${product.Name}`);
    console.log(`   Imagem: ${imageName}`);
    console.log(`   SKU: ${product.SKU || 'N/A'}\n`);
});

console.log('\n💡 Use esses nomes de imagem para criar um CSV com extensão .png');

