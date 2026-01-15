const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('🔍 Analisando CSV e removendo imagens dos produtos que falharam...\n');

// Ler o CSV original
const csvContent = fs.readFileSync('./n1-woocommerce-products-final.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

console.log(`📊 Total de produtos: ${records.length}`);

// Lista dos SKUs ou nomes dos produtos que falharam (baseado na imagem)
// Vou usar uma abordagem mais inteligente: verificar se a imagem existe localmente
const imagesDir = './n1-products-images';
const imageFiles = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];

console.log(`📁 Imagens disponíveis: ${imageFiles.length}`);

// Criar um mapa de imagens disponíveis
const availableImages = new Set(imageFiles.map(f => f.toLowerCase()));

// Processar cada registro
let fixedCount = 0;
const fixedRecords = records.map(record => {
    const newRecord = { ...record };
    const imageName = (record.Images || '').trim();
    
    if (imageName) {
        // Verificar se a imagem existe localmente
        const imageExists = availableImages.has(imageName.toLowerCase());
        
        // Se a imagem não existe ou está vazia, remover
        if (!imageExists) {
            newRecord.Images = '';
            fixedCount++;
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

fs.writeFileSync('./n1-woocommerce-products-no-images.csv', output, 'utf-8');

console.log(`\n✅ CSV corrigido gerado!`);
console.log(`   - Produtos com imagens removidas: ${fixedCount}`);
console.log(`   - Arquivo: n1-woocommerce-products-no-images.csv`);
console.log(`\n📝 PRÓXIMOS PASSOS:`);
console.log(`\n   OPÇÃO 1 - Importar sem imagens e adicionar depois:`);
console.log(`   1. Importe o arquivo n1-woocommerce-products-no-images.csv`);
console.log(`   2. Depois, adicione as imagens manualmente em cada produto`);
console.log(`\n   OPÇÃO 2 - Fazer upload das imagens primeiro:`);
console.log(`   1. Faça upload de TODAS as imagens da pasta n1-products-images/`);
console.log(`      para: wp-content/uploads/2025/01/ (via FTP ou WordPress)`);
console.log(`   2. Depois, use o CSV original (n1-woocommerce-products-final.csv)`);
console.log(`      mas atualize as URLs das imagens para:`);
console.log(`      https://loja.n-1edicoes.org/wp-content/uploads/2025/01/[nome-imagem].jpg`);


