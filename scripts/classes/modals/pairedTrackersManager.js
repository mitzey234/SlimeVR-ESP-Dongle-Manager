import Modal from "./modal.js";

class PairedTrackersManager extends Modal {
    /** @type {import("../dongleContainer.js")["default"]["prototype"]} */
    dongleContainer

    pairedCountText = document.createElement('span');

    listContainer = document.createElement('div');

    constructor(manager) {
        super(manager);
        this.dongleContainer = this.manager.dongleContainer;
        this.element.classList.add("hideScrolls")

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

        //Unpair all button
        let unpairAllButton = document.createElement('button');
        unpairAllButton.classList.add('bg-red-500', 'hover:bg-red-700', 'active:bg-red-900', 'text-white', 'px-4', 'py-2', 'rounded', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer", "outline-none", "ring-0", "self-center", "flex");
        unpairAllButton.innerText = "Unpair All Trackers";
        unpairAllButton.onclick = async () => {
            let confirm = await this.manager.confirmation.confirm("Confirm Unpair All", "Are you sure you want to unpair all trackers? This action cannot be undone.", "Unpair All", "Cancel", true);
            if (confirm) {
                await this.manager.sendCommand("unpairall");
            }
            this.open();
        };
        this.element.appendChild(unpairAllButton);

        //Divider
        let divider2 = document.createElement('div');
        divider2.classList.add('border-t', 'border-neutral-600', 'my-4');
        this.element.appendChild(divider2);

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