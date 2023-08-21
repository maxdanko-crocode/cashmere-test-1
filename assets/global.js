function debounce(fn, wait) {
  let t;
  return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function extractSectionId(element) {
    element = element.classList.contains("shopify-section") ? element : element.closest(".shopify-section");
    return element.id.replace("shopify-section-", "");
}

function formatMoney(cents, format) {
    if (typeof cents === 'string') {
        cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number) {
        var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
        var thousands = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ',';
        var decimal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '.';

        if (isNaN(number) || number == null) {
            return 0;
        }

        number = (number / 100.0).toFixed(precision);

        var parts = number.split('.');
        var dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
        var centsAmount = parts[1] ? decimal + parts[1] : '';

        return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
        case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
        case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
        case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
    }

    return formatString.replace(placeholderRegex, value);
}

function getUrlWithVariant(url, id) {
    if (/variant=/.test(url)) {
        return url.replace(/(variant=)[^&]+/, '$1' + id);
    } else if (/\?/.test(url)) {
        return url.concat('&variant=').concat(id);
    }

    return url.concat('?variant=').concat(id);
}

class SliderComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.sliderContainer = this.querySelector("[data-swiper-element]");
        this.paginationElement = this.querySelector("[data-swiper-pagination-element]");
        this.buttonPrevElement = this.querySelector("[data-swiper-button-prev]") || this.closest("section").querySelector("[data-swiper-button-prev]");
        this.buttonNextElement = this.querySelector("[data-swiper-button-next]") || this.closest("section").querySelector("[data-swiper-button-next]");
        this.optionName = this.getAttribute("data-swiper-option-name");

        if (swiperOptions) {
            this.swiperOptionItem = swiperOptions.find((optionItem) => optionItem.name === this.optionName);

            if (this.swiperOptionItem) {
                this.additionalOptions = this.swiperOptionItem.options;
            }
        }
        
        this.options = { 
        slidesPerView: "auto",
        spaceBetween: 0,
        navigation: {
            nextEl: this.buttonNextElement,
            prevEl: this.buttonPrevElement,
        },
        pagination: {
            el: this.paginationElement,
            clickable: true,
            bulletClass: "slider-component__pagination-item",
            bulletActiveClass: "slider-component__pagination-item--active",
            bulletElement: "button"
        },
        ...this.additionalOptions
        }

        if (!this.sliderContainer) return;
        
        new Swiper(this.sliderContainer, this.options);
    }
}

if(!window.customElements.get("slider-component")) {
    window.customElements.define("slider-component", SliderComponent)
}

class RecentlyViewedProducts extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const handleIntersection = (entries, observer) => {
            if (!entries[0].isIntersecting) return;
            this.fetchSection();
            observer.unobserve(this);
        }

        this.addToRecentlyViewedProducts();

        new IntersectionObserver(handleIntersection.bind(this), {
            rootMargin: '0px 0px 300px 0px'
        }).observe(this);
    }
    addToRecentlyViewedProducts() {
        const currentId = +window?.meta?.product?.id;

        if (!this.getCookie("theme:viewed-products")) {
            document.cookie = `theme:viewed-products=`;
        }

        if (!currentId) {
            return;
        }
        const value = `${currentId}`;

        let recentlyViewedItems = [
            value,
            ...this.getRecentlyViewedProducts().filter((item) => {
                return item !== value;
            })
        ];

        document.cookie = `theme:viewed-products=${recentlyViewedItems.join(",")}; path=/`;
    }
    getRecentlyViewedProducts() {
        const currentId = +window?.meta?.product?.id;
        const value = currentId;

        let recentlyViewed = "";

        if (!this.getCookie("theme:viewed-products")) {
            document.cookie = `theme:viewed-products=`;
        } else {
            recentlyViewed = this.getCookie("theme:viewed-products");
        }

        let items = recentlyViewed
            .split(",")
            .filter((item) => {
                return item;
            })
            .map((item) => parseInt(item));

        if (window?.meta?.page.pageType !== "product") {
            return items;
        }
        return items.filter((item) => {
            return item !== value;
        });
    }
    async fetchSection() {
        const items = this.getRecentlyViewedProducts();
        const section = this.closest(".shopify-section")
        let searchQueryString = Array.from(items.values(), (item) => `id:${item}`).join(" OR ");
        let searchQueryUrl = `${window.Shopify.routes.root}search?type=product&q=${searchQueryString}&section_id=${extractSectionId(section)}`
        const response = await fetch(searchQueryUrl, {
            priority: "low"
        });
        const responseBody = await response.text();
        const tempDiv = new DOMParser().parseFromString(responseBody, "text/html")
        const recentlyViewedProductsElement = tempDiv.querySelector("recently-viewed-products");
        
        if (recentlyViewedProductsElement.childElementCount > 0) {
            this.replaceChildren(...document.importNode(recentlyViewedProductsElement, true).childNodes);
        } else {
            section.remove();
        }
    }
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
}

