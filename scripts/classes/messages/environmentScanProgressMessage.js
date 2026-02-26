import SerialComMessage from "./serialComMessage.js";

class EnvironmentScanProgressMessage extends SerialComMessage {
    /** @type {number} */
    currentChannel;

    /** @type {number} */
    channelBytesSeen;

    /** @type {number} */
    uniqueBSSIDs;

    /** @type {number} */
    elapsedTime;

    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
        this.currentChannel = this.readUInt8();
        this.channelBytesSeen = this.readUInt32();
        this.uniqueBSSIDs = this.readUInt16();
        this.elapsedTime = this.readUInt16();
    }
}

export default EnvironmentScanProgressMessage;