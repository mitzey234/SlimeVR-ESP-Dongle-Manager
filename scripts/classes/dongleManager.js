import Manager from "./manager.js";
import SerialComParser from "./messages/serialComParser.js";
import Terminal from "./terminal.js";
import DongleContainer from "./dongleContainer.js";

class DongleManager extends Manager {
    connectTimeout;

    parser = new SerialComParser(this);

    _pairing = false;
    get pairing() {
        return this._pairing;
    }
    set pairing(value) {
        if (this._pairing === value) return;
        this._pairing = value;
        this.device.deviceElement.status = value ? "pairing" : "connected";
    }

    _scanningEnvironment = false;
    get scanningEnvironment() {
        return this._scanningEnvironment;
    }

    set scanningEnvironment(value) {
        if (this._scanningEnvironment === value) return;
        this._scanningEnvironment = value;
        this.device.deviceElement.status = value ? "scanning environment" : "connected";
    }
    
    constructor(main, device) {
        super(main, device);
        this.allowSerialCom = true;
        this.dongleContainer = new DongleContainer(this, device);
        this.element.appendChild(this.dongleContainer.element);
        this.terminal = new Terminal(this, device);
        this.terminal.element.classList.remove('w-full');
        this.terminal.element.classList.add('w-4/9');
        this.element.appendChild(this.terminal.element);
    }

    async onSwitch () {
        super.onSwitch();
        if (!this.device.port.connected) return;
        if (!this.device.port.writable || !this.device.port.readable) {
            await this.connect();
        }
    }

    /**
     * @param {Array<number>} line 
     */
    handleLine(line) {
        const output = String.fromCharCode(...line);
        if (output.startsWith(this.main.consolePrefix)) {
            this.element.dispatchEvent(new CustomEvent('socket-com', { detail: line.slice(this.main.consolePrefix.length) }));
        } else {
            this.terminal.addMessage(output);
            this.element.dispatchEvent(new CustomEvent('console-output', { detail: output }));
        }
        this.dataBuffer = [];
    }

    async connect () {
        await super.connect();
        this.connectTimeout = setTimeout(this.onTimeout.bind(this), 5000);
        this.element.addEventListener('socket-com', this.handleSocketComInit.bind(this));
        let result = await this.sendCommand('SCInit');
        if (!result) {
            this.connecting = false;
            this.overlay = true;
            this.connectingError = "Failed to send initialization command to the dongle";
            clearTimeout(this.connectTimeout);
            this.element.removeEventListener('socket-com', this.handleSocketComInit.bind(this));
            return;
        }
    }

    /**
     * @param {{detail: Array<number>}} d
     */
    handleSocketComInit (d) {
        let message;
        try {
            message = this.parser.parse(d.detail);
        } catch (error) {
            console.error('Failed to parse initialization message from dongle:', error, 'Data:', d);
            this.connectingError = "Failed to parse initialization message from the dongle: " + error.message;
            this.element.removeEventListener('socket-com', this.handleSocketComInit.bind(this));
            return;
        }
        if (message.type !== this.parser.types.IDENT) {
            console.error('Received non-initialization message during initialization:', message);
            clearTimeout(this.connectTimeout);
            this.element.removeEventListener('socket-com', this.handleSocketComInit.bind(this));
            return;
        }
        clearTimeout(this.connectTimeout);
        this.element.removeEventListener('socket-com', this.handleSocketComInit.bind(this));
        this.device.deviceElement.status = "connected";
        this.overlay = false;
        console.log('Dongle initialized successfully', message);
        this.dongleContainer.init(message);
    }

    async onTimeout () {
        this.connecting = false;
        this.overlay = true;
        this.connectingError = "Connection to the dongle timed out, please check the connection and try again";
        this.connectTimeout = null;
        try {
            this.exitLoop = true;
            while (this.device.port.readable.locked) await new Promise(resolve => setTimeout(resolve, 100));
            await this.device.port.close();
        } catch (error) {
            console.error('Error closing port after timeout:', error);
        }
    }

    async checkForFirmwareUpdates (e) {
        if (e.shiftKey) {
            //TODO: Allow users to upload custom firmware for advanced users and developers, maybe with a warning about the risks of bricking their device
            console.log('Custom firmware upload triggered');
            return;
        }
        //TODO: Implement firmware update checking
        this.dongleContainer.checkForUpdatesIcon.classList.add('animate-spin');
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.dongleContainer.checkForUpdatesIcon.classList.remove('animate-spin');
    }
}

export default DongleManager;