if (!customElements.get("recently-viewed-products")) {
    customElements.define('recently-viewed-products', RecentlyViewedProducts);
}

class ProductRecommendations extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const section = this.closest(".shopify-section");

        const handleIntersection = (entries, observer) => {
            if (!entries[0].isIntersecting) return;
            observer.unobserve(this);

            fetch(this.dataset.url)
                .then(response => response.text())
                .then(text => {
                    const html = document.createElement('div');
                    html.innerHTML = text;
                    const recommendations = html.querySelector('product-recommendations');
                    if (recommendations && recommendations.innerHTML.trim().length) {
                        this.innerHTML = recommendations.innerHTML;

                        if (section && section.classList.contains("hidden")) {
                            section.classList.remove("hidden");
                        }
                    } else {
                        if (section && !section.classList.contains("hidden")) {
                            section.classList.add("hidden");
                        }
                    }
                })
                .catch(e => {
                    console.error(e);
                });
        }

        new IntersectionObserver(handleIntersection.bind(this), {
            rootMargin: '0px 0px 300px 0px'
        }).observe(this);
    }
}

if (!customElements.get("product-recommendations")) {
    customElements.define('product-recommendations', ProductRecommendations);
}

async function fetchWithCache(url) {
    const cacheKey = url;

    if (cachedMap.has(cacheKey)) {
        return await (await Promise.resolve(new Response(new Blob([cachedMap.get(cacheKey)])))).text();
    }

  return fetch(url).then((response) => {
        if (response.status === 200) {
            response.clone().text().then((content) => {
                cachedMap.set(cacheKey, content);
            });
            return response.text();
        }
  });
}

class FocusTrap {
    constructor(container) {
        this.container = container;

        if (!this.container) return;

        this.selectors = [
            "summary",
            "a[href]",
            "button:enabled",
            "[tabindex]:not([tabindex^='-'])",
            "[draggable]",
            "area",
            "input:not([type=hidden]):enabled",
            "select:enabled",
            "textarea:enabled",
            "object",
            "iframe"
        ];

        this.init();
    }

    init() {
        document.addEventListener("keydown", (event) => {
            this.tabTrappingKey(event, this.container);
        });
    }

    getAllFocusableElements (parentElem) {
        const nodes = parentElem.querySelectorAll(this.selectors.join(','));
        const filterNegativeTabIndex = [];

        for (let i = 0; i < nodes.length; i++) {
            const tabindexAtr = parseInt(nodes[i].getAttribute('tabindex'), 10);

            if (!tabindexAtr || tabindexAtr > -1) {
                if (!nodes[i].closest(".hidden")) {
                    filterNegativeTabIndex.push(nodes[i])
                }
            }
        }

        return filterNegativeTabIndex
    }

    tabTrappingKey (event, parentElem) {
        const keyCode = event.which || event.keyCode

        if (keyCode !== 9) return

        const elements = this.getAllFocusableElements(parentElem)

        if (event.shiftKey && event.target === elements[0]) {
            elements[0].focus()
            event.preventDefault()
        }  else if (!event.shiftKey && event.target === elements[elements.length - 1]) {
            elements[elements.length - 1].focus()
            event.preventDefault()
        }
    }
}

