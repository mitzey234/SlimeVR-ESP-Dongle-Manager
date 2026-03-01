import SerialDevice from "./serialDevice.js";
import SerialManager from "./serialManager.js";

class ESP32Device extends SerialDevice {
    constructor(mainInstance, port) {
        super(mainInstance, port, "ESP JTAG Device");
        this.manager = new SerialManager(mainInstance, this);
    }
}

export default ESP32Device;