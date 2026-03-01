import Manager from "./manager.js";

class SerialManager extends Manager {
    constructor(main, device) {
        super(main, device);
    }

    onSwitch () {

    }

    async connect () {
        await super.connect();
        this.connecting = false;
        this.overlay = false;
        this.device.deviceElement.status = "connected";
    }
}

export default SerialManager;