import SerialComMessage from "./serialComMessage.js";

class AllTrackersUnpairedMessage extends SerialComMessage {
    /**
     * @param {Array<number>} data 
     */
    constructor (data) {
        super(data);
    }
}

export default AllTrackersUnpairedMessage;