class MediaModel extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.loadShopifyFeature();
    }

    loadShopifyFeature() {
        window.Shopify.loadFeatures([
            {
                name: "shopify-xr",
                version: "1.0",
                onLoad: this.setupShopifyXr.bind(this)
            },
            {
                name: "model-viewer-ui",
                version: "1.0",
                onLoad: () => {
                    const modelViewer = this.querySelector("model-viewer");

                    new window.Shopify.ModelViewerUI(modelViewer, {
                        focusOnPlay: true
                    })
                }
            }
        ])
    }

    setupShopifyXr() {
        if (!window.ShopifyXR) {
            document.addEventListener("shopify_xr_initialized", this.setupShopifyXr.bind(this));
        } else {
            const section = this.closest(".shopify-section");
            if (!section) {
                return null;
            }
            const models = JSON.parse(section.querySelector("[data-product-object]").innerHTML)["3d_media"];
            window.ShopifyXR.addModels(models);
            window.ShopifyXR.setupXRElements();
        }
    }

    launchXR() {
        const mediaId = parseInt(this.getAttribute("data-media-id"));
        const productTitle = this.getAttribute("data-product-title");

        return {
            model3dId: [mediaId],
            title: productTitle
        }
    }
}

if (!window.customElements.get("media-model")) {
    window.customElements.define("media-model", MediaModel);
}

class VariantSku extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.formId = this.getAttribute("data-form-id-id");
        this.form = document.forms[this.formId];

        if (!this.form) return;

        this.form.addEventListener("variant:changed", (event) => {
            if (event.detail.variant) {
                if (event.detail.variant.sku) {
                    const skuElement = this.querySelector("[data-product-sku]");
                    skuElement.innerHTML = event.detail.variant.sku;

                    if (this.classList.contains("hidden")) {
                        this.classList.remove("hidden")
                    }
                } else {
                    if (this.classList.contains("hidden")) return;

                    this.classList.add("hidden");
                }
            }
        });
    }
}

if (!window.customElements.get("variant-sku")) {
    window.customElements.define("variant-sku", VariantSku)
}

class QuantitySelector extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.formId = this.getAttribute("data-form-id");
        this.form = document.forms[this.formId];
        this.abortController = new AbortController();
        this.inputElement = this.querySelector("quantity-input");
        this.inputFieldElement = this.querySelector("[data-product-quantity-input]")
        this.minusButton = this.querySelector("[data-product-counter-minus]");
        this.plusButton = this.querySelector("[data-product-counter-plus]");

        this.minusButton.addEventListener("click", () => {
            this.inputElement.quantity = this.inputElement.quantity - 1, {
                signal: this.abortController.signal
            }
            this.disableButtons();
        });
        this.plusButton.addEventListener("click", () => {
            this.inputElement.quantity = this.inputElement.quantity + 1, {
                signal: this.abortController.signal
            }
            this.disableButtons();
        });

        if (this.form) {
            this.form.addEventListener("variant:changed", this.onVariantChange.bind(this))
        }
    }

    disableButtons() {
        if (this.inputElement.quantity >= this.inputElement.maxQuantity) {
            this.plusButton.classList.add("disabled");
            this.plusButton.setAttribute("disabled", "disabled");
        } else {
            this.plusButton.classList.remove("disabled");
            this.plusButton.removeAttribute("disabled");
        }

        if (this.inputElement.quantity <= 1) {
            this.minusButton.classList.add("disabled");
            this.minusButton.setAttribute("disabled", "disabled");
        } else {
            this.minusButton.classList.remove("disabled");
            this.minusButton.removeAttribute("disabled");
        }
    }

    onVariantChange(event) {
        const variant = event.detail.variant;

        if (!variant) {
            return null;
        }

        if (variant.available) {
            if (variant.inventory_management && variant.inventory_policy === 'deny') {
                this.inputFieldElement.max = variant.inventory_quantity;
            } else {
                if (variant.inventory_quantity <= 0) {
                    this.inputFieldElement.max = "";
                }
            }

            this.disableButtons();
            if (this.inputElement.quantity > this.inputElement.maxQuantity) {
                this.inputElement.quantity = variant.inventory_quantity;
            }
        } else {
            this.inputFieldElement.max = 1;
            this.inputElement.quantity = 1;
            this.disableButtons();
        }
    }
}

