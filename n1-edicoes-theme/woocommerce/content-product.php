<?php
/**
 * The template for displaying product content within loops
 *
 * @package N1_Edicoes
 */

if (!defined('ABSPATH')) {
    exit;
}

global $product;

// Ensure visibility
if (empty($product) || !$product->is_visible()) {
    return;
}
?>

<div class="col-xl-4 col-lg-4 col-md-4 col-sm-6">
    <?php n1_product_card($product); ?>
</div>



