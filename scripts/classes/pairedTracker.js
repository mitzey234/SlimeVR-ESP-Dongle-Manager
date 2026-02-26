class PairedTracker {
    element = document.createElement('div');

    /** @type string */
    mac;

    /** @type number */
    trackerId;

    /**
     * @param {import("./messages/rawPairedTrackerType.js")["default"]["prototype"]} data
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