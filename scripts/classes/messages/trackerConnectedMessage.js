import SerialComMessage from "./serialComMessage.js";
import Tracker from "./rawTrackerType.js";

class TrackerConnectedMessage extends SerialComMessage {
    /** @type {Tracker} */
    tracker;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.tracker = new Tracker(this.readTracker());
    }
}

export default TrackerConnectedMessage;