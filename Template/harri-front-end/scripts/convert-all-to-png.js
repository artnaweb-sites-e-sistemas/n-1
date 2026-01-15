const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔄 Convertendo todas as extensões de .jpg para .png...\n');

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

const fixedRecords = records.map(record => {
    const newRecord = { ...record };
    let imageName = (record.Images || '').trim();
    
    if (imageName && imageName.length > 0) {
        // Se já é uma URL completa, extrair o nome do arquivo
        if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
            const urlParts = imageName.split('/');
            imageName = urlParts[urlParts.length - 1];
        }
        
        // Remover extensão atual
        const nameWithoutExt = path.parse(imageName).name;
        
        // Converter para .png
        const correctImageName = nameWithoutExt + '.png';
        const imageUrl = `${WORDPRESS_URL}${UPLOAD_PATH}/${correctImageName}`;
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

fs.writeFileSync('./n1-woocommerce-products-with-urls-png.csv', output, 'utf-8');

console.log(`\n✅ CSV corrigido gerado com extensões .png!`);
console.log(`   - Produtos com URLs atualizadas: ${updatedCount}`);
console.log(`   - Todas as imagens agora usam extensão .png`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls-png.csv`);
console.log(`\n📝 Próximos passos:`);
console.log(`   1. Teste importar este CSV`);
console.log(`   2. Se ainda falhar, pode ser que algumas sejam .jpg e outras .png`);
console.log(`   3. Nesse caso, me informe quais produtos devem usar .jpg`);

