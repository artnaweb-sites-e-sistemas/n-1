<?php
/**
 * WooCommerce Functions
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Remove default WooCommerce wrappers
 */
remove_action('woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10);
remove_action('woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10);

/**
 * Add custom WooCommerce wrappers
 */
function n1_woocommerce_wrapper_start() {
    echo '<div class="woocommerce-wrapper">';
}
add_action('woocommerce_before_main_content', 'n1_woocommerce_wrapper_start', 10);

function n1_woocommerce_wrapper_end() {
    echo '</div>';
}
add_action('woocommerce_after_main_content', 'n1_woocommerce_wrapper_end', 10);

/**
 * Change number of products per row
 */
function n1_products_per_row() {
    return 3;
}
add_filter('loop_shop_columns', 'n1_products_per_row');

/**
 * Change number of products per page
 */
function n1_products_per_page() {
    return 12;
}
add_filter('loop_shop_per_page', 'n1_products_per_page');

/**
 * Custom product thumbnail size
 */
function n1_woocommerce_image_sizes() {
    add_image_size('n1-product-thumb', 400, 500, true);
    add_image_size('n1-product-single', 800, 1000, true);
}
add_action('after_setup_theme', 'n1_woocommerce_image_sizes');

/**
 * Customize product loop
 */
function n1_product_loop_start() {
    echo '<div class="row">';
}
add_action('woocommerce_before_shop_loop', 'n1_product_loop_start', 5);

function n1_product_loop_end() {
    echo '</div>';
}
add_action('woocommerce_after_shop_loop', 'n1_product_loop_end', 25);

/**
 * Wrap product in column
 */
function n1_product_wrapper_start() {
    echo '<div class="col-xl-4 col-lg-4 col-md-4 col-sm-6">';
}
add_action('woocommerce_before_shop_loop_item', 'n1_product_wrapper_start', 5);

function n1_product_wrapper_end() {
    echo '</div>';
}
add_action('woocommerce_after_shop_loop_item', 'n1_product_wrapper_end', 25);

/**
 * Customize add to cart button
 */
function n1_custom_add_to_cart_text() {
    return __('Adicionar ao Carrinho', 'n1-edicoes');
}
add_filter('woocommerce_product_add_to_cart_text', 'n1_custom_add_to_cart_text');
add_filter('woocommerce_product_single_add_to_cart_text', 'n1_custom_add_to_cart_text');

/**
 * Remove default WooCommerce breadcrumbs
 */
remove_action('woocommerce_before_main_content', 'woocommerce_breadcrumb', 20);

/**
 * Custom breadcrumbs
 */
function n1_woocommerce_breadcrumbs() {
    if (function_exists('woocommerce_breadcrumb')) {
        woocommerce_breadcrumb(array(
            'delimiter' => ' / ',
            'wrap_before' => '<nav class="breadcrumb" aria-label="breadcrumb"><div class="container"><ol class="breadcrumb-list">',
            'wrap_after' => '</ol></div></nav>',
            'before' => '<li class="breadcrumb-item">',
            'after' => '</li>',
            'home' => __('Home', 'n1-edicoes'),
        ));
    }
}



