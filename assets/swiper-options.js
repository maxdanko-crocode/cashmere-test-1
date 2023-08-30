const swiperOptions = [
    {
        name: "cart-product-slider",
        options: {
            loop: false,
            direction: "horizontal",
            mousewheel: true
        }
    },
    {
        name: "main-product-slider",
        options: {
            loop: false,
            direction: "horizontal",
            on: {
                init: (swiper) => {
                    new SliderNavigation(swiper);

                    const slideOnClick = (e) => {
                        if (e.target.closest("[data-swiper-slide-index]")) {
                            const activeSlide = e.target;
                            const activeSlideIndex = parseInt(activeSlide.getAttribute("data-swiper-slide-index"));
                            swiper.slideTo(parseInt(activeSlide.getAttribute("data-swiper-slide-index")));
                            swiper.slides.forEach(slide => {
                                slide.classList.remove("active");
                            });
                            activeSlide.classList.add("active");
                            new SlideSelection(swiper.slides[activeSlideIndex]);
                            document.dispatchEvent(new CustomEvent("swiper-navigation:update"));
                        }
                    } 

                    swiper.el.addEventListener("click", slideOnClick);

                    const formId = swiper.el.getAttribute("data-form-id");
                    const form = document.forms[formId];

                    if(!form) return;

                    form.addEventListener("variant:changed", (e) => {
                        if (e.detail.variant && e.detail.variant.featured_media) {
                            const imageId = e.detail.variant.featured_media.id;
                            const activeSlide = [...swiper.slides].find((slide) => {
                                const slideImageId = slide.getAttribute("data-media-id");
                                if (!slideImageId) return false;
                                return (parseInt(slideImageId) === imageId);
                            });

                            if (activeSlide) {
                                const activeSlideIndex = parseInt(activeSlide.getAttribute("data-swiper-slide-index"));
                                swiper.slideTo(activeSlideIndex);
                                
                                swiper.slides.forEach(slide => {
                                    slide.classList.remove("active");
                                });
                                activeSlide.classList.add("active");
                                document.dispatchEvent(new CustomEvent("swiper-navigation:update"));
                                new SlideSelection(swiper.slides[activeSlideIndex]);
                            }
                        }
                    });

                    new Media(swiper.el);
                }, 

                resize: (swiper) => {
                    new Media(swiper.el).resetMedia();
                    document.dispatchEvent(new CustomEvent("swiper-navigation:update"));
                },

                slideChange: (swiper) => {
                    new Media(swiper.el).resetMedia();
                },
            }
        }
    }
]