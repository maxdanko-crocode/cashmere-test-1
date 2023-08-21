class SlideSelection {
    constructor(activeElement) {
        this.activeElement = activeElement;

        if (!this.activeElement) return;

        this.setInnerHtml();
    }

    setInnerHtml() {
        const targetElement = this.activeElement.closest("[data-selection-container]").querySelector("[data-selection-target-element]");

        if (targetElement) {
            targetElement.classList.add("hidden");

            const isOuterContainer = this.activeElement.getAttribute("data-outer-container");

            if (isOuterContainer && isOuterContainer === "true") {
                targetElement.innerHTML = this.activeElement.firstElementChild.innerHTML;
            } else {
                targetElement.innerHTML = this.activeElement.innerHTML;
            }

            new Media(targetElement);

            targetElement.querySelectorAll("[data-media-button-play]").forEach(button => button.removeAttribute("tabindex"));

            const debouncedOnSlide = debounce(() => {
                targetElement.classList.remove("hidden");
            }, 300)
            
            debouncedOnSlide();
        }
    }
}