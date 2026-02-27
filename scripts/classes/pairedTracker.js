class PairedTracker {
    element = document.createElement('div');

    /** @type string */
    mac;

    /** @type number */
    trackerId;

    set connected(value) {
        if (value) {
            this.connectedBadge.classList.remove("hidden");
        } else {
            this.connectedBadge.classList.add("hidden");
        }
    }

    /**
     * @param {import("./messages/rawPairedTrackerType.js")["default"]["prototype"]} data
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
        this.element.classList.add('flex', 'items-center', 'gap-2', 'p-2', 'rounded', "border", "border-neutral-600", "hover:bg-neutral-700", "transition", "duration-200", "ease-in-out", "paired-tracker");
        let titleContainer = document.createElement('div');
        titleContainer.classList.add('flex', 'flex-col');
        let title = document.createElement('span');
        title.innerText = `Tracker ${this.trackerId}`;
        title.classList.add('font-semibold', 'text-white', 'text-xl', "flex", "items-center");
        titleContainer.appendChild(title);
        let macText = document.createElement('span');
        macText.classList.add('text-sm', 'text-neutral-400');
        macText.innerText = this.mac;
        titleContainer.appendChild(macText);
        this.element.appendChild(titleContainer);
        this.connectedBadge = document.createElement('span');
        this.connectedBadge.classList.add('text-xs', 'font-semibold', 'px-2', 'py-1', 'rounded-full', 'bg-green-500/25', 'text-white/75', "ml-4", "hover:text-white", "hover:bg-green-500/50", "transition", "duration-200", "ease-in-out");
        this.connectedBadge.innerText = "Connected";
        title.appendChild(this.connectedBadge);

        //actions
        //Unpair button
        this.unpairButton = document.createElement('button');
        this.unpairButton.classList.add('ml-auto', 'px-2', 'py-1', 'bg-red-500', 'text-white', 'rounded', 'hover:bg-red-700', 'active:bg-red-900', 'transition', 'duration-200', 'ease-in-out', "cursor-pointer", "outline-none", "ring-0", "unpair-button");
        this.unpairButton.innerText = "Unpair";
        this.element.appendChild(this.unpairButton);
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default PairedTracker;