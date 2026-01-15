/**
 * Main JavaScript for N-1 Edições Theme
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // Offcanvas Menu Toggle
        $('.offcanvas-open-btn').on('click', function() {
            $('body').toggleClass('offcanvas-open');
        });
        
        // Close offcanvas when clicking outside
        $(document).on('click', function(e) {
            if ($(e.target).closest('.offcanvas-open-btn, .offcanvas').length === 0) {
                $('body').removeClass('offcanvas-open');
            }
        });
        
        // Initialize Nice Select
        if (typeof $.fn.niceSelect !== 'undefined') {
            $('select').niceSelect();
        }
        
        // Header Sticky
        var header = $('#header-sticky');
        if (header.length) {
            $(window).on('scroll', function() {
                if ($(window).scrollTop() > 100) {
                    header.addClass('header-sticky');
                } else {
                    header.removeClass('header-sticky');
                }
            });
        }
        
        // Smooth Scroll
        $('a[href*="#"]:not([href="#"])').on('click', function() {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                if (target.length) {
                    $('html, body').animate({
                        scrollTop: target.offset().top - 100
                    }, 1000);
                    return false;
                }
            }
        });
        
        // Back to Top
        var backToTop = $('.back-to-top');
        if (backToTop.length) {
            $(window).on('scroll', function() {
                if ($(window).scrollTop() > 300) {
                    backToTop.fadeIn();
                } else {
                    backToTop.fadeOut();
                }
            });
            
            backToTop.on('click', function() {
                $('html, body').animate({scrollTop: 0}, 800);
                return false;
            });
        }
        
        // Product Quick View (se implementado)
        $('.product-action-btn').on('click', function(e) {
            e.preventDefault();
            // Implementar quick view se necessário
        });
        
        // Initialize Slick Carousel
        if (typeof $.fn.slick !== 'undefined') {
            $('.product-slider').slick({
                dots: true,
                infinite: true,
                speed: 300,
                slidesToShow: 1,
                adaptiveHeight: true
            });
        }
        
        // Initialize Swiper
        if (typeof Swiper !== 'undefined') {
            var swiper = new Swiper('.swiper-container', {
                slidesPerView: 1,
                spaceBetween: 30,
                loop: true,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
            });
        }
        
    });
    
    // Window Load
    $(window).on('load', function() {
        // Remove preloader se existir
        $('.preloader').fadeOut();
    });
    
})(jQuery);


