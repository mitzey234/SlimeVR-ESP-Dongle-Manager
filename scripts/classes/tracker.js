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
        this.rssiElement.classList.toggle('text-green-300', this._rssi > -85);
        this.rssiElement.classList.toggle('text-yellow-300', this._rssi <= -85 && this._rssi > -100);
        this.rssiElement.classList.toggle('text-red-300', this._rssi <= -100);
        if (this.update != null && typeof this.update === "function") {
            this.update();
        }
    }

    update;

    element = document.createElement('div');

    /**
     * @param {{mac, trackerId, missedPings, latency, rssi}} data 
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
        details.appendChild(connectionInfo);

        let missedPings = document.createElement('span');
        missedPings.classList.add('text-white/50', 'text-xs');
        this.missedPingsElement = document.createElement('a');
        missedPings.appendChild(this.missedPingsElement);
        this.missedPingsElement.innerText = `Missed Pings: ${this._missedPings}`;
        details.appendChild(missedPings);
        this.element.appendChild(details);

        let unpairButton = document.createElement('div');
        let unpairIcon = document.createElement('i');
        unpairIcon.classList.add('fa-solid', 'fa-circle-minus', 'text-md', 'text-red-400', "cursor-pointer", "transition", "duration-200", "ease-in-out");
        unpairButton.appendChild(unpairIcon);
        unpairButton.classList.add("self-center", "ml-auto");
        unpairButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to unpair Tracker ${this.trackerId}?\nThis will remove it from the dongle and you will need to pair it again if you want to use it\nMAC Address: ${this.mac}`)) {
                //delete tracker
            }
        });
        this.element.appendChild(unpairButton);
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default Tracker;