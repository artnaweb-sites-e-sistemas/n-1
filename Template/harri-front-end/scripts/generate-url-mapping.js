const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = path.join(__dirname, 'n1-woocommerce-products-final.csv');
const OUTPUT_FILE = path.join(__dirname, 'url-mapping.json');
const OUTPUT_TXT = path.join(__dirname, 'url-mapping.txt');

// Função para gerar slug a partir do título (mesma lógica do backend)
function generateSlug(title) {
  if (!title) return '';
  
  // Converter para minúsculas
  let slug = title.toLowerCase();
  
  // Remover acentos (simplificado)
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Remover caracteres especiais, manter apenas letras, números e espaços
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  
  // Substituir espaços e múltiplos hífens por um único hífen
  slug = slug.replace(/[\s-]+/g, '-');
  
  // Remover hífens no início e fim
  slug = slug.trim().replace(/^-+|-+$/g, '');
  
  return slug;
}

const mappings = [];
let isFirstLine = true;

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (row) => {
    // Pular cabeçalho
    if (isFirstLine) {
      isFirstLine = false;
      return;
    }
    
    const name = row.Name || row['Name'] || '';
    const externalUrl = row['External URL'] || row['External URL'] || '';
    const sku = row.SKU || row['SKU'] || '';
    
    if (!name || !externalUrl) {
      return;
    }
    
    // Extrair apenas o path da URL antiga
    let oldPath = '';
    try {
      const url = new URL(externalUrl);
      oldPath = url.pathname;
    } catch (e) {
      // Se não for uma URL válida, tentar extrair o path manualmente
      const match = externalUrl.match(/\/shop\/[^?#]+/);
      if (match) {
        oldPath = match[0];
      } else {
        return; // Pular se não conseguir extrair
      }
    }
    
    // Gerar slug do título
    const slug = generateSlug(name);
    
    if (!slug) {
      return;
    }
    
    // Criar mapeamento
    const mapping = {
      sku: sku.trim(),
      name: name.trim(),
      oldUrl: externalUrl.trim(),
      oldPath: oldPath,
      newPath: `/livros/${slug}`,
      newUrl: `https://n-1.artnaweb.com.br/livros/${slug}`,
      slug: slug
    };
    
    mappings.push(mapping);
  })
  .on('end', () => {
    console.log(`[INFO] Total de mapeamentos gerados: ${mappings.length}`);
    
    // Gerar arquivo JSON
    const jsonContent = JSON.stringify(mappings, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');
    console.log(`[INFO] Arquivo JSON gerado: ${OUTPUT_FILE}`);
    
    // Gerar arquivo TXT legível
    let txtContent = `# MAPEAMENTO DE URLs ANTIGAS PARA NOVAS URLs\n`;
    txtContent += `# Gerado automaticamente - ${new Date().toISOString()}\n`;
    txtContent += `# Total de mapeamentos: ${mappings.length}\n\n`;
    txtContent += `# Formato: URL_ANTIGA -> URL_NOVA\n\n`;
    
    mappings.forEach((mapping, index) => {
      txtContent += `# ${index + 1}. ${mapping.name}\n`;
      txtContent += `# SKU: ${mapping.sku}\n`;
      txtContent += `URL Antiga: ${mapping.oldUrl}\n`;
      txtContent += `Path Antigo: ${mapping.oldPath}\n`;
      txtContent += `URL Nova: ${mapping.newUrl}\n`;
      txtContent += `Path Novo: ${mapping.newPath}\n`;
      txtContent += `Slug: ${mapping.slug}\n`;
      txtContent += `\n---\n\n`;
    });
    
    fs.writeFileSync(OUTPUT_TXT, txtContent, 'utf-8');
    console.log(`[INFO] Arquivo TXT gerado: ${OUTPUT_TXT}`);
    
    // Gerar arquivo CSV para fácil importação
    const csvContent = generateCSV(mappings);
    const csvOutputFile = path.join(__dirname, 'url-mapping.csv');
    fs.writeFileSync(csvOutputFile, csvContent, 'utf-8');
    console.log(`[INFO] Arquivo CSV gerado: ${csvOutputFile}`);
    
    // Mostrar primeiros 5 exemplos
    console.log('\n[INFO] Primeiros 5 mapeamentos:');
    mappings.slice(0, 5).forEach((m, i) => {
      console.log(`\n${i + 1}. ${m.name}`);
      console.log(`   Antiga: ${m.oldPath}`);
      console.log(`   Nova:   ${m.newPath}`);
    });
    
    if (mappings.length > 5) {
      console.log(`\n   ... e mais ${mappings.length - 5} mapeamentos`);
    }
  })
  .on('error', (error) => {
    console.error('[ERROR] Erro ao processar CSV:', error);
  });

function generateCSV(mappings) {
  let csv = 'SKU,Nome,URL Antiga,Path Antigo,URL Nova,Path Novo,Slug\n';
  
  mappings.forEach(m => {
    csv += `"${m.sku}","${m.name.replace(/"/g, '""')}","${m.oldUrl}","${m.oldPath}","${m.newUrl}","${m.newPath}","${m.slug}"\n`;
  });
  
  return csv;
}