if (!window.customElements.get("quantity-selector")) {
    window.customElements.define("quantity-selector", QuantitySelector);
}
class QuantityInput extends HTMLElement {
    constructor() {
        super();

    }
    connectedCallback() {
        this.inputElement = this.querySelector("[data-product-quantity-input]");

        this.inputElement.addEventListener("input", () => {
            this.onValueInput();
        });

        this.inputElement.addEventListener("change", () => {
            this.onValueChanged();
        });

        this.quantitySelector = this.closest("quantity-selector");
    }

    get maxQuantity() {
        return parseInt(this.inputElement.max);
    }
    get quantity() {
        return parseInt(this.inputElement.value);
    }
    set quantity(quantity) {
        const isNumeric = (typeof quantity === "number" || typeof quantity === "string" && quantity.trim() !== "") && !isNaN(quantity);

        if (quantity === "") {
            return;
        }

        if (!isNumeric || quantity < 0) {
            quantity = parseInt(quantity) || 1;
        }
        this.inputElement.value = Math.max(this.inputElement.min || 1, Math.min(quantity, this.inputElement.max || Number.MAX_VALUE)).toString();
    }

    onValueInput() {
        this.quantity = this.inputElement.value;
        this.quantitySelector.disableButtons();
    }

    onValueChanged() {
        if (this.inputElement.value === "") {
            this.quantity = 1;
        }
        this.quantitySelector.disableButtons();
    }
}

if (!window.customElements.get("quantity-input")) {
    window.customElements.define("quantity-input", QuantityInput);
}

class BuyButtons extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.buyButton = this.querySelector("[data-add-to-cart]");
        this.paymentButtons = this.querySelector(".shopify-payment-button");
        this.errorMessageWrapper = this.querySelector("[data-error-message]");
        this.formId = this.getAttribute("data-form-id");
        this.form = document.forms[this.formId];
        
        if (this.form) {
            this.form.addEventListener("submit", this.onFormSubmit.bind(this));
            this.form.addEventListener("variant:changed", this.onVariantChanged.bind(this));
        }
    }

    onVariantChanged(event) {
        this.errorMessageWrapper.classList.add("hidden");
        const variant = event.detail.variant

        if (!variant) {
            this.buyButton.disabled = true;
            this.buyButton.innerText = window.translations.product.buttons.unavailable;
            this.paymentButtons?.classList.add("hidden");

            return null;
        }

        if (!variant.available) {
            this.buyButton.disabled = true;
            this.buyButton.innerText = window.translations.product.buttons.sold_out;
            this.paymentButtons?.classList.add("hidden");
        } else {
            this.buyButton.disabled = false;
            this.buyButton.innerText = window.translations.product.buttons.add_to_cart;
            this.paymentButtons?.classList.remove("hidden");
        }
    }

    async onFormSubmit(event) {
        event.preventDefault();
        const eventTarget = event.target;
        const formData = new URLSearchParams(new FormData(eventTarget)).toString();
        this.buyButton.disabled = true;
        const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });
        const responseJson = await response.json();

        if (response.status === 200) {
            document.dispatchEvent(new CustomEvent("product:added"));
        } else {
            this.errorMessageWrapper.classList.remove("hidden");
            this.errorMessageWrapper.innerText = responseJson.description;
        }

        this.buyButton.disabled = false;
    }
}

if (!window.customElements.get("buy-buttons")) {
    window.customElements.define("buy-buttons", BuyButtons);
}

