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

    /** @type number */
    bytesPerSecond;

    /** @type number */
    packetsPerSecond

    /**
     * @param {{mac, trackerId, missedPings, latency, rssi, bytesPerSecond, packetsPerSecond}} data 
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
        this.missedPings = data.missedPings;
        this.latency = data.latency;
        this.rssi = data.rssi;
        this.bytesPerSecond = data.bytesPerSecond;
        this.packetsPerSecond = data.packetsPerSecond;
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default Tracker;