<?php
/**
 * The Template for displaying all single products
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header('shop');
?>

<div class="product-details-area">
    <div class="container">
        <?php n1_woocommerce_breadcrumbs(); ?>
        
        <div class="row">
            <div class="col-lg-12">
                <?php
                while (have_posts()) {
                    the_post();
                    wc_get_template_part('content', 'single-product');
                }
                ?>
            </div>
        </div>
    </div>
</div>

<?php
get_footer('shop');



