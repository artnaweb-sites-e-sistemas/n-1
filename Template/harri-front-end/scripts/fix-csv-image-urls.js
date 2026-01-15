const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🖼️  Convertendo nomes de imagens para URLs completas do WordPress...\n');

// Configuração
const WORDPRESS_URL = 'https://n-1.artnaweb.com.br';
const UPLOAD_PATH = '/wp-content/uploads/2026/01'; // Caminho correto das imagens

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
    const imageName = (record.Images || '').trim();
    
    if (imageName && imageName.length > 0) {
        // Se já é uma URL completa, manter
        if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
            // Já é URL completa, manter
            newRecord.Images = imageName;
        } else {
            // Converter nome do arquivo para URL completa
            const imageUrl = `${WORDPRESS_URL}${UPLOAD_PATH}/${imageName}`;
            newRecord.Images = imageUrl;
            updatedCount++;
        }
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

console.log(`✅ CSV corrigido gerado!`);
console.log(`   - Produtos com URLs de imagens atualizadas: ${updatedCount}`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);
console.log(`\n📝 Formato das URLs geradas:`);
console.log(`   ${WORDPRESS_URL}${UPLOAD_PATH}/[nome-imagem].jpg`);
console.log(`\n⚠️  IMPORTANTE:`);
console.log(`   Certifique-se de que o caminho ${UPLOAD_PATH} está correto.`);
console.log(`   Se as imagens estão em outro diretório, ajuste a variável UPLOAD_PATH no script.`);

