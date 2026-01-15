<?php
/**
 * The Template for displaying product archives
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header('shop');
?>

<div class="shop-area">
    <div class="container">
        <?php n1_woocommerce_breadcrumbs(); ?>
        
        <div class="row">
            <div class="col-lg-12">
                <?php
                if (woocommerce_product_loop()) {
                    woocommerce_product_loop_start();
                    
                    if (wc_get_loop_prop('is_shortcode')) {
                        $columns = absint(wc_get_loop_prop('columns'));
                        wc_set_loop_prop('columns', $columns);
                    }
                    
                    while (have_posts()) {
                        the_post();
                        wc_get_template_part('content', 'product');
                    }
                    
                    woocommerce_product_loop_end();
                    
                    woocommerce_pagination();
                } else {
                    do_action('woocommerce_no_products_found');
                }
                ?>
            </div>
        </div>
    </div>
</div>

<?php
get_footer('shop');


