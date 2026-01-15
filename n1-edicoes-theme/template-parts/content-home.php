<?php
/**
 * Template part for displaying homepage
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<section class="hero-banner-area">
    <div class="container">
        <div class="row">
            <div class="col-12">
                <div class="hero-banner-content text-center">
                    <h1><?php echo esc_html(get_bloginfo('name')); ?></h1>
                    <p><?php echo esc_html(get_bloginfo('description')); ?></p>
                    <a href="<?php echo esc_url(n1_get_shop_url()); ?>" class="btn btn-primary">
                        <?php esc_html_e('Ver Produtos', 'n1-edicoes'); ?>
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<?php if (n1_is_woocommerce_active()) : ?>
    <section class="product__popular-area pb-20">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="section-title-wrapper text-center mb-50">
                        <h2 class="section-title"><?php esc_html_e('Produtos em Destaque', 'n1-edicoes'); ?></h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <?php
                $args = array(
                    'post_type' => 'product',
                    'posts_per_page' => 8,
                    'meta_key' => '_featured',
                    'meta_value' => 'yes',
                );
                
                $products = new WP_Query($args);
                
                if ($products->have_posts()) :
                    while ($products->have_posts()) : $products->the_post();
                        global $product;
                        n1_product_card($product);
                    endwhile;
                    wp_reset_postdata();
                else :
                    // Fallback: mostrar produtos recentes
                    $args = array(
                        'post_type' => 'product',
                        'posts_per_page' => 8,
                        'orderby' => 'date',
                        'order' => 'DESC',
                    );
                    
                    $products = new WP_Query($args);
                    
                    if ($products->have_posts()) :
                        while ($products->have_posts()) : $products->the_post();
                            global $product;
                            n1_product_card($product);
                        endwhile;
                        wp_reset_postdata();
                    endif;
                endif;
                ?>
            </div>
        </div>
    </section>
<?php endif; ?>



