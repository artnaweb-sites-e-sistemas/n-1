<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#main"><?php esc_html_e('Pular para o conteúdo', 'n1-edicoes'); ?></a>

    <header class="header__area">
        <div class="header__bottom-13 header__padding-7 header__black-3 header__bottom-border-4 grey-bg-17 header__sticky" id="header-sticky">
            <div class="container-fluid">
                <div class="mega-menu-wrapper p-relative">
                    <div class="row align-items-center">
                        <div class="col-xxl-1 col-xl-2 col-lg-4 col-md-4 col-sm-5 col-8">
                            <div class="logo">
                                <a href="<?php echo esc_url(home_url('/')); ?>">
                                    <?php
                                    $custom_logo_id = get_theme_mod('custom_logo');
                                    if ($custom_logo_id) {
                                        echo wp_get_attachment_image($custom_logo_id, 'full', false, array('alt' => get_bloginfo('name')));
                                    } else {
                                        echo '<img src="' . esc_url(get_template_directory_uri() . '/assets/img/logo/logo-black.svg') . '" alt="' . esc_attr(get_bloginfo('name')) . '">';
                                    }
                                    ?>
                                </a>
                            </div>
                        </div>
                        <div class="col-xxl-6 col-xl-7 d-none d-xl-block">
                            <div class="main-menu main-menu-13 pl-45 main-menu-ff-space">
                                <nav id="mobile-menu-3">
                                    <?php
                                    wp_nav_menu(array(
                                        'theme_location' => 'primary',
                                        'menu_id' => 'primary-menu',
                                        'container' => false,
                                        'menu_class' => 'menu',
                                        'fallback_cb' => false,
                                    ));
                                    ?>
                                </nav>
                            </div>
                        </div>
                        <div class="col-xxl-5 col-xl-3 col-lg-8 col-md-8 col-sm-7 col-4">
                            <div class="header__bottom-right-13 d-flex justify-content-end align-items-center pl-30">
                                <div class="header__search-13">
                                    <form role="search" method="get" class="search-form" action="<?php echo esc_url(home_url('/')); ?>">
                                        <input type="search" name="s" placeholder="<?php esc_attr_e('Buscar produtos...', 'n1-edicoes'); ?>" value="<?php echo get_search_query(); ?>">
                                        <button type="submit"><i class="fa fa-search"></i></button>
                                    </form>
                                </div>
                                <div class="header__action-13 d-none d-md-block">
                                    <ul>
                                        <?php if (is_user_logged_in()) : ?>
                                            <li>
                                                <a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">
                                                    <i class="fa fa-user"></i>
                                                </a>
                                            </li>
                                        <?php else : ?>
                                            <li>
                                                <a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">
                                                    <i class="fa fa-user"></i>
                                                </a>
                                            </li>
                                        <?php endif; ?>
                                        <li>
                                            <a href="<?php echo esc_url(wc_get_page_permalink('cart')); ?>">
                                                <i class="fa fa-shopping-cart"></i>
                                                <span class="tp-item-count"><?php echo WC()->cart->get_cart_contents_count(); ?></span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                <div class="header__hamburger ml-30 d-xl-none">
                                    <button type="button" class="hamburger-btn hamburger-btn-black offcanvas-open-btn">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>


