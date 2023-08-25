class ModalContainer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.targetId = this.getAttribute("data-modal-id");

        this.addEventListener("click", (event) => {
            const eventTarget = event.target;

            if (eventTarget.closest("[data-modal-close-button]") || eventTarget.closest("[data-modal-backdrop]")) {
                this.showModal(false);
            }
        })

        document.addEventListener("modals:open", (event) => {
            const modalId = event.detail.modalId;
            const recommendations = this.querySelector("[data-sidebar-recommendations]");

            if(this.targetId === modalId) {
                this.showModal(true);
            }
            
            if (recommendations) {
                if (!recommendations.classList.contains("move-left")) {
                    setTimeout(() => {
                        recommendations.classList.add("move-left")
                    }, 300)
                }
            }
        })

        document.addEventListener("modals:close", (event) => {
            const modalId = event.detail.modalId;

            if(this.targetId === modalId) {
                this.showModal(false);
            }
        })

        window.addEventListener("resize", () => {
            this.showModal(false);
        });

        document.addEventListener("keyup", (event) => event.code.toUpperCase() === 'ESCAPE' && this.showModal(false));
    }

    showModal(show) {
        this.shopifySectionWrapper = this.closest(".shopify-section");

        if (!this.shopifySectionWrapper) return;

        this.modalElement = this.shopifySectionWrapper.querySelector(`[data-modal-id=${this.targetId}]`);
        this.closeButton = this.querySelector("[data-modal-close-button]");
        this.backDropElement = this.querySelector("[data-modal-backdrop]");

        if (show === true) {
            if (!this.modalElement.classList.contains("show")) {
                this.modalElement.classList.add("show");
            }

            new OverflowSwitcher();
            new FocusTrap(this.modalElement);
            this.closeButton.focus();
        } else {
            if (this.modalElement.classList.contains("show")) {
                this.modalElement.classList.remove("show");
            }

            new OverflowSwitcher();
        }
    }
}

if(!window.customElements.get("modal-container")) {
    window.customElements.define("modal-container", ModalContainer);
}

class ButtonOpenModal extends HTMLElement {
    constructor() {
        super();
    }
  
    connectedCallback() {
        this.addEventListener("click", (event) => {
            const eventTarget = event.target;
    
            if (eventTarget.closest("[data-modal-open-button]")) {
                this.modalId = eventTarget.getAttribute("data-modal-open-button");
    
                document.dispatchEvent(new CustomEvent("modals:open", {
                    detail: {
                        modalId: this.modalId
                    }
                }))
            }
        })
    }
}
  
if (!window.customElements.get("button-open-modal")) {
    customElements.define("button-open-modal", ButtonOpenModal)
}