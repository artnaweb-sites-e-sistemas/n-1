const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔍 Verificando extensões reais das imagens e corrigindo URLs...\n');

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
    console.log(`📁 Total de imagens na pasta: ${imageFiles.length}`);
}

// Criar um mapa de nomes de arquivo (sem extensão) para extensão real
const imageMap = new Map();
imageFiles.forEach(file => {
    const nameWithoutExt = path.parse(file).name;
    const ext = path.parse(file).ext.toLowerCase();
    // Se já existe, manter a primeira encontrada (prioridade: .jpg > .png)
    if (!imageMap.has(nameWithoutExt) || ext === '.jpg') {
        imageMap.set(nameWithoutExt, ext);
    }
});

console.log(`📋 Mapeamento de extensões criado: ${imageMap.size} arquivos únicos`);

// Processar cada registro
let updatedCount = 0;
let pngCount = 0;
let jpgCount = 0;
let notFoundCount = 0;

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
        
        // Verificar qual extensão realmente existe
        const realExt = imageMap.get(nameWithoutExt);
        
        if (realExt) {
            // Usar a extensão real encontrada
            const correctImageName = nameWithoutExt + realExt;
            const imageUrl = `${WORDPRESS_URL}${UPLOAD_PATH}/${correctImageName}`;
            newRecord.Images = imageUrl;
            updatedCount++;
            
            if (realExt === '.png') {
                pngCount++;
            } else if (realExt === '.jpg' || realExt === '.jpeg') {
                jpgCount++;
            }
        } else {
            // Arquivo não encontrado, tentar manter .jpg ou .png
            // Se termina com .jpg, manter; se não, tentar .png
            if (!imageName.toLowerCase().endsWith('.jpg') && 
                !imageName.toLowerCase().endsWith('.jpeg') && 
                !imageName.toLowerCase().endsWith('.png')) {
                // Adicionar .jpg por padrão
                imageName = nameWithoutExt + '.jpg';
            }
            const imageUrl = `${WORDPRESS_URL}${UPLOAD_PATH}/${imageName}`;
            newRecord.Images = imageUrl;
            notFoundCount++;
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

console.log(`\n✅ CSV corrigido gerado!`);
console.log(`   - Produtos com URLs atualizadas: ${updatedCount}`);
console.log(`   - Imagens .jpg: ${jpgCount}`);
console.log(`   - Imagens .png: ${pngCount}`);
console.log(`   - Imagens não encontradas (usando .jpg): ${notFoundCount}`);
console.log(`   - Arquivo: n1-woocommerce-products-with-urls.csv`);
console.log(`\n📝 Formato das URLs geradas:`);
console.log(`   ${WORDPRESS_URL}${UPLOAD_PATH}/[nome-imagem].[extensão-real]`);


