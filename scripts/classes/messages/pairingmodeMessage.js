import SerialComMessage from "./serialComMessage.js";

class PairingModeMessage extends SerialComMessage {

    /** @type {boolean} */
    enabled;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.enabled = this.readBool();
    }
}

export default PairingModeMessage;