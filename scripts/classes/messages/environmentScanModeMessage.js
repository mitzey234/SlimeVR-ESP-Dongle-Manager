import SerialComMessage from "./serialComMessage.js";

class EnvironmentScanModeMessage extends SerialComMessage {

    /** @type {boolean} */
    enabled;

    /** @type {number} */
    scanningTime;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.enabled = this.readBool();
        this.scanningTime = this.readUInt16();
    }
}

export default EnvironmentScanModeMessage;