(function ($) {
    "use strict";
    var windowOn = $(window);

    /*-----------------------------------------------------------------------------------
        Template Name: Delish – Restaurant & Cafe Bootstrap HTML5 Template
        Author: RRDevs
        Support: https://support.rrdevs.net
        Description: Delish – Restaurant & Cafe Bootstrap HTML5 Template.
        Version: 1.0
        Developer: Sabbir Ahmmed (https://github.com/ahmmedsabbirbd)
    -----------------------------------------------------------------------------------

     */
   /*======================================
   Data Css js
   ========================================*/
    $("[data-background]").each(function() {
        $(this).css(
            "background-image",
            "url( " + $(this).attr("data-background") + "  )"
        );
    });

    $("[data-width]").each(function() {
        $(this).css("width", $(this).attr("data-width"));
    });

    // prelaoder
    let span = $('.letter'),
    tlSmell = new TimelineMax({repeat : -1});
    tlSmell
    .staggerFromTo($('svg .smell'), 3, {y: 50, autoAlpha: 0.5}, {y: -20, autoAlpha: 1}, 1);
    TweenMax.fromTo($('svg #body'), 3, {x: -1, repeat : -1, yoyo : true}, {x: 1, repeat : -1, yoyo : true});

    class GSAPAnimation {
        static Init() {
            /*title-animation*/
            $('.title-animation').length && this.sectionTitleAnimation('.title-animation'); 
        }
        
        static sectionTitleAnimation(activeClass) {
            let sectionTitleLines = gsap.utils.toArray(activeClass);

            sectionTitleLines.forEach(sectionTextLine => {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionTextLine,
                        start: 'top 90%',
                        end: 'bottom 60%',
                        scrub: false,
                        markers: false,
                        toggleActions: 'play none none none'
                    }
                });

                const itemSplitted = new SplitText(sectionTextLine, { type: "split, line" });
                gsap.set(sectionTextLine, { perspective: 100 });
                itemSplitted.split({ type: "words" })
                tl.from(itemSplitted.words, {
                    opacity: 0, 
                    autoAlpha: 0, 
                    transformOrigin: "top center -50",
                    y: "100px",
                    duration: 1.6,
                    stagger: 0.2,
                    ease: "power2.out",
                });
            });
        }
    }

    class RRDEVS {
        static LoadedAfter() {
            $('#preloader').delay(1).fadeOut(0);

            $('.odometer').waypoint(function(direction) {
                if (direction === 'down') {
                    let countNumber = $(this.element).attr("data-count");
                    $(this.element).html(countNumber);
                }
            }, {
                offset: '80%'
            });

            /*Wow Js*/
            if ($('.wow').length) {
                var wow = new WOW({
                    boxClass: 'wow',
                    animateClass: 'animated',
                    offset: 0,
                    mobile: false,
                    live: true
                });
                wow.init();
            }

            /*GSAPAnimation*/
            GSAPAnimation.Init();
        }
    }

    /*======================================
      Preloader activation
      ========================================*/
    $(window).on('load', RRDEVS.LoadedAfter);
    $(".preloader-close").on("click",  RRDEVS.LoadedAfter)

    window.addEventListener('resize', function() {
        gsap.globalTimeline.clear();
    });

    /*======================================
      Mobile Menu Js
      ========================================*/
    $("#mobile-menu").meanmenu({
        meanMenuContainer: ".mobile-menu",
        meanScreenWidth: "1199",
        meanExpand: ['<i class="fa-regular fa-angle-right"></i>'],
    });

    /*======================================
      Sidebar Toggle
      ========================================*/
    $(".offcanvas__close,.offcanvas__overlay").on("click", function () {
        $(".offcanvas__area").removeClass("info-open");
        $(".offcanvas__overlay").removeClass("overlay-open");
    });
    // Scroll to bottom then close navbar
    $(window).scroll(function(){
        if($("body").scrollTop() > 0 || $("html").scrollTop() > 0) {
            $(".offcanvas__area").removeClass("info-open");
            $(".offcanvas__overlay").removeClass("overlay-open");
        }
    });
    $(".sidebar__toggle").on("click", function () {
        $(".offcanvas__area").addClass("info-open");
        $(".offcanvas__overlay").addClass("overlay-open");
    });

    /*======================================
      Body overlay Js
      ========================================*/
    $(".body-overlay").on("click", function () {
        $(".offcanvas__area").removeClass("opened");
        $(".body-overlay").removeClass("opened");
    });

    /*======================================
      Sticky Header Js
      ========================================*/
    $(window).scroll(function () {
        if ($(this).scrollTop() > 10) {
            $("#header-sticky").addClass("rr-sticky");
        } else {
            $("#header-sticky").removeClass("rr-sticky");
        }
    });

    /*======================================
      MagnificPopup image view
      ========================================*/
    $(".popup-image").magnificPopup({
        type: "image",
        gallery: {
            enabled: true,
        },
    });

    /*======================================
      MagnificPopup video view
      ========================================*/
    $(".popup-video").magnificPopup({
        type: "iframe",
    });

    /*======================================
      Page Scroll Percentage
      ========================================*/
    const scrollTopPercentage = ()=> {
        const scrollPercentage = () => {
            const scrollTopPos = document.documentElement.scrollTop;
            const calcHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollValue = Math.round((scrollTopPos / calcHeight) * 100);
            const scrollElementWrap = $("#scroll-percentage");

            scrollElementWrap.css("background", `conic-gradient( var(--rr-theme-primary) ${scrollValue}%, var(--rr-theme-secondary) ${scrollValue}%)`);

            if ( scrollTopPos > 100 ) {
                scrollElementWrap.addClass("active");
            } else {
                scrollElementWrap.removeClass("active");
            }

            if( scrollValue < 96 ) {
                $("#scroll-percentage-value").text(`${scrollValue}%`);
            } else {
                $("#scroll-percentage-value").html('<i class="fa-solid fa-angle-up"></i>');
            }
        }
        window.onscroll = scrollPercentage;
        window.onload = scrollPercentage;

        // Back to Top
        function scrollToTop() {
            document.documentElement.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }

        $("#scroll-percentage").on("click", scrollToTop);
    }
    scrollTopPercentage();

    /*======================================
	One Page Scroll Js
	========================================*/
    var link = $('.onepagenav #mobile-menu ul li a, .onepagenav .mean-nav ul li a');
    link.on('click', function(e) {
        var target = $($(this).attr('href'));
        $('html, body').animate({
            scrollTop: target.offset().top - 76
        }, 600);
        $(this).parent().addClass('active');
        e.preventDefault();
    });
    $(window).on('scroll', function(){
        scrNav();
    });

    function scrNav() {
        var sTop = $(window).scrollTop();
        $('section').each(function() {
            var id = $(this).attr('id'),
                offset = $(this).offset().top-1,
                height = $(this).height();
            if(sTop >= offset && sTop < offset + height) {
                link.parent().removeClass('active');
                $('.main-menu').find('[href="#' + id + '"]').parent().addClass('active');
            }
        });
    }
    scrNav();

    /*======================================
	Smoth animatio Js
	========================================*/
    $(document).on('click', '.smoth-animation', function (event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: $($.attr(this, 'href')).offset().top - 50
        }, 300);
    });

    /*testimonial__slider***/
    let testimonial__slider = new Swiper(".testimonial__slider", {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        navigation: {
            prevEl: ".testimonial__slider__arrow-prev",
            nextEl: ".testimonial__slider__arrow-next",
        },
        clickable: true,
        autoplay: {
            delay: 3000,
        }
    });

    /*client-testimonial__slider***/
    let clienttestimonial__slider = new Swiper(".client-testimonial__slider", {
        slidesPerView: 2,
        spaceBetween: 60,
        loop: true,
        clickable: true,
        autoplay: {
            delay: 3000,
        },
        breakpoints: {
            992: {
                slidesPerView: 2,
            },
            0: {
                slidesPerView: 1,
            },
        }
    });


    $('.reservation__select select, .shop__input-select select, .checkout-form__item-input-select select').niceSelect();
    $( "#datepicker" ).datepicker({
        dateFormat: "y-mm-dd"
    });

    $(".search-open-btn").on("click", function () {
        $(".search__popup").addClass("search-opened");
    });

    $(".search-close-btn").on("click", function () {
        $(".search__popup").removeClass("search-opened");
    });

    if ($(".count-bar").length) {
        $(".count-bar").appear(
            function() {
                var el = $(this);
                var percent = el.data("percent");
                $(el).css("width", percent).addClass("counted");
            }, {
                accY: -50
            }
        );
    }

    $('.grid').imagesLoaded(function () {
        var $grid = $('.grid').isotope({
            itemSelector: '.grid-item',
            layoutMode: 'fitRows'
        });

        $('.masonary-menu').on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');
            $grid.isotope({ filter: filterValue });
        });
        $('.masonary-menu button').on('click', function (event) {
            $(this).siblings('.active').removeClass('active');
            $(this).addClass('active');
            event.preventDefault();
        });
    });

    function lastNobullet() {
        $(".last_no_bullet ul").each(function() {
            var $listItems = $(this).find("li");

            if ($listItems.length > 1) {
                $listItems.last().addClass("no_bullet");
            }
        });
    }

    lastNobullet();

    $(window).resize(function() {
        lastNobullet();
    });

    function handleQuantityButtons() {
        $('.product__quantity__group .minus').click(function() {
            var input = $(this).closest('.product__quantity__group').find('input.qty');
            var currentValue = parseInt(input.val());
            if (currentValue > 1) {
                input.val(currentValue - 1).change();
            }
        });

        $('.product__quantity__group .plus').click(function() {
            var input = $(this).closest('.product__quantity__group').find('input.qty');
            var currentValue = parseInt(input.val());
            input.val(currentValue + 1).change();
        });
    }

    handleQuantityButtons();

    function handleServiceQuantityButtons() {
        $('.shop-details__quantity-group .minus').click(function() {
            var input = $(this).closest('.shop-details__quantity-group').find('input.qty');
            var currentValue = parseInt(input.val());
            if (currentValue > 1) {
                input.val(currentValue - 1).change();
            }
        });
        $('.shop-details__quantity-group .plus').click(function() {
            var input = $(this).closest('.shop-details__quantity-group').find('input.qty');
            var currentValue = parseInt(input.val());
            input.val(currentValue + 1).change();
        });
    }
    handleServiceQuantityButtons();

    $('#showlogin').on('click', function () {
        $('#checkout-login').slideToggle(400);
    });
    $('#showcoupon').on('click', function () {
        $('#checkout_coupon').slideToggle(400);
    });

    $('#contact-us-message__form').submit(function(event) {
        event.preventDefault();
        var form = $(this);
        var valid = true;

        form.find('.error-message').remove();
        form.find('.success-message').remove();

        form.find('input, textarea, select').each(function() {
            if ($(this).val().trim() === '') {
                valid = false;
                $(this).parent().after('<p class="error-message  mt-3 mb-0">This field is required.</p>');
            }
        });

        if (!valid) {
            return;
        }

        $('.loading-form').show();

        setTimeout(function() {
            $.ajax({
                type: form.attr('method'),
                url: form.attr('action'),
                data: form.serialize()
            }).done(function(data) {
                $('.loading-form').hide();
                form.append('<p class="success-message mt-3 mb-0">Your message has been sent successfully.</p>');
            }).fail(function(data) {
                $('.loading-form').hide();
                form.append('<p class="error-message mt-3 mb-0">Something went wrong. Please try again later.</p>');
            });
        }, 1000);
    });

    //button animation
   // ----------------------------------------------------------------------------

    // Button Effect
    var buttons = document.querySelectorAll('.default-btn, .hover-anim');
    const btnCheck = document.getElementsByClassName('hover-anim').length > 0;
    if (btnCheck) {
        buttons.forEach(function (button) {
            button?.addEventListener('mouseenter', function (e) {
                var parentOffset = this.getBoundingClientRect(),
                    relX = e.clientX - parentOffset.left,
                    relY = e.clientY - parentOffset.top;
                if (this.querySelector('.hover-bg')) {
                    this.querySelector('.hover-bg').style.top = relY + 'px';
                    this.querySelector('.hover-bg').style.left = relX + 'px';
                }
            });

            button.addEventListener('mouseout', function (e) {
                var parentOffset = this.getBoundingClientRect(),
                    relX = e.clientX - parentOffset.left,
                    relY = e.clientY - parentOffset.top;
                if (this.querySelector('.hover-bg')) {
                    this.querySelector('.hover-bg').style.top = relY + 'px';
                    this.querySelector('.hover-bg').style.left = relX + 'px';
                }
            });
        });
    }
        

    // Helper function to detect mobile devices
    function isMobile() {
        return window.innerWidth <= 768; // Adjust the width as needed
    }

    // Check if we're on a non-mobile device before initializing animations
    if (!isMobile()) {
        // Original animation code goes here

        if ($(".fade-wrapper").length > 0) {
            $(".fade-wrapper").each(function () {
                var section = $(this);
                var fadeItems = section.find(".fade-top");
        
                fadeItems.each(function (index, element) {
                    var delay = index * 0.15;
        
                    gsap.set(element, {
                        opacity: 0,
                        y: 100,
                    });
        
                    ScrollTrigger.create({
                        trigger: element,
                        start: "top 100%",
                        end: "bottom 20%",
                        scrub: 0.5,
                        onEnter: function () {
                        gsap.to(element, {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            delay: delay,
                        });
                    },
                    once: true,
                });
            });
        });
    }

    let typeSplit = new SplitType("[data-text-animation]", {
        types: "lines,words, chars",
        className: "line",
    });

    var text_animations = document.querySelectorAll("[data-text-animation]");

    function createScrollTrigger(triggerElement, timeline) {
        ScrollTrigger.create({
            trigger: triggerElement,
            start: "top 80%",
            onEnter: () => timeline.play(),
            toggleClass: { targets: triggerElement, className: "active" }
        });
        }

        text_animations.forEach((animation) => {
            let type = "slide-up",
                duration = 0.75,
                offset = 10,
                stagger = 0.6,
                delay = 0,
                scroll = 1,
                split = "line",
                ease = "power2.out";

            if (animation.getAttribute("data-stagger")) stagger = animation.getAttribute("data-stagger");
            if (animation.getAttribute("data-duration")) duration = animation.getAttribute("data-duration");
            if (animation.getAttribute("data-text-animation")) type = animation.getAttribute("data-text-animation");
            if (animation.getAttribute("data-delay")) delay = animation.getAttribute("data-delay");
            if (animation.getAttribute("data-ease")) ease = animation.getAttribute("data-ease");
            if (animation.getAttribute("data-scroll")) scroll = animation.getAttribute("data-scroll");
            if (animation.getAttribute("data-offset")) offset = animation.getAttribute("data-offset");
            if (animation.getAttribute("data-split")) split = animation.getAttribute("data-split");

            if (scroll == 1) {
                let tl = gsap.timeline({ paused: true });
                switch (type) {
                    case "slide-up":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            yPercent: offset,
                            duration,
                            ease,
                            opacity: 0,
                            stagger: { amount: stagger },
                        });
                        break;
                    case "slide-down":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            yPercent: -offset,
                            duration,
                            ease,
                            opacity: 0,
                            stagger: { amount: stagger },
                        });
                        break;
                    case "rotate-in":
                        tl.set(animation.querySelectorAll(`.${split}`), { transformPerspective: 400 });
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            rotationX: -offset,
                            duration,
                            ease,
                            force3D: true,
                            opacity: 0,
                            transformOrigin: "top center -50",
                            stagger: { amount: stagger },
                        });
                        break;
                    case "slide-from-left":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            opacity: 0,
                            xPercent: -offset,
                            duration,
                            ease,
                            stagger: { amount: stagger },
                        });
                        break;
                    case "slide-from-right":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            opacity: 0,
                            xPercent: offset,
                            duration,
                            ease,
                            stagger: { amount: stagger },
                        });
                        break;
                    case "fade-in":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            opacity: 0,
                            duration,
                            ease,
                            stagger: { amount: stagger },
                        });
                        break;
                    case "fade-in-right":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            x: 100,
                            autoAlpha: 0,
                            duration,
                            stagger: stagger,
                        });
                        break;
                    case "fade-in-random":
                        tl.from(animation.querySelectorAll(`.${split}`), {
                            opacity: 0,
                            duration,
                            ease,
                            stagger: { amount: stagger, from: "random" },
                        });
                        break;
                    case "scrub":
                        gsap.timeline({
                            scrollTrigger: {
                                trigger: animation,
                                start: "top 90%",
                                end: "top center",
                                scrub: true,
                            },
                        }).from(animation.querySelectorAll(`.${split}`), {
                            opacity: 0.2,
                            duration,
                            ease,
                            stagger: { amount: stagger },
                        });
                        break;
                }

                createScrollTrigger(animation, tl);
            }
        });

        function textAnimationEffect() {
            let TextAnim = gsap.timeline();
            let splitText = new SplitType(".text-animation-effect", { types: "chars" });
            if ($('.text-animation-effect .char').length) {
                TextAnim.from(".text-animation-effect .char", {
                    duration: 1,
                    x: 100,
                    autoAlpha: 0,
                    stagger: 0.1
                }, "-=1");
            }
        }

        window.addEventListener("load", textAnimationEffect);
    }


    let testimonial__slider_active = new Swiper(".testimonial__slider-active", {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        clickable: true,
        pagination: {
            el: ".testimonial__slider-dot",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
        },
    });

    let expert_chef__slider_active = new Swiper(".expert-chef__slider-active", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop: false,
        clickable: true,
        autoplay: {
            delay: 3000,
        },
        pagination: {
            el: ".expert-chef__slider-dot",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
        },
        breakpoints: {
            1200: {
                slidesPerView: 3,
            },
            992: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 2,
            },
            0: {
                slidesPerView: 1,
            },
        }
    });



    /*banner-2__slider***/
    let banner_2__slider = new Swiper(".banner-2__slider", {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        centeredSlides: true,
        clickable: true,
        autoplay: {
            delay: 3000,
        },
        navigation: {
            prevEl: ".banner-2__slider__arrow-prev",
            nextEl: ".banner-2__slider__arrow-next",
        }
    });

    /*client-testimonial__active***/
    let client_testimonial__active = new Swiper(".client-testimonial__active", {
        slidesPerView: 1,
        loop: true,
        centeredSlides: true,
        clickable: true,
        autoplay: true,
        autoplay: {
            delay: 3000,
        },
        navigation: {
            prevEl: ".client-testimonial__slider__arrow-prev",
            nextEl: ".client-testimonial__slider__arrow-next",
        }
    });

    /*======================================
    our-collections__active
    ========================================*/
    let our_collections__active = new Swiper(".our-collections__active", {
        loop: true,
        slidesPerView: 4,
        spaceBetween: 30,
        pagination: {
            el: ".our-collections__slider-dot",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
        },
        breakpoints: {
            1200: {
                slidesPerView: 4,
            },
            768: {
                slidesPerView: 2,
            },
            575: {
                slidesPerView: 1,
            },
            0: {
                slidesPerView: 1,
            },
        },
    });

    /*======================================
    our-collections__active
    ========================================*/
    let blog_2__active = new Swiper(".blog-2__active", {
        loop: true,
        slidesPerView: 3,
        spaceBetween: 30,
        pagination: {
            el: ".blog-2__slider-dot",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
        },
        breakpoints: {
            1200: {
                slidesPerView: 3,
            },
            768: {
                slidesPerView: 2,
            },
            575: {
                slidesPerView: 1,
            },
            0: {
                slidesPerView: 1,
            },
        },
    });
    
    /*======================================
    featured-product__active
    ========================================*/
    let featured_product__active = new Swiper(".featured-product__active", {
        loop: true,
        slidesPerView: 4,
        spaceBetween: 30,
        pagination: {
            el: ".featured-product__slider-dot",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
        },
        breakpoints: {
            1200: {
                slidesPerView: 4,
            },
            768: {
                slidesPerView: 2,
            },
            575: {
                slidesPerView: 1,
            },
            0: {
                slidesPerView: 1,
            },
        },
    });


    let instagramwiper = new Swiper('.rr-instagram-active', {
        // Optional parameters
        loop: true,
        slidesPerView: 6,
        autoplay: true,
        spaceBetween: 10,
        breakpoints: {
            '1400': {
                slidesPerView: 6,
            },
            '1200': {
                slidesPerView: 4,
            },
            '992': {
                slidesPerView: 3,
            },
            '768': {
                slidesPerView: 3,
            },
            '576': {
                slidesPerView: 2,
            },
            '0': {
                slidesPerView: 1,
            },

        },
    });

    let food_list__slider = new Swiper('.food-list__slider', {
        // Optional parameters
        loop: true,
        slidesPerView: 6,
        autoplay: true,
        spaceBetween: 0,
        navigation: {
            prevEl: ".food-list__slider__arrow-prev",
            nextEl: ".food-list__slider__arrow-next",
        },
        breakpoints: {
            '1400': {
                slidesPerView: 6,
            },
            '1200': {
                slidesPerView: 4,
            },
            '992': {
                slidesPerView: 3,
            },
            '768': {
                slidesPerView: 3,
            },
            '576': {
                slidesPerView: 2,
            },
            '0': {
                slidesPerView: 1,
            },

        },
    });

    var slider = new Swiper ('.gallery-slider', {
        slidesPerView: 1,
        autoplay: true,
        loop: true,
        loopedSlides: 6,
        navigation: {
            nextEl: '.client-testimonial-2__slider__arrow-prev',
            prevEl: '.client-testimonial-2__slider__arrow-next',
        },
    });

    var thumbs = new Swiper ('.gallery-thumbs', {
        slidesPerView: 3,
        spaceBetween: 10,
        centeredSlides: true,
        loop: true,
        slideToClickedSlide: true,
    });

    slider.controller.control = thumbs;
    thumbs.controller.control = slider;


    $(document).ready(function () {
        let pause = false;
        const items = $('.select-item');
        const blocks = $('.bg-block');
        let currentIndex = 0;
      
        // Interval function to cycle through items and blocks
        const cycleItems = setInterval(function () {
          if (!pause) {
            items.removeClass('active');
            blocks.removeClass('active');
      
            items.eq(currentIndex).addClass('active');
            blocks.eq(currentIndex).addClass('active');
      
            currentIndex = (currentIndex + 1) % blocks.length; // Cycle back to 0 when end is reached
          }
        }, 3500);
      
        // Hover event to pause and show active state
        items.hover(
          function () {
            pause = true; // Pause cycling on hover
            const index = $(this).index();
      
            items.removeClass('active');
            blocks.removeClass('active');
      
            $(this).addClass('active');
            blocks.eq(index).addClass('active');
          },
          function () {
            pause = false; // Resume cycling after hover ends
          }
        );
      });
      

    /*blog-4__item__thumb-slider***/
    let blog4ItemThumbSlider = new Swiper(".blog-4__item__thumb-slider", {
        slidesPerView: 1,
        loop: true,
        autoplay: {
            delay: 3000,
        },
        navigation: {
            prevEl: ".blog-4__item__thumb-slider__arrow-prev",
            nextEl: ".blog-4__item__thumb-slider__arrow-next",
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
        },
    });


})(jQuery);

