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

// Evita erro fatal se houver duas cópias do plugin na pasta wp-content/plugins (mesma classe carregada 2x).
if (!class_exists('N1_WooCommerce_API', false)) {

class N1_WooCommerce_API
{

    private $namespace = 'n1/v1';
    private $stripe_secret_key = 'sk_test_51SpZZiR0R7yHOSAazG9L81muQRM7HdTT2LcjRGl6RpBohC65L4Wv3uDEqWdmgMqc2gYdRW3ol7X3TsTlyomVv2TH006iGbXYj1';

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('rest_api_init', array($this, 'add_cors_support'));
        add_action('add_meta_boxes', array($this, 'register_product_meta_box'));
        add_action('save_post_product', array($this, 'save_product_custom_fields'));
    }

    public function register_product_meta_box()
    {
        add_meta_box(
            'n1_product_editorial_fields',
            'N-1 Campos Editoriais',
            array($this, 'render_product_meta_box'),
            'product',
            'normal',
            'high'
        );
    }

    public function render_product_meta_box($post)
    {
        wp_nonce_field('n1_save_product_custom_fields', 'n1_product_custom_fields_nonce');

        $fields = array(
            'book_title' => get_post_meta($post->ID, 'n1_book_title', true),
            'original_title' => get_post_meta($post->ID, 'n1_original_title', true),
            'author' => get_post_meta($post->ID, 'n1_author', true),
            'authors' => get_post_meta($post->ID, 'n1_authors', true),
            'organization' => get_post_meta($post->ID, 'n1_organization', true),
            'translation' => get_post_meta($post->ID, 'n1_translation', true),
            'preparation' => get_post_meta($post->ID, 'n1_preparation', true),
            'revision' => get_post_meta($post->ID, 'n1_revision', true),
            'year' => get_post_meta($post->ID, 'n1_year', true),
            'pages' => get_post_meta($post->ID, 'n1_pages', true),
            'dimensions' => get_post_meta($post->ID, 'n1_dimensions', true),
            'isbn' => get_post_meta($post->ID, 'n1_isbn', true),
            'catalog_pdf' => get_post_meta($post->ID, 'n1_catalog_pdf', true),
            'catalog_content' => get_post_meta($post->ID, 'n1_catalog_content', true),
        );
        ?>
        <style>
            .n1-field { margin-bottom: 12px; }
            .n1-field label { display: block; font-weight: 600; margin-bottom: 4px; }
            .n1-field input[type="text"], .n1-field input[type="number"] { width: 100%; }
        </style>
        <div class="n1-field"><label for="n1_author">Autor (acima do título e em metadados)</label><input type="text" id="n1_author" name="n1_author" value="<?php echo esc_attr($fields['author']); ?>" /></div>
        <div class="n1-field"><label for="n1_book_title">Título completo</label><input type="text" id="n1_book_title" name="n1_book_title" value="<?php echo esc_attr($fields['book_title']); ?>" /></div>
        <div class="n1-field"><label for="n1_original_title">Título original</label><input type="text" id="n1_original_title" name="n1_original_title" value="<?php echo esc_attr($fields['original_title']); ?>" /></div>
        <div class="n1-field"><label for="n1_preparation">Preparação</label><input type="text" id="n1_preparation" name="n1_preparation" value="<?php echo esc_attr($fields['preparation']); ?>" /></div>
        <div class="n1-field"><label for="n1_revision">Revisão</label><input type="text" id="n1_revision" name="n1_revision" value="<?php echo esc_attr($fields['revision']); ?>" /></div>
        <div class="n1-field"><label for="n1_year">Ano</label><input type="number" id="n1_year" name="n1_year" value="<?php echo esc_attr($fields['year']); ?>" /></div>
        <div class="n1-field"><label for="n1_pages">Nº de páginas</label><input type="text" id="n1_pages" name="n1_pages" value="<?php echo esc_attr($fields['pages']); ?>" /></div>
        <div class="n1-field"><label for="n1_dimensions">Dimensões</label><input type="text" id="n1_dimensions" name="n1_dimensions" value="<?php echo esc_attr($fields['dimensions']); ?>" /></div>
        <div class="n1-field"><label for="n1_isbn">ISBN</label><input type="text" id="n1_isbn" name="n1_isbn" value="<?php echo esc_attr($fields['isbn']); ?>" /></div>
        <div class="n1-field"><label for="n1_organization">Organização</label><input type="text" id="n1_organization" name="n1_organization" value="<?php echo esc_attr($fields['organization']); ?>" /></div>
        <div class="n1-field"><label for="n1_translation">Tradução</label><input type="text" id="n1_translation" name="n1_translation" value="<?php echo esc_attr($fields['translation']); ?>" /></div>
        <div class="n1-field"><label for="n1_authors">Autores (lista alternativa)</label><input type="text" id="n1_authors" name="n1_authors" value="<?php echo esc_attr($fields['authors']); ?>" /></div>
        <div class="n1-field"><label for="n1_catalog_pdf">URL do PDF/Issuu (opcional)</label><input type="text" id="n1_catalog_pdf" name="n1_catalog_pdf" value="<?php echo esc_attr($fields['catalog_pdf']); ?>" /></div>
        <div class="n1-field">
            <label for="n1_catalog_content">Conteúdo longo do livro (aceita texto, imagens e HTML)</label>
            <?php
            wp_editor(
                $fields['catalog_content'],
                'n1_catalog_content_editor',
                array(
                    'textarea_name' => 'n1_catalog_content',
                    'media_buttons' => true,
                    'textarea_rows' => 16,
                    'teeny' => false,
                )
            );
            ?>
        </div>
        <?php
    }

    public function save_product_custom_fields($post_id)
    {
        if (!isset($_POST['n1_product_custom_fields_nonce']) || !wp_verify_nonce($_POST['n1_product_custom_fields_nonce'], 'n1_save_product_custom_fields')) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $text_fields = array(
            'n1_book_title',
            'n1_original_title',
            'n1_author',
            'n1_authors',
            'n1_organization',
            'n1_translation',
            'n1_preparation',
            'n1_revision',
            'n1_year',
            'n1_pages',
            'n1_dimensions',
            'n1_isbn',
            'n1_catalog_pdf',
        );

        foreach ($text_fields as $field_key) {
            if (isset($_POST[$field_key])) {
                update_post_meta($post_id, $field_key, sanitize_text_field(wp_unslash($_POST[$field_key])));
            }
        }

        if (isset($_POST['n1_catalog_content'])) {
            $raw_content = wp_unslash($_POST['n1_catalog_content']);
            // Administradores com unfiltered_html: guardar o HTML exatamente como no editor
            // (evita wp_kses remover atributos de img/figure/blocos do Gutenberg).
            if (current_user_can('unfiltered_html')) {
                update_post_meta($post_id, 'n1_catalog_content', $raw_content);
            } else {
                $allowed_html = wp_kses_allowed_html('post');
                $allowed_html['iframe'] = array(
                    'src' => true,
                    'width' => true,
                    'height' => true,
                    'frameborder' => true,
                    'allow' => true,
                    'allowfullscreen' => true,
                    'loading' => true,
                    'referrerpolicy' => true,
                    'title' => true,
                    'class' => true,
                    'style' => true,
                );
                $allowed_html['video'] = array(
                    'src' => true,
                    'controls' => true,
                    'autoplay' => true,
                    'loop' => true,
                    'muted' => true,
                    'poster' => true,
                    'preload' => true,
                    'width' => true,
                    'height' => true,
                    'class' => true,
                    'style' => true,
                );
                $allowed_html['source'] = array(
                    'src' => true,
                    'type' => true,
                );
                // Blocos comuns do editor (caso wp_kses_allowed_html('post') do site seja restritivo)
                if (!isset($allowed_html['figure'])) {
                    $allowed_html['figure'] = array('class' => true, 'style' => true, 'id' => true);
                }
                if (!isset($allowed_html['figcaption'])) {
                    $allowed_html['figcaption'] = array('class' => true, 'style' => true);
                }

                update_post_meta($post_id, 'n1_catalog_content', wp_kses($raw_content, $allowed_html));
            }
        }
    }

    private function format_catalog_content_for_output($content)
    {
        if (empty($content)) {
            return '';
        }

        // Processa shortcodes do WP (ex.: [caption], [video], [embed]).
        $formatted = do_shortcode($content);

        // Se vier texto simples, aplicar parágrafos.
        if (strpos($formatted, '<') === false) {
            $formatted = wpautop($formatted);
        }

        // Converter links puros em embed quando suportado (YouTube, Vimeo, etc),
        // e em link clicável quando não houver oEmbed disponível.
        $formatted = preg_replace_callback(
            '/<p>\s*(https?:\/\/[^\s<]+)\s*<\/p>/i',
            function ($matches) {
                $url = esc_url_raw($matches[1]);
                if (empty($url)) {
                    return $matches[0];
                }
                $embed = wp_oembed_get($url);
                if (!empty($embed)) {
                    return $embed;
                }
                return '<p><a href="' . esc_url($url) . '" target="_blank" rel="noopener noreferrer">' . esc_html($url) . '</a></p>';
            },
            $formatted
        );

        return $formatted;
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

        // Verificar se e-mail já está cadastrado (checkout / convidado)
        register_rest_route($this->namespace, '/api/user/check-email', array(
            'methods' => 'POST',
            'callback' => array($this, 'check_user_email_exists'),
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

        // Mercado Pago — processado no WordPress (igual Stripe). Credenciais: N1_MERCADO_PAGO_* no wp-config.php
        register_rest_route($this->namespace, '/api/order/create-mercadopago-payment', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_mercado_pago_transparent_payment'),
            'permission_callback' => '__return_true',
        ));

        register_rest_route($this->namespace, '/api/order/create-mercadopago-preference', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_mercado_pago_preference'),
            'permission_callback' => '__return_true',
        ));

        // Webhook Mercado Pago (notificações de pagamento)
        register_rest_route($this->namespace, '/api/order/mercadopago-webhook', array(
            'methods' => 'POST',
            'callback' => array($this, 'mercadopago_webhook'),
            'permission_callback' => '__return_true',
        ));

        // Get all orders by user
        register_rest_route($this->namespace, '/api/user-order/order-by-user', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_orders'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Get single order by ID (logado com Bearer OU convidado com ?key=order_key do WooCommerce)
        register_rest_route($this->namespace, '/api/user-order/single-order/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_single_order'),
            'permission_callback' => '__return_true',
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

        // Custom editorial metadata
        $book_title = get_post_meta($product_id, 'n1_book_title', true);
        $original_title = get_post_meta($product_id, 'n1_original_title', true);
        $author = get_post_meta($product_id, 'n1_author', true);
        $authors = get_post_meta($product_id, 'n1_authors', true);
        $organization = get_post_meta($product_id, 'n1_organization', true);
        $translation = get_post_meta($product_id, 'n1_translation', true);
        $preparation = get_post_meta($product_id, 'n1_preparation', true);
        $revision = get_post_meta($product_id, 'n1_revision', true);
        $year = get_post_meta($product_id, 'n1_year', true);
        $pages = get_post_meta($product_id, 'n1_pages', true);
        $dimensions = get_post_meta($product_id, 'n1_dimensions', true);
        $isbn = get_post_meta($product_id, 'n1_isbn', true);

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
            'bookTitle' => $book_title,
            'originalTitle' => $original_title,
            'author' => $author,
            'authors' => $authors,
            'organization' => $organization,
            'translation' => $translation,
            'preparation' => $preparation,
            'revision' => $revision,
            'year' => $year,
            'pages' => $pages,
            'dimensions' => $dimensions,
            'isbn' => $isbn,
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
            $result['content'] = $this->format_catalog_content_for_output($catalog_content);
            
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
     * Descobre user_id a partir do header Authorization Bearer (API N-1), como em add_order.
     */
    private function n1_get_user_id_from_bearer_request()
    {
        $user_id = get_current_user_id();
        if ($user_id) {
            return (int) $user_id;
        }

        $headers = array();
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) === 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        }

        $normalized = array();
        foreach ($headers as $key => $value) {
            $normalized[strtolower($key)] = $value;
        }

        $auth_header = '';
        if (isset($normalized['authorization'])) {
            $auth_header = $normalized['authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if ($auth_header && preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            $token = trim($matches[1]);
            $validated = $this->validate_token($token);
            if ($validated) {
                wp_set_current_user((int) $validated);
                return (int) $validated;
            }
        }

        return 0;
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
     * Verifica se um e-mail já possui cadastro (uso no checkout).
     */
    public function check_user_email_exists($request)
    {
        $params = $request->get_json_params();
        $email = isset($params['email']) ? sanitize_email($params['email']) : '';

        if (empty($email) || !is_email($email)) {
            return rest_ensure_response(array(
                'exists' => false,
                'valid' => false,
            ));
        }

        return rest_ensure_response(array(
            'exists' => (bool) email_exists($email),
            'valid' => true,
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
     * Access Token Mercado Pago (servidor). wp-config: define('N1_MERCADO_PAGO_ACCESS_TOKEN', '...');
     */
    private function get_mercadopago_access_token()
    {
        if (defined('N1_MERCADO_PAGO_ACCESS_TOKEN') && is_string(N1_MERCADO_PAGO_ACCESS_TOKEN) && N1_MERCADO_PAGO_ACCESS_TOKEN !== '') {
            return trim(N1_MERCADO_PAGO_ACCESS_TOKEN);
        }
        $opt = get_option('n1_mercado_pago_access_token', '');
        return is_string($opt) && $opt !== '' ? trim($opt) : '';
    }

    /**
     * Public Key (para busca de payment_method por BIN). wp-config: define('N1_MERCADO_PAGO_PUBLIC_KEY', '...');
     */
    private function get_mercadopago_public_key()
    {
        if (defined('N1_MERCADO_PAGO_PUBLIC_KEY') && is_string(N1_MERCADO_PAGO_PUBLIC_KEY) && N1_MERCADO_PAGO_PUBLIC_KEY !== '') {
            return trim(N1_MERCADO_PAGO_PUBLIC_KEY);
        }
        $opt = get_option('n1_mercado_pago_public_key', '');
        return is_string($opt) && $opt !== '' ? trim($opt) : '';
    }

    /**
     * Webhook secret do Mercado Pago (opcional, mas recomendado).
     * wp-config: define('N1_MERCADO_PAGO_WEBHOOK_SECRET', '...');
     */
    private function get_mercadopago_webhook_secret()
    {
        if (defined('N1_MERCADO_PAGO_WEBHOOK_SECRET') && is_string(N1_MERCADO_PAGO_WEBHOOK_SECRET) && N1_MERCADO_PAGO_WEBHOOK_SECRET !== '') {
            return trim(N1_MERCADO_PAGO_WEBHOOK_SECRET);
        }
        $opt = get_option('n1_mercado_pago_webhook_secret', '');
        return is_string($opt) && $opt !== '' ? trim($opt) : '';
    }

    /**
     * URL da loja Next (Vercel) para back_urls do Checkout Pro. wp-config: define('N1_STORE_URL', 'https://sua-loja.vercel.app');
     */
    private function get_n1_store_url()
    {
        if (defined('N1_STORE_URL') && is_string(N1_STORE_URL) && N1_STORE_URL !== '') {
            return rtrim(N1_STORE_URL, '/');
        }
        $opt = get_option('n1_store_url', '');
        if (is_string($opt) && $opt !== '') {
            return rtrim($opt, '/');
        }
        return rtrim(home_url(), '/');
    }

    /**
     * Estima payment_method_id do Mercado Pago a partir dos 6 primeiros dígitos (BIN).
     * Evita bin_not_found quando a API search falha mas o cartão é ex.: Mastercard (5031…).
     */
    private function mercadopago_guess_payment_method_from_bin($bin)
    {
        $bin = preg_replace('/\D/', '', (string) $bin);
        if (strlen($bin) < 6) {
            return 'master';
        }
        $d1 = substr($bin, 0, 1);
        $d2 = substr($bin, 0, 2);
        // Amex: 34 ou 37
        if ($d1 === '3' && ($d2 === '34' || $d2 === '37')) {
            return 'amex';
        }
        // Visa
        if ($d1 === '4') {
            return 'visa';
        }
        // Mastercard: 51–55 e intervalo 2221–2720 (simplificado: 5 + segundo dígito comum)
        if ($d1 === '5') {
            return 'master';
        }
        // Elo (prefixos comuns no Brasil)
        $elo_prefixes = array('5067', '4576', '4011', '4312', '4389', '4514', '4573', '6277', '6362', '6363');
        foreach ($elo_prefixes as $p) {
            if (strpos($bin, $p) === 0) {
                return 'elo';
            }
        }
        return 'master';
    }

    /**
     * Resolve payment_method_id a partir do token do cartão (API Mercado Pago).
     */
    private function mercadopago_resolve_payment_method_id($token_id, $access_token, $public_key)
    {
        $fallback = array('payment_method_id' => 'master', 'issuer_id' => null);

        $url = 'https://api.mercadopago.com/v1/card_tokens/' . rawurlencode($token_id);
        $res = wp_remote_get($url, array(
            'headers' => array('Authorization' => 'Bearer ' . $access_token),
            'timeout' => 30,
        ));
        if (is_wp_error($res)) {
            return $fallback;
        }
        $code = wp_remote_retrieve_response_code($res);
        if ($code < 200 || $code >= 300) {
            return $fallback;
        }
        $body = json_decode(wp_remote_retrieve_body($res), true);
        if (!is_array($body)) {
            return $fallback;
        }

        // Algumas respostas já trazem o id do método
        if (!empty($body['payment_method_id']) && is_string($body['payment_method_id'])) {
            $issuer_id = null;
            if (!empty($body['issuer_id'])) {
                $issuer_id = intval($body['issuer_id']);
            }
            return array(
                'payment_method_id' => sanitize_text_field($body['payment_method_id']),
                'issuer_id' => $issuer_id,
            );
        }

        $bin = null;
        if (!empty($body['first_six_digits'])) {
            $bin = (string) $body['first_six_digits'];
        } elseif (!empty($body['first_six_digit'])) {
            $bin = (string) $body['first_six_digit'];
        }

        $from_bin = $bin ? $this->mercadopago_guess_payment_method_from_bin($bin) : 'master';

        if (empty($bin)) {
            return array('payment_method_id' => $from_bin, 'issuer_id' => null);
        }

        // Busca oficial por BIN (precisa de public_key alinhada ao token)
        if ($public_key !== '') {
            $search_url = add_query_arg(
                array(
                    'public_key' => $public_key,
                    'bins' => $bin,
                ),
                'https://api.mercadopago.com/v1/payment_methods/search'
            );
            $sres = wp_remote_get($search_url, array('timeout' => 30));
            if (!is_wp_error($sres)) {
                $sc = wp_remote_retrieve_response_code($sres);
                if ($sc >= 200 && $sc < 300) {
                    $sdata = json_decode(wp_remote_retrieve_body($sres), true);
                    if (is_array($sdata) && !empty($sdata['results'][0]['id'])) {
                        $pm = $sdata['results'][0];
                        $issuer_id = null;
                        if (!empty($pm['issuer_list'][0]['id'])) {
                            $issuer_id = intval($pm['issuer_list'][0]['id']);
                        }
                        return array(
                            'payment_method_id' => sanitize_text_field($pm['id']),
                            'issuer_id' => $issuer_id,
                        );
                    }
                }
            }
        }

        // Search vazio ou chave pública ausente: usa heurística pelo BIN (corrige 5031… master vs visa)
        return array('payment_method_id' => $from_bin, 'issuer_id' => null);
    }

    /**
     * Checkout transparente Mercado Pago (cartão) — mesmo contrato do antigo backend Node.
     */
    public function create_mercado_pago_transparent_payment($request)
    {
        $access_token = $this->get_mercadopago_access_token();
        if ($access_token === '') {
            return new WP_Error(
                'mp_not_configured',
                'Mercado Pago: defina N1_MERCADO_PAGO_ACCESS_TOKEN no wp-config.php (Access Token) ou opção n1_mercado_pago_access_token.',
                array('status' => 500)
            );
        }
        $public_key = $this->get_mercadopago_public_key();
        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = array();
        }

        $payment_type = isset($params['payment_type']) ? sanitize_text_field($params['payment_type']) : 'card';
        $token = isset($params['token']) ? sanitize_text_field($params['token']) : '';
        $transaction_amount = isset($params['transaction_amount']) ? $params['transaction_amount'] : null;
        $installments = isset($params['installments']) ? intval($params['installments']) : 1;
        $payer_email = isset($params['payer_email']) ? sanitize_email($params['payer_email']) : '';
        $payer_first_name = isset($params['payer_first_name']) ? sanitize_text_field($params['payer_first_name']) : 'Cliente';
        $payer_last_name = isset($params['payer_last_name']) ? sanitize_text_field($params['payer_last_name']) : '';
        $identification_type = isset($params['identification_type']) ? sanitize_text_field($params['identification_type']) : 'CPF';
        $identification_number = isset($params['identification_number']) ? $params['identification_number'] : '';
        $description = isset($params['description']) ? sanitize_text_field($params['description']) : 'Compra N-1 Edições';
        $metadata = isset($params['metadata']) && is_array($params['metadata']) ? $params['metadata'] : array();

        $clean_doc = preg_replace('/\D/', '', (string) $identification_number);

        // —— PIX (sem token de cartão) ——
        if ($payment_type === 'pix') {
            if ($transaction_amount === null || $transaction_amount === '') {
                return new WP_Error('mp_bad_request', 'transaction_amount é obrigatório para PIX.', array('status' => 400));
            }
            if (empty($payer_email) || strlen($clean_doc) < 11) {
                return new WP_Error('mp_bad_request', 'E-mail e CPF/CNPJ válidos são obrigatórios para PIX.', array('status' => 400));
            }

            $amount = round(floatval($transaction_amount), 2);
            if ($amount <= 0) {
                return new WP_Error('mp_bad_request', 'Valor inválido para PIX.', array('status' => 400));
            }

            $id_type = strlen($clean_doc) > 11 ? 'CNPJ' : $identification_type;

            // Não enviar date_of_expiration: a API do MP valida o formato de forma estrita e costuma
            // retornar 400 ("yyyy-MM-dd'T'HH:mm:ssz"). Sem o campo, o MP aplica o prazo padrão do PIX.

            $payment_body = array(
                'transaction_amount' => $amount,
                'description' => substr($description, 0, 255),
                'payment_method_id' => 'pix',
                'payer' => array(
                    'email' => $payer_email,
                    'first_name' => substr($payer_first_name, 0, 255),
                    'last_name' => substr($payer_last_name, 0, 255),
                    'identification' => array(
                        'type' => $id_type,
                        'number' => $clean_doc,
                    ),
                ),
                'metadata' => $metadata,
            );

            $notif = get_option('n1_mercado_pago_notification_url', '');
            if ($notif !== '') {
                $payment_body['notification_url'] = esc_url_raw($notif);
            }

            $idempotency = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('n1-pix-', true);

            $mp_res = wp_remote_post(
                'https://api.mercadopago.com/v1/payments',
                array(
                    'headers' => array(
                        'Authorization' => 'Bearer ' . $access_token,
                        'Content-Type' => 'application/json',
                        'X-Idempotency-Key' => $idempotency,
                    ),
                    'body' => wp_json_encode($payment_body),
                    'timeout' => 90,
                )
            );

            if (is_wp_error($mp_res)) {
                return new WP_Error('mp_network', $mp_res->get_error_message(), array('status' => 502));
            }

            $http_code = wp_remote_retrieve_response_code($mp_res);
            $raw = wp_remote_retrieve_body($mp_res);
            $mp_data = json_decode($raw, true);

            if ($http_code < 200 || $http_code >= 300) {
                $msg = 'Falha ao gerar PIX no Mercado Pago.';
                if (is_array($mp_data)) {
                    if (!empty($mp_data['message'])) {
                        $msg = is_string($mp_data['message']) ? $mp_data['message'] : wp_json_encode($mp_data['message']);
                    } elseif (!empty($mp_data['cause'][0]['description'])) {
                        $msg = $mp_data['cause'][0]['description'];
                    }
                }
                return new WP_Error('mp_api_error', $msg, array('status' => $http_code >= 400 && $http_code < 600 ? $http_code : 502, 'data' => $mp_data));
            }

            if (!is_array($mp_data)) {
                return new WP_Error('mp_invalid_response', 'Resposta inválida do Mercado Pago.', array('status' => 502));
            }

            $status = isset($mp_data['status']) ? $mp_data['status'] : '';
            if ($status === 'rejected') {
                $detail = isset($mp_data['status_detail']) ? $mp_data['status_detail'] : '';
                return new WP_Error('mp_rejected', $detail !== '' ? $detail : 'PIX recusado.', array('status' => 400, 'data' => $mp_data));
            }

            $pix_td = array();
            if (!empty($mp_data['point_of_interaction']['transaction_data']) && is_array($mp_data['point_of_interaction']['transaction_data'])) {
                $td = $mp_data['point_of_interaction']['transaction_data'];
                $pix_td = array(
                    'qr_code' => isset($td['qr_code']) ? $td['qr_code'] : '',
                    'qr_code_base64' => isset($td['qr_code_base64']) ? $td['qr_code_base64'] : '',
                    'ticket_url' => isset($td['ticket_url']) ? esc_url_raw($td['ticket_url']) : '',
                );
            }

            if (empty($pix_td['qr_code']) && empty($pix_td['qr_code_base64'])) {
                return new WP_Error('mp_pix_incomplete', 'O Mercado Pago não retornou dados do PIX. Verifique se a conta habilitou PIX.', array('status' => 502, 'data' => $mp_data));
            }

            $expires_at = null;
            if (!empty($mp_data['date_of_expiration'])) {
                $ts = strtotime($mp_data['date_of_expiration']);
                if ($ts) {
                    $expires_at = $ts;
                }
            }

            $pay_id = isset($mp_data['id']) ? $mp_data['id'] : null;

            return rest_ensure_response(array(
                'success' => true,
                'approved' => ($status === 'approved'),
                'status' => $status,
                'status_detail' => isset($mp_data['status_detail']) ? $mp_data['status_detail'] : '',
                'payment_id' => $pay_id,
                'date_of_expiration' => isset($mp_data['date_of_expiration']) ? $mp_data['date_of_expiration'] : null,
                'expires_at' => $expires_at,
                'payment' => array(
                    'id' => $pay_id,
                    'status' => $status,
                    'status_detail' => isset($mp_data['status_detail']) ? $mp_data['status_detail'] : '',
                    'transaction_amount' => isset($mp_data['transaction_amount']) ? $mp_data['transaction_amount'] : $amount,
                    'payment_method_id' => 'pix',
                    'date_approved' => isset($mp_data['date_approved']) ? $mp_data['date_approved'] : null,
                ),
                'pix' => $pix_td,
            ));
        }

        if ($token === '' || $transaction_amount === null || $transaction_amount === '') {
            return new WP_Error('mp_bad_request', 'token e transaction_amount são obrigatórios.', array('status' => 400));
        }

        if (empty($payer_email) || strlen($clean_doc) < 11) {
            return new WP_Error('mp_bad_request', 'E-mail e CPF/CNPJ válidos são obrigatórios para pagamento com cartão.', array('status' => 400));
        }

        $resolved = $this->mercadopago_resolve_payment_method_id($token, $access_token, $public_key);
        $payment_method_id = $resolved['payment_method_id'];
        $issuer_id = $resolved['issuer_id'];

        $amount = round(floatval($transaction_amount), 2);
        $installments = max(1, min($installments > 0 ? $installments : 1, 12));

        $id_type = strlen($clean_doc) > 11 ? 'CNPJ' : $identification_type;

        $payment_body = array(
            'transaction_amount' => $amount,
            'token' => $token,
            'description' => substr($description, 0, 255),
            'installments' => $installments,
            'payment_method_id' => $payment_method_id,
            'payer' => array(
                'email' => $payer_email,
                'first_name' => substr($payer_first_name, 0, 255),
                'last_name' => substr($payer_last_name, 0, 255),
                'identification' => array(
                    'type' => $id_type,
                    'number' => $clean_doc,
                ),
            ),
            'metadata' => $metadata,
        );
        if ($issuer_id !== null && $issuer_id > 0) {
            $payment_body['issuer_id'] = $issuer_id;
        }

        $idempotency = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('n1-', true);

        $mp_res = wp_remote_post(
            'https://api.mercadopago.com/v1/payments',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type' => 'application/json',
                    'X-Idempotency-Key' => $idempotency,
                ),
                'body' => wp_json_encode($payment_body),
                'timeout' => 90,
            )
        );

        if (is_wp_error($mp_res)) {
            return new WP_Error('mp_network', $mp_res->get_error_message(), array('status' => 502));
        }

        $http_code = wp_remote_retrieve_response_code($mp_res);
        $raw = wp_remote_retrieve_body($mp_res);
        $mp_data = json_decode($raw, true);

        if ($http_code < 200 || $http_code >= 300) {
            $msg = 'Falha ao processar pagamento no Mercado Pago.';
            if (is_array($mp_data)) {
                if (!empty($mp_data['message'])) {
                    $msg = is_string($mp_data['message']) ? $mp_data['message'] : wp_json_encode($mp_data['message']);
                } elseif (!empty($mp_data['cause'][0]['description'])) {
                    $msg = $mp_data['cause'][0]['description'];
                }
            }
            return new WP_Error('mp_api_error', $msg, array('status' => $http_code >= 400 && $http_code < 600 ? $http_code : 502, 'data' => $mp_data));
        }

        if (!is_array($mp_data)) {
            return new WP_Error('mp_invalid_response', 'Resposta inválida do Mercado Pago.', array('status' => 502));
        }

        $status = isset($mp_data['status']) ? $mp_data['status'] : '';
        $approved = ($status === 'approved');

        return rest_ensure_response(array(
            'success' => true,
            'approved' => $approved,
            'status' => $status,
            'status_detail' => isset($mp_data['status_detail']) ? $mp_data['status_detail'] : '',
            'payment_id' => isset($mp_data['id']) ? $mp_data['id'] : null,
            'payment' => array(
                'id' => isset($mp_data['id']) ? $mp_data['id'] : null,
                'status' => $status,
                'status_detail' => isset($mp_data['status_detail']) ? $mp_data['status_detail'] : '',
                'transaction_amount' => isset($mp_data['transaction_amount']) ? $mp_data['transaction_amount'] : $amount,
                'payment_method_id' => isset($mp_data['payment_method_id']) ? $mp_data['payment_method_id'] : $payment_method_id,
                'date_approved' => isset($mp_data['date_approved']) ? $mp_data['date_approved'] : null,
            ),
        ));
    }

    /**
     * Preferência Checkout Pro Mercado Pago (redirecionamento), se ainda for usada no front.
     */
    public function create_mercado_pago_preference($request)
    {
        $access_token = $this->get_mercadopago_access_token();
        if ($access_token === '') {
            return new WP_Error(
                'mp_not_configured',
                'Mercado Pago: defina N1_MERCADO_PAGO_ACCESS_TOKEN no wp-config.php.',
                array('status' => 500)
            );
        }

        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = array();
        }

        $order_id = isset($params['orderId']) ? $params['orderId'] : '';
        $items = isset($params['items']) && is_array($params['items']) ? $params['items'] : array();
        $shipping_cost = isset($params['shippingCost']) ? floatval($params['shippingCost']) : 0;
        $discount = isset($params['discount']) ? floatval($params['discount']) : 0;
        $total_amount = isset($params['totalAmount']) ? floatval($params['totalAmount']) : 0;
        $payer = isset($params['payer']) && is_array($params['payer']) ? $params['payer'] : array();

        $mapped_items = array();
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $title = !empty($item['title']) ? sanitize_text_field($item['title']) : 'Produto';
            $quantity = isset($item['orderQuantity']) ? intval($item['orderQuantity']) : (isset($item['quantity']) ? intval($item['quantity']) : 1);
            $unit_price = isset($item['price']) ? floatval($item['price']) : (isset($item['originalPrice']) ? floatval($item['originalPrice']) : 0);
            if ($unit_price <= 0 || $quantity <= 0) {
                continue;
            }
            $mapped_items[] = array(
                'id' => !empty($item['_id']) ? (string) $item['_id'] : (!empty($item['id']) ? (string) $item['id'] : $title),
                'title' => $title,
                'quantity' => $quantity,
                'currency_id' => 'BRL',
                'unit_price' => round($unit_price, 2),
            );
        }

        if ($shipping_cost > 0) {
            $mapped_items[] = array(
                'id' => 'shipping',
                'title' => 'Frete',
                'quantity' => 1,
                'currency_id' => 'BRL',
                'unit_price' => round($shipping_cost, 2),
            );
        }

        if ($discount > 0) {
            $mapped_items[] = array(
                'id' => 'discount',
                'title' => 'Desconto',
                'quantity' => 1,
                'currency_id' => 'BRL',
                'unit_price' => round(-abs($discount), 2),
            );
        }

        $frontend_url = $this->get_n1_store_url();
        $external_reference = $order_id !== '' ? (string) $order_id : 'order-' . time();

        $preference_payload = array(
            'items' => $mapped_items,
            'payer' => array(
                'email' => isset($payer['email']) ? sanitize_email($payer['email']) : '',
                'name' => isset($payer['name']) ? sanitize_text_field($payer['name']) : '',
            ),
            'external_reference' => $external_reference,
            'back_urls' => array(
                'success' => $frontend_url . '/order/' . rawurlencode($external_reference),
                'failure' => $frontend_url . '/checkout',
                'pending' => $frontend_url . '/order/' . rawurlencode($external_reference),
            ),
            'auto_return' => 'approved',
            'statement_descriptor' => 'N1 EDICOES',
            'metadata' => array(
                'order_id' => $external_reference,
                'total_amount' => $total_amount,
            ),
        );

        if (defined('N1_MERCADO_PAGO_NOTIFICATION_URL') && N1_MERCADO_PAGO_NOTIFICATION_URL !== '') {
            $preference_payload['notification_url'] = N1_MERCADO_PAGO_NOTIFICATION_URL;
        } else {
            $notif = get_option('n1_mercado_pago_notification_url', '');
            if (is_string($notif) && $notif !== '') {
                $preference_payload['notification_url'] = $notif;
            }
        }

        $mp_res = wp_remote_post(
            'https://api.mercadopago.com/checkout/preferences',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $access_token,
                    'Content-Type' => 'application/json',
                ),
                'body' => wp_json_encode($preference_payload),
                'timeout' => 90,
            )
        );

        if (is_wp_error($mp_res)) {
            return new WP_Error('mp_network', $mp_res->get_error_message(), array('status' => 502));
        }

        $http_code = wp_remote_retrieve_response_code($mp_res);
        $mp_data = json_decode(wp_remote_retrieve_body($mp_res), true);

        if ($http_code < 200 || $http_code >= 300) {
            return new WP_Error(
                'mp_preference_error',
                'Falha ao criar preferência no Mercado Pago.',
                array('status' => $http_code, 'data' => $mp_data)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'preferenceId' => isset($mp_data['id']) ? $mp_data['id'] : null,
            'initPoint' => isset($mp_data['init_point']) ? $mp_data['init_point'] : null,
            'sandboxInitPoint' => isset($mp_data['sandbox_init_point']) ? $mp_data['sandbox_init_point'] : null,
        ));
    }

    /**
     * Webhook Mercado Pago: atualiza status do pedido WooCommerce.
     * URL esperada no MP: /wp-json/n1/v1/api/order/mercadopago-webhook
     */
    public function mercadopago_webhook($request)
    {
        if (!class_exists('WooCommerce') || !function_exists('wc_get_orders')) {
            error_log('N1 MP webhook: WooCommerce indisponível.');
            return rest_ensure_response(array(
                'success' => true,
                'ignored' => true,
                'reason' => 'woocommerce_unavailable',
            ));
        }

        // 1) Validar assinatura (se secret configurado)
        $secret = $this->get_mercadopago_webhook_secret();
        if ($secret !== '') {
            $x_signature = '';
            if (isset($_SERVER['HTTP_X_SIGNATURE'])) {
                $x_signature = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_SIGNATURE']));
            }
            $x_request_id = '';
            if (isset($_SERVER['HTTP_X_REQUEST_ID'])) {
                $x_request_id = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_REQUEST_ID']));
            }

            $parts = array();
            if ($x_signature !== '') {
                $tmp = explode(',', $x_signature);
                foreach ($tmp as $seg) {
                    $kv = explode('=', trim($seg), 2);
                    if (count($kv) === 2) {
                        $parts[trim($kv[0])] = trim($kv[1]);
                    }
                }
            }
            $ts = isset($parts['ts']) ? $parts['ts'] : '';
            $v1 = isset($parts['v1']) ? strtolower($parts['v1']) : '';

            // payment id pode vir no body ou query
            $raw = $request->get_json_params();
            if (!is_array($raw)) {
                $raw = array();
            }
            $data_id = '';
            if (!empty($raw['data']) && is_array($raw['data']) && !empty($raw['data']['id'])) {
                $data_id = (string) $raw['data']['id'];
            } elseif (!empty($_GET['data.id'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $data_id = sanitize_text_field(wp_unslash($_GET['data.id'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            } elseif (!empty($_GET['id'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
                $data_id = sanitize_text_field(wp_unslash($_GET['id'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            }

            if ($ts === '' || $v1 === '' || $data_id === '') {
                return new WP_Error('mp_webhook_invalid_signature', 'Assinatura do webhook inválida.', array('status' => 401));
            }

            $manifest = 'id:' . $data_id . ';request-id:' . $x_request_id . ';ts:' . $ts . ';';
            $expected = strtolower(hash_hmac('sha256', $manifest, $secret));
            if ($expected !== $v1) {
                return new WP_Error('mp_webhook_invalid_signature', 'Assinatura do webhook inválida.', array('status' => 401));
            }
        }

        // 2) Descobrir pagamento notificado
        $params = $request->get_json_params();
        if (!is_array($params)) {
            $params = array();
        }

        $topic = '';
        if (!empty($params['type'])) {
            $topic = sanitize_text_field($params['type']);
        } elseif (!empty($params['topic'])) {
            $topic = sanitize_text_field($params['topic']);
        } elseif (!empty($_GET['topic'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $topic = sanitize_text_field(wp_unslash($_GET['topic'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        }

        if ($topic !== '' && $topic !== 'payment' && $topic !== 'merchant_order') {
            return rest_ensure_response(array('success' => true, 'ignored' => true));
        }

        $payment_id = '';
        if (!empty($params['data']) && is_array($params['data']) && !empty($params['data']['id'])) {
            $payment_id = (string) $params['data']['id'];
        } elseif (!empty($_GET['data.id'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $payment_id = sanitize_text_field(wp_unslash($_GET['data.id'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        } elseif (!empty($_GET['id'])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            $payment_id = sanitize_text_field(wp_unslash($_GET['id'])); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        }

        if ($payment_id === '') {
            return rest_ensure_response(array('success' => true, 'ignored' => true, 'reason' => 'missing_payment_id'));
        }

        // 3) Buscar status real no MP
        $access_token = $this->get_mercadopago_access_token();
        if ($access_token === '') {
            return new WP_Error('mp_not_configured', 'Access token Mercado Pago não configurado.', array('status' => 500));
        }

        $mp_res = wp_remote_get(
            'https://api.mercadopago.com/v1/payments/' . rawurlencode($payment_id),
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $access_token,
                ),
                'timeout' => 90,
            )
        );
        if (is_wp_error($mp_res)) {
            error_log('N1 MP webhook: rede ao consultar pagamento ' . $payment_id . ' — ' . $mp_res->get_error_message());
            return rest_ensure_response(array(
                'success' => true,
                'ignored' => true,
                'reason' => 'mp_network_error',
            ));
        }

        $http_code = wp_remote_retrieve_response_code($mp_res);
        $mp_data = json_decode(wp_remote_retrieve_body($mp_res), true);

        // Simulador do MP usa id fictício (ex.: 123456) → API retorna 404. Responder 200 evita "502 Bad Gateway" no teste.
        if ($http_code === 404 || $http_code === 400) {
            return rest_ensure_response(array(
                'success' => true,
                'ignored' => true,
                'reason' => 'payment_not_found_or_simulation',
            ));
        }

        if ($http_code < 200 || $http_code >= 300 || !is_array($mp_data)) {
            error_log('N1 MP webhook: GET /v1/payments/' . $payment_id . ' HTTP ' . $http_code);
            return rest_ensure_response(array(
                'success' => true,
                'ignored' => true,
                'reason' => 'mp_payment_fetch_failed',
                'http_code' => $http_code,
            ));
        }

        $mp_status = !empty($mp_data['status']) ? sanitize_text_field($mp_data['status']) : '';
        if ($mp_status === '') {
            return rest_ensure_response(array('success' => true, 'ignored' => true, 'reason' => 'missing_status'));
        }

        // 4) Encontrar pedido WooCommerce pelo meta _mercadopago_payment_id
        $orders = wc_get_orders(array(
            'limit' => 10,
            'type' => 'shop_order',
            'meta_key' => '_mercadopago_payment_id',
            'meta_value' => (string) $payment_id,
            'orderby' => 'date',
            'order' => 'DESC',
        ));
        if (empty($orders)) {
            return rest_ensure_response(array('success' => true, 'ignored' => true, 'reason' => 'order_not_found'));
        }

        $updated = 0;
        foreach ($orders as $order) {
            if (!$order) {
                continue;
            }
            $current_status = $order->get_status();

            if ($mp_status === 'approved') {
                if ($current_status !== 'processing' && $current_status !== 'completed') {
                    $order->payment_complete((string) $payment_id);
                    $order->update_status('processing', 'Mercado Pago webhook: pagamento PIX aprovado.');
                    $updated++;
                }
            } elseif ($mp_status === 'pending' || $mp_status === 'in_process') {
                if ($current_status === 'pending') {
                    $order->add_order_note('Mercado Pago webhook: pagamento PIX pendente (' . $mp_status . ').');
                }
            } elseif ($mp_status === 'rejected' || $mp_status === 'cancelled' || $mp_status === 'refunded' || $mp_status === 'charged_back') {
                if ($current_status !== 'failed' && $current_status !== 'cancelled') {
                    $order->update_status('failed', 'Mercado Pago webhook: pagamento com status ' . $mp_status . '.');
                    $updated++;
                }
            } else {
                $order->add_order_note('Mercado Pago webhook: status recebido ' . $mp_status . '.');
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'payment_id' => (string) $payment_id,
            'status' => $mp_status,
            'orders_updated' => $updated,
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

            // Convidado: vincular ao cliente WooCommerce se o e-mail do pedido já existir no WordPress
            if ($user_id === 0 && !empty($params['email'])) {
                $billing_email = sanitize_email($params['email']);
                if ($billing_email && is_email($billing_email)) {
                    $existing_user = get_user_by('email', $billing_email);
                    if ($existing_user && (int) $existing_user->ID > 0) {
                        $user_id = (int) $existing_user->ID;
                        wp_set_current_user($user_id);
                        error_log('N1 API - add_order: Pedido vinculado ao usuário existente pelo e-mail, user_id = ' . $user_id);
                    }
                }
            }

            $coupon_info = isset($params['couponInfo']) ? $params['couponInfo'] : null;
            error_log('N1 API - add_order: Continuando com processamento do pedido. user_id final = ' . $user_id);

            // Pagamento: Stripe (paymentIntent.id) ou Mercado Pago (paymentIntent.mercadoPago + paymentMethod)
            $payment_intent_id = null;
            $payment_status = 'pending';
            $wc_payment_gateway = 'stripe';
            $wc_payment_title = 'Cartão de Crédito (Stripe)';
            $mp_extra_meta = array();

            $pi_raw = isset($params['paymentIntent']) ? $params['paymentIntent'] : null;
            $payment_intent_obj = is_array($pi_raw) ? $pi_raw : (is_object($pi_raw) ? (array) $pi_raw : array());

            $nested_pm = isset($payment_intent_obj['paymentMethod']) ? sanitize_text_field($payment_intent_obj['paymentMethod']) : '';
            $mp_raw = isset($payment_intent_obj['mercadoPago']) ? $payment_intent_obj['mercadoPago'] : null;
            $mp_pay = null;
            if (is_array($mp_raw)) {
                $mp_pay = $mp_raw;
            } elseif (is_object($mp_raw)) {
                $mp_pay = (array) $mp_raw;
            }

            if (is_string($pi_raw) && $pi_raw !== '' && empty($payment_intent_obj)) {
                $payment_intent_id = sanitize_text_field($pi_raw);
                $payment_status = 'succeeded';
                $wc_payment_gateway = 'stripe';
                $wc_payment_title = 'Cartão de Crédito (Stripe)';
            } elseif ($nested_pm === 'mercadopago_card') {
                $wc_payment_gateway = 'mercadopago';
                $wc_payment_title = 'Mercado Pago (cartão de crédito)';
                if (is_array($mp_pay) && !empty($mp_pay['id'])) {
                    $payment_intent_id = (string) $mp_pay['id'];
                    $mp_extra_meta['_mercadopago_payment_id'] = $payment_intent_id;
                }
                $payment_status = (is_array($mp_pay) && !empty($mp_pay['status']))
                    ? sanitize_text_field($mp_pay['status'])
                    : 'approved';
            } elseif ($nested_pm === 'mercadopago_pix') {
                $wc_payment_gateway = 'mercadopago';
                $wc_payment_title = 'Mercado Pago (PIX)';
                if (is_array($mp_pay) && !empty($mp_pay['id'])) {
                    $payment_intent_id = (string) $mp_pay['id'];
                    $mp_extra_meta['_mercadopago_payment_id'] = $payment_intent_id;
                }
                $payment_status = (is_array($mp_pay) && !empty($mp_pay['status']))
                    ? sanitize_text_field($mp_pay['status'])
                    : 'pending';
                $pix_raw = isset($payment_intent_obj['pix']) ? $payment_intent_obj['pix'] : array();
                if (is_array($pix_raw) && !empty($pix_raw['qr_code'])) {
                    $mp_extra_meta['_n1_mp_pix_qr_code'] = wp_kses_post($pix_raw['qr_code']);
                }
            } elseif (!empty($payment_intent_obj['id'])) {
                $payment_intent_id = sanitize_text_field($payment_intent_obj['id']);
                $payment_status = isset($payment_intent_obj['status']) ? sanitize_text_field($payment_intent_obj['status']) : 'succeeded';
                $pm_fr = isset($params['paymentMethod']) ? sanitize_text_field($params['paymentMethod']) : 'card';
                if ($pm_fr === 'pix') {
                    $wc_payment_title = 'PIX (Stripe)';
                } elseif ($pm_fr === 'boleto') {
                    $wc_payment_title = 'Boleto Bancário (Stripe)';
                } else {
                    $wc_payment_title = 'Cartão de Crédito (Stripe)';
                }
                $wc_payment_gateway = 'stripe';
            }

            if (isset($params['paymentStatus'])) {
                $payment_status = sanitize_text_field($params['paymentStatus']);
            }

            // Calcular total (produtos Woo + itens só da loja Next / catálogo externo)
            $subtotal = 0;
            $line_items = array();

            foreach ($cart_products as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $raw_id = isset($item['_id']) ? $item['_id'] : (isset($item['id']) ? $item['id'] : 0);
                $product_id = is_numeric($raw_id) ? intval($raw_id) : 0;

                $quantity = isset($item['orderQuantity']) ? max(1, intval($item['orderQuantity'])) : 1;
                $price = isset($item['price']) ? floatval($item['price']) : 0;

                $title = '';
                if (!empty($item['title'])) {
                    $title = sanitize_text_field($item['title']);
                } elseif (!empty($item['name'])) {
                    $title = sanitize_text_field($item['name']);
                } else {
                    $title = 'Produto';
                }

                if ($product_id > 0) {
                    $product = wc_get_product($product_id);
                    if ($product) {
                        $line_total = $price * $quantity;
                        $line_items[] = array(
                            'type' => 'product',
                            'product_id' => $product_id,
                            'quantity' => $quantity,
                            'subtotal' => $line_total,
                            'total' => $line_total,
                        );
                        $subtotal += $line_total;
                        continue;
                    }
                }

                // Sem produto no WooCommerce (catálogo Next, ID inválido, etc.) — linha manual no pedido
                if ($price > 0) {
                    $line_total = $price * $quantity;
                    $line_items[] = array(
                        'type' => 'custom',
                        'name' => $title,
                        'quantity' => $quantity,
                        'subtotal' => $line_total,
                        'total' => $line_total,
                    );
                    $subtotal += $line_total;
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

            // Adicionar itens: produtos WooCommerce ou taxa nomeada (itens só no Next — WC_Order_Item_Fee evita erro com linha “produto” sem ID)
            foreach ($line_items as $line_item) {
                if (isset($line_item['type']) && $line_item['type'] === 'custom') {
                    if (!class_exists('WC_Order_Item_Fee')) {
                        error_log('N1 API - WC_Order_Item_Fee indisponível');
                        return new WP_Error('woocommerce_fee_missing', 'WooCommerce não suporta itens personalizados nesta versão.', array('status' => 500));
                    }
                    $qty = max(1, intval($line_item['quantity']));
                    $fee_name = $line_item['name'];
                    if ($qty > 1) {
                        $fee_name .= ' × ' . $qty;
                    }
                    $fee_line = new WC_Order_Item_Fee();
                    $fee_line->set_name($fee_name);
                    $fee_total = floatval($line_item['total']);
                    if (method_exists($fee_line, 'set_amount')) {
                        $fee_line->set_amount($fee_total);
                    }
                    $fee_line->set_total($fee_total);
                    if (method_exists($fee_line, 'set_tax_status')) {
                        $fee_line->set_tax_status('none');
                    }
                    $order->add_item($fee_line);
                } elseif (!empty($line_item['product_id'])) {
                    $product = wc_get_product($line_item['product_id']);
                    if ($product) {
                        $order->add_product($product, intval($line_item['quantity']));
                    }
                }
            }

            // Frete enviado pelo checkout (Next)
            $ship_cost = isset($params['shippingCost']) ? floatval($params['shippingCost']) : 0;
            if ($ship_cost > 0 && class_exists('WC_Order_Item_Shipping')) {
                $ship = new WC_Order_Item_Shipping();
                $ship->set_method_title('Frete');
                if (method_exists($ship, 'set_method_id')) {
                    $ship->set_method_id('n1_loja');
                }
                $ship->set_total($ship_cost);
                if (method_exists($ship, 'set_tax_status')) {
                    $ship->set_tax_status('none');
                }
                $order->add_item($ship);
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

            $order->set_payment_method($wc_payment_gateway);
            $order->set_payment_method_title($wc_payment_title);

            foreach ($mp_extra_meta as $mk => $mv) {
                $order->update_meta_data($mk, $mv);
            }

            if ($wc_payment_gateway === 'stripe' && $payment_intent_id) {
                $order->update_meta_data('_stripe_payment_intent_id', $payment_intent_id);
            }

            // Definir status do pagamento (MP usa "approved")
            if ($payment_status === 'succeeded' || $payment_status === 'paid' || $payment_status === 'approved') {
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

            $resp_order = $saved_order ? $saved_order : $order;

            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Pedido criado com sucesso',
                'order' => array(
                    '_id' => (string) $order_id,
                    'id' => $order_id,
                    'order_number' => $resp_order->get_order_number(),
                    'order_key' => $resp_order->get_order_key(),
                    'status' => $resp_order->get_status(),
                    'total' => $resp_order->get_total(),
                    'date_created' => $resp_order->get_date_created() ? $resp_order->get_date_created()->date('Y-m-d H:i:s') : '',
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

            $order = wc_get_order($order_id);

            if (!$order) {
                error_log('N1 API - Pedido não encontrado: ' . $order_id);
                return new WP_Error('order_not_found', 'Pedido não encontrado', array('status' => 404));
            }

            $user_id = $this->n1_get_user_id_from_bearer_request();
            $provided_key = sanitize_text_field($request->get_param('key'));

            // Convidado: só com chave secreta do pedido WooCommerce (igual link do e-mail)
            if (!$user_id) {
                $real_key = (string) $order->get_order_key();
                if ($provided_key === '' || !hash_equals($real_key, $provided_key)) {
                    error_log('N1 API - single-order: sem login e sem order_key válido');
                    return new WP_Error(
                        'unauthorized',
                        'Informe a chave do pedido (link após o checkout) ou faça login.',
                        array('status' => 401)
                    );
                }
                error_log('N1 API - single-order: acesso convidado com order_key válido');
            } else {
                error_log('N1 API - Usuário autenticado ID: ' . $user_id);

                $customer_id = $order->get_customer_id();
                error_log('N1 API - Pedido encontrado. Customer ID: ' . $customer_id . ', User ID: ' . $user_id);

                // Verificar se o pedido pertence ao usuário
                if ($customer_id != $user_id) {
                    if (!current_user_can('edit_shop_orders')) {
                        $billing_email = $order->get_billing_email();
                        $ud = get_userdata($user_id);
                        $user_email = $ud ? $ud->user_email : '';

                        if ($billing_email !== $user_email) {
                            error_log('N1 API - Permissão negada. Customer: ' . $customer_id . ', User: ' . $user_id);
                            return new WP_Error('permission_denied', 'Você não tem permissão para visualizar este pedido', array('status' => 403));
                        }
                    }
                }
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

                        $line_total = floatval($item->get_total());
                        $item_price = $quantity > 0 ? floatval($line_total / $quantity) : 0;

                        if ($product) {
                            $regular_price = floatval($product->get_regular_price());
                            if ($regular_price <= 0) {
                                $regular_price = $item_price;
                            }
                            $sale_price = $product->get_sale_price() ? floatval($product->get_sale_price()) : $regular_price;
                        } else {
                            $regular_price = $item_price;
                            $sale_price = $item_price;
                        }

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
                            '_id' => $product_id > 0 ? (string) $product_id : 'custom-' . $item_id,
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

            // Taxas / itens catálogo Next (WC_Order_Item_Fee)
            $fee_items = $order->get_items('fee');
            if (is_array($fee_items)) {
                foreach ($fee_items as $fid => $fee_item) {
                    try {
                        $ft = floatval($fee_item->get_total());
                        $cart_items[] = array(
                            '_id' => 'fee-' . $fid,
                            'id' => 0,
                            'title' => $fee_item->get_name() ? $fee_item->get_name() : 'Item',
                            'price' => $ft,
                            'originalPrice' => $ft,
                            'discount' => 0,
                            'orderQuantity' => 1,
                            'image' => wc_placeholder_img_src(),
                        );
                    } catch (Exception $e) {
                        error_log('Erro ao formatar taxa do pedido: ' . $e->getMessage());
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
                'paymentMethod' => $payment_method ? $payment_method : 'unknown',
                'paymentMethodTitle' => $payment_method_title ? $payment_method_title : 'Pagamento online',
                'createdAt' => $created_at,
                'cardInfo' => array(
                    'type' => $payment_method_title ? $payment_method_title : ($payment_method ? $payment_method : 'Pagamento online'),
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

} // fim if (!class_exists('N1_WooCommerce_API'))

// Inicializa uma única vez (duas pastas do plugin não duplicam hooks).
if (!defined('N1_WOOCOMMERCE_API_LOADED')) {
    define('N1_WOOCOMMERCE_API_LOADED', true);
    new N1_WooCommerce_API();
}

