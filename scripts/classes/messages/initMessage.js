import SerialComMessage from "./serialComMessage.js";
import Tracker from "./rawTrackerType.js";
import PairedTracker from "./rawPairedTrackerType.js";

class InitMessage extends SerialComMessage {
    /** @type string */
    productName;

    /** @type string */
    firmwareVersion;

    /** @type string */
    boardName;

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

    /** @type number */
    bootTime;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.productName = this.readString();
        this.firmwareVersion = this.readString();
        this.boardName = this.readString();
        this.bootTime = this.readUInt32();
        this.bootTime = Math.floor(Date.now()/1000) - this.bootTime;
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