const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Este script precisa ser executado no WordPress via WP-CLI ou como um plugin
// Por enquanto, vamos criar um endpoint que faz isso automaticamente

console.log(`
========================================
SCRIPT PARA SALVAR URLs EXTERNAS
========================================

Este script deve ser executado no WordPress para salvar as URLs antigas
como meta fields nos produtos.

INSTRUÇÕES:
1. Execute este script no WordPress via WP-CLI ou crie um plugin temporário
2. Ou use o endpoint /wp-json/n1/v1/save-external-urls (se implementado)

O script lê o CSV e salva a URL externa como _external_url em cada produto.
`);

const CSV_FILE = path.join(__dirname, 'n1-woocommerce-products-final.csv');
const products = [];

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (row) => {
    const sku = row.SKU || row['SKU'];
    const externalUrl = row['External URL'] || row['External URL'];
    const name = row.Name || row['Name'];
    
    if (sku && externalUrl && name) {
      products.push({
        sku: sku.trim(),
        externalUrl: externalUrl.trim(),
        name: name.trim()
      });
    }
  })
  .on('end', () => {
    console.log(`\nTotal de produtos encontrados: ${products.length}`);
    console.log('\nPrimeiros 5 produtos:');
    products.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. SKU: ${p.sku} | URL: ${p.externalUrl}`);
    });
    
    // Gerar código PHP para salvar no WordPress
    const phpCode = generatePhpCode(products);
    const outputFile = path.join(__dirname, 'save-external-urls.php');
    fs.writeFileSync(outputFile, phpCode, 'utf-8');
    console.log(`\n✅ Código PHP gerado em: ${outputFile}`);
    console.log('\nINSTRUÇÕES:');
    console.log('1. Copie o conteúdo do arquivo save-external-urls.php');
    console.log('2. Execute no WordPress via WP-CLI: wp eval-file save-external-urls.php');
    console.log('3. Ou adicione como um plugin temporário e ative');
  });

function generatePhpCode(products) {
  let code = `<?php
/**
 * Script para salvar URLs externas como meta fields nos produtos
 * Execute via WP-CLI: wp eval-file save-external-urls.php
 * Ou adicione como plugin temporário
 */

// Verificar se estamos no WordPress
if (!defined('ABSPATH')) {
    require_once('../../../wp-load.php');
}

$mapping = array(
`;

  products.forEach((p) => {
    code += `    '${p.sku}' => '${p.externalUrl.replace(/'/g, "\\'")}',\n`;
  });

  code += `);

$updated = 0;
$not_found = 0;

foreach ($mapping as $sku => $external_url) {
    // Buscar produto pelo SKU
    $args = array(
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 1,
        'meta_query' => array(
            array(
                'key' => '_sku',
                'value' => $sku,
                'compare' => '=',
            ),
        ),
    );
    
    $query = new WP_Query($args);
    
    if ($query->have_posts()) {
        $query->the_post();
        $product_id = get_the_ID();
        
        // Salvar URL externa como meta field
        update_post_meta($product_id, '_external_url', $external_url);
        
        echo "✅ Produto ID {$product_id} (SKU: {$sku}) - URL salva\\n";
        $updated++;
        
        wp_reset_postdata();
    } else {
        echo "❌ Produto não encontrado (SKU: {$sku})\\n";
        $not_found++;
    }
}

echo "\\n========================================\\n";
echo "Total atualizado: {$updated}\\n";
echo "Total não encontrado: {$not_found}\\n";
echo "========================================\\n";
`;

  return code;
}


