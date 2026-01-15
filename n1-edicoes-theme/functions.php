<?php
/**
 * N-1 Edições Theme Functions
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define theme constants
define('N1_THEME_VERSION', '1.0.0');
define('N1_THEME_DIR', get_template_directory());
define('N1_THEME_URI', get_template_directory_uri());

/**
 * Theme Setup
 */
function n1_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // WooCommerce support
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Menu Principal', 'n1-edicoes'),
        'footer' => __('Menu Rodapé', 'n1-edicoes'),
    ));
    
    // Set content width
    $GLOBALS['content_width'] = 1200;
}
add_action('after_setup_theme', 'n1_theme_setup');

/**
 * Enqueue scripts and styles
 */
function n1_enqueue_assets() {
    $theme_uri = N1_THEME_URI;
    
    // Styles - usando CDN como fallback
    // Bootstrap
    if (file_exists($theme_uri . '/assets/css/bootstrap.min.css')) {
        wp_enqueue_style('bootstrap', $theme_uri . '/assets/css/bootstrap.min.css', array(), '5.2.3');
    } else {
        wp_enqueue_style('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css', array(), '5.2.3');
    }
    
    // Font Awesome
    if (file_exists(get_template_directory() . '/assets/css/fontawesome-all.min.css')) {
        wp_enqueue_style('fontawesome', $theme_uri . '/assets/css/fontawesome-all.min.css', array(), '6.0.0');
    } else {
        wp_enqueue_style('fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
    }
    
    // Elegant Font
    if (file_exists(get_template_directory() . '/assets/css/elegantFont.css')) {
        wp_enqueue_style('elegant-font', $theme_uri . '/assets/css/elegantFont.css', array(), '1.0.0');
    }
    
    // CSS do template (se existir)
    if (file_exists(get_template_directory() . '/assets/css/style.css')) {
        wp_enqueue_style('n1-main', $theme_uri . '/assets/css/style.css', array('bootstrap'), N1_THEME_VERSION);
    }
    
    if (file_exists(get_template_directory() . '/assets/css/responsive.css')) {
        wp_enqueue_style('n1-responsive', $theme_uri . '/assets/css/responsive.css', array('n1-main'), N1_THEME_VERSION);
    }
    
    // CSS customizado do tema
    wp_enqueue_style('n1-custom', $theme_uri . '/assets/css/theme-custom.css', array('bootstrap'), N1_THEME_VERSION);
    
    // CSS auxiliares do template
    if (file_exists(get_template_directory() . '/assets/css/animate.css')) {
        wp_enqueue_style('n1-animate', $theme_uri . '/assets/css/animate.css', array(), N1_THEME_VERSION);
    }
    if (file_exists(get_template_directory() . '/assets/css/nice-select.css')) {
        wp_enqueue_style('n1-nice-select', $theme_uri . '/assets/css/nice-select.css', array(), N1_THEME_VERSION);
    }
    
    // Style.css do tema
    wp_enqueue_style('n1-theme', get_stylesheet_uri(), array('bootstrap', 'n1-custom'), N1_THEME_VERSION);
    
    // Scripts
    wp_enqueue_script('jquery');
    
    // Bootstrap JS
    if (file_exists(get_template_directory() . '/assets/js/bootstrap.bundle.min.js')) {
        wp_enqueue_script('bootstrap', $theme_uri . '/assets/js/bootstrap.bundle.min.js', array('jquery'), '5.2.3', true);
    } else {
        wp_enqueue_script('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js', array('jquery'), '5.2.3', true);
    }
    
    // Slick Carousel
    if (file_exists(get_template_directory() . '/assets/js/slick.min.js')) {
        wp_enqueue_script('slick', $theme_uri . '/assets/js/slick.min.js', array('jquery'), '1.8.1', true);
        if (file_exists(get_template_directory() . '/assets/css/slick.css')) {
            wp_enqueue_style('slick', $theme_uri . '/assets/css/slick.css', array(), '1.8.1');
        }
    }
    
    // Swiper
    if (file_exists(get_template_directory() . '/assets/js/swiper-bundle.min.js')) {
        wp_enqueue_script('swiper', $theme_uri . '/assets/js/swiper-bundle.min.js', array('jquery'), '8.4.5', true);
        if (file_exists(get_template_directory() . '/assets/css/swiper-bundle.min.css')) {
            wp_enqueue_style('swiper', $theme_uri . '/assets/css/swiper-bundle.min.css', array(), '8.4.5');
        }
    }
    
    // Nice Select
    if (file_exists(get_template_directory() . '/assets/js/jquery.nice-select.min.js')) {
        wp_enqueue_script('nice-select', $theme_uri . '/assets/js/jquery.nice-select.min.js', array('jquery'), '1.1.0', true);
    }
    
    // Main JS do tema
    if (file_exists(get_template_directory() . '/assets/js/main.js')) {
        wp_enqueue_script('n1-main', $theme_uri . '/assets/js/main.js', array('jquery', 'bootstrap'), N1_THEME_VERSION, true);
    } else {
        // JS básico inline se não existir
        wp_add_inline_script('jquery', '
            jQuery(document).ready(function($) {
                // Menu mobile toggle
                $(".offcanvas-open-btn").on("click", function() {
                    $("body").toggleClass("offcanvas-open");
                });
                
                // Nice Select init
                if (typeof $.fn.niceSelect !== "undefined") {
                    $("select").niceSelect();
                }
            });
        ');
    }
    
    // Localize script for AJAX
    wp_localize_script('jquery', 'n1Ajax', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('n1_nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'n1_enqueue_assets');

/**
 * Register widget areas
 */
function n1_widgets_init() {
    register_sidebar(array(
        'name' => __('Sidebar Principal', 'n1-edicoes'),
        'id' => 'sidebar-1',
        'description' => __('Widgets para a sidebar principal', 'n1-edicoes'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
    
    register_sidebar(array(
        'name' => __('Rodapé 1', 'n1-edicoes'),
        'id' => 'footer-1',
        'description' => __('Primeira coluna do rodapé', 'n1-edicoes'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
    
    register_sidebar(array(
        'name' => __('Rodapé 2', 'n1-edicoes'),
        'id' => 'footer-2',
        'description' => __('Segunda coluna do rodapé', 'n1-edicoes'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
    
    register_sidebar(array(
        'name' => __('Rodapé 3', 'n1-edicoes'),
        'id' => 'footer-3',
        'description' => __('Terceira coluna do rodapé', 'n1-edicoes'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'n1_widgets_init');

/**
 * Custom WooCommerce functions
 */
require_once N1_THEME_DIR . '/inc/woocommerce.php';

/**
 * Template functions
 */
require_once N1_THEME_DIR . '/inc/template-functions.php';

/**
 * Helper functions
 */
require_once N1_THEME_DIR . '/inc/helpers.php';

