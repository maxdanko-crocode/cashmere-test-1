class OverflowSwitcher {
	constructor(show) {
		this.show = show;
		this.isOpen = false;
		this.init();
	}

	init() {
		this.isOpen = this.modalIsOpen();
		this.overflowSwitcher(this.isOpen);
	}

	modalIsOpen() {
		const modalList = document.querySelectorAll("[data-modal-oveflow]");
		const array = [];
		if (modalList) {
			modalList.forEach((item) => {
				if (item && (item.classList.contains("show") || item.checked === true || item.hasAttribute("open"))) {
					array.push(true);
				}
			});

			return array.includes(true);
		}
	}

	overflowSwitcher(isOpen) {
		document.documentElement.style.overflow = isOpen ? "hidden" : "";
		document.body.style.overflow = isOpen ? "hidden" : "";

		if (this.show && this.show === true) {
			document.documentElement.style.overflow = "";
			document.body.style.overflow = "";
		}
	}
}