import SerialComMessage from "./serialComMessage.js";

class UpdateChannelMessage extends SerialComMessage {
    /** @type {number} */
    channel;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.channel = this.readUInt8();
    }
}

export default UpdateChannelMessage;