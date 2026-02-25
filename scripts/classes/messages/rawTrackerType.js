class Tracker {
    /** @type string */
    mac;

    /** @type number */
    trackerId;

    /** @type number */
    missedPings;

    /** @type number */
    latency;

    /** @type number */
    rssi;

    /**
     * @param {{mac, trackerId, missedPings, latency, rssi}} data 
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
        this.missedPings = data.missedPings;
        this.latency = data.latency;
        this.rssi = data.rssi;
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default Tracker;