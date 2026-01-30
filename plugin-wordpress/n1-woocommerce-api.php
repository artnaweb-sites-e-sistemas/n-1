<?php
/**
 * Plugin Name: N-1 WooCommerce API
 * Plugin URI: https://loja.n-1edicoes.org
 * Description: API REST customizada para integração do template React/Next.js com WooCommerce
 * Version: 1.0.0
 * Author: N-1 Edições
 * Author URI: https://loja.n-1edicoes.org
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: n1-woocommerce-api
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class N1_WooCommerce_API
{

    private $namespace = 'n1/v1';
    private $stripe_secret_key = 'sk_test_51SpZZiR0R7yHOSAazG9L81muQRM7HdTT2LcjRGl6RpBohC65L4Wv3uDEqWdmgMqc2gYdRW3ol7X3TsTlyomVv2TH006iGbXYj1';

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('rest_api_init', array($this, 'add_cors_support'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes()
    {
        // Get all products
        register_rest_route($this->namespace, '/products', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_products'),
            'permission_callback' => '__return_true',
        ));

        // Get single product
        register_rest_route($this->namespace, '/products/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product'),
            'permission_callback' => '__return_true',
        ));

        // Get single product with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/products/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product'),
            'permission_callback' => '__return_true',
        ));

        // Get product by slug (for new URL format /livros/slug)
        register_rest_route($this->namespace, '/products/slug/(?P<slug>[a-zA-Z0-9\-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_by_slug'),
            'permission_callback' => '__return_true',
        ));

        // Get product by slug with /api/ prefix
        register_rest_route($this->namespace, '/api/products/slug/(?P<slug>[a-zA-Z0-9\-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_by_slug'),
            'permission_callback' => '__return_true',
        ));

        // Get product by old URL (for redirects)
        register_rest_route($this->namespace, '/products/old-url', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_by_old_url'),
            'permission_callback' => '__return_true',
        ));

        // Alternative endpoint with /api/ prefix
        register_rest_route($this->namespace, '/api/products/old-url', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product_by_old_url'),
            'permission_callback' => '__return_true',
        ));

        // Get featured products
        register_rest_route($this->namespace, '/products/show', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_featured_products'),
            'permission_callback' => '__return_true',
        ));

        // Get featured products with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/products/show', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_featured_products'),
            'permission_callback' => '__return_true',
        ));

        // Get discount products
        register_rest_route($this->namespace, '/products/discount', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_discount_products'),
            'permission_callback' => '__return_true',
        ));

        // Get discount products with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/products/discount', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_discount_products'),
            'permission_callback' => '__return_true',
        ));

        // Get related products
        register_rest_route($this->namespace, '/products/relatedProduct', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_related_products'),
            'permission_callback' => '__return_true',
            'args' => array(
                'tags' => array(
                    'required' => false,
                    'type' => 'string',
                ),
            ),
        ));

        // Get related products with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/products/relatedProduct', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_related_products'),
            'permission_callback' => '__return_true',
            'args' => array(
                'tags' => array(
                    'required' => false,
                    'type' => 'string',
                ),
            ),
        ));

        // Get categories
        register_rest_route($this->namespace, '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true',
        ));

        // Get categories (alias for template compatibility)
        register_rest_route($this->namespace, '/category/show', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true',
        ));

        // Get categories with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/category/show', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true',
        ));

        // Get coupons
        register_rest_route($this->namespace, '/coupon', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_coupons'),
            'permission_callback' => '__return_true',
        ));

        // Get coupons with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/coupon', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_coupons'),
            'permission_callback' => '__return_true',
        ));

        // Get products/show with /api/ prefix (for template compatibility)
        register_rest_route($this->namespace, '/api/products/show', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_featured_products'),
            'permission_callback' => '__return_true',
        ));

        // Search products
        register_rest_route($this->namespace, '/products/search', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_products'),
            'permission_callback' => '__return_true',
            'args' => array(
                'q' => array(
                    'required' => true,
                    'type' => 'string',
                ),
            ),
        ));

        // User Authentication Routes
        // Register user
        register_rest_route($this->namespace, '/api/user/signup', array(
            'methods' => 'POST',
            'callback' => array($this, 'register_user'),
            'permission_callback' => '__return_true',
        ));

        // Login user
        register_rest_route($this->namespace, '/api/user/login', array(
            'methods' => 'POST',
            'callback' => array($this, 'login_user'),
            'permission_callback' => '__return_true',
        ));

        // Get current user
        register_rest_route($this->namespace, '/api/user/me', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_current_user'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Forgot password
        register_rest_route($this->namespace, '/api/user/forget-password', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'forgot_password'),
            'permission_callback' => '__return_true',
        ));

        // Confirm forgot password
        register_rest_route($this->namespace, '/api/user/confirm-forget-password', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'confirm_forgot_password'),
            'permission_callback' => '__return_true',
        ));

        // Change password
        register_rest_route($this->namespace, '/api/user/change-password', array(
            'methods' => 'PATCH',
            'callback' => array($this, 'change_password'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Update user profile
        register_rest_route($this->namespace, '/api/user/update-user/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_user'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Confirm email
        register_rest_route($this->namespace, '/api/user/confirmEmail/(?P<token>[a-zA-Z0-9]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'confirm_email'),
            'permission_callback' => '__return_true',
        ));

        // Create Payment Intent (Stripe) - Permite guest checkout
        register_rest_route($this->namespace, '/api/order/create-payment-intent', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_payment_intent'),
            'permission_callback' => '__return_true', // Permite checkout sem login
        ));

        // Add Order (WooCommerce) - Permite guest checkout
        register_rest_route($this->namespace, '/api/order/addOrder', array(
            'methods' => 'POST',
            'callback' => array($this, 'add_order'),
            'permission_callback' => '__return_true', // Permite checkout sem login
        ));

        // Get all orders by user
        register_rest_route($this->namespace, '/api/user-order/order-by-user', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_orders'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Get single order by ID
        register_rest_route($this->namespace, '/api/user-order/single-order/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_order'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Calculate shipping rates
        register_rest_route($this->namespace, '/api/shipping/calculate', array(
            'methods' => 'POST',
            'callback' => array($this, 'calculate_shipping'),
            'permission_callback' => '__return_true',
        ));

        // Test email configuration (for debugging)
        register_rest_route($this->namespace, '/api/test/email', array(
            'methods' => 'POST',
            'callback' => array($this, 'test_email'),
            'permission_callback' => '__return_true',
        ));
    }

    /**
     * Add CORS support
     */
    public function add_cors_support()
    {
        // Aplicar CORS antes de qualquer processamento
        add_action('rest_api_init', function () {
            header('Access-Control-Allow-Credentials: true');
        }, 15);

        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function ($value) {
            // Lista de origens permitidas
            $allowed_origins = array(
                'https://n-1.artnaweb.com.br',
                'http://n-1.artnaweb.com.br',
                'https://loja.n-1edicoes.org',
                'http://loja.n-1edicoes.org',
                'http://localhost:3000',
                'http://localhost:3001',
            );

            // Obter origem da requisição
            $origin = '';
            if (isset($_SERVER['HTTP_ORIGIN'])) {
                $origin = $_SERVER['HTTP_ORIGIN'];
            } elseif (isset($_SERVER['HTTP_REFERER'])) {
                $parsed = parse_url($_SERVER['HTTP_REFERER']);
                $origin = $parsed['scheme'] . '://' . $parsed['host'];
                if (isset($parsed['port'])) {
                    $origin .= ':' . $parsed['port'];
                }
            }

            // Se a origem está na lista de permitidas, usar ela; senão usar wildcard
            if (!empty($origin) && in_array($origin, $allowed_origins)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }

            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE, PATCH');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, Accept');

            // Responder a requisições OPTIONS (preflight)
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit;
            }

            return $value;
        }, 10);

        // Garantir CORS mesmo em erros
        add_filter('rest_pre_dispatch', function ($result, $server, $request) {
            $allowed_origins = array(
                'https://n-1.artnaweb.com.br',
                'http://n-1.artnaweb.com.br',
                'https://loja.n-1edicoes.org',
                'http://loja.n-1edicoes.org',
                'http://localhost:3000',
                'http://localhost:3001',
            );

            $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
            if (!empty($origin) && in_array($origin, $allowed_origins)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: *');
            }

            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE, PATCH');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, Accept');

            return $result;
        }, 10, 3);
    }

    /**
     * Generate product slug from title (for /livros/slug format)
     */
    private function generate_product_slug($title)
    {
        if (empty($title)) {
            return '';
        }

        // Usar função do WordPress se disponível, senão usar alternativa
        if (function_exists('remove_accents')) {
            $slug = remove_accents($title);
        } else {
            // Alternativa manual para remover acentos
            $slug = $title;
            $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug);
        }

        // Converter para minúsculas
        $slug = strtolower($slug);
        // Remover caracteres especiais, manter apenas letras, números e espaços
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        // Substituir espaços e múltiplos hífens por um único hífen
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        // Remover hífens no início e fim
        $slug = trim($slug, '-');
        return $slug;
    }

    /**
     * Format product data for API response
     */
    private function format_product($product)
    {
        if (!$product || !is_a($product, 'WC_Product')) {
            return null;
        }

        $product_id = $product->get_id();
        $image_id = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'large') : wc_placeholder_img_src();

        $regular_price = floatval($product->get_regular_price());
        $sale_price = $product->get_sale_price() ? floatval($product->get_sale_price()) : $regular_price;
        $discount = 0;

        if ($regular_price > 0 && $sale_price < $regular_price) {
            $discount = round((($regular_price - $sale_price) / $regular_price) * 100);
        }

        // Get product tags
        $tags = wp_get_post_terms($product_id, 'product_tag', array('fields' => 'names'));

        // Get product categories
        $categories = wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names'));

        // Determine itemInfo (top-rated, best-selling, latest-product)
        $item_info = 'latest-product';
        if ($product->is_featured()) {
            $item_info = 'top-rated';
        }

        // Check if best selling (you can customize this logic)
        $total_sales = $product->get_total_sales();
        if ($total_sales > 10) {
            $item_info = 'best-selling';
        }

        // Generate new permalink format: /livros/slug
        $product_title = $product->get_name();
        $slug = $this->generate_product_slug($product_title);
        $new_permalink = home_url('/livros/' . $slug);

        // Get catalog content (editorial content from related post/page or meta fields)
        $catalog_data = $this->get_catalog_content($product_id, $product_title);

        // Get product creation date
        $date_created = $product->get_date_created();
        $date_created_timestamp = $date_created ? $date_created->getTimestamp() : time();
        $date_created_iso = $date_created ? $date_created->date('Y-m-d\TH:i:s') : date('Y-m-d\TH:i:s');

        return array(
            '_id' => (string) $product_id,
            'id' => $product_id,
            'title' => $product_title,
            'description' => $product->get_description(),
            'shortDescription' => $product->get_short_description(),
            'image' => $image_url,
            'images' => $this->get_product_images($product),
            'price' => $sale_price,
            'originalPrice' => $regular_price,
            'discount' => $discount,
            'sku' => $product->get_sku(),
            'stock' => $product->get_stock_quantity(),
            'inStock' => $product->is_in_stock(),
            'tags' => $tags,
            'categories' => $categories,
            'itemInfo' => $item_info,
            'rating' => array(
                'average' => $product->get_average_rating(),
                'count' => $product->get_rating_count(),
            ),
            'permalink' => $new_permalink,
            'slug' => $slug,
            'catalogContent' => $catalog_data['content'],
            'catalogImages' => $catalog_data['images'],
            'catalogPdf' => $catalog_data['pdf'],
            'date_created' => $date_created_iso,
            'date_created_timestamp' => $date_created_timestamp,
            'source' => 'woocommerce', // Identificar origem do produto
        );
    }

    /**
     * Get product images
     */
    private function get_product_images($product)
    {
        $images = array();
        $image_ids = $product->get_gallery_image_ids();

        // Add main image
        $main_image_id = $product->get_image_id();
        if ($main_image_id) {
            $images[] = wp_get_attachment_image_url($main_image_id, 'large');
        }

        // Add gallery images
        foreach ($image_ids as $image_id) {
            $images[] = wp_get_attachment_image_url($image_id, 'large');
        }

        return $images;
    }

    /**
     * Get catalog content (editorial content) for a product
     * Tries multiple strategies:
     * 1. Meta field 'n1_catalog_content', 'n1_catalog_images', 'n1_catalog_pdf'
     * 2. Related post/page with same title
     * 3. ACF fields if available
     */
    private function get_catalog_content($product_id, $product_title)
    {
        $result = array(
            'content' => '',
            'images' => array(),
            'pdf' => '',
        );

        // Strategy 1: Check meta fields directly on product
        $catalog_content = get_post_meta($product_id, 'n1_catalog_content', true);
        $catalog_images = get_post_meta($product_id, 'n1_catalog_images', true);
        $catalog_pdf = get_post_meta($product_id, 'n1_catalog_pdf', true);

        if (!empty($catalog_content)) {
            $result['content'] = $catalog_content;
            
            // Se o conteúdo já tem iframe do Issuu, extrair
            if (empty($catalog_pdf)) {
                preg_match('/<iframe[^>]+src=["\']([^"\']*issuu[^"\']*)["\'][^>]*>/i', $catalog_content, $issuu_match);
                if (!empty($issuu_match[1])) {
                    $result['pdf'] = html_entity_decode($issuu_match[1], ENT_QUOTES, 'UTF-8');
                }
            }
            
            // Se o conteúdo já tem imagens, extrair URLs
            if (empty($catalog_images)) {
                preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $catalog_content, $img_matches);
                if (!empty($img_matches[1])) {
                    // Filtrar apenas imagens do nosso domínio ou imagens relevantes
                    $extracted_images = array();
                    foreach ($img_matches[1] as $img_url) {
                        // Ignorar placeholders e logos
                        if (strpos($img_url, 'placeholder') === false && 
                            strpos($img_url, 'logo') === false &&
                            (strpos($img_url, 'n-1.artnaweb.com.br') !== false || 
                             strpos($img_url, 'catalog_image') !== false ||
                             strpos($img_url, 'IMG_') !== false)) {
                            $extracted_images[] = $img_url;
                        }
                    }
                    if (!empty($extracted_images)) {
                        $result['images'] = array_unique($extracted_images);
                    }
                }
            }
        }
        if (!empty($catalog_images)) {
            $result['images'] = is_array($catalog_images) ? $catalog_images : array($catalog_images);
        }
        if (!empty($catalog_pdf)) {
            $result['pdf'] = $catalog_pdf;
        }

        // If we found content via meta, return it
        if (!empty($result['content']) || !empty($result['images']) || !empty($result['pdf'])) {
            return $result;
        }

        // Strategy 2: Look for related post/page with same title
        $related_post = get_page_by_title($product_title, OBJECT, array('post', 'page'));
        if (!$related_post) {
            // Try with slug
            $product_slug = sanitize_title($product_title);
            $related_post = get_page_by_path($product_slug, OBJECT, array('post', 'page'));
        }

        if ($related_post && $related_post->post_status === 'publish') {
            // Get content
            $result['content'] = apply_filters('the_content', $related_post->post_content);

            // Extract images from content
            if (has_shortcode($related_post->post_content, 'gallery')) {
                $gallery_ids = get_post_gallery($related_post->ID, false);
                if (!empty($gallery_ids['ids'])) {
                    $ids = explode(',', $gallery_ids['ids']);
                    foreach ($ids as $img_id) {
                        $img_url = wp_get_attachment_image_url($img_id, 'large');
                        if ($img_url) {
                            $result['images'][] = $img_url;
                        }
                    }
                }
            }

            // Extract images from content HTML
            if (empty($result['images'])) {
                preg_match_all('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $result['content'], $matches);
                if (!empty($matches[1])) {
                    $result['images'] = array_unique($matches[1]);
                }
            }

            // Look for PDF link in content
            preg_match('/<a[^>]+href=["\']([^"\']+\.pdf)["\'][^>]*>/i', $result['content'], $pdf_match);
            if (!empty($pdf_match[1])) {
                $result['pdf'] = $pdf_match[1];
            }

            // Look for Issuu iframe in content (if no PDF found)
            if (empty($result['pdf'])) {
                preg_match('/<iframe[^>]+src=["\']([^"\']*issuu[^"\']*)["\'][^>]*>/i', $result['content'], $issuu_match);
                if (!empty($issuu_match[1])) {
                    $result['pdf'] = html_entity_decode($issuu_match[1], ENT_QUOTES, 'UTF-8');
                }
            }

            // Check for PDF in meta
            $pdf_meta = get_post_meta($related_post->ID, 'n1_catalog_pdf', true);
            if (empty($result['pdf']) && !empty($pdf_meta)) {
                $result['pdf'] = $pdf_meta;
            }
        }

        // Strategy 3: Check ACF fields if available
        if (function_exists('get_field')) {
            if (empty($result['content'])) {
                $acf_content = get_field('catalog_content', $product_id);
                if ($acf_content) {
                    $result['content'] = $acf_content;
                }
            }
            if (empty($result['images'])) {
                $acf_images = get_field('catalog_images', $product_id);
                if ($acf_images) {
                    $result['images'] = is_array($acf_images) ? array_map(function($img) {
                        return is_array($img) ? $img['url'] : $img;
                    }, $acf_images) : array($acf_images);
                }
            }
            if (empty($result['pdf'])) {
                $acf_pdf = get_field('catalog_pdf', $product_id);
                if ($acf_pdf) {
                    $result['pdf'] = is_array($acf_pdf) ? $acf_pdf['url'] : $acf_pdf;
                }
            }
        }

        return $result;
    }

    /**
     * Get all products
     */
    public function get_products($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $params = $request->get_query_params();
        $per_page = isset($params['per_page']) ? intval($params['per_page']) : 12;
        $page = isset($params['page']) ? intval($params['page']) : 1;
        $category = isset($params['category']) ? sanitize_text_field($params['category']) : '';
        $orderby = isset($params['orderby']) ? sanitize_text_field($params['orderby']) : 'date';
        $order = isset($params['order']) ? sanitize_text_field($params['order']) : 'DESC';

        $args = array(
            'post_type' => 'product',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'post_status' => 'publish',
            'orderby' => $orderby,
            'order' => $order,
        );

        if (!empty($category)) {
            $args['tax_query'] = array(
                array(
                    'taxonomy' => 'product_cat',
                    'field' => 'slug',
                    'terms' => $category,
                ),
            );
        }

        $query = new WP_Query($args);
        $products = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $product = wc_get_product(get_the_ID());
                $formatted = $this->format_product($product);
                if ($formatted) {
                    $products[] = $formatted;
                }
            }
            wp_reset_postdata();
        }

        return rest_ensure_response(array(
            'products' => $products,
            'total' => $query->found_posts,
            'pages' => $query->max_num_pages,
            'current_page' => $page,
        ));
    }

    /**
     * Get single product
     */
    public function get_product($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $product_id = intval($request['id']);
        $product = wc_get_product($product_id);

        if (!$product) {
            return new WP_Error('product_not_found', 'Produto não encontrado', array('status' => 404));
        }

        $formatted = $this->format_product($product);

        if (!$formatted) {
            return new WP_Error('product_error', 'Erro ao formatar produto', array('status' => 500));
        }

        return rest_ensure_response($formatted);
    }

    /**
     * Get product by slug (for /livros/slug format)
     */
    public function get_product_by_slug($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $slug = sanitize_text_field($request['slug']);

        if (empty($slug)) {
            return new WP_Error('invalid_slug', 'Slug inválido', array('status' => 400));
        }

        // Buscar produto pelo slug gerado a partir do título
        // Limitar a busca para melhor performance
        $args = array(
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => 100, // Limitar para melhor performance
            'orderby' => 'date',
            'order' => 'DESC',
        );

        $query = new WP_Query($args);
        $product = null;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $prod = wc_get_product(get_the_ID());

                if (!$prod) {
                    continue;
                }

                $prod_slug = $this->generate_product_slug($prod->get_name());

                if ($prod_slug === $slug) {
                    $product = $prod;
                    break;
                }
            }
            wp_reset_postdata();
        }

        // Se não encontrou nos primeiros 100, tentar mais produtos
        if (!$product && $query->found_posts > 100) {
            $args['posts_per_page'] = -1; // Buscar todos
            $args['offset'] = 100;
            $query2 = new WP_Query($args);

            if ($query2->have_posts()) {
                while ($query2->have_posts()) {
                    $query2->the_post();
                    $prod = wc_get_product(get_the_ID());

                    if (!$prod) {
                        continue;
                    }

                    $prod_slug = $this->generate_product_slug($prod->get_name());

                    if ($prod_slug === $slug) {
                        $product = $prod;
                        break;
                    }
                }
                wp_reset_postdata();
            }
        }

        if (!$product) {
            return new WP_Error('product_not_found', 'Produto não encontrado', array('status' => 404));
        }

        $formatted = $this->format_product($product);

        if (!$formatted) {
            return new WP_Error('product_error', 'Erro ao formatar produto', array('status' => 500));
        }

        return rest_ensure_response($formatted);
    }

    /**
     * Get product by old URL (for redirects from old site)
     */
    public function get_product_by_old_url($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $old_url = isset($request['url']) ? esc_url_raw($request['url']) : '';

        if (empty($old_url)) {
            return new WP_Error('invalid_url', 'URL inválida', array('status' => 400));
        }

        // Extrair o path da URL (remover domínio e query params/hash)
        $parsed_url = parse_url($old_url);
        $path = isset($parsed_url['path']) ? $parsed_url['path'] : $old_url;

        // Extrair ISBN ou identificador da URL antiga
        // Formato: /shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
        // Ou: shop/9786561190732-ueinzz-territorio-de-transmutacao-poetica-e-politica-816410
        preg_match('/(?:^|\/)(\d{13})-[^\/\?#]+/', $path, $matches);

        if (empty($matches[1])) {
            return new WP_Error('invalid_url', 'URL antiga inválida - ISBN não encontrado', array('status' => 400));
        }

        $isbn = $matches[1];

        // Primeiro, tentar buscar pelo path da URL (mais confiável)
        // Buscar produtos que tenham o path no meta field _external_url
        $args = array(
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => -1,
        );

        $query = new WP_Query($args);
        $product = null;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $prod = wc_get_product(get_the_ID());

                if (!$prod) {
                    continue;
                }

                // Verificar se o SKU contém o ISBN (método mais confiável)
                $sku = $prod->get_sku();
                if ($sku && strpos($sku, $isbn) !== false) {
                    $product = $prod;
                    break;
                }

                // Verificar se a URL externa (meta field) corresponde ao path
                $external_url = get_post_meta(get_the_ID(), '_external_url', true);
                if ($external_url) {
                    $external_path = parse_url($external_url, PHP_URL_PATH);
                    // Comparar paths (ignorar domínio)
                    if ($external_path && $path) {
                        // Normalizar paths (remover barras iniciais/finais)
                        $normalized_external = trim($external_path, '/');
                        $normalized_path = trim($path, '/');

                        // Verificar se os paths correspondem
                        if (
                            $normalized_external === $normalized_path ||
                            strpos($normalized_external, $normalized_path) !== false ||
                            strpos($normalized_path, $normalized_external) !== false
                        ) {
                            $product = $prod;
                            break;
                        }

                        // Verificar se contém o ISBN na URL externa
                        if (strpos($external_url, $isbn) !== false) {
                            $product = $prod;
                            break;
                        }
                    }
                }
            }
            wp_reset_postdata();
        }

        if (!$product) {
            return new WP_Error('product_not_found', 'Produto não encontrado para esta URL antiga', array('status' => 404));
        }

        $formatted = $this->format_product($product);

        if (!$formatted) {
            return new WP_Error('product_error', 'Erro ao formatar produto', array('status' => 500));
        }

        // Retornar apenas o slug para redirecionamento
        return rest_ensure_response(array(
            'slug' => $formatted['slug'],
            'id' => $formatted['id'],
        ));
    }

    /**
     * Get featured products
     * Retorna produtos em destaque, ou todos os produtos se não houver destaque
     */
    public function get_featured_products($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        // Primeiro, tenta buscar produtos em destaque usando a taxonomia moderna do WooCommerce
        $args = array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'tax_query' => array(
                array(
                    'taxonomy' => 'product_visibility',
                    'field' => 'name',
                    'terms' => 'featured',
                ),
            ),
        );

        $query = new WP_Query($args);
        $products = array();

        // Se não encontrou produtos em destaque, busca todos os produtos publicados
        if (!$query->have_posts()) {
            $args = array(
                'post_type' => 'product',
                'posts_per_page' => -1,
                'post_status' => 'publish',
            );
            $query = new WP_Query($args);
        }

        // Alternativa: busca usando meta_query (método antigo)
        if (!$query->have_posts()) {
            $args = array(
                'post_type' => 'product',
                'posts_per_page' => -1,
                'post_status' => 'publish',
                'meta_query' => array(
                    array(
                        'key' => '_featured',
                        'value' => 'yes',
                    ),
                ),
            );
            $query = new WP_Query($args);
        }

        // Se ainda não encontrou, retorna todos os produtos publicados
        if (!$query->have_posts()) {
            $args = array(
                'post_type' => 'product',
                'posts_per_page' => 12, // Limita a 12 produtos
                'post_status' => 'publish',
                'orderby' => 'date',
                'order' => 'DESC',
            );
            $query = new WP_Query($args);
        }

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $product = wc_get_product(get_the_ID());
                $formatted = $this->format_product($product);
                if ($formatted) {
                    $products[] = $formatted;
                }
            }
            wp_reset_postdata();
        }

        return rest_ensure_response(array('products' => $products));
    }

    /**
     * Get discount products
     */
    public function get_discount_products($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $args = array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'post_status' => 'publish',
            'meta_query' => array(
                array(
                    'key' => '_sale_price',
                    'value' => '',
                    'compare' => '!=',
                ),
            ),
        );

        $query = new WP_Query($args);
        $products = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $product = wc_get_product(get_the_ID());
                $formatted = $this->format_product($product);
                if ($formatted && $formatted['discount'] > 0) {
                    $products[] = $formatted;
                }
            }
            wp_reset_postdata();
        }

        return rest_ensure_response(array('products' => $products));
    }

    /**
     * Get related products
     */
    public function get_related_products($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $product_id = isset($request['id']) ? intval($request['id']) : 0;
        $categories_param = isset($request['categories']) ? sanitize_text_field($request['categories']) : '';
        $categories = !empty($categories_param) ? explode(',', $categories_param) : array();

        // Se não houver categorias, buscar produtos sem categoria
        if (empty($categories)) {
            // Buscar todos os produtos e filtrar os que não têm categoria
            $args = array(
                'post_type' => 'product',
                'posts_per_page' => 50, // Buscar mais para ter opções
                'post_status' => 'publish',
                'post__not_in' => array($product_id), // Excluir o produto atual
                'orderby' => 'rand', // Produtos aleatórios
            );

            $query = new WP_Query($args);
            $products = array();

            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $product = wc_get_product(get_the_ID());
                    $product_categories = wp_get_post_terms(get_the_ID(), 'product_cat', array('fields' => 'names'));

                    // Incluir apenas produtos sem categoria
                    if (empty($product_categories) || is_wp_error($product_categories)) {
                        $formatted = $this->format_product($product);
                        if ($formatted) {
                            $products[] = $formatted;
                            // Limitar a 4 produtos
                            if (count($products) >= 4) {
                                break;
                            }
                        }
                    }
                }
                wp_reset_postdata();
            }
        } else {
            // Buscar produtos da mesma categoria
            $args = array(
                'post_type' => 'product',
                'posts_per_page' => 4,
                'post_status' => 'publish',
                'post__not_in' => array($product_id), // Excluir o produto atual
                'orderby' => 'rand', // Produtos aleatórios
                'tax_query' => array(
                    array(
                        'taxonomy' => 'product_cat',
                        'field' => 'name',
                        'terms' => $categories,
                    ),
                ),
            );

            $query = new WP_Query($args);
            $products = array();

            if ($query->have_posts()) {
                while ($query->have_posts()) {
                    $query->the_post();
                    $product = wc_get_product(get_the_ID());
                    $formatted = $this->format_product($product);
                    if ($formatted) {
                        $products[] = $formatted;
                    }
                }
                wp_reset_postdata();
            }
        }

        return rest_ensure_response(array('products' => $products));
    }

    /**
     * Get categories
     */
    public function get_categories($request)
    {
        $terms = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ));

        $categories = array();

        if (!is_wp_error($terms) && !empty($terms)) {
            foreach ($terms as $term) {
                $categories[] = array(
                    '_id' => (string) $term->term_id,
                    'id' => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'count' => $term->count,
                );
            }
        }

        // Return format compatible with template
        // Template expects either 'categories' or direct array
        return rest_ensure_response(array('categories' => $categories));
    }

    /**
     * Search products
     */
    public function search_products($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $search_term = sanitize_text_field($request['q']);

        if (empty($search_term)) {
            return rest_ensure_response(array('products' => array()));
        }

        $args = array(
            'post_type' => 'product',
            'posts_per_page' => 20,
            'post_status' => 'publish',
            's' => $search_term,
        );

        $query = new WP_Query($args);
        $products = array();

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $product = wc_get_product(get_the_ID());
                $formatted = $this->format_product($product);
                if ($formatted) {
                    $products[] = $formatted;
                }
            }
            wp_reset_postdata();
        }

        return rest_ensure_response(array('products' => $products));
    }

    /**
     * Get coupons
     */
    public function get_coupons($request)
    {
        error_log('N1 API - get_coupons: Função chamada');

        if (!class_exists('WooCommerce')) {
            error_log('N1 API - get_coupons: WooCommerce não está ativo');
            return rest_ensure_response(array('coupons' => array()));
        }

        // Get active coupons from WooCommerce
        // Remover filtro de expiry_date para pegar todos os cupons e validar depois
        $args = array(
            'post_type' => 'shop_coupon',
            'posts_per_page' => -1,
            'post_status' => 'publish',
        );

        error_log('N1 API - get_coupons: Buscando cupons com args: ' . print_r($args, true));

        $query = new WP_Query($args);
        $coupons = array();
        $total_found = $query->found_posts;
        $total_valid = 0;
        $total_invalid = 0;

        error_log('N1 API - get_coupons: Total de cupons encontrados na query: ' . $total_found);

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $coupon_id = get_the_ID();
                $coupon = new WC_Coupon($coupon_id);
                $coupon_code = $coupon->get_code();

                error_log('N1 API - get_coupons: Processando cupom ID: ' . $coupon_id . ', Código: ' . $coupon_code);

                // Verificar se é válido (mas vamos incluir mesmo se não for válido para debug)
                // is_valid() pode retornar false se não houver usuário logado ou outras restrições
                $is_valid = $coupon->is_valid();
                error_log('N1 API - get_coupons: Cupom ' . $coupon_code . ' é válido? ' . ($is_valid ? 'SIM' : 'NÃO'));

                if (!$is_valid) {
                    $total_invalid++;
                    // Log o motivo da invalidade
                    $errors = $coupon->get_errors();
                    if (!empty($errors)) {
                        error_log('N1 API - get_coupons: Erros do cupom ' . $coupon_code . ': ' . print_r($errors, true));
                    }
                    // Vamos incluir mesmo cupons inválidos para debug, mas marcar como inválido
                    // Se quiser retornar apenas válidos, descomente o continue abaixo
                    // continue;
                }

                // Incluir o cupom mesmo se não for válido (para debug e para permitir validação no frontend)
                if ($is_valid || true) { // Sempre incluir por enquanto para debug
                    $total_valid++;
                    // Obter valor mínimo do pedido (minimum_amount)
                    $minimum_amount = $coupon->get_minimum_amount();
                    if (empty($minimum_amount)) {
                        $minimum_amount = 0;
                    }

                    // Obter data de expiração
                    $expiry_date = $coupon->get_date_expires();
                    $expiry_date_str = null;
                    if ($expiry_date) {
                        $expiry_date_str = $expiry_date->date('Y-m-d');
                    }

                    // Obter limite de uso
                    $usage_limit = $coupon->get_usage_limit();
                    $usage_count = $coupon->get_usage_count();

                    // Calcular desconto percentual se for tipo percent
                    $discount_percentage = 0;
                    if ($coupon->get_discount_type() === 'percent') {
                        $discount_percentage = floatval($coupon->get_amount());
                    }

                    $coupons[] = array(
                        '_id' => (string) $coupon_id,
                        'id' => $coupon_id,
                        'code' => $coupon->get_code(),
                        'couponCode' => $coupon->get_code(), // Compatibilidade
                        'title' => $coupon->get_code(), // Para exibição
                        'amount' => floatval($coupon->get_amount()),
                        'discountType' => $coupon->get_discount_type(),
                        'discountPercentage' => $discount_percentage,
                        'description' => $coupon->get_description(),
                        'expiryDate' => $expiry_date_str,
                        'endTime' => $expiry_date_str, // Compatibilidade
                        'minimumAmount' => floatval($minimum_amount),
                        'productType' => 'all', // WooCommerce não tem tipo de produto específico por padrão
                        'usageLimit' => $usage_limit ? intval($usage_limit) : null,
                        'usageCount' => intval($usage_count),
                    );
                }
            }
            wp_reset_postdata();
        }

        error_log('N1 API - get_coupons: Resumo - Total encontrados: ' . $total_found . ', Válidos: ' . $total_valid . ', Inválidos: ' . $total_invalid);
        error_log('N1 API - get_coupons: Retornando ' . count($coupons) . ' cupons');
        if (count($coupons) > 0) {
            $codes = array_map(function ($c) {
                return $c['code']; }, $coupons);
            error_log('N1 API - get_coupons: Códigos dos cupons retornados: ' . implode(', ', $codes));
        }

        return rest_ensure_response(array('coupons' => $coupons));
    }

    /**
     * Check authentication
     */
    public function check_authentication()
    {
        try {
            error_log('N1 API - check_authentication: Iniciando verificação');

            // Função compatível para obter headers
            $headers = array();
            if (function_exists('getallheaders')) {
                $headers = getallheaders();
            } else {
                foreach ($_SERVER as $name => $value) {
                    if (substr($name, 0, 5) == 'HTTP_') {
                        $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                    }
                }
            }

            // Normalizar headers para case-insensitive
            $normalized_headers = array();
            foreach ($headers as $key => $value) {
                $normalized_headers[strtolower($key)] = $value;
            }

            $auth_header = '';
            if (isset($normalized_headers['authorization'])) {
                $auth_header = $normalized_headers['authorization'];
            } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }

            error_log('N1 API - check_authentication: Auth header = ' . ($auth_header ? 'presente' : 'vazio'));

            if (empty($auth_header)) {
                error_log('N1 API - check_authentication: Token não fornecido');
                return new WP_Error('unauthorized', 'Token de autenticação não fornecido', array('status' => 401));
            }

            // Extract token from "Bearer {token}"
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                $token = trim($matches[1]);
                error_log('N1 API - check_authentication: Token extraído, validando...');

                $user_id = $this->validate_token($token);
                if ($user_id) {
                    error_log('N1 API - check_authentication: Token válido, user_id = ' . $user_id);
                    wp_set_current_user($user_id);
                    return true;
                } else {
                    error_log('N1 API - check_authentication: Token inválido');
                }
            } else {
                error_log('N1 API - check_authentication: Formato de token inválido');
            }

            return new WP_Error('unauthorized', 'Token de autenticação inválido', array('status' => 401));
        } catch (Exception $e) {
            error_log('N1 API - check_authentication: Exceção - ' . $e->getMessage());
            return new WP_Error('auth_error', 'Erro ao verificar autenticação: ' . $e->getMessage(), array('status' => 500));
        }
    }

    /**
     * Validate token and return user ID
     */
    private function validate_token($token)
    {
        // Check if token exists in user meta
        $users = get_users(array(
            'meta_key' => 'n1_api_token',
            'meta_value' => $token,
            'number' => 1,
        ));

        if (!empty($users)) {
            $user = $users[0];
            // Check if token is not expired (optional: add expiry check)
            return $user->ID;
        }

        return false;
    }

    /**
     * Generate API token for user
     */
    private function generate_token($user_id)
    {
        $token = wp_generate_password(32, false);
        update_user_meta($user_id, 'n1_api_token', $token);
        return $token;
    }

    /**
     * Format user data for API response
     */
    private function format_user($user)
    {
        if (!$user || !is_a($user, 'WP_User')) {
            return null;
        }

        return array(
            '_id' => (string) $user->ID,
            'id' => $user->ID,
            'name' => $user->display_name,
            'lastName' => get_user_meta($user->ID, 'n1_lastname', true) ?: '',
            'email' => $user->user_email,
            'role' => !empty($user->roles) ? $user->roles[0] : 'customer',
            'phone' => get_user_meta($user->ID, 'n1_phone', true) ?: get_user_meta($user->ID, 'billing_phone', true) ?: '',
            'contactNumber' => get_user_meta($user->ID, 'n1_phone', true) ?: get_user_meta($user->ID, 'billing_phone', true) ?: '',
            'address' => get_user_meta($user->ID, 'n1_address', true) ?: get_user_meta($user->ID, 'billing_address_1', true) ?: '',
            'shippingAddress' => get_user_meta($user->ID, 'n1_address', true) ?: get_user_meta($user->ID, 'shipping_address_1', true) ?: '',
            'number' => get_user_meta($user->ID, 'n1_number', true) ?: '',
            'numero' => get_user_meta($user->ID, 'n1_number', true) ?: '',
            'complement' => get_user_meta($user->ID, 'n1_complement', true) ?: '',
            'zipCode' => get_user_meta($user->ID, 'n1_zipcode', true) ?: get_user_meta($user->ID, 'billing_postcode', true) ?: '',
            'cep' => get_user_meta($user->ID, 'n1_zipcode', true) ?: get_user_meta($user->ID, 'billing_postcode', true) ?: '',
            'city' => get_user_meta($user->ID, 'n1_city', true) ?: get_user_meta($user->ID, 'billing_city', true) ?: '',
            'country' => get_user_meta($user->ID, 'n1_country', true) ?: get_user_meta($user->ID, 'billing_state', true) ?: '',
            'state' => get_user_meta($user->ID, 'n1_country', true) ?: get_user_meta($user->ID, 'billing_state', true) ?: '',
            'bio' => get_user_meta($user->ID, 'n1_bio', true) ?: get_user_meta($user->ID, 'description', true) ?: '',
        );
    }

    /**
     * Register new user
     */
    public function register_user($request)
    {
        $params = $request->get_json_params();

        $name = isset($params['name']) ? sanitize_text_field($params['name']) : '';
        $email = isset($params['email']) ? sanitize_email($params['email']) : '';
        $password = isset($params['password']) ? $params['password'] : '';
        $confirm_password = isset($params['confirmPassword']) ? $params['confirmPassword'] : '';

        // Validation
        if (empty($name) || empty($email) || empty($password)) {
            return new WP_Error('missing_fields', 'Nome, e-mail e senha são obrigatórios', array('status' => 400));
        }

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'E-mail inválido', array('status' => 400));
        }

        if (strlen($password) < 6) {
            return new WP_Error('weak_password', 'A senha deve ter pelo menos 6 caracteres', array('status' => 400));
        }

        if ($password !== $confirm_password) {
            return new WP_Error('password_mismatch', 'As senhas não coincidem', array('status' => 400));
        }

        // Check if user already exists
        if (email_exists($email)) {
            return new WP_Error('email_exists', 'Este e-mail já está cadastrado', array('status' => 409));
        }

        // Create user
        $user_id = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            return new WP_Error('registration_failed', $user_id->get_error_message(), array('status' => 500));
        }

        // Update user display name
        wp_update_user(array(
            'ID' => $user_id,
            'display_name' => $name,
        ));

        // Set user role as customer (WooCommerce)
        $user = new WP_User($user_id);
        $user->set_role('customer');

        // Generate token
        $token = $this->generate_token($user_id);

        // Get formatted user data
        $user_data = $this->format_user($user);

        return rest_ensure_response(array(
            'message' => 'Usuário cadastrado com sucesso',
            'data' => array(
                'user' => $user_data,
                'token' => $token,
            ),
        ));
    }

    /**
     * Login user
     */
    public function login_user($request)
    {
        $params = $request->get_json_params();

        $email = isset($params['email']) ? sanitize_email($params['email']) : '';
        $password = isset($params['password']) ? $params['password'] : '';

        // Validation
        if (empty($email) || empty($password)) {
            return new WP_Error('missing_fields', 'E-mail e senha são obrigatórios', array('status' => 400));
        }

        // Authenticate user
        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', 'E-mail ou senha inválidos', array('status' => 401));
        }

        // Generate token
        $token = $this->generate_token($user->ID);

        // Get formatted user data
        $user_data = $this->format_user($user);

        return rest_ensure_response(array(
            'message' => 'Login realizado com sucesso',
            'data' => array(
                'user' => $user_data,
                'token' => $token,
            ),
        ));
    }

    /**
     * Get current user
     */
    public function get_current_user($request)
    {
        $current_user_id = get_current_user_id();

        if (!$current_user_id) {
            return new WP_Error('not_authenticated', 'Usuário não autenticado', array('status' => 401));
        }

        $user = get_userdata($current_user_id);
        $user_data = $this->format_user($user);

        return rest_ensure_response($user_data);
    }

    /**
     * Forgot password
     */
    public function forgot_password($request)
    {
        $params = $request->get_json_params();

        $email = isset($params['email']) ? sanitize_email($params['email']) : '';

        if (empty($email)) {
            return new WP_Error('missing_email', 'E-mail é obrigatório', array('status' => 400));
        }

        $user = get_user_by('email', $email);

        if (!$user) {
            // Don't reveal if email exists for security
            return rest_ensure_response(array(
                'message' => 'Se o e-mail existir, você receberá um link para redefinir sua senha',
            ));
        }

        // Generate reset token
        $reset_token = wp_generate_password(32, false);
        update_user_meta($user->ID, 'n1_reset_token', $reset_token);
        update_user_meta($user->ID, 'n1_reset_token_expiry', time() + 3600); // 1 hour

        // Construir URL do frontend para redefinição de senha
        // IMPORTANTE: O email sempre deve usar a URL de produção, mesmo que a requisição venha de localhost
        // Pegar a origem da requisição apenas para debug
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        if (empty($origin)) {
            $origin = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
        }

        // URL de produção (sempre usar no email)
        $frontend_url_production = 'https://loja.n-1edicoes.org';

        // URL para debug (usar a origem da requisição)
        $frontend_url_debug = $frontend_url_production;
        if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
            $frontend_url_debug = 'http://localhost:3000';
        } elseif (strpos($origin, 'n-1.artnaweb.com.br') !== false) {
            $frontend_url_debug = $origin;
        }

        // Link para o email (sempre produção)
        $reset_link = $frontend_url_production . '/forget-password/' . $reset_token;

        // Link para debug (pode ser localhost)
        $reset_link_debug = $frontend_url_debug . '/forget-password/' . $reset_token;

        error_log('N1 API - forgot_password: Preparando envio de email');
        error_log('N1 API - forgot_password: Email destino: ' . $email);
        error_log('N1 API - forgot_password: Link de reset (no email): ' . $reset_link);
        error_log('N1 API - forgot_password: Link de reset (debug): ' . $reset_link_debug);
        error_log('N1 API - forgot_password: Origem da requisição: ' . $origin);

        // Enviar email com link de redefinição
        $subject = 'Redefinição de Senha - N-1 Edições';
        $message = 'Olá ' . $user->display_name . ",\n\n";
        $message .= "Você solicitou a redefinição de senha para sua conta na N-1 Edições.\n\n";
        $message .= "Clique no link abaixo para redefinir sua senha:\n";
        $message .= $reset_link . "\n\n";
        $message .= "Este link expira em 1 hora.\n\n";
        $message .= "Se você não solicitou esta redefinição, ignore este e-mail.\n\n";
        $message .= "Atenciosamente,\n";
        $message .= "Equipe N-1 Edições";

        // Configurar headers do email
        $headers = array(
            'Content-Type: text/plain; charset=UTF-8',
            'From: N-1 Edições <comercial@n-1edicoes.org>',
        );

        // Capturar erros do PHPMailer
        $phpmailer_error = null;
        $wp_mail_failed = false;

        // Hook para capturar erros do PHPMailer após o envio
        $failure_handler = function ($wp_error) use (&$phpmailer_error, &$wp_mail_failed) {
            $phpmailer_error = $wp_error->get_error_message();
            $wp_mail_failed = true;
            error_log('N1 API - forgot_password: Erro wp_mail_failed: ' . $phpmailer_error);
        };
        add_action('wp_mail_failed', $failure_handler);

        // Verificar configuração de email antes de enviar
        error_log('N1 API - forgot_password: Verificando configuração de email...');

        // Verificar se há plugin SMTP ativo
        $has_smtp = false;
        $smtp_plugin_name = '';

        // Verificar plugins SMTP comuns
        $smtp_plugins = array(
            'wp-mail-smtp/wp_mail_smtp.php' => 'WP Mail SMTP',
            'easy-wp-smtp/easy-wp-smtp.php' => 'Easy WP SMTP',
            'post-smtp/postman-smtp.php' => 'Post SMTP',
            'wp-smtp/wp-smtp.php' => 'WP SMTP',
        );

        if (function_exists('is_plugin_active')) {
            foreach ($smtp_plugins as $plugin_path => $plugin_name) {
                if (is_plugin_active($plugin_path)) {
                    $has_smtp = true;
                    $smtp_plugin_name = $plugin_name;
                    error_log('N1 API - forgot_password: Plugin SMTP ativo: ' . $plugin_name);
                    break;
                }
            }
        }

        // Verificar se há função de SMTP customizada
        if (!$has_smtp && function_exists('wp_mail_smtp')) {
            $has_smtp = true;
            error_log('N1 API - forgot_password: Função wp_mail_smtp encontrada');
        }

        if (!$has_smtp) {
            error_log('N1 API - forgot_password: AVISO - Nenhum plugin SMTP detectado');
        }

        // Verificar se PHPMailer está disponível
        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            error_log('N1 API - forgot_password: AVISO - PHPMailer não está disponível');
        }

        // Tentar enviar email
        $email_sent = wp_mail($email, $subject, $message, $headers);

        // Remover o hook para não interferir em outros envios
        remove_action('wp_mail_failed', $failure_handler);

        // Verificar se houve erro global do PHPMailer
        global $phpmailer;
        $phpmailer_has_error = false;
        if (isset($phpmailer) && is_object($phpmailer)) {
            if (!empty($phpmailer->ErrorInfo)) {
                $phpmailer_error = $phpmailer->ErrorInfo;
                $phpmailer_has_error = true;
                error_log('N1 API - forgot_password: ERRO PHPMailer ErrorInfo: ' . $phpmailer_error);
            }

            // Verificar se o email foi realmente enviado
            if (method_exists($phpmailer, 'getSMTPInstance')) {
                $smtp = $phpmailer->getSMTPInstance();
                if ($smtp && method_exists($smtp, 'getError')) {
                    $smtp_error = $smtp->getError();
                    if (!empty($smtp_error)) {
                        $phpmailer_error = $smtp_error['error'];
                        $phpmailer_has_error = true;
                        error_log('N1 API - forgot_password: ERRO SMTP: ' . $phpmailer_error);
                    }
                }
            }
        }

        // Se houve falha ou erro, considerar como não enviado
        if ($wp_mail_failed || $phpmailer_has_error) {
            $email_sent = false;
            error_log('N1 API - forgot_password: Email marcado como NÃO enviado devido a erros');
        }

        // Verificação adicional: se wp_mail retornou true mas não há SMTP configurado, pode ser falso positivo
        // Em muitos servidores, wp_mail retorna true mesmo quando o email não foi enviado
        if ($email_sent && !$has_smtp) {
            error_log('N1 API - forgot_password: AVISO CRÍTICO - wp_mail retornou true mas não há SMTP configurado.');
            error_log('N1 API - forgot_password: Em muitos servidores, isso significa que o email NÃO foi enviado.');
            error_log('N1 API - forgot_password: Recomendação: Instale e configure um plugin SMTP (WP Mail SMTP recomendado)');

            // Considerar como não enviado se não houver SMTP configurado
            // Isso evita falsos positivos
            $email_sent = false;
            error_log('N1 API - forgot_password: Email marcado como NÃO enviado (sem SMTP configurado)');
        }

        // Log detalhado do resultado
        if (!$email_sent) {
            error_log('N1 API - forgot_password: ERRO - wp_mail retornou false para ' . $email);
            if ($phpmailer_error) {
                error_log('N1 API - forgot_password: Erro detalhado: ' . $phpmailer_error);
            }
            error_log('N1 API - forgot_password: Verifique se o WordPress está configurado para enviar emails (SMTP)');
            error_log('N1 API - forgot_password: Verifique se o plugin SMTP está ativo e configurado corretamente');
        } else {
            error_log('N1 API - forgot_password: SUCESSO - wp_mail retornou true para ' . $email);
            error_log('N1 API - forgot_password: Email pode estar na caixa de spam. Verifique também.');
            error_log('N1 API - forgot_password: Se não receber, verifique:');
            error_log('N1 API - forgot_password: 1. Caixa de spam/lixo eletrônico');
            error_log('N1 API - forgot_password: 2. Configuração do SMTP (credenciais corretas?)');
            error_log('N1 API - forgot_password: 3. Firewall/antispam do servidor');
            error_log('N1 API - forgot_password: 4. Logs do plugin SMTP');
        }

        // Verificar se estamos em ambiente de desenvolvimento/teste
        $is_development = (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false);

        // Usar as variáveis já definidas anteriormente
        $smtp_plugin_active = $has_smtp;

        // Em desenvolvimento, retornar o token para facilitar testes
        $response_data = array(
            'message' => 'Se o e-mail existir, você receberá um link para redefinir sua senha',
        );

        // Em desenvolvimento ou se email não foi enviado, incluir debug
        if ($is_development || !$email_sent) {
            $debug_info = array(
                'token' => $reset_token,
                'reset_link' => $reset_link, // Link de produção (que vai no email)
                'reset_link_debug' => $reset_link_debug, // Link para debug (pode ser localhost)
                'email_sent' => $email_sent,
                'smtp_plugin_active' => $smtp_plugin_active,
                'smtp_plugin_name' => $smtp_plugin_name,
            );

            if ($phpmailer_error) {
                $debug_info['phpmailer_error'] = $phpmailer_error;
            }

            if ($email_sent) {
                $debug_info['note'] = 'Email enviado com link de produção. Se não receber, verifique: spam, configuração SMTP, ou logs do WordPress.';
            } else {
                $debug_info['note'] = 'Email NÃO foi enviado. ' . ($smtp_plugin_active ? 'Plugin SMTP ativo mas falhou. Verifique configuração.' : 'Configure um plugin SMTP no WordPress.');
            }

            $response_data['debug'] = $debug_info;
            error_log('N1 API - forgot_password: Modo debug ativado - token incluído na resposta');
        }

        return rest_ensure_response($response_data);
    }

    /**
     * Confirm forgot password
     */
    public function confirm_forgot_password($request)
    {
        $params = $request->get_json_params();

        $token = isset($params['token']) ? sanitize_text_field($params['token']) : '';
        $new_password = isset($params['password']) ? $params['password'] : '';

        if (empty($token) || empty($new_password)) {
            return new WP_Error('missing_fields', 'Token e nova senha são obrigatórios', array('status' => 400));
        }

        // Find user by reset token
        $users = get_users(array(
            'meta_key' => 'n1_reset_token',
            'meta_value' => $token,
            'number' => 1,
        ));

        if (empty($users)) {
            return new WP_Error('invalid_token', 'Token inválido ou expirado', array('status' => 400));
        }

        $user = $users[0];

        // Check if token is expired
        $expiry = get_user_meta($user->ID, 'n1_reset_token_expiry', true);
        if ($expiry && time() > $expiry) {
            delete_user_meta($user->ID, 'n1_reset_token');
            delete_user_meta($user->ID, 'n1_reset_token_expiry');
            return new WP_Error('expired_token', 'Token expirado', array('status' => 400));
        }

        // Update password
        wp_set_password($new_password, $user->ID);

        // Delete reset token
        delete_user_meta($user->ID, 'n1_reset_token');
        delete_user_meta($user->ID, 'n1_reset_token_expiry');

        // Generate new API token
        $api_token = $this->generate_token($user->ID);

        return rest_ensure_response(array(
            'message' => 'Senha redefinida com sucesso',
            'data' => array(
                'user' => $this->format_user($user),
                'token' => $api_token,
            ),
        ));
    }

    /**
     * Change password
     */
    public function change_password($request)
    {
        $params = $request->get_json_params();

        $current_password = isset($params['currentPassword']) ? $params['currentPassword'] : '';
        $new_password = isset($params['newPassword']) ? $params['newPassword'] : '';

        $user_id = get_current_user_id();

        if (!$user_id) {
            return new WP_Error('not_authenticated', 'Usuário não autenticado', array('status' => 401));
        }

        if (empty($current_password) || empty($new_password)) {
            return new WP_Error('missing_fields', 'Senha atual e nova senha são obrigatórias', array('status' => 400));
        }

        // Verify current password
        $user = get_userdata($user_id);
        if (!wp_check_password($current_password, $user->user_pass, $user_id)) {
            return new WP_Error('invalid_password', 'Senha atual incorreta', array('status' => 400));
        }

        // Update password
        wp_set_password($new_password, $user_id);

        // Generate new token
        $token = $this->generate_token($user_id);

        return rest_ensure_response(array(
            'message' => 'Senha alterada com sucesso',
            'data' => array(
                'user' => $this->format_user($user),
                'token' => $token,
            ),
        ));
    }

    /**
     * Update user profile
     */
    public function update_user($request)
    {
        $user_id = intval($request['id']);
        $current_user_id = get_current_user_id();

        // Check if user can update this profile
        if ($user_id !== $current_user_id && !current_user_can('edit_users')) {
            return new WP_Error('permission_denied', 'Você não tem permissão para atualizar este perfil', array('status' => 403));
        }

        $params = $request->get_json_params();

        $update_data = array('ID' => $user_id);

        if (isset($params['name'])) {
            $update_data['display_name'] = sanitize_text_field($params['name']);
        }

        if (isset($params['email'])) {
            $email = sanitize_email($params['email']);
            if (is_email($email)) {
                // Check if email is already used by another user
                $existing_user = get_user_by('email', $email);
                if ($existing_user && $existing_user->ID !== $user_id) {
                    return new WP_Error('email_exists', 'Este e-mail já está em uso', array('status' => 409));
                }
                $update_data['user_email'] = $email;
            }
        }

        $result = wp_update_user($update_data);

        if (is_wp_error($result)) {
            return new WP_Error('update_failed', $result->get_error_message(), array('status' => 500));
        }

        // Salvar campos adicionais usando user_meta
        if (isset($params['lastName'])) {
            update_user_meta($user_id, 'n1_lastname', sanitize_text_field($params['lastName']));
        }

        if (isset($params['phone'])) {
            update_user_meta($user_id, 'n1_phone', sanitize_text_field($params['phone']));
            update_user_meta($user_id, 'billing_phone', sanitize_text_field($params['phone']));
        }

        if (isset($params['address'])) {
            update_user_meta($user_id, 'n1_address', sanitize_text_field($params['address']));
            update_user_meta($user_id, 'billing_address_1', sanitize_text_field($params['address']));
        }

        if (isset($params['number'])) {
            update_user_meta($user_id, 'n1_number', sanitize_text_field($params['number']));
        }

        if (isset($params['complement'])) {
            update_user_meta($user_id, 'n1_complement', sanitize_text_field($params['complement']));
        }

        if (isset($params['zipCode'])) {
            update_user_meta($user_id, 'n1_zipcode', sanitize_text_field($params['zipCode']));
            update_user_meta($user_id, 'billing_postcode', sanitize_text_field($params['zipCode']));
        }

        if (isset($params['city'])) {
            update_user_meta($user_id, 'n1_city', sanitize_text_field($params['city']));
            update_user_meta($user_id, 'billing_city', sanitize_text_field($params['city']));
        }

        if (isset($params['country'])) {
            update_user_meta($user_id, 'n1_country', sanitize_text_field($params['country']));
            update_user_meta($user_id, 'billing_state', sanitize_text_field($params['country']));
        }

        if (isset($params['bio'])) {
            update_user_meta($user_id, 'n1_bio', sanitize_textarea_field($params['bio']));
            wp_update_user(array('ID' => $user_id, 'description' => sanitize_textarea_field($params['bio'])));
        }

        $user = get_userdata($user_id);
        $token = $this->generate_token($user_id);

        return rest_ensure_response(array(
            'message' => 'Perfil atualizado com sucesso',
            'data' => array(
                'user' => $this->format_user($user),
                'token' => $token,
            ),
        ));
    }

    /**
     * Confirm email
     */
    public function confirm_email($request)
    {
        $token = sanitize_text_field($request['token']);

        // Find user by confirmation token
        $users = get_users(array(
            'meta_key' => 'n1_email_confirmation_token',
            'meta_value' => $token,
            'number' => 1,
        ));

        if (empty($users)) {
            return new WP_Error('invalid_token', 'Token de confirmação inválido', array('status' => 400));
        }

        $user = $users[0];

        // Mark email as confirmed
        update_user_meta($user->ID, 'n1_email_confirmed', true);
        delete_user_meta($user->ID, 'n1_email_confirmation_token');

        // Generate API token
        $api_token = $this->generate_token($user->ID);

        return rest_ensure_response(array(
            'message' => 'E-mail confirmado com sucesso',
            'data' => array(
                'user' => $this->format_user($user),
                'token' => $api_token,
            ),
        ));
    }

    /**
     * Create Payment Intent (Stripe)
     */
    public function create_payment_intent($request)
    {
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $params = $request->get_json_params();
        $amount = isset($params['price']) ? floatval($params['price']) : 0;
        $payment_method = isset($params['payment_method']) ? sanitize_text_field($params['payment_method']) : 'card';

        if ($amount <= 0) {
            return new WP_Error('invalid_amount', 'Valor inválido', array('status' => 400));
        }

        // Converter para centavos (Stripe usa centavos)
        $amount_in_cents = intval($amount * 100);

        // Verificar se a biblioteca Stripe está disponível
        if (!function_exists('curl_init')) {
            return new WP_Error('stripe_unavailable', 'Stripe não está disponível', array('status' => 500));
        }

        // Determinar método de pagamento
        $payment_method_type = 'card';
        if ($payment_method === 'pix') {
            $payment_method_type = 'pix';
        } elseif ($payment_method === 'boleto') {
            $payment_method_type = 'boleto';
        }

        error_log('N1 API - create_payment_intent: Criando payment intent para ' . $payment_method_type . ' - Valor: ' . $amount_in_cents);

        // Criar Payment Intent via API do Stripe
        $stripe_url = 'https://api.stripe.com/v1/payment_intents';
        $stripe_data = array(
            'amount' => $amount_in_cents,
            'currency' => 'brl', // BRL para reais brasileiros
            'payment_method_types[]' => $payment_method_type,
        );

        // Para PIX, precisamos criar e confirmar o Payment Intent para obter o QR Code
        if ($payment_method_type === 'pix') {
            // PIX expira em 30 minutos
            $stripe_data['payment_method_options[pix][expires_after_seconds]'] = 1800;
            // Confirmar automaticamente para gerar o QR Code
            $stripe_data['confirm'] = 'true';
            // Criar um payment method inline para PIX
            $stripe_data['payment_method_data[type]'] = 'pix';
        } elseif ($payment_method_type === 'boleto') {
            // Boleto expira em 3 dias
            $stripe_data['payment_method_options[boleto][expires_after_days]'] = 3;
            // Boleto é confirmado pelo frontend com os dados do cliente (CPF)
        }

        error_log('N1 API - create_payment_intent: Dados enviados ao Stripe - ' . print_r($stripe_data, true));

        $ch = curl_init($stripe_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($stripe_data));
        curl_setopt($ch, CURLOPT_USERPWD, $this->stripe_secret_key . ':');
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/x-www-form-urlencoded',
        ));

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        error_log('N1 API - create_payment_intent: HTTP Code: ' . $http_code);
        error_log('N1 API - create_payment_intent: Resposta do Stripe: ' . $response);

        if ($http_code !== 200) {
            $error_data = json_decode($response, true);
            error_log('N1 API - create_payment_intent: Erro do Stripe - ' . print_r($error_data, true));

            $error_message = isset($error_data['error']['message']) ? $error_data['error']['message'] : 'Erro ao criar Payment Intent';

            return new WP_Error('stripe_error', $error_message, array('status' => $http_code));
        }

        $payment_intent = json_decode($response, true);

        if (!isset($payment_intent['client_secret'])) {
            return new WP_Error('stripe_error', 'Resposta inválida do Stripe', array('status' => 500));
        }

        error_log('N1 API - create_payment_intent: Payment intent criado com sucesso - ID: ' . $payment_intent['id']);

        // Log completo da resposta do Stripe para debug
        error_log('N1 API - create_payment_intent: Resposta completa do Stripe - ' . print_r($payment_intent, true));

        // Preparar resposta com todos os dados relevantes
        $response_data = array(
            'clientSecret' => $payment_intent['client_secret'],
            'paymentIntentId' => $payment_intent['id'],
            'paymentMethod' => $payment_method_type,
            'status' => isset($payment_intent['status']) ? $payment_intent['status'] : null,
        );

        // Para PIX, incluir dados do QR Code se disponível
        if ($payment_method_type === 'pix' && isset($payment_intent['next_action']['pix_display_qr_code'])) {
            $pix_data = $payment_intent['next_action']['pix_display_qr_code'];
            $response_data['next_action'] = array(
                'pix_display_qr_code' => array(
                    'data' => isset($pix_data['data']) ? $pix_data['data'] : null,
                    'image_url_png' => isset($pix_data['image_url_png']) ? $pix_data['image_url_png'] : null,
                    'image_url_svg' => isset($pix_data['image_url_svg']) ? $pix_data['image_url_svg'] : null,
                    'hosted_instructions_url' => isset($pix_data['hosted_instructions_url']) ? $pix_data['hosted_instructions_url'] : null,
                    'expires_at' => isset($pix_data['expires_at']) ? $pix_data['expires_at'] : null,
                ),
            );
            error_log('N1 API - create_payment_intent: Dados do PIX incluídos na resposta');
        } elseif ($payment_method_type === 'pix') {
            error_log('N1 API - create_payment_intent: ATENÇÃO - next_action.pix_display_qr_code não encontrado na resposta do Stripe');
        }

        // Para Boleto, incluir dados do boleto se disponível
        if ($payment_method_type === 'boleto' && isset($payment_intent['next_action']['boleto_display_details'])) {
            $boleto_data = $payment_intent['next_action']['boleto_display_details'];
            $response_data['next_action'] = array(
                'boleto_display_details' => array(
                    'number' => isset($boleto_data['number']) ? $boleto_data['number'] : null,
                    'hosted_voucher_url' => isset($boleto_data['hosted_voucher_url']) ? $boleto_data['hosted_voucher_url'] : null,
                    'expires_at' => isset($boleto_data['expires_at']) ? $boleto_data['expires_at'] : null,
                ),
            );
        }

        return rest_ensure_response(array(
            'data' => $response_data,
        ));
    }

    /**
     * Add Order (WooCommerce)
     */
    public function add_order($request)
    {
        try {
            if (!class_exists('WooCommerce')) {
                return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
            }

            $params = $request->get_json_params();

            // Log para debug (remover em produção)
            error_log('N1 API - add_order chamado com: ' . print_r($params, true));

            // Validar dados obrigatórios - o frontend pode enviar 'cart' ou 'cart_products'
            $cart_products = isset($params['cart']) ? $params['cart'] : (isset($params['cart_products']) ? $params['cart_products'] : array());

            if (!is_array($cart_products) || empty($cart_products)) {
                return new WP_Error('invalid_data', 'Produtos do carrinho são obrigatórios', array('status' => 400));
            }

            // O frontend pode enviar shipping_info ou os dados diretamente
            $shipping_info = isset($params['shipping_info']) ? $params['shipping_info'] : array();

            if (empty($shipping_info) && isset($params['name'])) {
                // Se não houver shipping_info, tentar construir a partir dos dados diretos
                $name_parts = explode(' ', $params['name'], 2);
                $shipping_info = array(
                    'firstName' => isset($name_parts[0]) ? $name_parts[0] : '',
                    'lastName' => isset($name_parts[1]) ? $name_parts[1] : '',
                    'email' => isset($params['email']) ? $params['email'] : '',
                    'phone' => isset($params['contact']) ? $params['contact'] : '',
                    'address' => isset($params['address']) ? $params['address'] : '',
                    'city' => isset($params['city']) ? $params['city'] : '',
                    'country' => isset($params['country']) ? $params['country'] : 'BR',
                    'postcode' => isset($params['zipCode']) ? $params['zipCode'] : '',
                );
            }

            if (empty($shipping_info)) {
                return new WP_Error('invalid_data', 'Informações de entrega são obrigatórias', array('status' => 400));
            }

            // Tentar autenticar usuário se houver token na requisição
            $user_id = get_current_user_id();
            error_log('N1 API - add_order: user_id inicial (get_current_user_id) = ' . $user_id);

            // Se não houver usuário logado, tentar autenticar pelo token
            if (!$user_id) {
                // Verificar se há token na requisição
                $headers = array();
                if (function_exists('getallheaders')) {
                    $headers = getallheaders();
                } else {
                    foreach ($_SERVER as $name => $value) {
                        if (substr($name, 0, 5) == 'HTTP_') {
                            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                        }
                    }
                }

                // Normalizar headers para case-insensitive
                $normalized_headers = array();
                foreach ($headers as $key => $value) {
                    $normalized_headers[strtolower($key)] = $value;
                }

                $auth_header = '';
                if (isset($normalized_headers['authorization'])) {
                    $auth_header = $normalized_headers['authorization'];
                } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
                } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                    $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
                }

                error_log('N1 API - add_order: Auth header presente = ' . ($auth_header ? 'sim' : 'não'));

                // Se houver token, tentar validar
                if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                    $token = trim($matches[1]);
                    error_log('N1 API - add_order: Token encontrado, validando...');
                    $validated_user_id = $this->validate_token($token);
                    if ($validated_user_id) {
                        $user_id = $validated_user_id;
                        wp_set_current_user($user_id);
                        error_log('N1 API - add_order: Token válido, user_id = ' . $user_id);
                    } else {
                        error_log('N1 API - add_order: Token inválido ou expirado, usando guest checkout');
                        $user_id = 0;
                    }
                } else {
                    error_log('N1 API - add_order: Sem token, usando guest checkout (user_id = 0)');
                    $user_id = 0;
                }
            } else {
                error_log('N1 API - add_order: Usuário já logado, user_id = ' . $user_id);
            }

            $coupon_info = isset($params['couponInfo']) ? $params['couponInfo'] : null;
            error_log('N1 API - add_order: Continuando com processamento do pedido. user_id final = ' . $user_id);

            // Extrair payment intent ID - pode vir como objeto ou string
            $payment_intent_id = null;
            $payment_status = 'succeeded'; // Default para succeeded se houver paymentIntent

            if (isset($params['paymentIntent'])) {
                if (is_array($params['paymentIntent']) || is_object($params['paymentIntent'])) {
                    $payment_intent_obj = is_array($params['paymentIntent']) ? $params['paymentIntent'] : (array) $params['paymentIntent'];
                    $payment_intent_id = isset($payment_intent_obj['id']) ? sanitize_text_field($payment_intent_obj['id']) : null;
                    $payment_status = isset($payment_intent_obj['status']) ? sanitize_text_field($payment_intent_obj['status']) : 'succeeded';
                } else {
                    $payment_intent_id = sanitize_text_field($params['paymentIntent']);
                }
            }

            if (isset($params['paymentStatus'])) {
                $payment_status = sanitize_text_field($params['paymentStatus']);
            }

            // Se não houver paymentIntent, considerar como pending
            if (!$payment_intent_id) {
                $payment_status = 'pending';
            }

            // Calcular total
            $subtotal = 0;
            $line_items = array();

            foreach ($cart_products as $item) {
                $product_id = isset($item['_id']) ? intval($item['_id']) : (isset($item['id']) ? intval($item['id']) : 0);
                $quantity = isset($item['orderQuantity']) ? intval($item['orderQuantity']) : 1;
                $price = isset($item['price']) ? floatval($item['price']) : 0;

                if ($product_id > 0) {
                    $product = wc_get_product($product_id);
                    if ($product) {
                        $line_items[] = array(
                            'product_id' => $product_id,
                            'quantity' => $quantity,
                            'subtotal' => $price * $quantity,
                            'total' => $price * $quantity,
                        );
                        $subtotal += $price * $quantity;
                    }
                }
            }

            // Aplicar desconto do cupom se houver
            $discount_total = 0;
            if ($coupon_info && isset($coupon_info['discountValue'])) {
                $discount_total = floatval($coupon_info['discountValue']);
            }

            $total = $subtotal - $discount_total;
            if ($total < 0) {
                $total = 0;
            }

            // Criar pedido no WooCommerce
            $order = wc_create_order();

            if (is_wp_error($order)) {
                return new WP_Error('order_creation_failed', 'Erro ao criar pedido: ' . $order->get_error_message(), array('status' => 500));
            }

            // Adicionar produtos ao pedido
            foreach ($line_items as $line_item) {
                $product = wc_get_product($line_item['product_id']);
                if ($product) {
                    $order->add_product($product, $line_item['quantity']);
                }
            }

            // Aplicar cupom se houver
            if ($coupon_info && isset($coupon_info['couponCode'])) {
                $coupon_code = sanitize_text_field($coupon_info['couponCode']);
                $order->apply_coupon($coupon_code);
            }

            // Adicionar informações de entrega
            $billing_address = array(
                'first_name' => isset($shipping_info['firstName']) ? sanitize_text_field($shipping_info['firstName']) : '',
                'last_name' => isset($shipping_info['lastName']) ? sanitize_text_field($shipping_info['lastName']) : '',
                'email' => isset($shipping_info['email']) ? sanitize_email($shipping_info['email']) : '',
                'phone' => isset($shipping_info['phone']) ? sanitize_text_field($shipping_info['phone']) : (isset($shipping_info['contact']) ? sanitize_text_field($shipping_info['contact']) : ''),
                'address_1' => isset($shipping_info['address']) ? sanitize_text_field($shipping_info['address']) : '',
                'city' => isset($shipping_info['city']) ? sanitize_text_field($shipping_info['city']) : '',
                'state' => isset($shipping_info['state']) ? sanitize_text_field($shipping_info['state']) : '',
                'postcode' => isset($shipping_info['postcode']) ? sanitize_text_field($shipping_info['postcode']) : (isset($shipping_info['zipCode']) ? sanitize_text_field($shipping_info['zipCode']) : ''),
                'country' => isset($shipping_info['country']) ? sanitize_text_field($shipping_info['country']) : 'BR',
            );

            $shipping_address = $billing_address;

            $order->set_billing_address($billing_address);
            $order->set_shipping_address($shipping_address);

            // Definir método de pagamento baseado no que foi enviado
            $payment_method_from_request = isset($params['paymentMethod']) ? sanitize_text_field($params['paymentMethod']) : 'card';

            $payment_method_title = 'Cartão de Crédito (Stripe)';
            if ($payment_method_from_request === 'pix') {
                $payment_method_title = 'PIX (Stripe)';
            } elseif ($payment_method_from_request === 'boleto') {
                $payment_method_title = 'Boleto Bancário (Stripe)';
            }

            $order->set_payment_method('stripe');
            $order->set_payment_method_title($payment_method_title);

            // Adicionar meta do payment intent se houver
            if ($payment_intent_id) {
                $order->update_meta_data('_stripe_payment_intent_id', $payment_intent_id);
            }

            // Definir status do pagamento
            if ($payment_status === 'succeeded' || $payment_status === 'paid') {
                $order->set_status('processing');
            } else {
                $order->set_status('pending');
            }

            // Calcular totais
            $order->calculate_totals();

            // Associar pedido ao usuário
            $order->set_customer_id($user_id);

            // Garantir que o usuário está definido como atual
            wp_set_current_user($user_id);

            // Salvar pedido
            $order_id = $order->save();

            if (!$order_id || is_wp_error($order_id)) {
                $error_msg = is_wp_error($order_id) ? $order_id->get_error_message() : 'Erro desconhecido ao salvar pedido';
                error_log('N1 API - Erro ao salvar pedido: ' . $error_msg);
                return new WP_Error('order_save_failed', 'Erro ao salvar pedido: ' . $error_msg, array('status' => 500));
            }

            // Recarregar o pedido para garantir que os dados estão atualizados
            $saved_order = wc_get_order($order_id);
            if ($saved_order) {
                // Verificar e corrigir customer_id se necessário
                $saved_customer_id = $saved_order->get_customer_id();
                if ($saved_customer_id != $user_id) {
                    error_log('N1 API - Customer ID incorreto. Corrigindo de ' . $saved_customer_id . ' para ' . $user_id);
                    $saved_order->set_customer_id($user_id);
                    $saved_order->save();
                }
                error_log('N1 API - Pedido criado com sucesso. ID: ' . $order_id . ', Customer ID: ' . $saved_order->get_customer_id());
            } else {
                error_log('N1 API - Pedido criado mas não foi possível recarregar. ID: ' . $order_id);
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Pedido criado com sucesso',
                'order' => array(
                    '_id' => (string) $order_id,
                    'id' => $order_id,
                    'order_number' => $order->get_order_number(),
                    'status' => $order->get_status(),
                    'total' => $order->get_total(),
                    'date_created' => $order->get_date_created()->date('Y-m-d H:i:s'),
                ),
            ));
        } catch (Exception $e) {
            error_log('N1 API - Exceção em add_order: ' . $e->getMessage());
            error_log('N1 API - Stack trace: ' . $e->getTraceAsString());
            return new WP_Error('server_error', 'Erro ao processar pedido: ' . $e->getMessage(), array('status' => 500));
        }
    }

    /**
     * Get all orders by user
     */
    public function get_user_orders($request)
    {
        try {
            if (!class_exists('WooCommerce')) {
                return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
            }

            $user_id = get_current_user_id();
            if (!$user_id) {
                return new WP_Error('unauthorized', 'Usuário não autenticado', array('status' => 401));
            }

            $orders = wc_get_orders(array(
                'customer_id' => $user_id,
                'limit' => -1,
                'orderby' => 'date',
                'order' => 'DESC',
            ));

            $formatted_orders = array();
            $total_doc = 0;
            $pending = 0;
            $processing = 0;
            $delivered = 0;

            if (is_array($orders)) {
                foreach ($orders as $order) {
                    try {
                        $formatted_order = $this->format_order($order);
                        if ($formatted_order) {
                            $formatted_orders[] = $formatted_order;
                            $total_doc++;

                            // Contar por status
                            $status = $order->get_status();
                            if ($status === 'pending' || $status === 'on-hold') {
                                $pending++;
                            } elseif ($status === 'processing') {
                                $processing++;
                            } elseif ($status === 'completed' || $status === 'delivered') {
                                $delivered++;
                            }
                        }
                    } catch (Exception $e) {
                        // Continuar processando outros pedidos mesmo se um falhar
                        error_log('Erro ao formatar pedido: ' . $e->getMessage());
                        continue;
                    }
                }
            }

            return rest_ensure_response(array(
                'orders' => $formatted_orders,
                'totalDoc' => $total_doc,
                'pending' => $pending,
                'processing' => $processing,
                'delivered' => $delivered,
            ));
        } catch (Exception $e) {
            return new WP_Error('server_error', 'Erro ao buscar pedidos: ' . $e->getMessage(), array('status' => 500));
        }
    }

    /**
     * Get single order by ID
     */
    public function get_single_order($request)
    {
        try {
            if (!class_exists('WooCommerce')) {
                return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
            }

            $order_id = intval($request['id']);
            error_log('N1 API - Buscando pedido ID: ' . $order_id);

            $user_id = get_current_user_id();

            if (!$user_id) {
                error_log('N1 API - Usuário não autenticado');
                return new WP_Error('unauthorized', 'Usuário não autenticado', array('status' => 401));
            }

            error_log('N1 API - Usuário autenticado ID: ' . $user_id);

            $order = wc_get_order($order_id);

            if (!$order) {
                error_log('N1 API - Pedido não encontrado: ' . $order_id);
                return new WP_Error('order_not_found', 'Pedido não encontrado', array('status' => 404));
            }

            $customer_id = $order->get_customer_id();
            error_log('N1 API - Pedido encontrado. Customer ID: ' . $customer_id . ', User ID: ' . $user_id);

            // Verificar se o pedido pertence ao usuário
            // Se customer_id for 0 ou vazio, pode ser um pedido criado sem usuário - permitir se for admin
            if ($customer_id != $user_id) {
                // Verificar se é admin ou se pode editar pedidos
                if (!current_user_can('edit_shop_orders')) {
                    // Verificar também pelo email de cobrança como fallback
                    $billing_email = $order->get_billing_email();
                    $user_email = get_userdata($user_id)->user_email;

                    if ($billing_email != $user_email) {
                        error_log('N1 API - Permissão negada. Customer: ' . $customer_id . ', User: ' . $user_id . ', Email billing: ' . $billing_email . ', User email: ' . $user_email);
                        return new WP_Error('permission_denied', 'Você não tem permissão para visualizar este pedido', array('status' => 403));
                    } else {
                        error_log('N1 API - Permissão concedida por email. Customer: ' . $customer_id . ', User: ' . $user_id);
                    }
                } else {
                    error_log('N1 API - Permissão concedida (admin). Customer: ' . $customer_id . ', User: ' . $user_id);
                }
            } else {
                error_log('N1 API - Permissão concedida (customer_id match). Customer: ' . $customer_id . ', User: ' . $user_id);
            }

            error_log('N1 API - Formatando pedido...');
            $formatted_order = $this->format_order($order);

            if (!$formatted_order) {
                error_log('N1 API - Erro ao formatar pedido');
                return new WP_Error('order_format_error', 'Erro ao formatar pedido', array('status' => 500));
            }

            error_log('N1 API - Pedido formatado com sucesso');
            return rest_ensure_response(array(
                'order' => $formatted_order,
            ));
        } catch (Exception $e) {
            error_log('N1 API - Exceção em get_single_order: ' . $e->getMessage());
            error_log('N1 API - Stack trace: ' . $e->getTraceAsString());
            return new WP_Error('server_error', 'Erro ao buscar pedido: ' . $e->getMessage(), array('status' => 500));
        }
    }

    /**
     * Format order data for API response
     */
    private function format_order($order)
    {
        try {
            if (!$order || !is_a($order, 'WC_Order')) {
                error_log('N1 API - format_order: Pedido inválido ou não é WC_Order');
                return null;
            }

            error_log('N1 API - format_order: Iniciando formatação do pedido ID: ' . $order->get_id());

            // Obter itens do pedido
            $cart_items = array();
            $items = $order->get_items();
            if (is_array($items)) {
                foreach ($items as $item_id => $item) {
                    try {
                        $product = $item->get_product();
                        $product_id = $product ? $product->get_id() : 0;

                        $quantity = $item->get_quantity();
                        $quantity = $quantity > 0 ? $quantity : 1;

                        $item_price = floatval($item->get_total() / $quantity);
                        $regular_price = $product ? floatval($product->get_regular_price()) : $item_price;
                        $sale_price = $product ? ($product->get_sale_price() ? floatval($product->get_sale_price()) : $regular_price) : $item_price;
                        $discount = 0;

                        if ($regular_price > 0 && $sale_price < $regular_price) {
                            $discount = round((($regular_price - $sale_price) / $regular_price) * 100);
                        }

                        $image_url = wc_placeholder_img_src();
                        if ($product && $product->get_image_id()) {
                            $image_url = wp_get_attachment_image_url($product->get_image_id(), 'large');
                            if (!$image_url) {
                                $image_url = wc_placeholder_img_src();
                            }
                        }

                        $cart_items[] = array(
                            '_id' => (string) $product_id,
                            'id' => $product_id,
                            'title' => $item->get_name() ? $item->get_name() : 'Produto',
                            'price' => $sale_price,
                            'originalPrice' => $regular_price,
                            'discount' => $discount,
                            'orderQuantity' => $quantity,
                            'image' => $image_url,
                        );
                    } catch (Exception $e) {
                        error_log('Erro ao formatar item do pedido: ' . $e->getMessage());
                        continue;
                    }
                }
            }

            // Obter informações de cobrança de forma segura - usando apenas métodos individuais
            $billing = array(
                'first_name' => '',
                'last_name' => '',
                'email' => '',
                'phone' => '',
                'address_1' => '',
                'address_2' => '',
                'city' => '',
                'state' => '',
                'postcode' => '',
                'country' => 'BR',
            );

            try {
                $billing['first_name'] = $order->get_billing_first_name() ?: '';
                $billing['last_name'] = $order->get_billing_last_name() ?: '';
                $billing['email'] = $order->get_billing_email() ?: '';
                $billing['phone'] = $order->get_billing_phone() ?: '';
                $billing['address_1'] = $order->get_billing_address_1() ?: '';
                $billing['address_2'] = $order->get_billing_address_2() ?: '';
                $billing['city'] = $order->get_billing_city() ?: '';
                $billing['state'] = $order->get_billing_state() ?: '';
                $billing['postcode'] = $order->get_billing_postcode() ?: '';
                $billing['country'] = $order->get_billing_country() ?: 'BR';
            } catch (Exception $e) {
                error_log('N1 API - Erro ao obter dados de cobrança: ' . $e->getMessage());
            }

            // Formatar data
            $date_created = $order->get_date_created();
            $created_at = '';
            if ($date_created) {
                try {
                    $created_at = $date_created->date('Y-m-d H:i:s');
                } catch (Exception $e) {
                    $created_at = date('Y-m-d H:i:s');
                }
            } else {
                $created_at = date('Y-m-d H:i:s');
            }

            // Obter informações do pagamento
            $payment_method = $order->get_payment_method();
            $payment_method_title = $order->get_payment_method_title();

            // Obter cupons aplicados
            $coupons = $order->get_coupon_codes();
            $coupon_info = null;
            if (!empty($coupons) && is_array($coupons)) {
                try {
                    $coupon_code = $coupons[0];
                    $coupon = new WC_Coupon($coupon_code);
                    if ($coupon && $coupon->get_id()) {
                        $coupon_info = array(
                            'couponCode' => $coupon_code,
                            'discountValue' => floatval($order->get_total_discount()),
                        );
                    }
                } catch (Exception $e) {
                    error_log('Erro ao processar cupom: ' . $e->getMessage());
                }
            }

            $formatted = array(
                '_id' => (string) $order->get_id(),
                'id' => $order->get_id(),
                'invoice' => $order->get_order_number(),
                'name' => trim((isset($billing['first_name']) ? $billing['first_name'] : '') . ' ' . (isset($billing['last_name']) ? $billing['last_name'] : '')),
                'email' => isset($billing['email']) ? $billing['email'] : '',
                'contact' => isset($billing['phone']) ? $billing['phone'] : '',
                'country' => isset($billing['country']) ? $billing['country'] : 'BR',
                'city' => isset($billing['city']) ? $billing['city'] : '',
                'address' => isset($billing['address_1']) ? $billing['address_1'] : '',
                'zipCode' => isset($billing['postcode']) ? $billing['postcode'] : '',
                'cart' => $cart_items,
                'shippingCost' => floatval($order->get_shipping_total()),
                'discount' => floatval($order->get_total_discount()),
                'totalAmount' => floatval($order->get_total()),
                'subTotal' => floatval($order->get_subtotal()),
                'status' => $order->get_status(),
                'paymentMethod' => $payment_method ? $payment_method : 'stripe',
                'paymentMethodTitle' => $payment_method_title ? $payment_method_title : 'Cartão de Crédito',
                'createdAt' => $created_at,
                'cardInfo' => array(
                    'type' => $payment_method ? $payment_method : 'stripe',
                    'last4' => $order->get_meta('_stripe_source_id') ? substr($order->get_meta('_stripe_source_id'), -4) : '',
                ),
                'couponInfo' => $coupon_info,
            );

            error_log('N1 API - format_order: Pedido formatado com sucesso. ID: ' . $order->get_id());
            return $formatted;
        } catch (Exception $e) {
            error_log('N1 API - Exceção em format_order: ' . $e->getMessage());
            error_log('N1 API - Stack trace: ' . $e->getTraceAsString());
            return null;
        }
    }

    /**
     * Calculate shipping rates based on CEP
     */
    public function calculate_shipping($request)
    {
        error_log('N1 API - calculate_shipping: Função chamada');

        if (!class_exists('WooCommerce')) {
            error_log('N1 API - calculate_shipping: WooCommerce não está ativo');
            return new WP_Error('woocommerce_not_active', 'WooCommerce não está ativo', array('status' => 500));
        }

        $params = $request->get_json_params();
        $postcode = isset($params['postcode']) ? sanitize_text_field($params['postcode']) : '';
        $cart_products = isset($params['cart_products']) ? $params['cart_products'] : array();

        error_log('N1 API - calculate_shipping: CEP recebido: ' . $postcode);
        error_log('N1 API - calculate_shipping: Produtos no carrinho: ' . count($cart_products));

        if (empty($postcode)) {
            return new WP_Error('missing_postcode', 'CEP é obrigatório', array('status' => 400));
        }

        // Limpar CEP (remover traços e espaços)
        $postcode = preg_replace('/[^0-9]/', '', $postcode);

        if (strlen($postcode) !== 8) {
            return new WP_Error('invalid_postcode', 'CEP inválido. Deve conter 8 dígitos', array('status' => 400));
        }

        // Calcular total do carrinho
        $total_cost = 0;
        foreach ($cart_products as $item) {
            $price = isset($item['price']) ? floatval($item['price']) : (isset($item['originalPrice']) ? floatval($item['originalPrice']) : 0);
            $quantity = isset($item['orderQuantity']) ? intval($item['orderQuantity']) : 1;
            $total_cost += $price * $quantity;
        }

        error_log('N1 API - calculate_shipping: Total do carrinho: ' . $total_cost);

        // Buscar zonas de frete configuradas no WooCommerce
        $shipping_options = array();
        $data_store = WC_Data_Store::load('shipping-zone');
        $raw_zones = $data_store->get_zones();

        error_log('N1 API - calculate_shipping: Zonas de frete encontradas: ' . count($raw_zones));

        // Adicionar a zona padrão (resto do mundo)
        $zones = array(new WC_Shipping_Zone(0));

        // Adicionar as zonas configuradas
        foreach ($raw_zones as $raw_zone) {
            $zones[] = new WC_Shipping_Zone($raw_zone);
        }

        $matching_zone = null;

        // Encontrar a zona que corresponde ao CEP
        foreach ($zones as $zone) {
            $zone_id = $zone->get_id();
            $zone_name = $zone->get_zone_name();
            $zone_locations = $zone->get_zone_locations();

            error_log('N1 API - calculate_shipping: Verificando zona: ' . $zone_name . ' (ID: ' . $zone_id . ')');

            // Se for a zona padrão (ID = 0), guardar como fallback
            if ($zone_id == 0) {
                $matching_zone = $zone;
                continue;
            }

            // Verificar se o CEP está na zona
            foreach ($zone_locations as $location) {
                $location_type = $location->type;
                $location_code = $location->code;

                error_log('N1 API - calculate_shipping: Localização - Tipo: ' . $location_type . ', Código: ' . $location_code);

                if ($location_type === 'postcode') {
                    // Verificar se o CEP corresponde (suporta wildcards e ranges)
                    if ($this->postcode_matches($postcode, $location_code)) {
                        $matching_zone = $zone;
                        error_log('N1 API - calculate_shipping: CEP ' . $postcode . ' corresponde à zona: ' . $zone_name);
                        break 2; // Sair dos dois loops
                    }
                } elseif ($location_type === 'country' && $location_code === 'BR') {
                    // Se for país Brasil, usar como fallback melhor que a zona 0
                    $matching_zone = $zone;
                } elseif ($location_type === 'state' && strpos($location_code, 'BR:') === 0) {
                    // Se for um estado brasileiro, verificar pelo prefixo do CEP
                    $state_code = str_replace('BR:', '', $location_code);
                    if ($this->postcode_in_state($postcode, $state_code)) {
                        $matching_zone = $zone;
                        error_log('N1 API - calculate_shipping: CEP ' . $postcode . ' está no estado: ' . $state_code);
                    }
                }
            }
        }

        if ($matching_zone) {
            $zone_name = $matching_zone->get_zone_name();
            error_log('N1 API - calculate_shipping: Zona correspondente: ' . $zone_name);

            // Obter métodos de envio da zona
            $shipping_methods = $matching_zone->get_shipping_methods(true); // true = enabled only

            error_log('N1 API - calculate_shipping: Métodos de envio na zona: ' . count($shipping_methods));

            foreach ($shipping_methods as $method) {
                $method_id = $method->id;
                $instance_id = $method->instance_id;
                $method_title = $method->get_title();

                error_log('N1 API - calculate_shipping: Método - ' . $method_title . ' (ID: ' . $method_id . ')');

                // Calcular o custo baseado no tipo de método
                $cost = 0;
                $is_available = true;

                if ($method_id === 'free_shipping') {
                    // Verificar requisitos do frete grátis
                    $requires = $method->get_option('requires', '');
                    $min_amount = $method->get_option('min_amount', 0);

                    error_log('N1 API - calculate_shipping: Frete grátis - Requisito: ' . $requires . ', Mínimo: ' . $min_amount);

                    if ($requires === 'min_amount' && $total_cost < floatval($min_amount)) {
                        $is_available = false;
                        error_log('N1 API - calculate_shipping: Frete grátis não disponível - valor mínimo não atingido');
                    } elseif ($requires === 'coupon') {
                        // Por enquanto, não verificar cupom
                        $is_available = true;
                    } elseif ($requires === 'either') {
                        // Precisa de cupom OU valor mínimo
                        if ($total_cost < floatval($min_amount)) {
                            $is_available = false;
                        }
                    } elseif ($requires === 'both') {
                        // Precisa de cupom E valor mínimo
                        if ($total_cost < floatval($min_amount)) {
                            $is_available = false;
                        }
                    }

                    $cost = 0;
                } elseif ($method_id === 'flat_rate') {
                    $cost = floatval($method->get_option('cost', 0));
                    error_log('N1 API - calculate_shipping: Flat rate - Custo: ' . $cost);
                } elseif ($method_id === 'local_pickup') {
                    $cost = floatval($method->get_option('cost', 0));
                    error_log('N1 API - calculate_shipping: Retirada local - Custo: ' . $cost);
                } else {
                    // Outros métodos (plugins de terceiros)
                    $cost = 0;
                    if (method_exists($method, 'get_option')) {
                        $cost = floatval($method->get_option('cost', 0));
                    }
                }

                if ($is_available) {
                    $shipping_options[] = array(
                        'id' => $method_id . ':' . $instance_id,
                        'title' => $method_title,
                        'cost' => $cost,
                        'method_id' => $method_id,
                    );
                }
            }
        }

        // Se não houver métodos de envio, retornar mensagem
        if (empty($shipping_options)) {
            error_log('N1 API - calculate_shipping: Nenhum método de envio encontrado para o CEP: ' . $postcode);
            return rest_ensure_response(array(
                'shipping_options' => array(),
                'postcode' => $postcode,
                'message' => 'Nenhum método de envio disponível para este CEP',
            ));
        }

        error_log('N1 API - calculate_shipping: Retornando ' . count($shipping_options) . ' opções de frete');

        return rest_ensure_response(array(
            'shipping_options' => $shipping_options,
            'postcode' => $postcode,
        ));
    }

    /**
     * Verifica se o CEP corresponde a um padrão (wildcards, ranges)
     */
    private function postcode_matches($postcode, $pattern)
    {
        // Limpar padrão
        $pattern = str_replace(array(' ', '-'), '', $pattern);
        $postcode = str_replace(array(' ', '-'), '', $postcode);

        // Verificar range (ex: 01000-000...01999-999 ou 01000000...01999999)
        if (strpos($pattern, '...') !== false) {
            list($min, $max) = explode('...', $pattern);
            $min = str_replace(array(' ', '-'), '', $min);
            $max = str_replace(array(' ', '-'), '', $max);

            return $postcode >= $min && $postcode <= $max;
        }

        // Verificar wildcard (ex: 01* ou 010*)
        if (strpos($pattern, '*') !== false) {
            $pattern_prefix = str_replace('*', '', $pattern);
            return strpos($postcode, $pattern_prefix) === 0;
        }

        // Verificação exata
        return $postcode === $pattern;
    }

    /**
     * Verifica se o CEP pertence a um estado brasileiro
     */
    private function postcode_in_state($postcode, $state_code)
    {
        // Mapeamento de prefixos de CEP para estados
        $state_postcodes = array(
            'SP' => array('01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'),
            'RJ' => array('20', '21', '22', '23', '24', '25', '26', '27', '28'),
            'ES' => array('29'),
            'MG' => array('30', '31', '32', '33', '34', '35', '36', '37', '38', '39'),
            'BA' => array('40', '41', '42', '43', '44', '45', '46', '47', '48'),
            'SE' => array('49'),
            'PE' => array('50', '51', '52', '53', '54', '55', '56'),
            'AL' => array('57'),
            'PB' => array('58'),
            'RN' => array('59'),
            'CE' => array('60', '61', '62', '63'),
            'PI' => array('64'),
            'MA' => array('65'),
            'PA' => array('66', '67', '68'),
            'AP' => array('68'),
            'AM' => array('69'),
            'RR' => array('69'),
            'AC' => array('69'),
            'DF' => array('70', '71', '72', '73'),
            'GO' => array('72', '73', '74', '75', '76'),
            'TO' => array('77'),
            'MT' => array('78'),
            'RO' => array('76', '78'),
            'MS' => array('79'),
            'PR' => array('80', '81', '82', '83', '84', '85', '86', '87'),
            'SC' => array('88', '89'),
            'RS' => array('90', '91', '92', '93', '94', '95', '96', '97', '98', '99'),
        );

        $prefix = substr($postcode, 0, 2);

        if (isset($state_postcodes[$state_code])) {
            return in_array($prefix, $state_postcodes[$state_code]);
        }

        return false;
    }

    /**
     * Test email configuration
     */
    public function test_email($request)
    {
        $params = $request->get_json_params();
        $test_email = isset($params['email']) ? sanitize_email($params['email']) : '';

        if (empty($test_email)) {
            return new WP_Error('missing_email', 'E-mail é obrigatório', array('status' => 400));
        }

        $test_info = array(
            'php_mail_function' => function_exists('mail'),
            'wp_mail_function' => function_exists('wp_mail'),
            'phpmailer_class' => class_exists('PHPMailer\PHPMailer\PHPMailer'),
        );

        // Verificar plugins SMTP
        $smtp_plugins = array(
            'wp-mail-smtp/wp_mail_smtp.php' => 'WP Mail SMTP',
            'easy-wp-smtp/easy-wp-smtp.php' => 'Easy WP SMTP',
            'post-smtp/postman-smtp.php' => 'Post SMTP',
            'wp-smtp/wp-smtp.php' => 'WP SMTP',
        );

        $active_smtp_plugins = array();
        if (function_exists('is_plugin_active')) {
            foreach ($smtp_plugins as $plugin_path => $plugin_name) {
                if (is_plugin_active($plugin_path)) {
                    $active_smtp_plugins[] = $plugin_name;
                }
            }
        }

        $test_info['smtp_plugins_active'] = $active_smtp_plugins;
        $test_info['smtp_plugins_count'] = count($active_smtp_plugins);

        // Tentar enviar email de teste
        $subject = 'Teste de Email - N-1 Edições';
        $message = 'Este é um email de teste para verificar se a configuração de email está funcionando corretamente.';
        $headers = array(
            'Content-Type: text/plain; charset=UTF-8',
            'From: N-1 Edições <comercial@n-1edicoes.org>',
        );

        $email_sent = wp_mail($test_email, $subject, $message, $headers);

        // Verificar erros
        global $phpmailer;
        $phpmailer_error = null;
        if (isset($phpmailer) && is_object($phpmailer) && !empty($phpmailer->ErrorInfo)) {
            $phpmailer_error = $phpmailer->ErrorInfo;
        }

        $test_info['email_sent'] = $email_sent;
        $test_info['phpmailer_error'] = $phpmailer_error;
        $test_info['recommendation'] = empty($active_smtp_plugins)
            ? 'Instale e configure um plugin SMTP (WP Mail SMTP recomendado)'
            : 'Verifique a configuração do plugin SMTP ativo';

        error_log('N1 API - test_email: Resultado do teste - ' . print_r($test_info, true));

        return rest_ensure_response(array(
            'message' => $email_sent ? 'Email de teste enviado' : 'Email de teste NÃO foi enviado',
            'test_info' => $test_info,
        ));
    }
}

// Initialize plugin
new N1_WooCommerce_API();

