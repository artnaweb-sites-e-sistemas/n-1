<?php
/**
 * Script alternativo para importar produtos do site atual (https://loja.n-1edicoes.org/shop)
 * 
 * Este script faz scraping do site atual para extrair informações dos produtos
 * e importá-los no WooCommerce.
 * 
 * USO: php import-products-from-website.php
 */

// Carregar WordPress
require_once(__DIR__ . '/wp-load.php');

// Verificar se WooCommerce está ativo
if (!class_exists('WooCommerce')) {
    die('WooCommerce não está instalado ou ativado!');
}

/**
 * Extrair produtos da página do shop
 */
function scrape_products_from_shop() {
    $shop_url = 'https://loja.n-1edicoes.org/shop';
    $products = array();
    
    // Usar cURL para buscar a página
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $shop_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code !== 200 || !$html) {
        die("Erro ao acessar o site: HTTP {$http_code}\n");
    }
    
    // Criar DOMDocument
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
    $xpath = new DOMXPath($dom);
    
    // Buscar links de produtos (ajuste o seletor conforme necessário)
    $product_links = $xpath->query("//a[contains(@href, '/shop/')]");
    
    foreach ($product_links as $link) {
        $href = $link->getAttribute('href');
        if (strpos($href, '/shop/') !== false && strpos($href, '/shop/') === 0) {
            $product_url = 'https://loja.n-1edicoes.org' . $href;
            $product_data = scrape_single_product($product_url);
            
            if ($product_data) {
                $products[] = $product_data;
            }
        }
    }
    
    return $products;
}

/**
 * Extrair dados de um produto individual
 */
function scrape_single_product($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    $html = curl_exec($ch);
    curl_close($ch);
    
    if (!$html) {
        return null;
    }
    
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
    $xpath = new DOMXPath($dom);
    
    $product = array(
        'name' => '',
        'description' => '',
        'price' => 0,
        'image' => '',
        'sku' => '',
    );
    
    // Extrair título (ajuste o seletor)
    $title_nodes = $xpath->query("//h1 | //h2[contains(@class, 'product-title')]");
    if ($title_nodes->length > 0) {
        $product['name'] = trim($title_nodes->item(0)->textContent);
    }
    
    // Extrair preço (ajuste o seletor)
    $price_nodes = $xpath->query("//span[contains(@class, 'price')] | //div[contains(@class, 'price')]");
    if ($price_nodes->length > 0) {
        $price_text = $price_nodes->item(0)->textContent;
        // Extrair número do preço (ex: R$ 95,00 -> 95.00)
        preg_match('/[\d,]+/', $price_text, $matches);
        if (!empty($matches)) {
            $price = str_replace(',', '.', $matches[0]);
            $product['price'] = floatval($price);
        }
    }
    
    // Extrair imagem (ajuste o seletor)
    $img_nodes = $xpath->query("//img[contains(@class, 'product-image')] | //img[contains(@src, 'product')]");
    if ($img_nodes->length > 0) {
        $img_src = $img_nodes->item(0)->getAttribute('src');
        if (strpos($img_src, 'http') === false) {
            $img_src = 'https://loja.n-1edicoes.org' . $img_src;
        }
        $product['image'] = $img_src;
    }
    
    // Extrair descrição (ajuste o seletor)
    $desc_nodes = $xpath->query("//div[contains(@class, 'description')] | //div[contains(@class, 'product-description')]");
    if ($desc_nodes->length > 0) {
        $product['description'] = trim($desc_nodes->item(0)->textContent);
    }
    
    // Gerar SKU a partir do nome
    $product['sku'] = sanitize_title($product['name']);
    
    return $product;
}

/**
 * Baixar e importar imagem
 */
function import_product_image($image_url, $product_name) {
    if (empty($image_url)) {
        return '';
    }
    
    // Baixar imagem
    $upload_dir = wp_upload_dir();
    $image_data = @file_get_contents($image_url);
    
    if (!$image_data) {
        return '';
    }
    
    $filename = sanitize_file_name($product_name) . '.jpg';
    $file_path = $upload_dir['path'] . '/' . $filename;
    
    file_put_contents($file_path, $image_data);
    
    $attachment = array(
        'post_mime_type' => 'image/jpeg',
        'post_title' => sanitize_file_name($product_name),
        'post_content' => '',
        'post_status' => 'inherit'
    );
    
    $attach_id = wp_insert_attachment($attachment, $file_path);
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
    wp_update_attachment_metadata($attach_id, $attach_data);
    
    return $attach_id;
}

/**
 * Importar produto para WooCommerce
 */
function import_product($product_data) {
    // Verificar se já existe
    $existing_id = wc_get_product_id_by_sku($product_data['sku']);
    
    if ($existing_id) {
        echo "Produto já existe: {$product_data['name']}\n";
        return $existing_id;
    }
    
    // Importar imagem
    $image_id = import_product_image($product_data['image'], $product_data['name']);
    
    // Criar produto
    $product = new WC_Product_Simple();
    $product->set_name($product_data['name']);
    $product->set_description($product_data['description']);
    $product->set_short_description($product_data['description']);
    $product->set_sku($product_data['sku']);
    $product->set_regular_price($product_data['price']);
    $product->set_price($product_data['price']);
    $product->set_status('publish');
    $product->set_catalog_visibility('visible');
    $product->set_stock_status('instock');
    
    if ($image_id) {
        $product->set_image_id($image_id);
    }
    
    $product_id = $product->save();
    
    echo "Produto importado: {$product_data['name']} (ID: {$product_id})\n";
    
    return $product_id;
}

/**
 * Função principal
 */
function import_from_website() {
    echo "Iniciando importação do site atual...\n\n";
    
    echo "Extraindo produtos do site...\n";
    $products = scrape_products_from_shop();
    
    if (empty($products)) {
        echo "Nenhum produto encontrado. Verifique os seletores CSS no código.\n";
        return;
    }
    
    echo "Encontrados " . count($products) . " produtos.\n\n";
    
    $imported = 0;
    
    foreach ($products as $product_data) {
        if (import_product($product_data)) {
            $imported++;
        }
        // Pequeno delay para não sobrecarregar o servidor
        sleep(1);
    }
    
    echo "\n\n=== RESUMO ===\n";
    echo "Importados: {$imported}\n";
    echo "Total processado: " . count($products) . "\n";
}

// Executar
if (php_sapi_name() === 'cli') {
    import_from_website();
} else {
    if (current_user_can('manage_options')) {
        import_from_website();
    } else {
        die('Acesso negado.');
    }
}


