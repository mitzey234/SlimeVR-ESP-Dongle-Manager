import SerialComMessage from "./serialComMessage.js";

class PairedTracker {
    /** @type string */
    mac;

    /** @type number */
    trackerId;

    /**
     * @param {{mac, trackerId}} data 
     */
    constructor(data) {
        this.mac = data.mac;
        this.trackerId = data.trackerId;
    }
}

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
}

class InitMessage extends SerialComMessage {
    /** @type string */
    productName;

    /** @type string */
    firmwareVersion;

    /** @type string */
    macAddress;

    /** @type number */
    channel;

    /** @type boolean */
    pairingMode;

    /** @type boolean */
    scanningEnvironment;

    /** @type {Tracker[]} */
    trackers;

    /** @type {PairedTracker[]} */
    pairedTrackers = []; 

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.productName = this.readString();
        this.firmwareVersion = this.readString();
        this.macAddress = this.readMacAddress();
        this.channel = this.readUInt8();
        this.pairingMode = this.readBool();
        this.scanningEnvironment = this.readBool();
        this.trackers = [];
        let trackerCount = this.readUInt8();
        for (let i = 0; i < trackerCount; i++) this.trackers.push(new Tracker(this.readTracker()));
        let pairedTrackerCount = this.readUInt8();
        for (let i = 0; i < pairedTrackerCount; i++) this.pairedTrackers.push(new PairedTracker(this.readPairedTracker()));
    }
}

export default InitMessage;