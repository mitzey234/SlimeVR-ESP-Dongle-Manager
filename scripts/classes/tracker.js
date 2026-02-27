class Tracker {
    /** @type string */
    mac;

    /** @type number */
    trackerId;

    /** @type number */
    _missedPings;

    get missedPings() {
        return this._missedPings;
    }

    set missedPings(value) {
        if (this._missedPings === value) return;
        this._missedPings = value;
        this.missedPingsElement.innerText = `Missed Pings: ${this._missedPings}`;
        this.missedPingsElement.classList.toggle('text-yellow-300', this._missedPings > 0 && this._missedPings <= 2);
        this.missedPingsElement.classList.toggle('text-orange-300', this._missedPings > 2 && this._missedPings <= 3);
        this.missedPingsElement.classList.toggle('text-red-300', this._missedPings > 3);
    }

    /** @type number */
    _latency;
    get latency() {
        return this._latency;
    }

    set latency(value) {
        if (this._latency === value) return;
        this._latency = value;
        this.latencyElement.innerText = `${this._latency}ms`;
        if (this.update != null && typeof this.update === "function") {
            this.update();
        }
    }

    /** @type number */
    _rssi;

    get rssi() {
        return this._rssi;
    }

    set rssi(value) {
        if (this._rssi === value) return;
        this._rssi = value;
        this.rssiElement.innerText = `${this._rssi}dBm`;
        this.rssiElement.classList.toggle('text-green-300', this._rssi > -55);
        this.rssiElement.classList.toggle('text-yellow-300', this._rssi <= -55 && this._rssi > -75);
        this.rssiElement.classList.toggle('text-red-300', this._rssi <= -75);
        if (this.update != null && typeof this.update === "function") {
            this.update();
        }
    }

    /** @type number */
    _bytesPerSecond;
    get bytesPerSecond() {
        return this._bytesPerSecond;
    }

    set bytesPerSecond(value) {
        if (this._bytesPerSecond === value) return;
        this._bytesPerSecond = value;
        this.bytesPerSecondElement.innerText = `${this._bytesPerSecond} B`;
        this.bytesPerSecondElement.classList.toggle('text-blue-300/35', this._bytesPerSecond <= 500);
        this.bytesPerSecondElement.classList.toggle('text-blue-300/75', this._bytesPerSecond > 500 && this._bytesPerSecond <= 1000);
        this.bytesPerSecondElement.classList.toggle('text-blue-300', this._bytesPerSecond > 1000);
    }

    /** @type number */
    _packetsPerSecond
    get packetsPerSecond() {
        return this._packetsPerSecond;
    }

    set packetsPerSecond(value) {
        if (this._packetsPerSecond === value) return;
        this._packetsPerSecond = value;
        this.packetsPerSecondElement.innerText = `${this._packetsPerSecond} P`;
        this.packetsPerSecondElement.classList.toggle('text-blue-300/35', this._packetsPerSecond <= 20);
        this.packetsPerSecondElement.classList.toggle('text-blue-300/75', this._packetsPerSecond > 20 && this._packetsPerSecond <= 50);
        this.packetsPerSecondElement.classList.toggle('text-blue-300', this._packetsPerSecond > 50);
    }

    update;

    element = document.createElement('div');

    /**
     * @param {import("./messages/rawTrackerType.js")["default"]["prototype"]} data 
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
        this._missedPings = data.missedPings;
        this._latency = data.latency;
        this._rssi = data.rssi;

        this.element.classList.add("tracker", 'w-full', 'hover:bg-black/70', 'p-2', 'py-2', "flex", "flow-row", "select-none", "rounded", "transition", "duration-200", "ease-in-out");
        let icon = document.createElement('i');
        icon.classList.add('fa-solid', 'fa-location-dot', 'text-2xl', 'text-white/75', 'mx-2', 'self-center');
        this.element.appendChild(icon);
        
        let details = document.createElement('div');
        details.classList.add('flex', 'flex-col', 'text-sm');
        let name = document.createElement('span');
        name.innerText = `Tracker ${this.trackerId}`;
        details.appendChild(name);

        let macAddress = document.createElement('span');
        macAddress.classList.add('text-white/50', 'text-xs');
        macAddress.innerText = `${this.mac}`;
        details.appendChild(macAddress);

        let connectionInfo = document.createElement('span');
        connectionInfo.classList.add('text-white/50', 'text-xs');
        this.latencyElement = document.createElement('a');
        connectionInfo.appendChild(this.latencyElement);
        let divider = document.createElement('span');
        divider.innerText = " | ";
        connectionInfo.appendChild(divider);
        this.rssiElement = document.createElement('a');
        connectionInfo.appendChild(this.rssiElement);
        this.latencyElement.innerText = `${this._latency}ms`;
        this.rssiElement.innerText = `${this._rssi}dBm`;
        this.rssiElement.classList.toggle('text-green-300', this._rssi > -85);
        this.rssiElement.classList.toggle('text-yellow-300', this._rssi <= -85 && this._rssi > -100);
        this.rssiElement.classList.toggle('text-red-300', this._rssi <= -100);
        divider = document.createElement('span');
        divider.innerText = " | ";
        connectionInfo.appendChild(divider);
        this.packetsPerSecondElement = document.createElement('a');
        this.packetsPerSecondElement.innerText = `${data.packetsPerSecond} P`;
        this.packetsPerSecondElement.classList.toggle('text-blue-300/35', data.packetsPerSecond <= 20);
        this.packetsPerSecondElement.classList.toggle('text-blue-300/75', data.packetsPerSecond > 20 && data.packetsPerSecond <= 50);
        this.packetsPerSecondElement.classList.toggle('text-blue-300', data.packetsPerSecond > 50);
        connectionInfo.appendChild(this.packetsPerSecondElement);
        divider = document.createElement('span');
        divider.innerText = " | ";
        connectionInfo.appendChild(divider);
        this.bytesPerSecondElement = document.createElement('a');
        this.bytesPerSecondElement.innerText = `${data.bytesPerSecond} B`;
        this.bytesPerSecondElement.classList.toggle('text-blue-300/35', data.bytesPerSecond <= 500);
        this.bytesPerSecondElement.classList.toggle('text-blue-300/75', data.bytesPerSecond > 500 && data.bytesPerSecond <= 1000);
        this.bytesPerSecondElement.classList.toggle('text-blue-300', data.bytesPerSecond > 1000);
        connectionInfo.appendChild(this.bytesPerSecondElement);

        details.appendChild(connectionInfo);

        let missedPings = document.createElement('span');
        missedPings.classList.add('text-white/50', 'text-xs');
        this.missedPingsElement = document.createElement('a');
        missedPings.appendChild(this.missedPingsElement);
        this.missedPingsElement.innerText = `Missed Pings: ${this._missedPings}`;
        details.appendChild(missedPings);
        this.element.appendChild(details);

        this.unpairButton = document.createElement('div');
        let unpairIcon = document.createElement('i');
        unpairIcon.classList.add('fa-solid', 'fa-circle-minus', 'text-md', 'text-red-400', "cursor-pointer", "transition", "duration-200", "ease-in-out");
        this.unpairButton.appendChild(unpairIcon);
        this.unpairButton.classList.add("self-center", "ml-auto");
        this.element.appendChild(this.unpairButton);
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default Tracker;