import SerialDevice from "./serialDevice.js";
import SerialManager from "./serialManager.js";

class UnknownDevice extends SerialDevice {
    constructor(mainInstance, port) {
        super(mainInstance, port, "Unknown Device");
        this.manager = new SerialManager(mainInstance, this);
    }
}

export default UnknownDevice;