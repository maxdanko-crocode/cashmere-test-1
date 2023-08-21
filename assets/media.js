class Media {
    constructor(container) {
        this.container = container;

        if(!this.container) return;

        this.buttons = this.container.querySelectorAll("[data-media-button-play]");

        this.initMedia();
    }

    initMedia() {
        const buttons = this.container.querySelectorAll("[data-media-button-play]");
        
        buttons.forEach(button => {
            if (button.classList.contains("hidden")) {
                button.classList.remove("hidden");
            }

            button.addEventListener("click", () => {
                const content = document.createElement("div");
                const mediaWrapper = button.closest("[data-media]");
                const template = mediaWrapper.querySelector("[data-media-template]");

                content.appendChild(
                    template.content.firstElementChild.cloneNode(true)
                );

                if (content.querySelector("[data-media-content]")) {
                    const media = content.querySelector("[data-media-content]");

                    mediaWrapper.appendChild(media);

                    if (!button.classList.contains("hidden")) {
                        button.classList.add("hidden");
                    }
                }
            })
        });
    }

    resetMedia() {
        const buttons = this.container.querySelectorAll("[data-media-button-play]");
        
        buttons.forEach(button => {
            const mediaWrapper = button.closest("[data-media]");
            
            if (mediaWrapper.querySelector("[data-media-content]")) {
                const mediaList = mediaWrapper.querySelectorAll("[data-media-content]");

                mediaList.forEach(media => {
                    media.remove();
                })
            }

            if (button.classList.contains("hidden")) {
                button.classList.remove("hidden");
            }
        })
    }
}