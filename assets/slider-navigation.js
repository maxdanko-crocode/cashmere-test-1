class SliderNavigation {
    constructor(swiper) {
        this.swiper = swiper;

        if(!this.swiper) return;

        this.buttonNext = this.swiper.navigation.nextEl;
        this.buttonPrev = this.swiper.navigation.prevEl;
        this.pagination = this.swiper.pagination.el;

        this.init();
    }

    init() {
        if (this.swiper.slides[0]) {
            this.swiper.slides[0].classList.add("active");
        }

        const activeSlide = this.swiper.el.querySelector(".active");

        if(!activeSlide) return;

        const activeSlideIndex = +activeSlide.getAttribute("data-swiper-slide-index");

        new SlideSelection(this.swiper.slides[activeSlideIndex]);

        this.checkButtons();

        this.buttonPrev.addEventListener("click", () => {
            const activeSlide = this.swiper.el.querySelector(".active");

            if(!activeSlide) return;

            const activeSlideIndex = parseInt(activeSlide.getAttribute("data-swiper-slide-index"));
            const prevSlideIndex = activeSlideIndex - 1;
        
            if (activeSlideIndex > 0) {
                this.swiper.slideTo(prevSlideIndex);
                this.swiper.slides[activeSlideIndex].classList.remove("active");
                new SlideSelection(this.swiper.slides[prevSlideIndex])
                this.swiper.slides[prevSlideIndex].classList.add("active");
            }
        
            this.checkButtons();
        })
        
        this.buttonNext.addEventListener("click", () => {
            const activeSlide = this.swiper.el.querySelector(".active");

            if(!activeSlide) return;

            const activeSlideIndex = parseInt(activeSlide.getAttribute("data-swiper-slide-index"));
            const nextSlideIndex = activeSlideIndex + 1;
        
            if (this.swiper.slides.length > nextSlideIndex) {
                this.swiper.slideTo(nextSlideIndex);
                this.swiper.slides[activeSlideIndex].classList.remove("active");

                new SlideSelection(this.swiper.slides[nextSlideIndex]);
                
                this.swiper.slides[nextSlideIndex].classList.add("active");
            }
        
            this.checkButtons();
        });
        
        document.addEventListener("swiper-navigation:update", () => {
            this.checkButtons();
        });
    }

    disableButton(button, disable) {
        if (disable === true) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    }

    checkButtons() {
        if (this.swiper.slides.length < 2) {
            this.buttonPrev.classList.add("hidden");
            this.buttonNext.classList.add("hidden");
            this.buttonPrev.setAttribute("tabindex", -1);
            this.buttonNext.setAttribute("tabindex", -1);

            if (this.pagination) {
                this.pagination.classList.add('hidden');
            }

        } else {
            this.buttonPrev.classList.remove("hidden");
            this.buttonNext.classList.remove("hidden");
            this.buttonPrev.removeAttribute("tabindex");
            this.buttonNext.removeAttribute("tabindex");

            if (this.pagination) {
                this.pagination.classList.remove('hidden');
            }
        }

        if (this.swiper.slides[0]) {
            if (this.swiper.slides[0].classList.contains("active")) {
                this.disableButton(this.buttonPrev, true);
            } else {
                this.disableButton(this.buttonPrev, false);
            }
        }

        if (this.swiper.slides[this.swiper.slides.length - 1]) {
            if (this.swiper.slides[this.swiper.slides.length - 1].classList.contains("active")) {
                this.disableButton(this.buttonNext, true);
            } else {
                this.disableButton(this.buttonNext, false);
            }
        }
    }
}