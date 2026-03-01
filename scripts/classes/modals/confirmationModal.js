import Modal from "./modal.js";

class Confirmation extends Modal {
    /** @type {{resolve: Function, reject: Function}} */
    promise;

    constructor(manager) {
        super(manager);
        this.element.classList.add('bg-gray-800', 'rounded', 'p-6');
        this.titleText = document.createElement('h2');
        this.titleText.classList.add('text-xl', 'font-bold', 'mb-4');
        this.element.appendChild(this.titleText);
        this.descriptionText = document.createElement('p');
        this.descriptionText.classList.add('text-sm', 'mb-6');
        this.element.appendChild(this.descriptionText);
        let buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('flex', 'justify-end', 'gap-2');
        this.cancelButton = document.createElement('button');
        this.cancelButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.cancelButton.innerText = "Cancel";
        buttonsContainer.appendChild(this.cancelButton);
        this.confirmButton = document.createElement('button');
        this.confirmButton.classList.add('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.confirmButton.innerText = "Confirm";
        this.cancelButton.onclick = () => {
            if (this.promise) {
                this.promise.resolve(false);
                this.promise = null;
                this.close();
            }
        };
        this.confirmButton.onclick = () => {
            if (this.promise) {
                this.promise.resolve(true);
                this.promise = null;
                this.close();
            }
        };
        buttonsContainer.appendChild(this.confirmButton);
        this.element.appendChild(buttonsContainer);
    }

    confirm (title, description, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false) {
        if (this.promise != null) throw new Error("A confirmation is already in progress");
        this.titleText.innerText = title;
        this.descriptionText.innerText = description;
        this.confirmButton.innerText = confirmText;
        this.cancelButton.innerText = cancelText;
        if (isDestructive) {
            this.confirmButton.classList.remove('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-800');
            this.confirmButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800');
        } else {
            this.confirmButton.classList.remove('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800');
            this.confirmButton.classList.add('bg-yellow-500', 'hover:bg-yellow-700', 'active:bg-yellow-800');
        }
        this.open();
        return new Promise((resolve, reject) => {
            this.promise = {resolve, reject};
        });
    }

    onClose() {
        if (this.promise) {
            this.promise.resolve(false);
            this.promise = null;
        }
    }
}

export default Confirmation;