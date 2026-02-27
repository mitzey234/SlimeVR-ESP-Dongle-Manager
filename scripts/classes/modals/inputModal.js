import Modal from "./modal.js";

class CustomInputModal extends Modal {
    /** @type {{resolve: Function, reject: Function}} */
    promise;

    /** @type {Function|null} */
    check;

    constructor(manager) {
        super(manager);
        this.element.classList.add('bg-gray-800', 'rounded', 'p-6');
        this.titleText = document.createElement('h2');
        this.titleText.classList.add('text-xl', 'font-bold', 'mb-4');
        this.element.appendChild(this.titleText);
        this.descriptionText = document.createElement('p');
        this.descriptionText.classList.add('text-sm', 'mb-6');
        this.element.appendChild(this.descriptionText);
        this.inputField = document.createElement('input');
        this.inputField.classList.add('w-full', 'p-2', 'rounded', 'bg-transparent', 'text-white', 'border', 'border-gray-600', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', "select-all");
        this.inputField.onkeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.confirmButton.click();
            } else if (event.key === "Escape") {
                event.preventDefault();
                this.cancelButton.click();
            }
        };
        this.element.appendChild(this.inputField);
        this.errorText = document.createElement('p');
        this.errorText.classList.add('text-sm', 'text-red-500', 'mb-4', "italic");
        this.element.appendChild(this.errorText);
        let buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('flex', 'justify-end', 'gap-2');
        this.cancelButton = document.createElement('button');
        this.cancelButton.classList.add('bg-gray-500', 'hover:bg-gray-700', 'active:bg-gray-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.cancelButton.innerText = "Cancel";
        buttonsContainer.appendChild(this.cancelButton);
        this.confirmButton = document.createElement('button');
        this.confirmButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer");
        this.confirmButton.innerText = "Confirm";
        this.cancelButton.onclick = () => {
            if (this.promise) {
                this.promise.reject("cancelled");
                this.promise = null;
                this.close();
            }
        };
        this.confirmButton.onclick = () => {
            if (this.promise) {
                if (this.check != null && typeof this.check === "function") {
                    let checkResult = this.check(this.inputField.value);
                    if (checkResult != null) {
                        if (typeof checkResult === "string") {
                            this.errorText.innerText = checkResult;
                            this.inputField.classList.add('border-red-500');
                        }
                        return;
                    }
                }
                this.promise.resolve(this.inputField.value);
                this.promise = null;
                this.close();
            }
        };
        buttonsContainer.appendChild(this.confirmButton);
        this.element.appendChild(buttonsContainer);
    }

    requestInput (title, description, type, submitText = "Submit", cancelText = "Cancel", placeholder = "", isDestructive = false, conditionChecker = null) {
        if (this.promise != null) throw new Error("A confirmation is already in progress");
        this.titleText.innerText = title;
        this.descriptionText.innerText = description;
        this.confirmButton.innerText = submitText;
        this.cancelButton.innerText = cancelText;
        this.errorText.innerText = "";
        this.inputField.value = "";
        this.inputField.classList.remove('border-red-500');
        this.check = conditionChecker;
        if (isDestructive) {
            this.confirmButton.classList.remove('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800');
            this.confirmButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800');
            this.inputField.classList.add('focus:ring-red-500');
            this.inputField.classList.remove('focus:ring-blue-500');
        } else {
            this.confirmButton.classList.remove('bg-red-500', 'hover:bg-red-700', 'active:bg-red-800');
            this.confirmButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'active:bg-blue-800');
            this.inputField.classList.remove('focus:ring-red-500');
            this.inputField.classList.add('focus:ring-blue-500');
        }
        this.inputField.type = type;
        this.inputField.placeholder = placeholder;
        this.open();
        return new Promise((resolve, reject) => {
            this.promise = {resolve, reject};
        });
    }

    onClose() {
        if (this.promise) {
            this.promise.reject("cancelled");
            this.promise = null;
        }
    }
}

export default CustomInputModal;