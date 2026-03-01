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
        this.mac = this.readMacAddress();
        this.trackerId = this.readUInt8();
    }

    get id () {
        return this.trackerId + "|" + this.mac;
    }
}

export default TrackerUnpairedMessage;