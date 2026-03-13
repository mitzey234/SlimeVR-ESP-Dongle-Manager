import Modal from "./modal.js";

class Waiting extends Modal {
    /** @type {{resolve: Function, reject: Function}} */
    promise;

    get progress() {
        return this.progressBar.style.width.replace("%", "");
    }

    set progress(value) {
        if (typeof value === "number") {
            this.progressBar.style.width = Math.max(0, Math.min(100, value)) + "%";
        }
    }

    constructor(manager) {
        super(manager);
        this.element.classList.add('bg-gray-800', 'rounded', 'p-6');
        this.titleText = document.createElement('h2');
        this.titleText.classList.add('text-xl', 'font-bold', 'mb-4');
        this.element.appendChild(this.titleText);
        this.descriptionText = document.createElement('p');
        this.descriptionText.classList.add('text-sm', 'mb-6');
        this.element.appendChild(this.descriptionText);
        
        this.spinner = document.createElement('div');
        this.spinner.classList.add('flex', 'items-center', 'justify-center');
        let spinnerIcon = document.createElement('i');
        spinnerIcon.classList.add('fa-solid', 'fa-circle-notch', 'animate-spin', 'text-4xl', 'text-white');
        this.spinner.appendChild(spinnerIcon);
        this.element.appendChild(this.spinner);

        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.classList.add('w-full', 'bg-gray-700', 'rounded', 'h-4', 'mt-6', "hidden");
        this.progressBar = document.createElement('div');
        this.progressBar.style.width = "0%";
        this.progressBar.classList.add('bg-green-500', 'h-full', 'rounded', 'w-0');
        this.progressBarContainer.appendChild(this.progressBar);
        this.element.appendChild(this.progressBarContainer);
    }

    waiting (title = "Please wait...", description = "", showSpinner = true, showProgressBar = false) {
        this.locked = true;
        this.progress = 0;
        this.titleText.innerText = title;
        this.descriptionText.innerText = description;
        this.spinner.classList.toggle("hidden", !showSpinner);
        this.progressBarContainer.classList.toggle("hidden", !showProgressBar);
        this.open();
    }

    complete () {
        this.locked = false;
        this.manager.activeModal = null;
    }
}

export default Waiting;