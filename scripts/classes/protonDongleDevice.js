import SerialDevice from "./serialDevice.js";
import DongleManager from "./dongleManager.js";

class ProtonDongleDevice extends SerialDevice {
    trackers = new Map();

    constructor(mainInstance, port) {
        super(mainInstance, port, "SlimeVR Dongle");
        this.manager = new DongleManager(mainInstance, this);
    }

    async updateFirmware(firmware) {

    }

    async updateTrackers(firmware) {

    }

    enterDFU() {

    }

    togglePairingMode() {
        //TODO: Implement this when I add the pairing mode toggle button in the UI
    }
}

export default ProtonDongleDevice;