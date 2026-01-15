<?php
/**
 * Template part for displaying single product
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!n1_is_woocommerce_active()) {
    return;
}
?>

<div class="product-details-area">
    <div class="container">
        <?php n1_woocommerce_breadcrumbs(); ?>
        
        <?php
        while (have_posts()) {
            the_post();
            wc_get_template_part('content', 'single-product');
        }
        ?>
    </div>
</div>


