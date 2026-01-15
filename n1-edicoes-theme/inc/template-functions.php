<?php
/**
 * Template Functions
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Get product image URL
 */
function n1_get_product_image($product_id, $size = 'n1-product-thumb') {
    $image_id = get_post_thumbnail_id($product_id);
    if ($image_id) {
        $image = wp_get_attachment_image_src($image_id, $size);
        return $image ? $image[0] : '';
    }
    return wc_placeholder_img_src();
}

/**
 * Format product price
 */
function n1_format_price($price) {
    return 'R$ ' . number_format($price, 2, ',', '.');
}

/**
 * Get product discount percentage
 */
function n1_get_product_discount($product) {
    if (!$product->is_on_sale()) {
        return 0;
    }
    
    $regular_price = $product->get_regular_price();
    $sale_price = $product->get_sale_price();
    
    if ($regular_price && $sale_price) {
        $discount = (($regular_price - $sale_price) / $regular_price) * 100;
        return round($discount);
    }
    
    return 0;
}

/**
 * Display product card
 */
function n1_product_card($product) {
    if (!$product) {
        return;
    }
    
    $product_id = $product->get_id();
    $image = n1_get_product_image($product_id);
    $title = $product->get_name();
    $price = $product->get_price();
    $regular_price = $product->get_regular_price();
    $discount = n1_get_product_discount($product);
    $permalink = get_permalink($product_id);
    ?>
    <div class="product__item p-relative transition-3 mb-50">
        <div class="product__thumb w-img p-relative fix">
            <a href="<?php echo esc_url($permalink); ?>">
                <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($title); ?>">
            </a>
            
            <?php if ($discount > 0) : ?>
                <div class="product__badge d-flex flex-column flex-wrap">
                    <span class="product__badge-item has-new">sale</span>
                    <span class="product__badge-item has-offer">-<?php echo esc_html($discount); ?>%</span>
                </div>
            <?php endif; ?>
            
            <div class="product__action d-flex flex-column flex-wrap">
                <a href="<?php echo esc_url($permalink); ?>" class="product-action-btn">
                    <i class="fa fa-eye"></i>
                    <span class="product-action-tooltip">Visualizar</span>
                </a>
            </div>
            
            <div class="product__add transition-3">
                <a href="<?php echo esc_url($product->add_to_cart_url()); ?>" class="product-add-cart-btn w-100">
                    <i class="fa fa-shopping-cart"></i>
                    Adicionar ao Carrinho
                </a>
            </div>
        </div>
        <div class="product__content">
            <h3 class="product__title">
                <a href="<?php echo esc_url($permalink); ?>"><?php echo esc_html($title); ?></a>
            </h3>
            <div class="product__price">
                <?php if ($discount > 0) : ?>
                    <span class="product__old-price"><?php echo n1_format_price($regular_price); ?></span>
                    <span class="product__ammount"><?php echo n1_format_price($price); ?></span>
                <?php else : ?>
                    <span class="product__ammount"><?php echo n1_format_price($price); ?></span>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <?php
}



