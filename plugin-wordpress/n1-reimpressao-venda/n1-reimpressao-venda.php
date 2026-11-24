<?php
/**
 * Plugin Name: N-1 Reimpressão — venda sem estoque
 * Description: Libera a venda dos livros de reimpressão mesmo com estoque zero. Quando a Olist (ou o WooCommerce) grava uma quantidade maior que zero, essa quantidade passa a valer e o livro esgota ao chegar a zero.
 * Version: 1.0.0
 * Author: N-1 Edições
 * Requires Plugins: woocommerce
 * Text Domain: n1-reimpressao-venda
 */

if (!defined('ABSPATH')) {
    exit;
}

const N1_REPRINT_PRIORITY_META = '_n1_olist_stock_priority';
const N1_REPRINT_EXTRA_OPTION = 'n1_reprint_extra_titles';

/**
 * Títulos da planilha de reimpressão. A comparação ignora acento, caixa e pontuação.
 * A linha marcada como "adiado" ficou ilegível na imagem; dá para incluí-la em
 * WooCommerce → Reimpressões, no campo de títulos adicionais.
 */
function n1_reprint_default_needles()
{
    return array(
        'floresta de cristal',
        'tratado do todo mundo',
        'animacidades',
        'pensar apos gaza',
        'dinamicas do pensamento por imagens',
        'antigos caminhos queer',
        'impressoes de michel foucault',
        'enigma da revolta',
        'etica bixa',
        'corpos crip',
        'politicas da inimizade',
        'a ultima guerra',
        'ixinakax',
        'quando o sol aqui nao mais brilhar',
        'potencias da suavidade',
        'composto escola',
        'brutalismo',
        'esferas da insurrei',
        'corpo utopico',
        'cosmopolitica dos animais',
        'hegel e o haiti',
        'e se eu fosse puta',
    );
}

function n1_reprint_needles()
{
    $extra = get_option(N1_REPRINT_EXTRA_OPTION, '');
    $lines = preg_split('/\r\n|\r|\n/', (string) $extra);
    $needles = n1_reprint_default_needles();
    foreach ($lines as $line) {
        $normalized = n1_reprint_normalize($line);
        if ($normalized !== '') {
            $needles[] = $normalized;
        }
    }
    return array_values(array_unique($needles));
}

function n1_reprint_normalize($text)
{
    $text = remove_accents(wp_strip_all_tags((string) $text));
    $text = strtolower($text);
    $text = str_replace(array('-', '–', '—', '’', "'"), ' ', $text);
    $text = preg_replace('/[^a-z0-9]+/', ' ', $text);
    return trim($text);
}

function n1_reprint_title_matches($title)
{
    $name = n1_reprint_normalize($title);
    if ($name === '') {
        return false;
    }
    foreach (n1_reprint_needles() as $needle) {
        if ($needle !== '' && strpos($name, $needle) !== false) {
            return true;
        }
    }
    return false;
}

function n1_reprint_is_listed($product)
{
    if (!$product || !is_a($product, 'WC_Product')) {
        return false;
    }
    if (n1_reprint_title_matches($product->get_name())) {
        return true;
    }
    if ($product->is_type('variation')) {
        $parent = wc_get_product($product->get_parent_id());
        return $parent && n1_reprint_title_matches($parent->get_name());
    }
    return false;
}

function n1_reprint_has_priority($product)
{
    return $product && $product->get_meta(N1_REPRINT_PRIORITY_META) === 'yes';
}

function n1_reprint_positive_stock($product)
{
    if (!$product || !$product->managing_stock()) {
        return false;
    }
    $qty = $product->get_stock_quantity();
    return $qty !== null && (float) $qty > 0;
}

/**
 * Quantidade maior que zero assume o controle. Estoque zero sincronizado
 * não conta: é o estado atual desses livros, e a venda sem estoque continua.
 */
function n1_reprint_grant_priority($product_id)
{
    update_post_meta($product_id, N1_REPRINT_PRIORITY_META, 'yes');
    update_post_meta($product_id, '_backorders', 'no');
}

function n1_reprint_open_for_sale($product)
{
    if (n1_reprint_positive_stock($product)) {
        n1_reprint_grant_priority($product->get_id());
        return;
    }
    $product->set_backorders('yes');
    if (!$product->managing_stock() || (float) $product->get_stock_quantity() <= 0) {
        $product->set_stock_status('onbackorder');
    }
    $product->save();
}

function n1_reprint_apply_all()
{
    if (!function_exists('wc_get_product')) {
        return array('opened' => 0, 'priority' => 0, 'matched' => array(), 'missing' => n1_reprint_needles());
    }

    $query = new WP_Query(array(
        'post_type' => 'product',
        'post_status' => array('publish', 'private'),
        'posts_per_page' => -1,
        'fields' => 'ids',
        'no_found_rows' => true,
    ));

    $opened = 0;
    $priority = 0;
    $matched_needles = array();

    foreach ($query->posts as $product_id) {
        $product = wc_get_product($product_id);
        if (!$product || !n1_reprint_is_listed($product)) {
            continue;
        }
        $normalized = n1_reprint_normalize($product->get_name());
        foreach (n1_reprint_needles() as $needle) {
            if (strpos($normalized, $needle) !== false) {
                $matched_needles[$needle] = true;
            }
        }
        if (n1_reprint_has_priority($product) || n1_reprint_positive_stock($product)) {
            if (n1_reprint_positive_stock($product)) {
                n1_reprint_grant_priority($product_id);
            }
            $priority++;
            continue;
        }
        n1_reprint_open_for_sale($product);
        $opened++;
    }

    $missing = array();
    foreach (n1_reprint_needles() as $needle) {
        if (empty($matched_needles[$needle])) {
            $missing[] = $needle;
        }
    }

    return array(
        'opened' => $opened,
        'priority' => $priority,
        'missing' => $missing,
    );
}

