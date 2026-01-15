const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔧 Corrigindo hífens duplos (--) e usando .png para produtos que falharam...\n');

// Configuração
const WORDPRESS_URL = 'https://n-1.artnaweb.com.br';
const UPLOAD_PATH = '/wp-content/uploads/2026/01';

// Lista dos SKUs dos produtos que falharam (devem usar .png)
const failedSKUs = new Set([
    'N1-4',  // Sonhos em série
    'N1-20', // A última guerra
    'N1-22', // A raça no divã
    'N1-30', // A chuva desmancha todos os fatos
    'N1-40', // assim é a mulher por trás de seu véu
    'N1-149', // O judeu pós-judeu
]);

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
let fixedHyphenCount = 0;
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
        
        // Corrigir hífen duplo antes do número (--1.png ou --1.jpg)
        let correctedName = imageName;
        if (correctedName.includes('--1.')) {
            correctedName = correctedName.replace(/--1\./g, '-1.');
            fixedHyphenCount++;
        }
        // Também verificar outros padrões como --2., --3., etc.
        correctedName = correctedName.replace(/--(\d+)\./g, '-$1.');
        
        // Determinar extensão baseado no SKU
        const sku = record.SKU || '';
        const isFailed = failedSKUs.has(sku);
        
        // Remover extensão atual e adicionar a correta
        const nameWithoutExt = path.parse(correctedName).name;
        const ext = isFailed ? '.png' : '.jpg';
        
        if (isFailed) {
            pngCount++;
        } else {
            jpgCount++;
        }
        
        // Construir URL completa
        const finalImageName = nameWithoutExt + ext;
        const imageUrl = `${WORDPRESS_URL}${UPLOAD_PATH}/${finalImageName}`;
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
console.log(`   - Arquivos com hífen duplo corrigidos: ${fixedHyphenCount}`);
console.log(`   - Imagens .jpg: ${jpgCount}`);
console.log(`   - Imagens .png: ${pngCount} (produtos que falharam)`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);


