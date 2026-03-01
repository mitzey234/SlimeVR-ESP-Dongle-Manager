import SerialComMessage from "./serialComMessage.js";

class EnvironmentScanResultsMessage extends SerialComMessage {
    /** @type {number} */
    selected;

    /** @type {Array<number>} */
    channels = [];

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.selected = this.readUInt8();
        let length = this.readUInt8();
        for (let i = 0; i < length; i++) {
            this.channels.push(this.readUInt32());
        }
    }
}

export default EnvironmentScanResultsMessage;