add_filter('woocommerce_product_is_in_stock', function ($in_stock, $product) {
    if (!n1_reprint_is_listed($product) || n1_reprint_has_priority($product) || n1_reprint_positive_stock($product)) {
        return $in_stock;
    }
    return true;
}, 20, 2);

add_filter('woocommerce_product_backorders_allowed', function ($allowed, $product_id, $product) {
    if (!$product) {
        $product = wc_get_product($product_id);
    }
    if (!n1_reprint_is_listed($product) || n1_reprint_has_priority($product) || n1_reprint_positive_stock($product)) {
        return $allowed;
    }
    return true;
}, 20, 3);

add_action('woocommerce_product_set_stock', function ($product) {
    if (!n1_reprint_is_listed($product) || !n1_reprint_positive_stock($product)) {
        return;
    }
    n1_reprint_grant_priority($product->get_id());
    $product->set_backorders('no');
});

add_action('updated_post_meta', 'n1_reprint_on_stock_meta', 10, 4);
add_action('added_post_meta', 'n1_reprint_on_stock_meta', 10, 4);
function n1_reprint_on_stock_meta($meta_id, $object_id, $meta_key, $meta_value)
{
    if ($meta_key !== '_stock' || (float) $meta_value <= 0 || !function_exists('wc_get_product')) {
        return;
    }
    $product = wc_get_product($object_id);
    if (!$product || !n1_reprint_is_listed($product)) {
        return;
    }
    n1_reprint_grant_priority($object_id);
}

add_action('admin_menu', function () {
    add_submenu_page(
        'woocommerce',
        'Reimpressões',
        'Reimpressões',
        'manage_woocommerce',
        'n1-reimpressao-venda',
        'n1_reprint_render_admin'
    );
});

add_action('admin_post_n1_reprint_apply', function () {
    if (!current_user_can('manage_woocommerce')) {
        wp_die('Sem permissão.');
    }
    check_admin_referer('n1_reprint_apply');
    if (isset($_POST['extra_titles'])) {
        update_option(N1_REPRINT_EXTRA_OPTION, sanitize_textarea_field(wp_unslash($_POST['extra_titles'])));
    }
    $result = n1_reprint_apply_all();
    set_transient('n1_reprint_last_result', $result, MINUTE_IN_SECONDS * 5);
    wp_safe_redirect(admin_url('admin.php?page=n1-reimpressao-venda&applied=1'));
    exit;
});

function n1_reprint_render_admin()
{
    if (!current_user_can('manage_woocommerce')) {
        return;
    }
    $result = get_transient('n1_reprint_last_result');
    delete_transient('n1_reprint_last_result');
    $extra = get_option(N1_REPRINT_EXTRA_OPTION, '');
    echo '<div class="wrap"><h1>Reimpressões — venda sem estoque</h1>';
    echo '<p>Estoque zero continua à venda. Quando a Olist gravar uma quantidade maior que zero no produto sincronizado, essa quantidade passa a mandar. Ao chegar de novo a zero, o livro fica esgotado.</p>';
    if (is_array($result)) {
        echo '<div class="notice notice-success"><p>';
        echo esc_html(sprintf(
            'Aplicado. %d livro(s) liberados sem estoque. %d já seguem a quantidade cadastrada.',
            (int) $result['opened'],
            (int) $result['priority']
        ));
        echo '</p></div>';
        if (!empty($result['missing'])) {
            echo '<div class="notice notice-warning"><p>Nenhum produto encontrado para: ' . esc_html(implode(', ', $result['missing'])) . '.</p></div>';
        }
    }
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    wp_nonce_field('n1_reprint_apply');
    echo '<input type="hidden" name="action" value="n1_reprint_apply" />';
    echo '<p><label for="n1-extra"><strong>Títulos adicionais</strong> (um por linha, se algum livro não for encontrado)</label><br />';
    echo '<textarea id="n1-extra" name="extra_titles" rows="6" class="large-text">' . esc_textarea($extra) . '</textarea></p>';
    submit_button('Aplicar na lista');
    echo '</form></div>';
}

add_action('admin_init', function () {
    if (!wp_next_scheduled('n1_reprint_daily')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'n1_reprint_daily');
    }
});

add_action('n1_reprint_daily', 'n1_reprint_apply_all');

register_activation_hook(__FILE__, function () {
    if (!wp_next_scheduled('n1_reprint_daily')) {
        wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', 'n1_reprint_daily');
    }
    n1_reprint_apply_all();
});

register_deactivation_hook(__FILE__, function () {
    wp_clear_scheduled_hook('n1_reprint_daily');
});
