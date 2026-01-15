const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔍 Corrigindo extensões: tentando .png para todas as imagens...\n');

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

// Verificar quais arquivos existem na pasta de imagens
const imagesDir = './n1-products-images';
let imageFiles = [];
if (fs.existsSync(imagesDir)) {
    imageFiles = fs.readdirSync(imagesDir);
}

// Criar um mapa de nomes de arquivo (sem extensão) para extensão real
const imageMap = new Map();
imageFiles.forEach(file => {
    const nameWithoutExt = path.parse(file).name;
    const ext = path.parse(file).ext.toLowerCase();
    imageMap.set(nameWithoutExt, ext);
});

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
        
        // Determinar extensão a usar
        // Primeiro, verificar extensão real na pasta local
        let ext = imageMap.get(nameWithoutExt);
        
        // Se não encontrou na pasta local, tentar .png primeiro (como o usuário pediu)
        if (!ext) {
            // Tentar .png primeiro para produtos que podem estar em .png no WordPress
            ext = '.png';
            pngCount++;
        } else {
            // Usar a extensão encontrada
            if (ext === '.png') {
                pngCount++;
            } else {
                jpgCount++;
            }
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
console.log(`   - Imagens .png: ${pngCount}`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);
console.log(`\n📝 Estratégia aplicada:`);
console.log(`   - Para imagens encontradas na pasta local: usa extensão real`);
console.log(`   - Para imagens não encontradas: tenta .png primeiro`);