class ProductInventory extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.formId = this.getAttribute("data-form-id");
        this.form = document.forms[this.formId];
        this.form.addEventListener("variant:changed", this.onVariantChanged.bind(this));
        this.messageWrapper = this.querySelector("[data-quantity-wrapper]");
    }

    onVariantChanged(event) {
        const variant = event.detail.variant;

        if (!variant || !this.messageWrapper) {
            return null;
        }

        if (variant.available) {
            if (variant.inventory_management && variant.inventory_policy === 'deny') {
                const messageSpan = `<span class="main-product__text main-product__text--tertiary">${window.translations.product.inventory.available.replace("[quantity]", variant.inventory_quantity)}</span>`;
                this.messageWrapper.innerHTML = window.translations.product.inventory.in_stock_quantity_html.replace("[quantity_code]", messageSpan);
            } else {
                if (variant.inventory_quantity <= 0) {
                    this.messageWrapper.innerHTML = window.translations.product.inventory.in_stock;
                }
            }
        } else {
            this.messageWrapper.innerHTML = window.translations.product.inventory.out_of_stock;
        }
    }
}

if (!window.customElements.get("product-inventory")) {
    window.customElements.define("product-inventory", ProductInventory);
}

class ProductOptions extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.initElements();
        this.changeHistoryState = this.getAttribute("data-change-history-state");
        this.productJSON = this.closest(".shopify-section").querySelector("[data-product-object]")
        if (!this.productJSON) {
            return null;
        }
        this.product = JSON.parse(this.productJSON.innerHTML);
        this.currentVariant = this.product.current_variant;
        this.addEventListener("change", this.onOptionChange);
        this.formId = this.getAttribute("data-form-id");
        this.form = document.forms[this.formId];
        setTimeout(() => {
            this.form.dispatchEvent(new CustomEvent("variant:changed", {
                detail: {
                    variant: this.currentVariant
                }
            }));
        }, 25);

        this.productOptionInputs = this.formInputs.reduce(
            (options, input) => {
                const option = input.getAttribute("data-option");
                const inputs = options[option] || [];

                return {
                    ...options,
                    [option]: [...inputs, input]
                };
            }, {}
        );
        const selectedOptions = this.getSelectedOptions();
        
        this.disableUnavailableOptions(selectedOptions);
    }

    initElements() {
        this.formInputs = [...this.querySelectorAll("input:not([name='id'])")];
        this.selectedVariantId = this.querySelector("[name='id']");
    }

    onOptionChange(event) {
        const eventTarget = event.target;
        const dataOptionValue = eventTarget.getAttribute("data-option");
        const value = eventTarget.value;
        const selectedOptions = this.getSelectedOptions();
        this.currentVariant = this.getVariantsBySelectedOptions(selectedOptions);
        this.form.dispatchEvent(new CustomEvent("variant:changed", {
            detail: {
                variant: this.currentVariant
            }
        }))
        this.updateSelectedId(this.currentVariant);
        this.updateOptionLabel(dataOptionValue, value);
        this.disableUnavailableOptions(selectedOptions);
        if (this.changeHistoryState === "true") {
            this.updateBrowserHistory(this.currentVariant);
        }
    }
    updateSelectedId(variant) {
        if (!this.selectedVariantId || !variant) {
            return null;
        }

        this.selectedVariantId.value = variant.id;
    }

    getSelectedOptions() {
        const activeInputs = [...this.querySelectorAll("input:checked")];

        return activeInputs.reduce((options, input) => {
            const optionPosition = input.getAttribute("data-option");
            options[optionPosition] = input.value

            return options
        }, {});
    }

    getVariantsBySelectedOptions(selectedOptions) {
        const optionKeys = Object.keys(selectedOptions);

        return this.product.variants.find(variant => {
            return optionKeys.every(key => {
                return variant[key] === selectedOptions[key]
            })
        }) || null;
    }

    getAvailableValues(variants, selectedOptions) {
        const optionKeys = Object.keys(selectedOptions);
        const variantsAvailableToCombination = this.getAvailableToCombinationVariants(variants, selectedOptions)

        return Object.assign({},
            ...optionKeys.map(key => {
                return {
                    [key]: [...new Set(variantsAvailableToCombination.map(variant => {
                        return variant[key];
                    }))]
                }
            })
        )
    }

    getAvailableToCombinationVariants(variants, selectedOptions) {
        const optionKeys = Object.keys(selectedOptions);

        if (Object.keys(selectedOptions).length > 1) {
            return variants.filter(variant => {
                if (!variant.available) {
                    return null;
                }

                return optionKeys.some(key => {
                    return variant[key] === selectedOptions[key]
                })
            })
        }
        else {
            return variants.filter(variant => {
                if (!variant.available) {
                    return null;
                }

                return variant;
            })
        }
    }

    disableUnavailableOptions(selectedOptions) {
        if (!Object.keys(this.productOptionInputs).length) {
            return null;
        }

        const availableValues = this.getAvailableValues(this.product.variants, selectedOptions);

        Object.keys(this.productOptionInputs).forEach(option => {
            this.productOptionInputs[option].forEach(input => {
                const wrapper = input.closest('li');
                const label = wrapper.querySelector("label");
                
                if (label) {
                    label.classList.add("disabled");

                    if (availableValues[option].includes(input.value)) {
                        label.classList.remove("disabled");
                    }
                }
            })
        })
    }

    updateOptionLabel(optionIndex, newValue) {
        if (!optionIndex) {
            return null;
        }

        const optionLabel = this.querySelector(`[data-option-label="${optionIndex}"]`);
        if (!optionLabel) {
            return null;
        }
        optionLabel.innerText = newValue;
    }

    updateBrowserHistory(variant) {
        if (!variant) {
            return null;
        }

        const url = window.getUrlWithVariant(window.location.href, variant.id);
        window.history.replaceState({
            path: url
        }, "", url);
    }
}

