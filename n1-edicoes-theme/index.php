<?php
/**
 * The main template file
 *
 * @package N1_Edicoes
 */

get_header();
?>

<main id="main" class="site-main">
    <?php
    if (is_front_page() && is_home()) {
        // Homepage
        get_template_part('template-parts/content', 'home');
    } elseif (is_shop() || is_product_category() || is_product_tag()) {
        // Shop pages
        get_template_part('template-parts/content', 'shop');
    } elseif (is_product()) {
        // Single product
        get_template_part('template-parts/content', 'single-product');
    } elseif (have_posts()) {
        // Blog posts
        while (have_posts()) {
            the_post();
            get_template_part('template-parts/content', get_post_type());
        }
    } else {
        get_template_part('template-parts/content', 'none');
    }
    ?>
</main>

<?php
get_footer();



