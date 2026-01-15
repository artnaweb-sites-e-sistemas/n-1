const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = path.join(__dirname, 'n1-woocommerce-products-with-urls.csv');
const OUTPUT_FILE = path.join(__dirname, 'htaccess-redirects.txt');

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

// Ler CSV e gerar redirecionamentos
const redirects = [];
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
    
    if (!name || !externalUrl) {
      return;
    }
    
    // Extrair apenas o path da URL antiga
    // Exemplo: https://loja.n-1edicoes.org/shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
    // Resultado: /shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
    let oldPath = '';
    try {
      const url = new URL(externalUrl);
      oldPath = url.pathname;
      
      // Remover query params e hash se existirem
      if (url.search) {
        oldPath += url.search;
      }
      if (url.hash) {
        oldPath += url.hash;
      }
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
    
    // Criar regra de redirecionamento
    // Formato: Redirect 301 /shop/old-path /livros/new-slug
    redirects.push({
      oldPath: oldPath,
      newPath: slug, // Apenas o slug, sem /livros/ (será adicionado na regra)
      name: name
    });
  })
  .on('end', () => {
    console.log(`[INFO] Total de redirecionamentos gerados: ${redirects.length}`);
    
    // Gerar conteúdo do .htaccess
    let htaccessContent = `# Redirecionamentos de URLs antigas para novas URLs (/livros/slug)
# Gerado automaticamente - ${new Date().toISOString()}
# Total de redirecionamentos: ${redirects.length}

# Habilitar mod_rewrite
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

`;

    // Adicionar cada redirecionamento
    redirects.forEach((redirect) => {
      // Escapar caracteres especiais no path antigo
      const escapedOldPath = redirect.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Remover /shop/ do início se existir
      const cleanOldPath = escapedOldPath.replace(/^\/shop\//, 'shop/');
      
      htaccessContent += `# ${redirect.name}
RewriteRule ^${cleanOldPath}$ /livros/${redirect.newPath} [R=301,L]

`;
    });

    htaccessContent += `</IfModule>
`;

    // Salvar arquivo
    fs.writeFileSync(OUTPUT_FILE, htaccessContent, 'utf-8');
    
    console.log(`[INFO] Arquivo gerado: ${OUTPUT_FILE}`);
    console.log(`[INFO] Adicione o conteúdo deste arquivo ao seu .htaccess`);
    
    // Também gerar um resumo
    console.log('\n[INFO] Primeiros 5 redirecionamentos:');
    redirects.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.oldPath} -> ${r.newPath}`);
    });
    
    if (redirects.length > 5) {
      console.log(`  ... e mais ${redirects.length - 5} redirecionamentos`);
    }
  })
  .on('error', (error) => {
    console.error('[ERROR] Erro ao processar CSV:', error);
  });