if (!window.customElements.get("product-options")) {
    window.customElements.define("product-options", ProductOptions)
}

class ProductPrice extends HTMLElement {
    constructor() {
        super();

        this.priceElement = this.querySelector("[data-price]");
        this.compareAtPriceElement = this.querySelector("[data-compare-at-price]");
        this.unitPriceElement = this.querySelector("[data-unit-price]");
        this.discountElement = this.querySelector("[data-discount-value]");
    }

    connectedCallback() {
        this.formId = this.getAttribute("data-form-id");
        this.form = document.forms[this.formId];
        
        if (this.form) {
            this.form.addEventListener("variant:changed", this.updateProductPrice.bind(this));
        }
    }

    updateProductPrice(event) {
        const variant = event.detail.variant;
        if (!variant) {
            return null;
        }

        this.priceElement.innerText = formatMoney(variant.price, window.price.money_format);

        if (variant.compare_at_price) {
            this.compareAtPriceElement.innerText = formatMoney(variant.compare_at_price, window.price.money_format);
            this.compareAtPriceElement.classList.remove("hidden");
        } else {
            this.compareAtPriceElement.classList.add("hidden");
        }
        if (variant.unit_price_measurement) {
            const reference_value = variant.unit_price_measurement.reference_value;
            const reference_unit = variant.unit_price_measurement.reference_unit;
            this.unitPriceElement.innerText = `${formatMoney(variant.unit_price)}/${reference_value}${reference_unit}`;
            this.unitPriceElement.classList.remove("hidden");
        } else {
            this.unitPriceElement.classList.add("hidden");
        }

        this.discountWrapper = this.discountElement.closest("[data-discount-value-wrapper]");

        if (variant.discount_value || variant.discount_value !== "") {
            this.discountElement.innerText = `${variant.discount_value}%`;

            if (this.discountWrapper.classList.contains("hidden")) {
                this.discountWrapper.classList.remove("hidden");
            }
        } else {
            if (!this.discountWrapper.classList.contains("hidden")) {
                this.discountWrapper.classList.add("hidden");
            }
        }
    }
}

if (!window.customElements.get("product-price")) {
    window.customElements.define("product-price", ProductPrice)
}

class ProductDropdowns extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.dropdowns = this.querySelectorAll("[data-dropdown-opener]");

        this.addEventListener("click", (event) => {
            if (event.target.closest("[data-dropdown-opener]")) {
                const details = event.target.closest("[data-dropdown-opener]");
                this.setActive(details);
            }
        })
    }

    setActive(current) {
        this.dropdowns.forEach(dropdown => {
            if (dropdown !== current) {
                dropdown.open = false;
            }
        })
    }
}

if (!window.customElements.get("product-dropdowns")) {
    window.customElements.define("product-dropdowns", ProductDropdowns)
}