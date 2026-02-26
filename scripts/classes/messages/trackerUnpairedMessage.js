import SerialComMessage from "./serialComMessage.js";

class TrackerUnpairedMessage extends SerialComMessage {
    /** @type {string} */
    mac;

    /** @type {number} */
    trackerId;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.mac = this.readMac();
        this.trackerId = this.readByte();
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default TrackerUnpairedMessage;