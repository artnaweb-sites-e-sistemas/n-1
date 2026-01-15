/**
 * Script para ajustar o CSV e manter apenas a primeira imagem de cada produto
 */

const fs = require('fs');
const path = require('path');

const INPUT_CSV = 'n1-woocommerce-products.csv';
const OUTPUT_CSV = 'n1-woocommerce-products-fixed.csv';

// Ler o arquivo CSV
const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');
const lines = csvContent.split('\n');

// Header
const header = lines[0];
const newLines = [header];

// Processar cada linha
for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Encontrar a coluna de imagens (penúltima coluna antes da URL)
    // O CSV usa vírgula como separador, mas alguns campos podem ter vírgula dentro de aspas
    
    // Usar regex para fazer split respeitando aspas
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
        } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current); // último campo
    
    // A coluna de imagens é a 16ª (índice 15)
    if (fields.length >= 16) {
        let imagesField = fields[15];
        
        // Remover aspas se houver
        imagesField = imagesField.replace(/^"|"$/g, '');
        
        // Pegar apenas a primeira imagem
        const images = imagesField.split(',').map(s => s.trim());
        const firstImage = images[0] || '';
        
        // Atualizar o campo
        fields[15] = firstImage;
    }
    
    // Reconstruir a linha
    // Escapar campos que contêm vírgula ou quebra de linha
    const newLine = fields.map(field => {
        if (field.includes(',') || field.includes('\n') || field.includes('"')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }).join(',');
    
    newLines.push(newLine);
}

// Salvar novo CSV
fs.writeFileSync(OUTPUT_CSV, newLines.join('\n'), 'utf-8');

console.log(`✅ CSV ajustado salvo em: ${OUTPUT_CSV}`);
console.log(`   Total de linhas processadas: ${newLines.length - 1}`);


