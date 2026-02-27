class SocketComHandler {
    /** @type import("../dongleManager")["default"]["prototype"] */
    manager;

    constructor(manager) {
        this.manager = manager;
        this.parser = this.manager.parser;
        this.types = this.parser.types;
        this.manager.element.addEventListener('socket-com', this.handleSocketCom.bind(this));
    }

    /** @param {Array<number>} d */
    handleSocketCom(d) {
        let message;
        try {
            message = this.parser.parse(d.detail);
        } catch (error) {
            console.error('Failed to parse message from dongle:', error, 'Data:', d);
            return;
        }
        if (message) this.handleParsed(message);
    }

    /** @param {import("./serialComMessage")["default"]["prototype"]} message */
    handleParsed(message) {
        if (!this.manager.connected) {
            switch (message.type) {
                case this.types.IDENT:
                    this.manager.handleInit(message);
                    break;
            }
        } else {
            switch (message.type) {
                case this.types.TRACKER_CONNECTED:
                    this.manager.handleTrackerConnected(message);
                    break;
                case this.types.TRACKER_DISCONNECTED:
                    this.manager.handleTrackerDisconnected(message);
                    break;
                case this.types.TRACKER_UPDATE:
                    this.manager.handleTrackerUpdate(message);
                    break;
                case this.types.ALL_TRACKERS_UNPAIRED:
                    this.manager.handleAllTrackersUnpaired(message);
                    break;
                case this.types.TRACKER_UNPAIRED:
                    this.manager.handleTrackerUnpaired(message);
                    break;
                case this.types.TRACKER_PAIRED:
                    this.manager.handleTrackerPaired(message);
                    break;
                case this.types.PAIRING_MODE:
                    this.manager.handlePairingMode(message);
                    break;
                case this.types.ENVIRONMENT_SCAN_MODE:
                    this.manager.handleEnvironmentScanMode(message);
                    break;
                case this.types.ENVIRONMENT_SCAN_PROGRESS:
                    this.manager.handleEnvironmentScanProgress(message);
                    break;
                case this.types.UPDATE_CHANNEL:
                    this.manager.handleUpdateChannel(message);
                    break;
                default:
                    console.warn('Received unhandled message type:', message);
            }
        }
    }
}

export default SocketComHandler;