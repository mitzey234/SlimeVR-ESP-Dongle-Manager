import SerialComMessage from "./serialComMessage.js";
import Tracker from "./rawTrackerType.js";

class TrackerUpdateMessage extends SerialComMessage {
    /** @type {Tracker[]} */
    trackers;

    /** @type {number} */
    bytesPerSecond;

    /** @type {number} */
    packetsPerSecond;

    /** @type {number} */
    temperature;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.bytesPerSecond = this.readUInt16();
        this.packetsPerSecond = this.readUInt16();
        this.temperature = this.readInt8();
        let trackerCount = this.readUInt8();
        this.trackers = [];
        for (let i = 0; i < trackerCount; i++) this.trackers.push(new Tracker(this.readTracker()));

    }
}

export default TrackerUpdateMessage;