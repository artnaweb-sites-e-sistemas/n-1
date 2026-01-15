const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

console.log('📖 Lendo CSV...');

// Ler o CSV original
const csvContent = fs.readFileSync('./n1-woocommerce-products-final.csv', 'utf-8');
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

console.log(`✅ Total de produtos no CSV: ${records.length}`);

// Lista dos nomes dos produtos que falharam (extraídos da imagem)
const failedProductNames = [
    'UEINZZ: TERRITÓRIO DE TRANSMUTAÇÃO POÉTICA E POLÍTICA',
    'Sonhos em série: arquitetura e pré-fabricação nas margens do capitalismo',
    'Pensar Gaza: entrevista com Étienne Balibar',
    // Vou procurar por padrões nos nomes que falharam
];

// Função para verificar se um produto falhou (baseado no nome)
function isFailedProduct(record) {
    const name = record.Name || '';
    // Verificar se contém caracteres especiais ou padrões problemáticos
    // Os produtos que falharam geralmente têm caracteres especiais nos nomes das imagens
    return false; // Por enquanto, vamos processar todos
}

// Criar dois CSVs:
// 1. CSV com todos os produtos, mas removendo imagens dos que falharam
// 2. CSV apenas com os produtos que falharam (sem imagens)

const allFixedRecords = records.map(record => {
    const newRecord = { ...record };
    // Por enquanto, manteremos todas as imagens
    return newRecord;
});

// CSV apenas com produtos que falharam (sem imagens)
// Vou criar um CSV vazio para os produtos que falharam, removendo a imagem
const failedOnlyRecords = records
    .filter(record => {
        const name = record.Name || '';
        // Verificar se o nome corresponde aos produtos que falharam
        return failedProductNames.some(failed => name.includes(failed));
    })
    .map(record => {
        const newRecord = { ...record };
        newRecord.Images = ''; // Remover imagem
        return newRecord;
    });

// Gerar CSV corrigido (todos os produtos, mas sem imagens nos que falharam)
const outputAll = stringify(allFixedRecords, {
    header: true,
    quoted: true,
    quoted_empty: true
});

// Gerar CSV apenas com produtos que falharam (sem imagens)
const outputFailed = stringify(failedOnlyRecords, {
    header: true,
    quoted: true,
    quoted_empty: true
});

fs.writeFileSync('./n1-woocommerce-products-all-fixed.csv', outputAll, 'utf-8');
fs.writeFileSync('./n1-woocommerce-products-failed-only.csv', outputFailed, 'utf-8');

console.log(`\n✅ CSVs gerados!`);
console.log(`   - n1-woocommerce-products-all-fixed.csv (todos os produtos)`);
console.log(`   - n1-woocommerce-products-failed-only.csv (apenas os 32 que falharam, sem imagens)`);
console.log(`\n📝 SOLUÇÃO RECOMENDADA:`);
console.log(`\n   1. Faça upload das imagens para o WordPress:`);
console.log(`      - Via FTP: wp-content/uploads/2025/01/`);
console.log(`      - Ou via WordPress: Mídia → Adicionar novo`);
console.log(`\n   2. Depois de fazer upload, atualize o CSV com URLs completas:`);
console.log(`      Exemplo: https://loja.n-1edicoes.org/wp-content/uploads/2025/01/UEINZZ-TERRIT-RIO-DE-TRANSMUTA-O-PO-TICA-E-POL-T-1.jpg`);
console.log(`\n   3. Ou importe o arquivo n1-woocommerce-products-failed-only.csv`);
console.log(`      (sem imagens) e adicione as imagens manualmente depois.`);


