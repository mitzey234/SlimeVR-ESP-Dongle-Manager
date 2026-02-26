class PairedTracker {
    /** @type string */
    mac;

    /** @type number */
    trackerId;

    /**
     * @param {{mac: string, trackerId: number}} data 
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default PairedTracker;