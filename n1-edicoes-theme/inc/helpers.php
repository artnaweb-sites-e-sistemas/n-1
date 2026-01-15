<?php
/**
 * Helper Functions
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sanitize text
 */
function n1_sanitize_text($text) {
    return sanitize_text_field($text);
}

/**
 * Get excerpt
 */
function n1_get_excerpt($post_id = null, $length = 20) {
    if (!$post_id) {
        $post_id = get_the_ID();
    }
    
    $excerpt = get_the_excerpt($post_id);
    if (empty($excerpt)) {
        $excerpt = get_post_field('post_content', $post_id);
    }
    
    $excerpt = wp_strip_all_tags($excerpt);
    $excerpt = wp_trim_words($excerpt, $length, '...');
    
    return $excerpt;
}

/**
 * Check if WooCommerce is active
 */
function n1_is_woocommerce_active() {
    return class_exists('WooCommerce');
}

/**
 * Get shop URL
 */
function n1_get_shop_url() {
    if (function_exists('wc_get_page_permalink')) {
        return wc_get_page_permalink('shop');
    }
    return home_url('/shop');
}



