import Modal from "./modal.js";

class PairedTrackersManager extends Modal {
    /** @type {import("../dongleContainer.js")["default"]["prototype"]} */
    dongleContainer

    pairedCountText = document.createElement('span');

    listContainer = document.createElement('div');

    constructor(manager) {
        super(manager);
        this.dongleContainer = this.manager.dongleContainer;

        let title = document.createElement('h2');
        title.classList.add('text-xl', 'font-bold', 'mb-4', "text-center");
        title.innerText = "Paired Trackers: ";
        title.appendChild(this.pairedCountText);
        this.element.appendChild(title);
        this.listContainer.classList.add('flex', 'flex-col', 'gap-2');
        this.element.appendChild(this.listContainer);
        
        //Divider
        let divider = document.createElement('div');
        divider.classList.add('border-t', 'border-neutral-600', 'my-4');
        this.element.appendChild(divider);

        //List
        this.listContainer.classList.add('flex', 'flex-col', "gap-2");
        this.element.appendChild(this.listContainer);
    }

    update() {
        this.pairedCountText.innerText = `${this.dongleContainer.pairedTrackers.size}`;
    }

    sort () {
        Array.from(this.dongleContainer.pairedTrackers.values()).sort((a, b) => a.trackerId - b.trackerId).forEach((tracker, index) => tracker.element.style.order = index);
    }
}

export default PairedTrackersManager;