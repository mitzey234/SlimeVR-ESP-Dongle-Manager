import Manager from "./manager.js";
import SerialComParser from "./messages/serialComParser.js";
import Terminal from "./terminal.js";
import DongleContainer from "./dongleContainer.js";
import SocketComHandler from "./messages/socketComHandler.js";
import PairedTrackersManager from "./modals/pairedTrackersManager.js";
import ScanningEnvironment from "./modals/scanningEnvModal.js";

class DongleManager extends Manager {
    connectTimeout;

    parser = new SerialComParser(this);
    socketComHandler = new SocketComHandler(this);

    _pairing = false;
    get pairing() {
        return this._pairing;
    }
    set pairing(value) {
        if (this._pairing === value) return;
        this._pairing = value;
        this.device.deviceElement.status = value ? "pairing" : "connected";
        this.dongleContainer.pairingButton.classList.toggle('bg-blue-500', !value);
        this.dongleContainer.pairingButton.classList.toggle('hover:bg-blue-700', !value);
        this.dongleContainer.pairingButton.classList.toggle('active:bg-blue-900', !value);
        this.dongleContainer.pairingButton.classList.toggle('bg-red-500', value);
        this.dongleContainer.pairingButton.classList.toggle('hover:bg-red-700', value);
        this.dongleContainer.pairingButton.classList.toggle('active:bg-red-900', value);
        this.dongleContainer.pairingButton.innerText = value ? "Exit Pairing Mode" : "Enter Pairing Mode";
    }

    _scanningEnvironment = false;
    get scanningEnvironment() {
        return this._scanningEnvironment;
    }

    set scanningEnvironment(value) {
        if (this._scanningEnvironment === value) return;
        this._scanningEnvironment = value;
        this.device.deviceElement.status = value ? "scanning environment" : "connected";
        if (value) {
            this.scanningEnvironmentModal.init();
            this.activeModal = this.scanningEnvironmentModal;
            this.scanningEnvironmentModal.locked = true;
        } else if (this.scanningEnvironmentModal.locked) {
            this.scanningEnvironmentModal.locked = false;
            this.scanningEnvironmentModal.close();
        }
    }
    
    constructor(main, device) {
        super(main, device);
        this.allowSerialCom = true;
        this.dongleContainer = new DongleContainer(this, device);
        this.terminal = new Terminal(this, device);
        this.terminal.element.classList.remove('w-full');
        this.terminal.element.classList.add('w-4/9');

        //Modals
        this.pairedTrackersManager = new PairedTrackersManager(this);
        this.scanningEnvironmentModal = new ScanningEnvironment(this);
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

    initInterval;

    async sendInit () {
        let result = await this.sendCommand('SCInit');
        if (!result) {
            this.connecting = false;
            this.overlay = true;
            this.connectingError = "Failed to send initialization command to the dongle";
            clearInterval(this.initInterval);
            clearTimeout(this.connectTimeout);
            return;
        }
    }

    async connect () {
        let result = await super.connect();
        if (!result) return;
        this.connectTimeout = setTimeout(this.onTimeout.bind(this), 5000);
        this.initInterval = setInterval(this.sendInit.bind(this), 1000);
    }

    /**
     * @param {import("./messages/initMessage.js").default} message
     */
    handleInit (message) {
        clearTimeout(this.connectTimeout);
        clearInterval(this.initInterval);
        this.device.deviceElement.status = "connected";
        this.overlay = false;
        this.connected = true;
        this.device.deviceElement.nameElement.title = `Board: ` + message.boardName;
        console.log('Dongle initialized successfully', message);
        this.dongleContainer.init(message);
    }

    /**
     * @param {import("./messages/trackerConnectedMessage.js").default} message
     */
    handleTrackerConnected (message) {
        console.log('Tracker connected:', message);
        this.dongleContainer.addTracker(message.tracker);
    }

    /**
     * @param {import("./messages/trackerDisconnectedMessage.js").default} message
     */
    handleTrackerDisconnected (message) {
        console.log('Tracker disconnected:', message);
        this.dongleContainer.removeTracker(message.tracker.id);
    }

    /**
     * @param {import("./messages/trackerUpdateMessage.js").default} message
     */
    handleTrackerUpdate (message) {
        this.dongleContainer.bytesPerSecond = message.bytesPerSecond;
        this.dongleContainer.packetsPerSecond = message.packetsPerSecond;
        this.dongleContainer.temperature = message.temperature;
        message.trackers.forEach(tracker => {
            this.dongleContainer.updateTracker(tracker);
        });
        this.dongleContainer.trackers.forEach(tracker => {
            let trackerInfo = message.trackers.find(t => t.id === tracker.id);
            if (!trackerInfo) return this.dongleContainer.removeTracker(tracker.id);
        });
    }

    /**
     * @param {import("./messages/allTrackersUnpairedMessage.js").default} message
     */
    handleAllTrackersUnpaired (message) {
        console.log('All trackers unpaired:', message);
        this.dongleContainer.clearTrackers();
        this.dongleContainer.clearPairedTrackers();
    }

    /**
     * @param {import("./messages/trackerUnpairedMessage.js").default} message
     */
    handleTrackerUnpaired (message) {
        console.log('Tracker unpaired:', message);
        this.dongleContainer.removePairedTracker(message.id);
    }

    /**
     * @param {import("./messages/trackerPairedMessage.js").default} message
     */
    handleTrackerPaired (message) {
        console.log('Tracker paired:', message);
        this.dongleContainer.addPairedTracker(message);
    }

    /**
     * @param {import("./messages/pairingmodeMessage.js").default} message
     */
    handlePairingMode (message) {
        console.log('Pairing mode changed:', message);
        this.pairing = message.enabled;
    }

    /**
     * @param {import("./messages/environmentScanModeMessage.js").default} message
     */
    handleEnvironmentScanMode (message) {
        console.log('Environment scan mode changed:', message);
        this.scanningEnvironment = message.enabled;
    }

    /**
     * @param {import("./messages/environmentScanProgressMessage.js").default} message
     */
    handleEnvironmentScanProgress (message) {
        console.log('Environment scan progress:', message);
        this.scanningEnvironmentModal.scanningTime = message.scanningTime;
        this.scanningEnvironmentModal.updateChannel(message.currentChannel, message.channelBytesSeen, message.elapsedTime);
    }

    /**
     * @param {import("./messages/environmentScanResultsMessage.js").default} message
     */
    handleEnvironmentScanResults (message) {
        console.log('Environment scan results:', message);
        message.channels.forEach((channel, index) => {
            this.scanningEnvironmentModal.updateChannel(index+1, channel, this.scanningEnvironmentModal.scanningTime);
        });
        this.scanningEnvironmentModal.selectedChannel = message.selected;
        this.scanningEnvironmentModal.locked = false;
        this.scanningEnvironment = false;
    }

    /**
     * @param {import("./messages/updateChannelMessage.js").default} message
     */
    handleUpdateChannel (message) {
        console.log('Channel updated:', message);
        this.dongleContainer.channel = message.channel;
    }

    async onTimeout () {
        this.connecting = false;
        this.overlay = true;
        this.connectingError = "Connection to the dongle timed out, please check the connection and try again";
        this.connectTimeout = null;
        clearInterval(this.initInterval);
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