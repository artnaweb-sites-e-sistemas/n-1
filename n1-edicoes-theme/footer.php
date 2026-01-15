    <footer class="footer__area footer__style-4" data-bg-color="footer-bg-white">
        <div class="footer__top">
            <div class="container">
                <div class="row">
                    <div class="col-xxl-3 col-xl-3 col-lg-3 col-md-5 col-sm-6">
                        <div class="footer__widget footer__widget-11 mb-50 footer-col-11-1">
                            <div class="footer__logo">
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
                            <div class="footer__widget-content">
                                <div class="footer__info">
                                    <p><?php echo esc_html(get_bloginfo('description')); ?></p>
                                    <div class="footer__social footer__social-11">
                                        <?php
                                        // Social links - você pode adicionar campos personalizados ou usar widgets
                                        ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <?php if (is_active_sidebar('footer-1')) : ?>
                        <div class="col-xxl-2 col-xl-2 col-lg-3 col-md-4 col-sm-6">
                            <?php dynamic_sidebar('footer-1'); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (is_active_sidebar('footer-2')) : ?>
                        <div class="col-xxl-3 col-xl-3 col-lg-3 col-md-3 col-sm-6">
                            <?php dynamic_sidebar('footer-2'); ?>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (is_active_sidebar('footer-3')) : ?>
                        <div class="col-xxl-1 col-xl-1 col-lg-3 col-md-3 col-sm-6">
                            <?php dynamic_sidebar('footer-3'); ?>
                        </div>
                    <?php endif; ?>
                    
                    <div class="col-xxl-3 col-xl-3 col-lg-3 col-md-5 col-sm-6">
                        <div class="footer__widget mb-50 footer-col-11-5">
                            <h3 class="footer__widget-title"><?php esc_html_e('Fale Conosco', 'n1-edicoes'); ?></h3>
                            <div class="footer__widget-content">
                                <p class="footer__text">
                                    <?php esc_html_e('Encontre uma localização próxima a você.', 'n1-edicoes'); ?>
                                </p>
                                <div class="footer__contact">
                                    <div class="footer__contact-mail">
                                        <span>
                                            <a href="mailto:<?php echo esc_attr(get_option('admin_email')); ?>">
                                                <?php echo esc_html(get_option('admin_email')); ?>
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer__bottom">
            <div class="container">
                <div class="footer__bottom-inner">
                    <div class="row">
                        <div class="col-sm-6">
                            <div class="footer__copyright">
                                <p>&copy; <?php echo date('Y'); ?> <?php echo esc_html(get_bloginfo('name')); ?>. <?php esc_html_e('Todos os direitos reservados.', 'n1-edicoes'); ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>


