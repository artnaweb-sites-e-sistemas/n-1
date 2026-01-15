const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔧 Corrigindo extensões: .png para produtos que falharam, .jpg para o resto...\n');

// Configuração
const WORDPRESS_URL = 'https://n-1.artnaweb.com.br';
const UPLOAD_PATH = '/wp-content/uploads/2026/01';

// Lista dos nomes dos produtos que falharam (baseado na imagem que você mostrou)
// Estes devem usar .png
const failedProductNames = [
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

console.log(`📊 Total de produtos: ${records.length}`);

// Processar cada registro
let updatedCount = 0;
let pngCount = 0;
let jpgCount = 0;

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
        
        // Verificar se este produto falhou
        const productName = record.Name || '';
        const isFailed = failedProductNames.some(failed => productName.includes(failed));
        
        // Determinar extensão
        let ext = '.jpg'; // Padrão
        if (isFailed) {
            ext = '.png'; // Produtos que falharam usam .png
            pngCount++;
        } else {
            jpgCount++;
        }
        
        // Construir URL completa
        const correctImageName = nameWithoutExt + ext;
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

fs.writeFileSync('./n1-woocommerce-products-with-urls.csv', output, 'utf-8');

console.log(`\n✅ CSV corrigido gerado!`);
console.log(`   - Produtos com URLs atualizadas: ${updatedCount}`);
console.log(`   - Imagens .jpg: ${jpgCount}`);
console.log(`   - Imagens .png: ${pngCount} (produtos que falharam)`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);
console.log(`\n⚠️  IMPORTANTE:`);
console.log(`   Se você souber os nomes dos outros 29 produtos que falharam,`);
console.log(`   adicione-os na lista 'failedProductNames' no script e execute novamente.`);

