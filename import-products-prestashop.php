<?php
/**
 * Script para importar produtos do PrestaShop para WooCommerce
 * 
 * INSTRUÇÕES:
 * 1. Configure as credenciais do banco de dados PrestaShop abaixo
 * 2. Certifique-se de que o WordPress e WooCommerce estão instalados
 * 3. Execute este script via linha de comando ou navegador
 * 
 * USO: php import-products-prestashop.php
 */

// Configurações do banco de dados PrestaShop
define('PS_DB_HOST', 'localhost');
define('PS_DB_NAME', 'prestashop_db');
define('PS_DB_USER', 'usuario');
define('PS_DB_PASS', 'senha');
define('PS_DB_PREFIX', 'ps_'); // Prefixo das tabelas PrestaShop

// Caminho para a pasta de uploads do PrestaShop (onde estão as imagens)
define('PS_IMG_PATH', __DIR__ . '/loja-antiga/img/p/');

// Carregar WordPress
require_once(__DIR__ . '/wp-load.php');

// Verificar se WooCommerce está ativo
if (!class_exists('WooCommerce')) {
    die('WooCommerce não está instalado ou ativado!');
}

/**
 * Conectar ao banco PrestaShop
 */
function connect_prestashop_db() {
    $conn = new mysqli(PS_DB_HOST, PS_DB_USER, PS_DB_PASS, PS_DB_NAME);
    
    if ($conn->connect_error) {
        die("Erro na conexão: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8");
    return $conn;
}

/**
 * Buscar produtos do PrestaShop
 */
function get_prestashop_products($conn) {
    $prefix = PS_DB_PREFIX;
    
    $sql = "SELECT 
                p.id_product,
                p.reference,
                p.price,
                p.wholesale_price,
                p.on_sale,
                p.available_for_order,
                p.show_price,
                p.active,
                pl.name,
                pl.description,
                pl.description_short,
                pl.link_rewrite,
                i.id_image,
                c.id_category_default,
                cat.name as category_name
            FROM {$prefix}product p
            LEFT JOIN {$prefix}product_lang pl ON p.id_product = pl.id_product AND pl.id_lang = 1
            LEFT JOIN {$prefix}image i ON p.id_product = i.id_product AND i.cover = 1
            LEFT JOIN {$prefix}category_product c ON p.id_product = c.id_product
            LEFT JOIN {$prefix}category_lang cat ON c.id_category = cat.id_category AND cat.id_lang = 1
            WHERE p.active = 1
            ORDER BY p.id_product";
    
    $result = $conn->query($sql);
    $products = array();
    
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
    }
    
    return $products;
}

/**
 * Obter URL da imagem do produto PrestaShop
 */
function get_prestashop_image_url($id_product, $id_image) {
    if (!$id_image) {
        return '';
    }
    
    // PrestaShop organiza imagens em pastas: 123/456/789.jpg
    $image_path = str_pad($id_image, 9, '0', STR_PAD_LEFT);
    $folder1 = substr($image_path, 0, 3);
    $folder2 = substr($image_path, 3, 3);
    $folder3 = substr($image_path, 6, 3);
    
    $image_file = PS_IMG_PATH . $folder1 . '/' . $folder2 . '/' . $folder3 . '/' . $image_path . '.jpg';
    
    if (file_exists($image_file)) {
        // Copiar imagem para uploads do WordPress
        $upload_dir = wp_upload_dir();
        $new_filename = 'prestashop-' . $id_image . '.jpg';
        $new_path = $upload_dir['path'] . '/' . $new_filename;
        
        if (copy($image_file, $new_path)) {
            $attachment = array(
                'post_mime_type' => 'image/jpeg',
                'post_title' => sanitize_file_name($new_filename),
                'post_content' => '',
                'post_status' => 'inherit'
            );
            
            $attach_id = wp_insert_attachment($attachment, $new_path);
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            $attach_data = wp_generate_attachment_metadata($attach_id, $new_path);
            wp_update_attachment_metadata($attach_id, $attach_data);
            
            return $attach_id;
        }
    }
    
    return '';
}

/**
 * Importar produto para WooCommerce
 */
function import_product_to_woocommerce($product_data, $image_id) {
    // Verificar se produto já existe (por SKU/reference)
    $existing_id = wc_get_product_id_by_sku($product_data['reference']);
    
    if ($existing_id) {
        $product = wc_get_product($existing_id);
        echo "Produto já existe: {$product_data['name']} (ID: {$existing_id})\n";
        return $existing_id;
    }
    
    // Criar novo produto
    $product = new WC_Product_Simple();
    
    // Dados básicos
    $product->set_name($product_data['name']);
    $product->set_description($product_data['description']);
    $product->set_short_description($product_data['description_short']);
    $product->set_sku($product_data['reference']);
    $product->set_regular_price($product_data['price']);
    $product->set_price($product_data['price']);
    $product->set_status('publish');
    $product->set_catalog_visibility('visible');
    $product->set_stock_status('instock');
    $product->set_manage_stock(false);
    
    // Imagem
    if ($image_id) {
        $product->set_image_id($image_id);
    }
    
    // Salvar produto
    $product_id = $product->save();
    
    // Categoria
    if (!empty($product_data['category_name'])) {
        $term = get_term_by('name', $product_data['category_name'], 'product_cat');
        if (!$term) {
            $term = wp_insert_term($product_data['category_name'], 'product_cat');
            if (!is_wp_error($term)) {
                $term_id = $term['term_id'];
            }
        } else {
            $term_id = $term->term_id;
        }
        
        if ($term_id) {
            wp_set_object_terms($product_id, $term_id, 'product_cat');
        }
    }
    
    echo "Produto importado: {$product_data['name']} (ID: {$product_id})\n";
    
    return $product_id;
}

/**
 * Função principal de importação
 */
function import_all_products() {
    echo "Iniciando importação de produtos...\n\n";
    
    // Conectar ao banco PrestaShop
    $conn = connect_prestashop_db();
    
    // Buscar produtos
    echo "Buscando produtos do PrestaShop...\n";
    $products = get_prestashop_products($conn);
    echo "Encontrados " . count($products) . " produtos.\n\n";
    
    $imported = 0;
    $skipped = 0;
    $errors = 0;
    
    foreach ($products as $product_data) {
        try {
            // Obter imagem
            $image_id = get_prestashop_image_url($product_data['id_product'], $product_data['id_image']);
            
            // Importar produto
            $woo_id = import_product_to_woocommerce($product_data, $image_id);
            
            if ($woo_id) {
                $imported++;
            } else {
                $skipped++;
            }
        } catch (Exception $e) {
            echo "ERRO ao importar produto {$product_data['name']}: " . $e->getMessage() . "\n";
            $errors++;
        }
    }
    
    $conn->close();
    
    echo "\n\n=== RESUMO ===\n";
    echo "Importados: {$imported}\n";
    echo "Ignorados: {$skipped}\n";
    echo "Erros: {$errors}\n";
    echo "Total processado: " . count($products) . "\n";
}

// Executar importação
if (php_sapi_name() === 'cli') {
    // Execução via linha de comando
    import_all_products();
} else {
    // Execução via navegador (apenas para desenvolvimento)
    if (current_user_can('manage_options')) {
        import_all_products();
    } else {
        die('Acesso negado. Você precisa ser administrador.');
    }
}



