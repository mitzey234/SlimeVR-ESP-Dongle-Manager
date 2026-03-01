class Modal {
    
    /** @type {import("../manager.js")["default"]["prototype"]} */
    manager;

    element = document.createElement('div');

    locked = false;

    constructor(manager) {
        this.manager = manager;
        this.element.onclick = (event) => {
            event.stopPropagation();
        }
        this.element.classList.add('bg-neutral-800', 'rounded-lg', 'p-4', 'min-w-96', 'max-w-[90%]', 'text-white', 'relative', "min-h-24", "max-h-[90%]", "overflow-auto", "select-none", "hidden");
        this.manager.modalOverlay.appendChild(this.element);
    }

    open() {
        this.manager.activeModal = this;
    }

    close() {
        if (this.manager.activeModal === this) {
            this.manager.activeModal = null;
        }
        this.onClose();
    }

    onClose() {
        // Placeholder method
    }
}

export default Modal;