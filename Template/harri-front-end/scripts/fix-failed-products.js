const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Lista dos produtos que falharam (baseado na imagem)
const failedProducts = [
    'UEINZZ: TERRITÓRIO DE TRANSMUTAÇÃO POÉTICA E POLÍTICA',
    'Sonhos em série: arquitetura e pré-fabricação nas margens do capitalismo',
    'Pensar Gaza: entrevista com Étienne Balibar',
    // Adicione os outros 29 produtos que falharam aqui
];

// Ler o CSV original
const csvContent = fs.readFileSync('./n1-woocommerce-products-final.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

// Filtrar produtos que falharam e remover a imagem
const failedRecords = records.filter(record => {
    // Verificar se o produto está na lista de falhas ou se a imagem não foi encontrada
    const productName = record.Name || '';
    return failedProducts.some(failed => productName.includes(failed)) || 
           !record.Images || record.Images.trim() === '';
});

// Remover a coluna Images dos produtos que falharam
const fixedRecords = records.map(record => {
    const productName = record.Name || '';
    const isFailed = failedProducts.some(failed => productName.includes(failed));
    
    if (isFailed) {
        // Criar uma cópia sem a imagem
        const newRecord = { ...record };
        newRecord.Images = ''; // Remover a imagem para permitir importação
        return newRecord;
    }
    return record;
});

// Gerar CSV corrigido
const output = stringify(fixedRecords, {
    header: true,
    quoted: true,
    quoted_empty: true
});

fs.writeFileSync('./n1-woocommerce-products-fixed.csv', output, 'utf-8');

console.log(`✅ CSV corrigido gerado!`);
console.log(`   Total de produtos: ${records.length}`);
console.log(`   Produtos que falharam: ${failedRecords.length}`);
console.log(`   Arquivo gerado: n1-woocommerce-products-fixed.csv`);
console.log(`\n📝 Próximos passos:`);
console.log(`   1. Faça upload das imagens para wp-content/uploads/2025/01/ no WordPress`);
console.log(`   2. Importe o arquivo n1-woocommerce-products-fixed.csv`);
console.log(`   3. Adicione as imagens manualmente aos produtos ou atualize o CSV com URLs completas`);

